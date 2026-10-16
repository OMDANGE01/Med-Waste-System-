const express = require('express');
const router = express.Router();
const wasteCtrl = require('../controllers/wasteController');
const { optionalAuth, requireAuth } = require('../middleware/authMiddleware');

// Read endpoints (scoped by role if token present)
router.get('/', optionalAuth, wasteCtrl.getWasteRecords);
router.get('/stats', optionalAuth, wasteCtrl.getWasteStats);
router.get('/:id', optionalAuth, wasteCtrl.getWasteRecordById);

// Protected mutation endpoints (RBAC verified in controller)
router.post('/', optionalAuth, wasteCtrl.createWasteRecord);
router.patch('/:id/status', optionalAuth, wasteCtrl.updateWasteStatus);
router.patch('/tag/:tagId/status', optionalAuth, wasteCtrl.updateWasteStatus);

module.exports = router;
