// In-memory hardware telemetry state
let hardwareState = {
  scale: {
    deviceId: 'SCALE-WS-204-BAY-3',
    name: 'Mettler Toledo Biohazard Heavy-Duty Platform Scale',
    port: 'COM3 (USB-Serial / 9600 Baud)',
    currentWeightKg: 4.65,
    isTareZero: false,
    status: 'ONLINE',
    batteryPct: 94,
    lastUpdate: new Date().toISOString(),
  },
  scanner: {
    deviceId: 'SCAN-ZEBRA-DS2208',
    name: 'Zebra DS2208 Biohazard Handheld Laser Barcode Reader',
    interface: 'USB-HID / Bluetooth BLE',
    status: 'ONLINE',
    lastScannedTag: 'MW-2026-1002',
    scanHistory: [
      { tagId: 'MW-2026-1002', category: 'Red', timestamp: new Date(Date.now() - 120000).toISOString() },
      { tagId: 'MW-2026-1001', category: 'Yellow', timestamp: new Date(Date.now() - 340000).toISOString() },
      { tagId: 'MW-2026-1004', category: 'Blue', timestamp: new Date(Date.now() - 890000).toISOString() },
    ],
  },
  smartBin: {
    deviceId: 'BIN-IOT-BAY-A',
    name: 'Smart Bio-Infectious Receptacle #A4',
    fillLevelPct: 68,
    lidLocked: true,
    uvcSterilizationActive: false,
    temperatureCelsius: 18.4,
    odorScrubberActive: true,
    status: 'ONLINE',
  },
  fleetGps: {
    vehicleNumber: 'WB-04-E-8821',
    driver: 'Robert Langdon',
    destination: 'Apex Bio-Clean Incineration Plant',
    latitude: 22.5726,
    longitude: 88.3639,
    speedKmh: 42,
    status: 'IN TRANSIT',
    lastPing: new Date().toISOString(),
  },
};

// GET /api/hardware/status
exports.getHardwareStatus = (req, res) => {
  res.json({
    success: true,
    data: hardwareState,
    timestamp: new Date().toISOString(),
  });
};

// POST /api/hardware/scale - Update or push weight from physical scale or simulator
exports.updateScaleWeight = (req, res) => {
  const { weightKg, deviceId } = req.body;
  if (weightKg === undefined || isNaN(Number(weightKg))) {
    return res.status(400).json({ success: false, message: 'Valid weightKg number required.' });
  }

  const parsed = Math.max(0, parseFloat(Number(weightKg).toFixed(2)));
  hardwareState.scale.currentWeightKg = parsed;
  hardwareState.scale.lastUpdate = new Date().toISOString();
  if (deviceId) hardwareState.scale.deviceId = deviceId;

  res.json({
    success: true,
    message: `Scale reading updated to ${parsed} kg`,
    scale: hardwareState.scale,
  });
};

// POST /api/hardware/calibrate - Tare / zero out scale
exports.calibrateScale = (req, res) => {
  hardwareState.scale.currentWeightKg = 0.0;
  hardwareState.scale.isTareZero = true;
  hardwareState.scale.lastUpdate = new Date().toISOString();

  res.json({
    success: true,
    message: 'Digital scale successfully tared to 0.00 kg.',
    scale: hardwareState.scale,
  });
};

// POST /api/hardware/scan - Receive hardware barcode scanner scan
exports.recordBarcodeScan = (req, res) => {
  const { tagId, category } = req.body;
  if (!tagId) {
    return res.status(400).json({ success: false, message: 'Barcode tagId required.' });
  }

  const cleanTag = tagId.trim().toUpperCase();
  hardwareState.scanner.lastScannedTag = cleanTag;
  hardwareState.scanner.scanHistory.unshift({
    tagId: cleanTag,
    category: category || 'Yellow',
    timestamp: new Date().toISOString(),
  });

  if (hardwareState.scanner.scanHistory.length > 10) {
    hardwareState.scanner.scanHistory.pop();
  }

  res.json({
    success: true,
    message: `Hardware scanner registered tag ${cleanTag}`,
    lastScan: cleanTag,
  });
};

// POST /api/hardware/bin/toggle-lid - Remote lock/unlock bin lid
exports.toggleBinLid = (req, res) => {
  hardwareState.smartBin.lidLocked = !hardwareState.smartBin.lidLocked;
  res.json({
    success: true,
    message: `Smart Bin lid is now ${hardwareState.smartBin.lidLocked ? 'LOCKED' : 'UNLOCKED'}`,
    smartBin: hardwareState.smartBin,
  });
};
