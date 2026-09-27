import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Wifi, 
  WifiOff, 
  Server, 
  ArrowUpRight,
  Code
} from 'lucide-react';
import cloudSync from '../services/cloudSyncService';

export default function CloudSyncModal({ isOpen, onClose, mongoConnected }) {
  const [syncState, setSyncState] = useState(cloudSync.getState());

  useEffect(() => {
    const unsubscribe = cloudSync.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleToggleOffline = () => {
    cloudSync.setSimulatedOffline(!syncState.isSimulatedOffline);
  };

  const handleForceSync = () => {
    cloudSync.flushQueue();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              syncState.isOffline 
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-400' 
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
            }`}>
              {syncState.isOffline ? <CloudOff className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Edge SQL & Cloud Sync Engine</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  syncState.isOffline 
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/50' 
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                }`}>
                  {syncState.isOffline ? 'OFFLINE EDGE MODE' : 'CLOUD CONNECTED'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Resilient offline-first transaction buffer for hospital operations & CBWTF drivers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Dashboard Grid */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/40 border-b border-slate-800">
          {/* Target Database */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-medium">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>Cloud Target</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="font-semibold text-white text-xs truncate">
              {mongoConnected ? 'MongoDB Atlas (Live)' : 'Production Resilient Store'}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
              <span>● SW Background Sync Active</span>
            </div>
          </div>

          {/* Buffer Status */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-medium">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Storage Engine</span>
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                syncState.pendingCount > 0 ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {syncState.pendingCount} Pending
              </span>
            </div>
            <div className="font-semibold text-white text-xs">
              IndexedDB (MedWasteOfflineDB)
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              {syncState.pendingCount > 0 ? `${syncState.pendingCount} write(s) in IndexedDB` : 'IndexedDB synchronized'}
            </div>
          </div>

          {/* Network Link */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-medium">
                {syncState.isOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
                <span>Network Link</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">Auto-Sync On</span>
            </div>
            <div className="font-semibold text-white text-xs">
              {syncState.isOffline ? 'Offline / Buffering in IndexedDB' : 'Auto-Sync to Cloud Active'}
            </div>
            <button
              onClick={handleToggleOffline}
              className={`mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded transition w-full text-center border ${
                syncState.isSimulatedOffline
                  ? 'bg-amber-900/40 text-amber-300 border-amber-700/60 hover:bg-amber-800/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {syncState.isSimulatedOffline ? 'Restore Network (Auto-Sync)' : 'Simulate Offline Network Drop'}
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Recent SQL Transaction Log ({syncState.transactions.length})
              </h3>
            </div>
            <button
              onClick={handleForceSync}
              disabled={syncState.isSyncing || syncState.isOffline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
              <span>{syncState.isSyncing ? 'Syncing...' : 'Force Cloud Sync'}</span>
            </button>
          </div>

          {syncState.transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <Database className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs font-medium">No edge transactions recorded yet.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Any waste bags logged, driver pickups, or worker updates will appear here in SQL format.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {syncState.transactions.map((tx) => (
                <div 
                  key={tx.txId}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        tx.operation === 'INSERT' 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' 
                          : tx.operation === 'UPDATE' 
                          ? 'bg-sky-950 text-sky-300 border border-sky-800/40' 
                          : 'bg-rose-950 text-rose-300 border border-rose-800/40'
                      }`}>
                        {tx.operation}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">table: {tx.table}</span>
                      <span className="text-[10px] text-slate-500">·</span>
                      <span className="text-[10px] text-slate-500 font-mono">{tx.txId}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {tx.syncStatus === 'synced' ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Uploaded to Cloud</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400 animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span>Buffered at Edge</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SQL Statement Display */}
                  <div className="p-2 rounded bg-slate-900 border border-slate-800/50 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    <code>{tx.sqlStatement}</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Last Cloud Check:</span>
            <span className="text-slate-300 font-mono text-[11px]">
              {new Date(syncState.lastSyncTime).toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
}
