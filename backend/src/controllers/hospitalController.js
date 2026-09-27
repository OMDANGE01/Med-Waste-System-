const storage = require('../services/storageService');

// GET /api/hospitals
exports.getHospitals = async (req, res) => {
  try {
    const hospitals = await storage.getAllHospitals();
    res.json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving hospitals', error: error.message });
  }
};

// GET /api/hospitals/:id
exports.getHospitalById = async (req, res) => {
  try {
    const hospital = await storage.getHospitalById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    const workers = await storage.getAllWorkers(hospital.hospitalId);
    const wasteRecords = await storage.getAllWaste({ hospitalId: hospital.hospitalId });
    res.json({
      success: true,
      data: {
        ...hospital._doc ? hospital._doc : hospital,
        workers,
        wasteRecords,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving hospital details', error: error.message });
  }
};

// GET /api/hospitals/:id/workers
exports.getHospitalWorkers = async (req, res) => {
  try {
    const workers = await storage.getAllWorkers(req.params.id);
    res.json({
      success: true,
      count: workers.length,
      data: workers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving workers', error: error.message });
  }
};

// POST /api/hospitals/:id/workers
exports.createHospitalWorker = async (req, res) => {
  try {
    const { name, email, role, department, phone, badgeNumber } = req.body;
    const hospitalId = req.params.id;

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and clinical/logistics role are required.',
      });
    }

    const hospital = await storage.getHospitalById(hospitalId);
    const hospitalName = hospital ? hospital.name : 'Government Hospital of Khamgaon';

    const newWorker = await storage.createWorker({
      name,
      email,
      role,
      department: department || 'General Ward',
      phone: phone || '+91 98200 00000',
      badgeNumber: badgeNumber || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      hospitalId,
      hospitalName,
    });

    res.status(201).json({
      success: true,
      message: `Worker "${name}" added to ${hospitalName} successfully.`,
      data: newWorker,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating hospital worker', error: error.message });
  }
};

// PATCH /api/hospitals/workers/:workerId/status
exports.updateWorkerStatus = async (req, res) => {
  try {
    const { dutyStatus } = req.body;
    if (!dutyStatus) {
      return res.status(400).json({ success: false, message: 'dutyStatus is required' });
    }
    const updated = await storage.updateWorkerStatus(req.params.workerId, dutyStatus);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating worker status', error: error.message });
  }
};
