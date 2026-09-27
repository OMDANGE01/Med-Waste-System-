import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Database } from 'lucide-react';
import cloudSync from '../services/cloudSyncService';

export default function OfflineIndicator() {
  const [syncState, setSyncState] = useState(cloudSync.getState());

  useEffect(() => {
    const unsubscribe = cloudSync.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsubscribe;
  }, []);

  if (!syncState.isOffline && !syncState.isSyncing && syncState.pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900/95 border border-amber-600/70 text-amber-200 px-3.5 py-2 text-xs font-medium shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-200">
      {syncState.isSyncing ? (
        <>
          <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin flex-shrink-0" />
          <span>Auto-syncing IndexedDB edge transactions to cloud...</span>
        </>
      ) : syncState.isOffline ? (
        <>
          <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
          <div>
            <span className="font-bold text-amber-300">Offline Mode</span>
            <span className="text-slate-300"> · Temporary data stored in IndexedDB ({syncState.pendingCount} queued)</span>
          </div>
        </>
      ) : (
        <>
          <Database className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{syncState.pendingCount} write(s) in IndexedDB auto-syncing...</span>
        </>
      )}
    </div>
  );
}
