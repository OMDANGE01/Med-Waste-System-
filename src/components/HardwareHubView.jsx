import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Scale, 
  QrCode, 
  Radio, 
  RotateCcw, 
  Zap, 
  BatteryCharging, 
  Navigation, 
  CheckCircle2, 
  Terminal,
  RefreshCw,
  Send,
  AlertTriangle,
  Play,
  Pause,
  Anchor,
  ShieldAlert,
  Flame,
  Recycle,
  Wine,
  Camera,
  Activity,
  Trash2,
  Lock,
  Unlock
} from 'lucide-react';
import RobotFloorPlanMap from './RobotFloorPlanMap';
import TableSkeleton from './TableSkeleton';

export default function HardwareHubView({ onAddToast }) {
  const [hardwareData, setHardwareData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [simWeight, setSimWeight] = useState(4.65);
  const [simBarcode, setSimBarcode] = useState('');
  const [isUpdatingScale, setIsUpdatingScale] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('rover'); // 'rover' | 'scale_scanner'

  const fetchHardware = async () => {
    try {
      const res = await fetch('/api/hardware/status');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setHardwareData(json.data);
          if (json.data.scale?.currentWeightKg !== undefined) {
            setSimWeight(json.data.scale.currentWeightKg);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch hardware status', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHardware();
    const interval = setInterval(fetchHardware, 5000);
    return () => clearInterval(interval);
  }, []);

  // Robot Command Handler
  const handleRobotCommand = async (command, targetZone = null) => {
    try {
      const res = await fetch('/api/hardware/robot/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, targetZone }),
      });
      const json = await res.json();
      if (json.success) {
        setHardwareData((prev) => ({
          ...prev,
          robot: json.robot,
        }));
        if (onAddToast) {
          onAddToast('Rover Telemetry Updated', json.message, 'success');
        }
      }
    } catch {
      if (onAddToast) onAddToast('Command Error', 'Failed to communicate with robot controller.', 'error');
    }
  };

  // Empty Bin Handler
  const handleEmptyBin = async (binColor) => {
    try {
      const res = await fetch('/api/hardware/robot/empty-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ binColor }),
      });
      const json = await res.json();
      if (json.success) {
        fetchHardware();
        if (onAddToast) {
          onAddToast('Bin Emptied & Sanitized', `${binColor} receptacle cleared to 0% fill.`, 'info');
        }
      }
    } catch {
      if (onAddToast) onAddToast('Error', 'Failed to clear bin fill level', 'error');
    }
  };

  // Scale tare
  const handleTareScale = async () => {
    try {
      const res = await fetch('/api/hardware/calibrate', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSimWeight(0.0);
        fetchHardware();
        if (onAddToast) onAddToast('Scale Zeroed', 'Digital platform scale zeroed to 0.00 kg (Tare complete).', 'success');
      }
    } catch {
      if (onAddToast) onAddToast('Error', 'Failed to tare hardware scale', 'error');
    }
  };

  const handlePushScaleWeight = async (weight) => {
    setIsUpdatingScale(true);
    try {
      const res = await fetch('/api/hardware/scale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightKg: weight }),
      });
      const json = await res.json();
      if (json.success) {
        setSimWeight(weight);
        fetchHardware();
        if (onAddToast) onAddToast('Scale Synchronized', `Platform weight updated to ${weight} kg`, 'info');
      }
    } catch {
      if (onAddToast) onAddToast('Error', 'Failed to update scale weight', 'error');
    } finally {
      setIsUpdatingScale(false);
    }
  };

  const handlePushBarcodeScan = async (e) => {
    e.preventDefault();
    if (!simBarcode.trim()) return;
    try {
      const res = await fetch('/api/hardware/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: simBarcode.trim(), category: 'Red' }),
      });
      const json = await res.json();
      if (json.success) {
        fetchHardware();
        setSimBarcode('');
        if (onAddToast) onAddToast('Barcode Optical Trigger', `Scanned ${json.lastScan}`, 'success');
      }
    } catch {
      if (onAddToast) onAddToast('Error', 'Failed to push barcode scan', 'error');
    }
  };

  const robot = hardwareData?.robot || {
    status: 'ONLINE',
    batteryPct: 86,
    isCharging: false,
    autoDockStatus: 'Active',
    dockAlignmentPct: 99.8,
    currentLocation: 'Ward 3 Corridor A - East Wing',
    sensors: {
      lidarDistanceM: 1.84,
      cameraStatus: 'Active - 60 FPS • AI Object Detection Engaged',
      motorSpeedMs: 0.65,
      motorRpm: 340,
    },
    binFillLevels: {
      Yellow: 72,
      Red: 48,
      Blue: 35,
      Black: 18,
    },
    movementLogs: [
      { id: '1', timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(), location: 'Ward 3 Corridor A - East Wing', action: 'Patrolling sector; LiDAR dynamic detour calculated.' },
      { id: '2', timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), location: 'OT-2 Scrub & Prep', action: 'Loaded container tag MW-2026-1001 into Yellow Internal Bin (6.4 kg).' },
      { id: '3', timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), location: 'Central Waste Disposal Bay', action: 'Discharged accumulated red plastics into designated compacting bay.' },
      { id: '4', timestamp: new Date(Date.now() - 1000 * 60 * 62).toISOString(), location: 'Docking Base Alpha', action: 'Disengaged magnetic lock; completed battery saturation.' },
      { id: '5', timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(), location: 'ICU Trauma Isolation', action: 'Scheduled biohazard survey route completed.' },
    ],
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Cpu className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Telemetry & Robotic Fleet Hardware Hub
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
            Hardware, IoT & Autonomous Robot Control
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Live telemetry stream for Autonomous Bio-Waste Rover Mark-IV, multi-stream internal receptacles, LiDAR collision prevention, and floor plan dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
            <button
              onClick={() => setActiveSubTab('rover')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'rover'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Robot & IoT
            </button>
            <button
              onClick={() => setActiveSubTab('scale_scanner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'scale_scanner'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Scale & Scanners
            </button>
          </div>

          <button
            onClick={fetchHardware}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeSubTab === 'rover' ? (
        <>
          {/* ─── 1. ROBOT STATUS CARD & SENSOR READINGS ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Robot Status Card */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center">
                    <Navigation className="w-5 h-5 transform rotate-45" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Bio-Rover Mark-IV</h3>
                    <span className="font-mono text-xs text-slate-500">ID: ROBOT-BIO-BOT-01</span>
                  </div>
                </div>

                {/* Online / Offline Status Badge */}
                <button
                  onClick={() => handleRobotCommand('toggle_status')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition ${
                    robot.status === 'ONLINE'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                  }`}
                  title="Click to toggle status"
                >
                  <span className={`w-2 h-2 rounded-full ${robot.status === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                  {robot.status}
                </button>
              </div>

              {/* Battery & Current Location */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <BatteryCharging className="w-4 h-4 text-emerald-400" />
                      Battery Level
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {robot.batteryPct}% {robot.isCharging ? '(Charging)' : ''}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${robot.batteryPct}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
                    Current Location
                  </span>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    {robot.currentLocation}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Floor Level 2 • Autonomous GPS & SLAM Grounded
                  </div>
                </div>

                {/* Auto-Dock Status */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                      Auto-Dock Status
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                      robot.autoDockStatus === 'Charging' ? 'bg-emerald-500/20 text-emerald-300' :
                      robot.autoDockStatus === 'Active' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {robot.autoDockStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Alignment Precision:</span>
                    <span className="font-mono font-bold text-white">{robot.dockAlignmentPct || 99.8}%</span>
                  </div>

                  {/* Rover Remote Control Commands */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60">
                    <button
                      onClick={() => handleRobotCommand('dock')}
                      className="py-1.5 px-2 rounded-xl bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition"
                      title="Recall rover to docking base"
                    >
                      <Anchor className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Dock</span>
                    </button>
                    <button
                      onClick={() => handleRobotCommand('patrol')}
                      className="py-1.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition shadow-md"
                      title="Resume autonomous patrol"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Patrol</span>
                    </button>
                    <button
                      onClick={() => handleRobotCommand('emergency_stop')}
                      className="py-1.5 px-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1 transition"
                      title="Emergency halt"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Halt</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Sensor Readings */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Live Sensor Readings
                </h3>
                <span className="text-xs font-mono text-slate-400">100 Hz Bus</span>
              </div>

              <div className="space-y-3">
                {/* LiDAR Distance */}
                <div className="p-3.5 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-rose-400" />
                      LiDAR Proximity & Clearance
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {robot.sensors?.lidarDistanceM || 1.84} m
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${Math.min(100, (robot.sensors?.lidarDistanceM || 1.84) * 35)}%` }} 
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Path: CLEAR</span>
                    <span>360° Safety Ring Engaged</span>
                  </div>
                </div>

                {/* Camera Status */}
                <div className="p-3.5 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-sky-400" />
                      Optical Vision Camera
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-sky-500/20 text-sky-300">
                      60 FPS HDR
                    </span>
                  </div>
                  <div className="text-xs text-white font-medium">
                    {robot.sensors?.cameraStatus || 'Active - 60 FPS • AI Object Detection Engaged'}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Clean Lens Confirmed</span>
                    <span>Temp: 38.2°C</span>
                  </div>
                </div>

                {/* Motor Speed */}
                <div className="p-3.5 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Motor Drive & Speed
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {robot.sensors?.motorSpeedMs || 0.65} m/s
                    </span>
                  </div>
                  <div className="text-xs text-white font-medium">
                    {robot.sensors?.motorRpm || 340} RPM Differential Wheels
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Brushless High-Torque Gearmotors • Dual Encoders
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Bin Fill Levels (Progress Bars) */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    4 Bin Internal Fill Levels
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Segregated CPCB canisters inside rover</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Yellow Bin */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      Yellow Bin (Anatomical)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">
                        {robot.binFillLevels?.Yellow || 72}%
                      </span>
                      <button
                        onClick={() => handleEmptyBin('Yellow')}
                        className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
                        title="Empty yellow bin"
                      >
                        Discharge
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${robot.binFillLevels?.Yellow || 72}%` }}
                    />
                  </div>
                </div>

                {/* Red Bin */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                      <Recycle className="w-3.5 h-3.5" />
                      Red Bin (Contaminated/Sharps)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">
                        {robot.binFillLevels?.Red || 48}%
                      </span>
                      <button
                        onClick={() => handleEmptyBin('Red')}
                        className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
                        title="Empty red bin"
                      >
                        Discharge
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all duration-500"
                      style={{ width: `${robot.binFillLevels?.Red || 48}%` }}
                    />
                  </div>
                </div>

                {/* Blue Bin */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-sky-300 font-semibold flex items-center gap-1.5">
                      <Wine className="w-3.5 h-3.5" />
                      Blue Bin (Glassware/Metallic)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">
                        {robot.binFillLevels?.Blue || 35}%
                      </span>
                      <button
                        onClick={() => handleEmptyBin('Blue')}
                        className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
                        title="Empty blue bin"
                      >
                        Discharge
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="h-full rounded-full bg-sky-400 transition-all duration-500"
                      style={{ width: `${robot.binFillLevels?.Blue || 35}%` }}
                    />
                  </div>
                </div>

                {/* Black Bin */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Black Bin (General/Cytotoxic)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">
                        {robot.binFillLevels?.Black || 18}%
                      </span>
                      <button
                        onClick={() => handleEmptyBin('Black')}
                        className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
                        title="Empty black bin"
                      >
                        Discharge
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="h-full rounded-full bg-slate-400 transition-all duration-500"
                      style={{ width: `${robot.binFillLevels?.Black || 18}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 2. ROBOT LOCATION MAP: FLOOR PLAN GRID ─── */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <RobotFloorPlanMap
              robotData={robot}
              onCommand={handleRobotCommand}
            />
          </div>

          {/* ─── 3. ROBOT MOVEMENT LOG TABLE ─── */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-rose-500" />
                  Autonomous Robot Movement & Navigation Log
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time telemetry event records with coordinate checkpoints and container pickup events
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {robot.movementLogs?.length || 0} events
              </span>
            </div>

            {isLoading ? (
              <TableSkeleton rows={4} cols={3} />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5">Hospital Location</th>
                      <th className="px-5 py-3.5">Rover Action & Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {robot.movementLogs?.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-850/50 transition">
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-white">
                          {log.location}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-300">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                            <span>{log.action}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Scale & Barcode Scanner Telemetry Tab */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Digital Scale Hardware Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Industrial Digital Platform Scale</h3>
                  <span className="font-mono text-xs text-slate-500">Mettler Toledo RS-232 / USB</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                ONLINE
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-black border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
                Load Cell Weight Reading
              </span>
              <div className="text-4xl font-extrabold text-emerald-400 font-mono">
                {Number(simWeight).toFixed(2)} <span className="text-xl text-slate-400">kg</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Precision: ±0.01 kg</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleTareScale}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Tare to 0.00 kg</span>
              </button>
              <button
                onClick={() => handlePushScaleWeight(Number((Math.random() * 8 + 1).toFixed(2)))}
                disabled={isUpdatingScale}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Simulate Load</span>
              </button>
            </div>
          </div>

          {/* Barcode Scanner Hardware Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Handheld Optical Scanner</h3>
                  <span className="font-mono text-xs text-slate-500">Zebra DS2208 1D/2D Reader</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                ONLINE
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-850/80 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Last Scanned Label</span>
              <div className="font-mono text-base font-bold text-white">
                {hardwareData?.scanner?.lastScannedTag || 'MW-2026-1002'}
              </div>
              <span className="text-xs text-slate-400">Decoded in 45ms</span>
            </div>

            <form onSubmit={handlePushBarcodeScan} className="flex gap-2">
              <input
                type="text"
                placeholder="Scan or enter tag (e.g. MW-2026-1009)..."
                value={simBarcode}
                onChange={(e) => setSimBarcode(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md"
              >
                Scan Tag
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
