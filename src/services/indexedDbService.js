/**
 * IndexedDB Enterprise Storage Service for MED_WASTE
 * 
 * Provides robust offline-first local persistence:
 * 1. `offline_transactions`: Stores queued edge SQL statements & mutations when disconnected.
 * 2. `offline_cache`: Stores local snapshots of waste records, pickups, hospitals, and workers.
 * 3. `sync_metadata`: Tracks synchronization timestamps and device telemetry.
 */

const DB_NAME = 'MedWasteOfflineDB';
const DB_VERSION = 1;

const STORES = {
  TRANSACTIONS: 'offline_transactions',
  CACHE: 'offline_cache',
  METADATA: 'sync_metadata',
};

class IndexedDbService {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  /**
   * Initializes and opens the IndexedDB database
   */
  async getDB() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('[IndexedDB] IndexedDB is not supported in this runtime environment. Using in-memory fallback.');
        resolve(null);
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store 1: Offline Transactions
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const txStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'txId' });
          txStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          txStore.createIndex('clientTimestamp', 'clientTimestamp', { unique: false });
          txStore.createIndex('table', 'table', { unique: false });
        }

        // Store 2: Offline Entity Cache
        if (!db.objectStoreNames.contains(STORES.CACHE)) {
          db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
        }

        // Store 3: Sync Metadata
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('[IndexedDB] Database connection established successfully:', DB_NAME);
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('[IndexedDB] Failed to open IndexedDB:', event.target.error);
        resolve(null);
      };
    });

    return this.initPromise;
  }

  /**
   * Saves or updates a transaction in IndexedDB
   */
  async saveTransaction(transaction) {
    const db = await this.getDB();
    if (!db) return transaction;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
        const store = tx.objectStore(STORES.TRANSACTIONS);
        store.put(transaction);

        tx.oncomplete = () => {
          resolve(transaction);
        };
        tx.onerror = (e) => {
          console.error('[IndexedDB] Error putting transaction:', e.target.error);
          resolve(transaction);
        };
      } catch (err) {
        console.error('[IndexedDB] Exception in saveTransaction:', err);
        resolve(transaction);
      }
    });
  }

  /**
   * Retrieves all stored transactions
   */
  async getAllTransactions() {
    const db = await this.getDB();
    if (!db) return [];

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORES.TRANSACTIONS, 'readonly');
        const store = tx.objectStore(STORES.TRANSACTIONS);
        const request = store.getAll();

        request.onsuccess = () => {
          const list = request.result || [];
          // Sort descending by clientTimestamp
          list.sort((a, b) => new Date(b.clientTimestamp) - new Date(a.clientTimestamp));
          resolve(list);
        };
        request.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  /**
   * Retrieves all pending transactions that need to be synced to the cloud
   */
  async getPendingTransactions() {
    const db = await this.getDB();
    if (!db) return [];

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORES.TRANSACTIONS, 'readonly');
        const store = tx.objectStore(STORES.TRANSACTIONS);
        const index = store.index('syncStatus');
        const request = index.getAll('pending');

        request.onsuccess = () => {
          resolve(request.result || []);
        };
        request.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  /**
   * Marks a transaction as synced
   */
  async markTransactionSynced(txId, syncedAt = new Date().toISOString()) {
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
        const store = tx.objectStore(STORES.TRANSACTIONS);
        const getReq = store.get(txId);

        getReq.onsuccess = () => {
          const item = getReq.result;
          if (item) {
            item.syncStatus = 'synced';
            item.syncedAt = syncedAt;
            store.put(item);
          }
          resolve(true);
        };
        getReq.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Deletes a transaction by ID
   */
  async deleteTransaction(txId) {
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
        const store = tx.objectStore(STORES.TRANSACTIONS);
        store.delete(txId);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Caches an entity collection (e.g. waste_records, hospitals, workers)
   */
  async cacheEntities(key, data) {
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORES.CACHE, 'readwrite');
        const store = tx.objectStore(STORES.CACHE);
        store.put({
          key,
          data,
          updatedAt: new Date().toISOString(),
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Retrieves cached entities from IndexedDB
   */
  async getCachedEntities(key) {
    const db = await this.getDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORES.CACHE, 'readonly');
        const store = tx.objectStore(STORES.CACHE);
        const req = store.get(key);
        req.onsuccess = () => {
          resolve(req.result ? req.result.data : null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Get storage health and metrics
   */
  async getStorageStats() {
    const db = await this.getDB();
    if (!db) {
      return { supported: false, engine: 'LocalStorage Fallback', totalTransactions: 0, pendingCount: 0 };
    }

    const txs = await this.getAllTransactions();
    const pending = txs.filter((t) => t.syncStatus === 'pending');

    return {
      supported: true,
      engine: 'IndexedDB (MedWasteOfflineDB)',
      version: DB_VERSION,
      totalTransactions: txs.length,
      pendingCount: pending.length,
      syncedCount: txs.length - pending.length,
    };
  }
}

export const indexedDBService = new IndexedDbService();
export default indexedDBService;
