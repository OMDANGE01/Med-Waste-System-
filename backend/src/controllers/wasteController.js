const storage = require('../services/storageService');

// GET /api/waste
exports.getWasteRecords = async (req, res) => {
  try {
    const { category, department, status, search } = req.query;
    const records = await storage.getAllWaste({ category, department, status, search });
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error('Error fetching waste records:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving waste logs', error: error.message });
  }
};

// GET /api/waste/:id
exports.getWasteRecordById = async (req, res) => {
  try {
    const record = await storage.getWasteById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Waste record not found' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving record', error: error.message });
  }
};

// POST /api/waste
exports.createWasteRecord = async (req, res) => {
  try {
    const { category, department, weightKg, handlerName, location, hazardLevel, notes, tagId } = req.body;

    // Validation
    if (!category || !department || !weightKg || !handlerName || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: category, department, weightKg, handlerName, and location are required.',
      });
    }

    const parsedWeight = parseFloat(weightKg);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Weight must be a positive number in kilograms.',
      });
    }

    // Auto-generate tag if not provided
    const generatedTag = tagId && tagId.trim() !== ''
      ? tagId.trim().toUpperCase()
      : `MW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const recordData = {
      tagId: generatedTag,
      category,
      department,
      weightKg: parsedWeight,
      handlerName: handlerName.trim(),
      location: location.trim(),
      hazardLevel: hazardLevel || 'Bio-Infectious',
      notes: notes ? notes.trim() : '',
      status: 'Logged',
    };

    const created = await storage.createWasteRecord(recordData);
    res.status(201).json({ success: true, message: 'Waste record logged successfully', data: created });
  } catch (error) {
    console.error('Error creating waste record:', error);
    res.status(500).json({ success: false, message: 'Failed to create waste record', error: error.message });
  }
};

// PUT /api/waste/:id
exports.updateWasteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await storage.updateWasteRecord(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Record not found for update' });
    }
    res.json({ success: true, message: 'Record updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update record', error: error.message });
  }
};

// PATCH /api/waste/:id/status
exports.updateWasteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Logged', 'Awaiting Pickup', 'In Transit', 'Disposed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updatePayload = { status };
    if (status === 'Disposed') {
      updatePayload.disposedAt = new Date();
    }

    const updated = await storage.updateWasteRecord(id, updatePayload);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    res.json({ success: true, message: `Status updated to ${status}`, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

// DELETE /api/waste/:id
exports.deleteWasteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteWasteRecord(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Waste record not found' });
    }
    res.json({ success: true, message: 'Waste record deleted successfully', data: deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete record', error: error.message });
  }
};

// GET /api/waste/stats
exports.getWasteStats = async (req, res) => {
  try {
    const stats = await storage.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to compile statistics', error: error.message });
  }
};

// POST /api/waste/seed
exports.seedSampleData = async (req, res) => {
  try {
    const result = await storage.resetToSeed();
    res.json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to seed sample records', error: error.message });
  }
};
