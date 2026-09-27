const express = require('express');
const router = express.Router();
const auditCtrl = require('../controllers/auditController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Only Superintendents and State/District Monitors can view audit logs and verify integrity
router.get(
  '/',
  requireAuth,
  requireRole('Chief Medical Superintendent', 'State / District Monitor'),
  auditCtrl.getAuditLogs
);

router.get(
  '/verify-integrity',
  requireAuth,
  requireRole('Chief Medical Superintendent', 'State / District Monitor'),
  auditCtrl.verifyChain
);

module.exports = router;
