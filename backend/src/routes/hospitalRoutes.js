const express = require('express');
const router = express.Router();
const hospitalCtrl = require('../controllers/hospitalController');

router.get('/', hospitalCtrl.getHospitals);
router.get('/:id', hospitalCtrl.getHospitalById);
router.get('/:id/workers', hospitalCtrl.getHospitalWorkers);
router.post('/:id/workers', hospitalCtrl.createHospitalWorker);
router.patch('/workers/:workerId/status', hospitalCtrl.updateWorkerStatus);

module.exports = router;
