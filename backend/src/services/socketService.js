let ioInstance = null;

/**
 * Socket.io Real-Time Event Bus Service
 * Distributes real-time events for waste creation, status updates, and audit trails.
 */
const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      // Clean disconnect
    });

    socket.on('join_hospital', (hospitalId) => {
      if (hospitalId) {
        socket.join(`hospital_${hospitalId}`);
      }
    });
  });

  return ioInstance;
};

const getSocket = () => ioInstance;

const emitWasteCreated = (record) => {
  if (!ioInstance) return;
  try {
    ioInstance.emit('waste:created', record);
    if (record.hospitalId) {
      ioInstance.to(`hospital_${record.hospitalId}`).emit('hospital:waste_created', record);
    }
  } catch (err) {
    console.warn('[Socket.io] Error emitting waste:created:', err.message);
  }
};

const emitWasteStatusUpdated = (payload) => {
  if (!ioInstance) return;
  try {
    // Universal update event
    ioInstance.emit('waste:status_updated', payload);

    // Explicit Collected event for Hospital Head and Auditor screens
    if (payload.newStatus === 'Collected' || payload.newStatus === 'In Transit') {
      ioInstance.emit('waste:collected', payload);
    }

    if (payload.newStatus === 'Delivered' || payload.newStatus === 'Disposed') {
      ioInstance.emit('waste:delivered', payload);
    }

    if (payload.record && payload.record.hospitalId) {
      ioInstance.to(`hospital_${payload.record.hospitalId}`).emit('hospital:waste_status_updated', payload);
    }
  } catch (err) {
    console.warn('[Socket.io] Error emitting waste:status_updated:', err.message);
  }
};

const emitAuditEntry = (auditEntry) => {
  if (!ioInstance) return;
  try {
    ioInstance.emit('audit:new_entry', auditEntry);
  } catch (err) {
    console.warn('[Socket.io] Error emitting audit:new_entry:', err.message);
  }
};

module.exports = {
  initSocket,
  getSocket,
  emitWasteCreated,
  emitWasteStatusUpdated,
  emitAuditEntry,
};
