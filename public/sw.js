/**
 * MED_WASTE Service Worker
 * 
 * Provides:
 * 1. Asset & Navigation Caching (Stale-While-Revalidate / Cache-First)
 * 2. Offline Fallback for Network Disconnects
 * 3. Background Sync API Integration with IndexedDB for Seamless Auto-Sync to Cloud
 */

const CACHE_NAME = 'medwaste-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/favicon.svg'
];

const DB_NAME = 'MedWasteOfflineDB';
const DB_VERSION = 1;
const TX_STORE_NAME = 'offline_transactions';

// Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching static app shell');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Some pre-cache assets could not be fetched:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Open IndexedDB inside Service Worker
function openServiceWorkerDB() {
  return new Promise((resolve, reject) => {
    if (!self.indexedDB) {
      resolve(null);
      return;
    }
    const req = self.indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

// Helper: Read pending transactions from IndexedDB
async function getPendingTransactionsFromSW() {
  const db = await openServiceWorkerDB();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(TX_STORE_NAME, 'readonly');
      const store = tx.objectStore(TX_STORE_NAME);
      const index = store.index('syncStatus');
      const req = index.getAll('pending');

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

// Helper: Mark transactions as synced in IndexedDB
async function markTransactionsSyncedInSW(txIds) {
  const db = await openServiceWorkerDB();
  if (!db) return;

  const idSet = new Set(txIds);
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(TX_STORE_NAME, 'readwrite');
      const store = tx.objectStore(TX_STORE_NAME);
      const req = store.openCursor();

      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (idSet.has(cursor.value.txId)) {
            const updated = {
              ...cursor.value,
              syncStatus: 'synced',
              syncedAt: new Date().toISOString()
            };
            cursor.update(updated);
          }
          cursor.continue();
        } else {
          resolve(true);
        }
      };
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

// Background Sync Handler: Auto-sync buffered IndexedDB data to cloud
async function performCloudSyncFromSW() {
  console.log('[ServiceWorker] Checking IndexedDB for pending transactions to auto-sync...');
  const pending = await getPendingTransactionsFromSW();

  if (pending.length === 0) {
    console.log('[ServiceWorker] No pending transactions in IndexedDB.');
    return;
  }

  console.log(`[ServiceWorker] Found ${pending.length} pending transaction(s). Dispatching to /api/sync...`);

  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions: pending,
        clientDeviceInfo: {
          userAgent: 'ServiceWorker-BackgroundSync',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      const syncedIds = pending.map((t) => t.txId);
      await markTransactionsSyncedInSW(syncedIds);
      console.log(`[ServiceWorker] Successfully auto-synced ${syncedIds.length} transaction(s) to cloud!`);

      // Broadcast to all open tabs / clients
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({
          type: 'SW_SYNC_SUCCESS',
          syncedCount: syncedIds.length,
          timestamp: new Date().toISOString(),
          result
        });
      }
    } else {
      console.warn('[ServiceWorker] /api/sync returned error status, will retry on next reconnect event.');
    }
  } catch (err) {
    console.warn('[ServiceWorker] Network error during background sync attempt:', err.message);
  }
}

// Background Sync Event Listener
self.addEventListener('sync', (event) => {
  if (event.tag === 'medwaste-auto-sync' || event.tag === 'sync-queue') {
    console.log(`[ServiceWorker] Received background sync trigger for tag: "${event.tag}"`);
    event.waitUntil(performCloudSyncFromSW());
  }
});

// Message Event Listener from Client Window
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'TRIGGER_SYNC') {
    event.waitUntil(performCloudSyncFromSW());
  } else if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event: Stale-While-Revalidate for Assets, Network-First for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore chrome-extension or external third-party requests
  if (!url.protocol.startsWith('http')) return;

  // Handle API Requests: Network First, fallback to cached error json
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(async () => {
        // If offline and attempting GET on waste or hospitals, check cache or return offline response
        return new Response(
          JSON.stringify({
            offline: true,
            message: 'Device is offline. Changes buffered to local IndexedDB and will auto-sync once connected.',
            timestamp: new Date().toISOString()
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // Handle Static Assets & Pages: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for navigation requests if totally offline
        if (request.mode === 'navigate') {
          return caches.match('/index.html') || cachedResponse;
        }
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
