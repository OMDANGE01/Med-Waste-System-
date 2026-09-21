const express = require('express');
const router = express.Router();
const wasteCtrl = require('../controllers/wasteController');

router.get('/', wasteCtrl.getWasteRecords);
router.get('/stats', wasteCtrl.getWasteStats);
router.post('/seed', wasteCtrl.seedSampleData);
router.get('/:id', wasteCtrl.getWasteRecordById);
router.post('/', wasteCtrl.createWasteRecord);
router.put('/:id', wasteCtrl.updateWasteRecord);
router.patch('/:id/status', wasteCtrl.updateWasteStatus);
router.delete('/:id', wasteCtrl.deleteWasteRecord);

module.exports = router;
