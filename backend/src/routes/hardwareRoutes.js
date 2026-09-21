const express = require('express');
const router = express.Router();
const hwCtrl = require('../controllers/hardwareController');

router.get('/status', hwCtrl.getHardwareStatus);
router.post('/scale', hwCtrl.updateScaleWeight);
router.post('/calibrate', hwCtrl.calibrateScale);
router.post('/scan', hwCtrl.recordBarcodeScan);
router.post('/bin/toggle-lid', hwCtrl.toggleBinLid);

module.exports = router;
