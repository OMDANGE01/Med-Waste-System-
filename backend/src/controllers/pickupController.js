const storage = require('../services/storageService');

// GET /api/pickups
exports.getPickups = async (req, res) => {
  try {
    const pickups = await storage.getAllPickups();
    res.json({ success: true, count: pickups.length, data: pickups });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve pickup manifests', error: error.message });
  }
};

// POST /api/pickups
exports.createPickup = async (req, res) => {
  try {
    const { treatmentFacility, vehicleNumber, driverName, driverPhone, wasteRecordIds, totalWeightKg, notes } = req.body;

    if (!vehicleNumber || !driverName) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number and driver name are required.',
      });
    }

    const manifestNumber = `MAN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const pickup = await storage.createPickup({
      manifestNumber,
      treatmentFacility: treatmentFacility || 'Apex Bio-Clean & Incineration Services (CBWTF)',
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      driverName: driverName.trim(),
      driverPhone: driverPhone ? driverPhone.trim() : '+1 (555) 349-8821',
      wasteRecordIds: wasteRecordIds || [],
      totalWeightKg: parseFloat(totalWeightKg) || 0,
      notes: notes ? notes.trim() : '',
      status: 'Scheduled',
      scheduledDate: new Date(),
    });

    res.status(201).json({ success: true, message: 'Pickup dispatch scheduled', data: pickup });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to schedule pickup', error: error.message });
  }
};

// PATCH /api/pickups/:id/status
exports.updatePickupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Scheduled', 'En Route', 'Collected', 'Completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Valid values: ${validStatuses.join(', ')}` });
    }

    const updated = await storage.updatePickupStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Pickup manifest not found' });
    }

    res.json({ success: true, message: `Manifest status updated to ${status}`, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update manifest status', error: error.message });
  }
};
