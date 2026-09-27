const express = require('express');
const router = express.Router();
const syncCtrl = require('../controllers/syncController');

router.post('/', syncCtrl.processOfflineBatch);
router.get('/status', syncCtrl.getSyncStatus);

module.exports = router;
