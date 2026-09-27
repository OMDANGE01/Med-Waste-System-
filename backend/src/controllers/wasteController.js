const storage = require('../services/storageService');
const auditService = require('../services/auditService');

/**
 * Calculates CPCB 48-Hour Storage Rule Compliance
 * CPCB Bio-Medical Waste Management Rules 2016, Rule 8:
 * "No untreated bio-medical waste shall be kept stored beyond a period of 48 hours."
 */
const enrichWith48HourCompliance = (record) => {
  if (!record) return record;
  const createdAt = new Date(record.createdAt || record.timestamp || Date.now()).getTime();
  const now = Date.now();
  const elapsedHours = (now - createdAt) / (1000 * 60 * 60);

  const isPendingPickup = record.status === 'Logged' || record.status === 'Awaiting Pickup';
  const isViolation48Hr = isPendingPickup && elapsedHours >= 48;
  const isApproaching48Hr = isPendingPickup && elapsedHours >= 36 && elapsedHours < 48;

  return {
    ...record,
    elapsedHours: Math.round(elapsedHours * 10) / 10,
    hoursRemaining: Math.max(0, Math.round((48 - elapsedHours) * 10) / 10),
    isViolation48Hr,
    isApproaching48Hr,
  };
};

// GET /api/waste
exports.getWasteRecords = async (req, res) => {
  try {
    const { category, department, status, search, hospitalId } = req.query;

    // Scope to user's assigned hospital unless State Monitor
    let effectiveHospital = hospitalId;
    if (req.user && req.user.role !== 'State / District Monitor' && req.user.hospitalId !== 'ALL') {
      effectiveHospital = req.user.hospitalId;
    }

    const records = await storage.getAllWaste({
      category,
      department,
      status,
      search,
      hospitalId: effectiveHospital,
    });

    const enriched = (records || []).map(enrichWith48HourCompliance);

    res.json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
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
    res.json({ success: true, data: enrichWith48HourCompliance(record) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving record', error: error.message });
  }
};

// POST /api/waste
exports.createWasteRecord = async (req, res) => {
  try {
    const { category, department, weightKg, handlerName, location, hazardLevel, notes, tagId, hospitalId, hospitalName } = req.body;

    if (!category || !department || !weightKg) {
      return res.status(400).json({
        success: false,
        message: 'category, department, and weightKg are mandatory under CPCB 2016 Rules.',
      });
    }

    const parsedWeight = parseFloat(weightKg);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Weight must be a positive number in kilograms.',
      });
    }

    const actor = req.user || {
      id: 'USR-ANON',
      name: handlerName || 'Staff Member',
      role: 'Clinical Staff / Nurse',
      hospitalId: hospitalId || 'HOSP-01',
      hospitalName: hospitalName || 'Khamgaon Hospital',
    };

    // Auto-generate CPCB barcode format: MH28-HOSPXX-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const assignedHospitalId = actor.hospitalId || hospitalId || 'HOSP-01';
    const generatedTag = tagId && tagId.trim() !== ''
      ? tagId.trim().toUpperCase()
      : `CPCB-MH28-${assignedHospitalId}-${dateStr}-${randCode}`;

    const recordData = {
      tagId: generatedTag,
      category, // Yellow, Red, Blue, White, Black
      department,
      weightKg: parsedWeight,
      handlerName: actor.name || handlerName || 'Registered Staff',
      loggedById: actor.id,
      loggedByRole: actor.role,
      hospitalId: assignedHospitalId,
      hospitalName: actor.hospitalName || hospitalName || 'Government Hospital of Khamgaon',
      location: location ? location.trim() : department,
      hazardLevel: hazardLevel || 'Bio-Infectious',
      notes: notes ? notes.trim() : '',
      status: 'Logged',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const created = await storage.createWasteRecord(recordData);

    // Cryptographic Tamper-Evident Audit Event
    auditService.logEvent({
      eventType: 'WASTE_LOGGED',
      actor,
      entityId: created.tagId || created._id,
      hospitalId: assignedHospitalId,
      details: {
        category,
        weightKg: parsedWeight,
        department,
        barcode: created.tagId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Bio-medical waste bag logged into CPCB Registry successfully.',
      data: enrichWith48HourCompliance(created),
    });
  } catch (error) {
    console.error('Error creating waste record:', error);
    res.status(500).json({ success: false, message: 'Failed to create waste record', error: error.message });
  }
};

// PATCH /api/waste/:id/status
exports.updateWasteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, vehicleNumber, driverName, disposalFacility, incineratorChamberTemp } = req.body;
    const validStatuses = ['Logged', 'Awaiting Pickup', 'In Transit', 'Disposed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const actor = req.user || { id: 'SYSTEM', name: 'Compliance Officer', role: 'CBWTF Operations' };

    const updatePayload = { status, updatedAt: new Date().toISOString() };
    if (status === 'In Transit') {
      updatePayload.inTransitAt = new Date().toISOString();
      if (vehicleNumber) updatePayload.vehicleNumber = vehicleNumber;
      if (driverName) updatePayload.driverName = driverName;
    }
    if (status === 'Disposed') {
      updatePayload.disposedAt = new Date().toISOString();
      updatePayload.disposalFacility = disposalFacility || 'Khamgaon Central Bio-Medical Treatment Facility (CBWTF MIDC)';
      updatePayload.certification = `CERT-CBWTF-${Date.now()}`;
      if (incineratorChamberTemp) updatePayload.incineratorChamberTemp = incineratorChamberTemp;
    }

    const updated = await storage.updateWasteRecord(id, updatePayload);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Waste record not found.' });
    }

    // Tamper-Evident Audit Log
    auditService.logEvent({
      eventType: status === 'Disposed' ? 'INCINERATION_CERTIFIED' : 'WASTE_STATUS_CHANGED',
      actor,
      entityId: updated.tagId || id,
      hospitalId: updated.hospitalId,
      details: {
        previousStatus: updated.status,
        newStatus: status,
        vehicleNumber: updated.vehicleNumber,
        certification: updated.certification,
      },
    });

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      data: enrichWith48HourCompliance(updated),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

// GET /api/waste/stats
exports.getWasteStats = async (req, res) => {
  try {
    const { hospitalId } = req.query;
    let effectiveHospital = hospitalId;
    if (req.user && req.user.role !== 'State / District Monitor' && req.user.hospitalId !== 'ALL') {
      effectiveHospital = req.user.hospitalId;
    }

    const allRecords = await storage.getAllWaste({ hospitalId: effectiveHospital });
    const enriched = (allRecords || []).map(enrichWith48HourCompliance);

    const totalWeightKg = enriched.reduce((sum, r) => sum + (Number(r.weightKg) || 0), 0);
    const totalBags = enriched.length;
    const awaitingPickup = enriched.filter((r) => r.status === 'Logged' || r.status === 'Awaiting Pickup').length;
    const inTransit = enriched.filter((r) => r.status === 'In Transit').length;
    const disposedCertified = enriched.filter((r) => r.status === 'Disposed').length;

    // CPCB 48-Hour Violations
    const violations48Hr = enriched.filter((r) => r.isViolation48Hr).length;
    const approaching48Hr = enriched.filter((r) => r.isApproaching48Hr).length;

    // By CPCB Category
    const categoryBreakdown = {
      Yellow: 0,
      Red: 0,
      Blue: 0,
      White: 0,
      Black: 0,
    };
    enriched.forEach((r) => {
      if (categoryBreakdown[r.category] !== undefined) {
        categoryBreakdown[r.category] += Number(r.weightKg) || 0;
      }
    });

    // 7-day trend
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayRecords = enriched.filter((r) => (r.createdAt || r.timestamp || '').slice(0, 10) === dateKey);
      const dayWeight = dayRecords.reduce((sum, r) => sum + (Number(r.weightKg) || 0), 0);
      last7Days.push({
        date: dateKey,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        weightKg: Math.round(dayWeight * 10) / 10,
        bags: dayRecords.length,
      });
    }

    res.json({
      success: true,
      data: {
        totalWeightKg: Math.round(totalWeightKg * 10) / 10,
        totalBags,
        awaitingPickup,
        inTransit,
        disposedCertified,
        violations48Hr,
        approaching48Hr,
        categoryBreakdown,
        last7Days,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to compile statistics', error: error.message });
  }
};
