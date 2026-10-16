const express = require('express');
const router = express.Router();
const auditCtrl = require('../controllers/auditController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Only Auditor and HospitalHead (and Superintendents/Monitors) can view audit logs and verify integrity
router.get(
  '/',
  requireAuth,
  requireRole('Auditor', 'HospitalHead', 'Chief Medical Superintendent', 'State / District Monitor'),
  auditCtrl.getAuditLogs
);

router.get(
  '/verify-integrity',
  requireAuth,
  requireRole('Auditor', 'HospitalHead', 'Chief Medical Superintendent', 'State / District Monitor'),
  auditCtrl.verifyChain
);

module.exports = router;
