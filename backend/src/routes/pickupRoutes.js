const express = require('express');
const router = express.Router();
const pickupCtrl = require('../controllers/pickupController');

router.get('/', pickupCtrl.getPickups);
router.post('/', pickupCtrl.createPickup);
router.patch('/:id/status', pickupCtrl.updatePickupStatus);

module.exports = router;
