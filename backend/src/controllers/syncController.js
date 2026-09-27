const storage = require('../services/storageService');
const { isConnected } = require('../config/db');

// POST /api/sync
exports.processOfflineBatch = async (req, res) => {
  try {
    const { transactions, clientDeviceInfo } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No transactions provided in the sync payload.',
      });
    }

    console.log(`[CloudSync] Ingesting offline edge sync batch: ${transactions.length} transaction(s)`);
    const results = await storage.syncTransactions(transactions);

    res.json({
      success: true,
      message: `Cloud Sync completed: ${results.succeeded} transaction(s) applied to production store.`,
      cloudStorageTarget: isConnected() ? 'MongoDB Cloud Atlas (Mongoose)' : 'Resilient Edge Storage Engine',
      results,
      syncTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error during offline cloud sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process offline batch',
      error: error.message,
    });
  }
};

// GET /api/sync/status
exports.getSyncStatus = (req, res) => {
  res.json({
    success: true,
    cloudReady: true,
    mongoConnected: isConnected(),
    protocol: 'Edge-to-Cloud Bidirectional Transaction Protocol (v2.4-Production)',
    serverTimestamp: new Date().toISOString(),
  });
};
