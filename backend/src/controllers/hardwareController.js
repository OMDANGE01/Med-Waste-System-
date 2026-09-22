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
  robot: {
    deviceId: 'ROBOT-BIO-BOT-01',
    name: 'Autonomous Bio-Waste Rover Mark-IV',
    status: 'ONLINE', // 'ONLINE' | 'OFFLINE'
    batteryPct: 86,
    isCharging: false,
    autoDockStatus: 'Active', // 'Charging' | 'Active' | 'Idle'
    dockAlignmentPct: 99.8,
    currentLocation: 'Ward 3 Corridor A - East Wing',
    currentZone: 'general_ward',
    coordinates: { x: 42, y: 58 },
    sensors: {
      lidarDistanceM: 1.84,
      lidarStatus: 'CLEAR_PATH',
      cameraStatus: 'Active - 60 FPS • AI Object Detection Engaged',
      cameraTempC: 38.2,
      motorSpeedMs: 0.65,
      motorRpm: 340,
      emergencyBrakeEngaged: false,
    },
    binFillLevels: {
      Yellow: 72, // % fill
      Red: 48,
      Blue: 35,
      Black: 18,
    },
    movementLogs: [
      {
        id: 'mov-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
        location: 'Ward 3 Corridor A - East Wing',
        action: 'Patrolling sector; LiDAR detected hospital bed cart, dynamic detour calculated.',
        status: 'Success',
      },
      {
        id: 'mov-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        location: 'OT-2 Scrub & Prep',
        action: 'Loaded container tag MW-2026-1001 into Yellow Internal Bin (6.4 kg).',
        status: 'Success',
      },
      {
        id: 'mov-3',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        location: 'Central Waste Disposal Bay',
        action: 'Discharged accumulated red plastics into designated compacting bay.',
        status: 'Success',
      },
      {
        id: 'mov-4',
        timestamp: new Date(Date.now() - 1000 * 60 * 62).toISOString(),
        location: 'Docking Base Alpha',
        action: 'Disengaged magnetic lock; completed 100% battery saturation.',
        status: 'Success',
      },
      {
        id: 'mov-5',
        timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        location: 'ICU Trauma Isolation',
        action: 'Scheduled biohazard survey route completed without contamination breach.',
        status: 'Success',
      },
    ],
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

// POST /api/hardware/robot/command - Issue command to autonomous rover
exports.controlRobot = (req, res) => {
  const { command, targetZone } = req.body;
  if (!command) {
    return res.status(400).json({ success: false, message: 'Command is required.' });
  }

  const robot = hardwareState.robot;
  let actionDescription = '';

  switch (command) {
    case 'dock':
      robot.autoDockStatus = 'Charging';
      robot.isCharging = true;
      robot.currentLocation = 'Docking Station Alpha';
      robot.currentZone = 'dock';
      robot.coordinates = { x: 12, y: 15 };
      robot.sensors.motorSpeedMs = 0;
      actionDescription = 'Autonomous return to Docking Station Alpha executed. Inductive contact closed.';
      break;

    case 'patrol':
      robot.autoDockStatus = 'Active';
      robot.isCharging = false;
      robot.status = 'ONLINE';
      robot.sensors.motorSpeedMs = 0.65;
      robot.currentLocation = 'Central Medical Corridor - Sector 2';
      robot.currentZone = 'corridor';
      robot.coordinates = { x: 50, y: 50 };
      actionDescription = 'Patrol route resumed across surgical suites and patient wards.';
      break;

    case 'navigate':
      robot.autoDockStatus = 'Active';
      robot.isCharging = false;
      robot.currentZone = targetZone || 'icu';
      robot.currentLocation = targetZone ? `${targetZone.toUpperCase()} Station` : 'Target Clinical Bay';
      robot.coordinates = { x: Math.floor(Math.random() * 60 + 20), y: Math.floor(Math.random() * 60 + 20) };
      actionDescription = `Dispatched to ${robot.currentLocation}.`;
      break;

    case 'emergency_stop':
      robot.autoDockStatus = 'Idle';
      robot.sensors.motorSpeedMs = 0;
      robot.sensors.emergencyBrakeEngaged = !robot.sensors.emergencyBrakeEngaged;
      actionDescription = robot.sensors.emergencyBrakeEngaged
        ? 'EMERGENCY BRAKE ENGAGED. Rover halted immediately.'
        : 'Emergency brake released. Rover in manual standby.';
      break;

    case 'toggle_status':
      robot.status = robot.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
      actionDescription = `Robot status switched to ${robot.status}.`;
      break;

    default:
      return res.status(400).json({ success: false, message: `Unknown command: ${command}` });
  }

  // Record movement log
  robot.movementLogs.unshift({
    id: `mov-${Date.now()}`,
    timestamp: new Date().toISOString(),
    location: robot.currentLocation,
    action: actionDescription,
    status: 'Success',
  });

  if (robot.movementLogs.length > 20) {
    robot.movementLogs.pop();
  }

  res.json({
    success: true,
    message: actionDescription,
    robot,
  });
};

// POST /api/hardware/robot/empty-bin - Empty one of the 4 bins
exports.emptyRobotBin = (req, res) => {
  const { binColor } = req.body;
  if (!binColor || !hardwareState.robot.binFillLevels[binColor] !== undefined) {
    return res.status(400).json({ success: false, message: 'Valid binColor (Yellow, Red, Blue, Black) required.' });
  }

  hardwareState.robot.binFillLevels[binColor] = 0;
  hardwareState.robot.movementLogs.unshift({
    id: `mov-${Date.now()}`,
    timestamp: new Date().toISOString(),
    location: 'Central Waste Disposal Bay',
    action: `Manually discharged and sanitized internal ${binColor} Bin (Reset to 0% fill).`,
    status: 'Success',
  });

  res.json({
    success: true,
    message: `${binColor} bin emptied and sanitized.`,
    binFillLevels: hardwareState.robot.binFillLevels,
  });
};

