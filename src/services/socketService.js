import { io } from 'socket.io-client';

let socket = null;
const listeners = {
  wasteCreated: new Set(),
  wasteStatusUpdated: new Set(),
  wasteCollected: new Set(),
  auditNewEntry: new Set(),
};

/**
 * Initializes the client-side Socket.io connection.
 * Strict replacement for client-side polling.
 */
export const initSocket = () => {
  if (socket) return socket;

  try {
    const serverUrl = window.location.origin;
    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Connected to Medical Waste real-time event bus:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected from event bus:', reason);
    });

    socket.on('waste:created', (record) => {
      listeners.wasteCreated.forEach((callback) => {
        try { callback(record); } catch (e) { console.error(e); }
      });
    });

    socket.on('waste:status_updated', (payload) => {
      listeners.wasteStatusUpdated.forEach((callback) => {
        try { callback(payload); } catch (e) { console.error(e); }
      });
    });

    socket.on('waste:collected', (payload) => {
      listeners.wasteCollected.forEach((callback) => {
        try { callback(payload); } catch (e) { console.error(e); }
      });
    });

    socket.on('audit:new_entry', (entry) => {
      listeners.auditNewEntry.forEach((callback) => {
        try { callback(entry); } catch (e) { console.error(e); }
      });
    });
  } catch (err) {
    console.warn('[Socket.io] Initialization error:', err.message);
  }

  return socket;
};

export const getSocket = () => socket || initSocket();

export const subscribeToWasteCreated = (callback) => {
  listeners.wasteCreated.add(callback);
  return () => listeners.wasteCreated.delete(callback);
};

export const subscribeToWasteStatusUpdated = (callback) => {
  listeners.wasteStatusUpdated.add(callback);
  return () => listeners.wasteStatusUpdated.delete(callback);
};

export const subscribeToWasteCollected = (callback) => {
  listeners.wasteCollected.add(callback);
  return () => listeners.wasteCollected.delete(callback);
};

export const subscribeToAuditNewEntry = (callback) => {
  listeners.auditNewEntry.add(callback);
  return () => listeners.auditNewEntry.delete(callback);
};

export default {
  initSocket,
  getSocket,
  subscribeToWasteCreated,
  subscribeToWasteStatusUpdated,
  subscribeToWasteCollected,
  subscribeToAuditNewEntry,
};
