const storage = require('../services/storageService');
const auditService = require('../services/auditService');
const s3Service = require('../services/s3Service');
const socketService = require('../services/socketService');

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

// Normalizes status names across system conventions
const canonicalizeStatus = (status) => {
  if (!status) return 'Logged';
  const s = status.trim();
  if (s === 'Collected') return 'Collected';
  if (s === 'Delivered') return 'Delivered';
  if (s === 'In Transit') return 'Collected'; // canonical collection state
  if (s === 'Disposed') return 'Delivered';   // canonical final delivery/incineration state
  return s;
};

// GET /api/waste
exports.getWasteRecords = async (req, res) => {
  try {
    const { category, department, status, search, hospitalId } = req.query;

    // RBAC: DepartmentHead is strictly restricted to their own department
    let effectiveDepartment = department;
    if (req.user && req.user.normalizedRole === 'DepartmentHead') {
      const userDept = req.user.department || req.user.departmentId;
      if (userDept) {
        effectiveDepartment = userDept;
      }
    }

    // Scope to user's assigned hospital unless Auditor, Driver, or Global HospitalHead
    let effectiveHospital = hospitalId;
    if (
      req.user &&
      req.user.normalizedRole !== 'Auditor' &&
      req.user.normalizedRole !== 'Driver' &&
      req.user.hospitalId &&
      req.user.hospitalId !== 'ALL'
    ) {
      effectiveHospital = req.user.hospitalId;
    }

    const records = await storage.getAllWaste({
      category,
      department: effectiveDepartment,
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
    res.status(500).json({
      success: false,
      message: 'Server error retrieving waste logs',
      error: error.message,
    });
  }
};

// GET /api/waste/:id
exports.getWasteRecordById = async (req, res) => {
  try {
    const record = await storage.getWasteById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Waste record not found' });
    }

    // RBAC: DepartmentHead restricted to their department
    if (req.user && req.user.normalizedRole === 'DepartmentHead') {
      const userDept = req.user.department || req.user.departmentId;
      if (userDept && record.department !== userDept) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Department Head can only access records for department "${userDept}".`,
        });
      }
    }

    res.json({ success: true, data: enrichWith48HourCompliance(record) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving record', error: error.message });
  }
};

// POST /api/waste
exports.createWasteRecord = async (req, res) => {
  try {
    // RBAC Check: Only Nurse (and HospitalHead) can log new waste
    // Drivers, DepartmentHeads, and Auditors cannot log waste
    if (req.user) {
      const role = req.user.normalizedRole;
      if (role === 'Driver') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Drivers cannot log new waste. Only Nurses (or Hospital Head) are authorized.',
        });
      }
      if (role === 'DepartmentHead') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Department Heads have read-only access and cannot log new waste.',
        });
      }
      if (role === 'Auditor') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Auditors have read-only access to the audit stream.',
        });
      }
    }

    const {
      category,
      department,
      weightKg,
      handlerName,
      location,
      hazardLevel,
      notes,
      tagId,
      hospitalId,
      hospitalName,
    } = req.body;

    if (!category || !department || weightKg === undefined || weightKg === null) {
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
      id: 'USR-NURSE-01',
      name: handlerName || 'Sister Sunita Tayade',
      role: 'Nurse',
      normalizedRole: 'Nurse',
      hospitalId: hospitalId || 'HOSP-01',
      hospitalName: hospitalName || 'Government Hospital of Khamgaon',
    };

    // Auto-generate unique CPCB barcode format: MH28-HOSPXX-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const assignedHospitalId = actor.hospitalId || hospitalId || 'HOSP-01';
    const generatedTag =
      tagId && tagId.trim() !== ''
        ? tagId.trim().toUpperCase()
        : `CPCB-MH28-${assignedHospitalId}-${dateStr}-${randCode}`;

    // 1. Generate QR code and upload to AWS S3 (with graceful local fallback)
    let qrCodeUrl = '';
    try {
      qrCodeUrl = await s3Service.generateAndUploadQRCode(generatedTag, {
        category,
        department,
        weightKg: parsedWeight,
        hospitalId: assignedHospitalId,
        hospitalName: actor.hospitalName || hospitalName || 'Government Hospital of Khamgaon',
        timestamp: new Date().toISOString(),
      });
    } catch (qrErr) {
      console.warn('[QR/S3] Upload error, continuing with fallback URL:', qrErr.message);
      qrCodeUrl = `/qrcodes/${generatedTag}.png`;
    }

    const recordData = {
      tagId: generatedTag,
      category, // Yellow, Red, Blue, White, Black
      department,
      weightKg: parsedWeight,
      handlerName: actor.name || handlerName || 'Sister Sunita Tayade',
      loggedById: actor.id || actor.workerId,
      loggedByRole: actor.role || 'Nurse',
      hospitalId: assignedHospitalId,
      hospitalName: actor.hospitalName || hospitalName || 'Government Hospital of Khamgaon',
      location: location ? location.trim() : department,
      hazardLevel: hazardLevel || 'Bio-Infectious',
      notes: notes ? notes.trim() : '',
      status: 'Logged',
      qrCodeUrl,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const created = await storage.createWasteRecord(recordData);

    // 2. Append to Immutable Audit Trail
    await auditService.logEvent({
      actionType: 'WASTE_LOGGED',
      actorId: actor.id || actor.workerId || 'USR-NURSE-01',
      actorRole: actor.role || 'Nurse',
      actorName: actor.name || 'Nurse Custodian',
      entityId: created.tagId || created._id,
      hospitalId: assignedHospitalId,
      previousState: null,
      newState: {
        tagId: created.tagId,
        category: created.category,
        weightKg: created.weightKg,
        status: created.status,
        qrCodeUrl: created.qrCodeUrl,
      },
      details: {
        category,
        weightKg: parsedWeight,
        department,
        qrCodeUrl: created.qrCodeUrl,
      },
    });

    // 3. Emit real-time event via Socket.io event bus
    socketService.emitWasteCreated(created);

    res.status(201).json({
      success: true,
      message: 'Bio-medical waste bag logged into CPCB Registry with QR Code generated & uploaded.',
      data: enrichWith48HourCompliance(created),
    });
  } catch (error) {
    console.error('Error creating waste record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create waste record',
      error: error.message,
    });
  }
};

// PATCH /api/waste/:id/status
exports.updateWasteStatus = async (req, res) => {
  try {
    const id = req.params.id || req.params.tagId;
    const { status, vehicleNumber, driverName, disposalFacility, incineratorChamberTemp } = req.body;

    // RBAC: Only Driver (and HospitalHead) can transition status
    // Nurses cannot change status to Collected/Delivered!
    if (req.user) {
      const role = req.user.normalizedRole;
      if (role === 'Nurse') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Nurses cannot change waste status to Collected or Delivered. Only Drivers (or Hospital Head) are authorized.',
        });
      }
      if (role === 'DepartmentHead' || role === 'Auditor') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Role is read-only and cannot transition waste status.',
        });
      }
    }

    const validStatuses = ['Logged', 'Awaiting Pickup', 'In Transit', 'Collected', 'Delivered', 'Disposed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const existing = await storage.getWasteById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Waste record not found.' });
    }

    const previousStatus = existing.status;
    const actor = req.user || {
      id: 'WRK-CBWTF-001',
      name: driverName || 'Prakash Gawli',
      role: 'Driver',
      normalizedRole: 'Driver',
    };

    const updatePayload = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'Collected' || status === 'In Transit') {
      updatePayload.collectedAt = new Date().toISOString();
      updatePayload.inTransitAt = new Date().toISOString();
      if (vehicleNumber) updatePayload.vehicleNumber = vehicleNumber;
      if (driverName || actor.name) updatePayload.driverName = driverName || actor.name;
    }

    if (status === 'Delivered' || status === 'Disposed') {
      updatePayload.deliveredAt = new Date().toISOString();
      updatePayload.disposedAt = new Date().toISOString();
      updatePayload.disposalFacility =
        disposalFacility || 'Khamgaon Central Bio-Medical Waste Treatment Facility (CBWTF MIDC)';
      updatePayload.certification = `CERT-CBWTF-${Date.now()}`;
      if (incineratorChamberTemp) updatePayload.incineratorChamberTemp = incineratorChamberTemp;
    }

    const updated = await storage.updateWasteRecord(id, updatePayload);

    // 1. Immutable Audit Trail
    await auditService.logEvent({
      actionType: 'STATUS_TRANSITION',
      actorId: actor.id || actor.workerId || 'WRK-CBWTF-001',
      actorRole: actor.role || 'Driver',
      actorName: actor.name || 'Transit Custodian',
      entityId: updated.tagId || id,
      hospitalId: updated.hospitalId,
      previousState: { status: previousStatus },
      newState: { status, certification: updated.certification },
      details: {
        previousStatus,
        newStatus: status,
        vehicleNumber: updated.vehicleNumber,
        driverName: updated.driverName,
        certification: updated.certification,
      },
    });

    // 2. Real-Time Socket.io Event Bus:
    // Instantly pushes state change to Hospital Head's and Auditor's screens!
    socketService.emitWasteStatusUpdated({
      record: enrichWith48HourCompliance(updated),
      previousStatus,
      newStatus: status,
      actor: {
        id: actor.id,
        name: actor.name,
        role: actor.role,
      },
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Status transitioned from "${previousStatus}" to "${status}" successfully.`,
      data: enrichWith48HourCompliance(updated),
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message,
    });
  }
};

// GET /api/waste/stats
exports.getWasteStats = async (req, res) => {
  try {
    const { hospitalId } = req.query;
    let effectiveHospital = hospitalId;
    if (
      req.user &&
      req.user.normalizedRole !== 'Auditor' &&
      req.user.normalizedRole !== 'Driver' &&
      req.user.hospitalId &&
      req.user.hospitalId !== 'ALL'
    ) {
      effectiveHospital = req.user.hospitalId;
    }

    let records = await storage.getAllWaste({ hospitalId: effectiveHospital });

    // Restrict stats if DepartmentHead
    if (req.user && req.user.normalizedRole === 'DepartmentHead') {
      const userDept = req.user.department || req.user.departmentId;
      if (userDept) {
        records = records.filter((r) => r.department === userDept);
      }
    }

    const enriched = (records || []).map(enrichWith48HourCompliance);

    const totalWeightKg = enriched.reduce((sum, r) => sum + (Number(r.weightKg) || 0), 0);
    const totalBags = enriched.length;
    const awaitingPickup = enriched.filter((r) => r.status === 'Logged' || r.status === 'Awaiting Pickup').length;
    const inTransit = enriched.filter((r) => r.status === 'In Transit' || r.status === 'Collected').length;
    const disposedCertified = enriched.filter((r) => r.status === 'Disposed' || r.status === 'Delivered').length;

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
    res.status(500).json({
      success: false,
      message: 'Failed to compile statistics',
      error: error.message,
    });
  }
};
