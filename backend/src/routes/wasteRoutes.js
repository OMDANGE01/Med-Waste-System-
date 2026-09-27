const express = require('express');
const router = express.Router();
const wasteCtrl = require('../controllers/wasteController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', wasteCtrl.getWasteRecords);
router.get('/stats', wasteCtrl.getWasteStats);
router.get('/:id', wasteCtrl.getWasteRecordById);

// Protected mutation endpoints
router.post('/', requireAuth, wasteCtrl.createWasteRecord);
router.patch('/:id/status', requireAuth, wasteCtrl.updateWasteStatus);

module.exports = router;
