/**
 * Edge SQL Transaction Queue & Cloud Sync Service (IndexedDB + Service Worker Edition)
 * 
 * Implements a resilient offline-first transaction buffer for hospital operations:
 * 1. Writes are serialized as SQL statements and stored in browser IndexedDB (`MedWasteOfflineDB`).
 * 2. Service Worker Background Sync automatically triggers auto-sync when network is restored.
 * 3. Bidirectional event stream auto-reconciles pending writes with the cloud (/api/sync).
 * 4. Supports network drop simulation for testing disconnected hospital wards.
 */

import indexedDBService from './indexedDbService';
import { triggerBackgroundSync } from './swRegister';

const STORAGE_KEY = 'medwaste_edge_sql_tx_ledger';
const OFFLINE_OVERRIDE_KEY = 'medwaste_simulated_offline';

class CloudSyncService {
  constructor() {
    this.listeners = new Set();
    this.isSyncing = false;
    this.lastSyncTime = new Date().toISOString();
    this.syncInterval = null;
    this.inMemoryLedger = [];
    this.storageEngine = 'IndexedDB (MedWasteOfflineDB)';

    if (typeof window !== 'undefined') {
      // 1. Initial load from IndexedDB with localStorage fallback
      this.loadInitialTransactions();

      // 2. Listen to network connectivity events
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));

      // 3. Listen to Service Worker auto-sync events
      window.addEventListener('sw-sync-success', (event) => {
        console.log('[CloudSync] Service Worker successfully auto-synced data in background:', event.detail);
        this.loadInitialTransactions().then(() => {
          this.lastSyncTime = new Date().toISOString();
          this.notifyListeners();
        });
      });

      // 4. Background polling worker as heartbeat
      this.startBackgroundWorker();
    }
  }

  async loadInitialTransactions() {
    try {
      const dbTxs = await indexedDBService.getAllTransactions();
      if (dbTxs && dbTxs.length > 0) {
        this.inMemoryLedger = dbTxs;
      } else {
        // Fallback or seed from localStorage
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.inMemoryLedger = parsed;
          // Migrate to IndexedDB
          for (const tx of parsed) {
            await indexedDBService.saveTransaction(tx);
          }
        }
      }
    } catch (e) {
      console.warn('[CloudSync] Error loading initial transactions from IndexedDB:', e);
    }
    this.notifyListeners();
  }

  // Check if offline (either real browser state or user simulation)
  isOffline() {
    if (typeof window === 'undefined') return false;
    const isSimulatedOffline = localStorage.getItem(OFFLINE_OVERRIDE_KEY) === 'true';
    return isSimulatedOffline || !navigator.onLine;
  }

  setSimulatedOffline(val) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(OFFLINE_OVERRIDE_KEY, val ? 'true' : 'false');
    this.notifyListeners();
    if (!val) {
      this.flushQueue();
      triggerBackgroundSync();
    }
  }

  getTransactions() {
    return this.inMemoryLedger;
  }

  async persistTransaction(transaction) {
    // Save to IndexedDB
    await indexedDBService.saveTransaction(transaction);

    // Keep in-memory cache synchronized
    const existingIdx = this.inMemoryLedger.findIndex(t => t.txId === transaction.txId);
    if (existingIdx >= 0) {
      this.inMemoryLedger[existingIdx] = transaction;
    } else {
      this.inMemoryLedger.unshift(transaction);
      if (this.inMemoryLedger.length > 100) {
        this.inMemoryLedger = this.inMemoryLedger.slice(0, 100);
      }
    }

    // Mirror to localStorage as redundant fail-safe
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.inMemoryLedger.slice(0, 50)));
    } catch {
      // quota or blocked
    }

    this.notifyListeners();
  }

  // Enqueue a transactional write formatted as SQL statement into IndexedDB
  async enqueueTransaction(table, operation, payload) {
    const txId = `TX-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const sqlStatement = this.generateSQLStatement(table, operation, payload);

    const transaction = {
      txId,
      table,
      operation,
      sqlStatement,
      payload,
      clientTimestamp: new Date().toISOString(),
      syncStatus: 'pending',
      storageEngine: 'IndexedDB',
    };

    console.log(`[CloudSync IndexedDB] Buffered edge transaction ${txId}: ${sqlStatement}`);
    await this.persistTransaction(transaction);

    // Register Background Sync with Service Worker
    triggerBackgroundSync();

    // Attempt instant cloud flush if currently online
    if (!this.isOffline()) {
      this.flushQueue();
    }

    return transaction;
  }

  generateSQLStatement(table, operation, payload) {
    if (operation === 'INSERT') {
      const keys = Object.keys(payload).slice(0, 5).join(', ');
      const values = Object.values(payload).slice(0, 5).map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v).join(', ');
      return `INSERT INTO ${table} (${keys}) VALUES (${values});`;
    }
    if (operation === 'UPDATE' || operation === 'UPDATE_STATUS') {
      const id = payload.tagId || payload.workerId || payload.manifestNumber || payload._id || 'ID';
      return `UPDATE ${table} SET status='${payload.status || payload.dutyStatus || 'Updated'}' WHERE id='${id}';`;
    }
    if (operation === 'DELETE') {
      const id = payload.id || payload.tagId || 'ID';
      return `DELETE FROM ${table} WHERE id='${id}';`;
    }
    return `EXEC sp_${table}_${operation.toLowerCase()} ();`;
  }

  // Flush pending transactions to the backend /api/sync
  async flushQueue() {
    if (this.isSyncing || this.isOffline()) return;

    // Get pending transactions directly from IndexedDB or memory
    const pending = this.inMemoryLedger.filter((t) => t.syncStatus === 'pending');
    if (pending.length === 0) return;

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: pending,
          clientDeviceInfo: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Client',
            storageEngine: 'IndexedDB',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const succeededIds = new Set(
          (data.results?.details || []).filter((d) => d.status === 'synced').map((d) => d.txId)
        );

        // Update IndexedDB for each synced transaction
        for (const t of pending) {
          if (succeededIds.has(t.txId) || data.success) {
            t.syncStatus = 'synced';
            t.syncedAt = new Date().toISOString();
            await indexedDBService.markTransactionSynced(t.txId, t.syncedAt);
          }
        }

        // Mirror to memory
        this.inMemoryLedger = [...this.inMemoryLedger];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.inMemoryLedger.slice(0, 50)));
        } catch {
          // ignore
        }

        this.lastSyncTime = new Date().toISOString();
        console.log(`[CloudSync] Auto-sync committed ${pending.length} transaction(s) to cloud database.`);
      } else {
        console.warn('[CloudSync] /api/sync returned non-200. Will retry on next auto-sync cycle.');
      }
    } catch (err) {
      console.warn('[CloudSync] Network sync attempt failed (offline or server unreachable):', err.message);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  startBackgroundWorker() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.syncInterval = setInterval(() => {
      if (!this.isOffline()) {
        this.flushQueue();
      }
    }, 5000); // Check and auto-sync every 5 seconds
  }

  handleNetworkChange(online) {
    console.log(`[CloudSync] Connectivity state changed: ${online ? 'ONLINE' : 'OFFLINE'}`);
    this.notifyListeners();
    if (online && !this.isOffline()) {
      console.log('[CloudSync] Network restored! Initiating seamless auto-sync from IndexedDB to cloud...');
      this.flushQueue();
      triggerBackgroundSync();
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  getState() {
    const txs = this.inMemoryLedger;
    const pendingCount = txs.filter((t) => t.syncStatus === 'pending').length;
    const isSimulatedOffline = typeof window !== 'undefined' && localStorage.getItem(OFFLINE_OVERRIDE_KEY) === 'true';

    return {
      isOffline: this.isOffline(),
      isSimulatedOffline,
      isSyncing: this.isSyncing,
      pendingCount,
      transactions: txs,
      lastSyncTime: this.lastSyncTime,
      storageEngine: this.storageEngine,
      serviceWorkerActive: typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller,
    };
  }
}

export const cloudSync = new CloudSyncService();
export default cloudSync;
