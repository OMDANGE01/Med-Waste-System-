import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Scale, 
  QrCode, 
  Radio, 
  Truck, 
  Lock, 
  Unlock, 
  RotateCcw, 
  Zap, 
  BatteryCharging, 
  Thermometer, 
  Navigation, 
  CheckCircle2, 
  Terminal,
  RefreshCw,
  Send
} from 'lucide-react';

export default function HardwareHubView({ onAddToast, onNavigateToMap }) {
  const [hardwareData, setHardwareData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [simWeight, setSimWeight] = useState(4.65);
  const [simBarcode, setSimBarcode] = useState('');
  const [isUpdatingScale, setIsUpdatingScale] = useState(false);

  const fetchHardware = async () => {
    try {
      const res = await fetch('/api/hardware/status');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setHardwareData(json.data);
          setSimWeight(json.data.scale?.currentWeightKg || 0);
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
    const interval = setInterval(fetchHardware, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleTareScale = async () => {
    try {
      const res = await fetch('/api/hardware/calibrate', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSimWeight(0.0);
        fetchHardware();
        if (onAddToast) onAddToast('Scale Calibrated', 'Digital platform scale zeroed to 0.00 kg (Tare complete).', 'success');
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
        body: JSON.stringify({ weightKg: parseFloat(weight) }),
      });
      const json = await res.json();
      if (json.success) {
        fetchHardware();
        if (onAddToast) onAddToast('Scale Telemetry Updated', `Live load set to ${weight} kg`, 'info');
      }
    } catch {
      if (onAddToast) onAddToast('Error', 'Failed to update scale weight', 'error');
    } finally {
      setIsUpdatingScale(false);
    }
  };

  const handleSimulateScan = async (e) => {
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
        setSimBarcode('');
        fetchHardware();
        if (onAddToast) onAddToast('Hardware Scan Registered', `Scanned: ${json.lastScan}`, 'success');
      }
    } catch {
      if (onAddToast) onAddToast('Error', 'Failed to send barcode scan', 'error');
    }
  };

  const handleToggleLid = async () => {
    try {
      const res = await fetch('/api/hardware/bin/toggle-lid', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        fetchHardware();
        if (onAddToast) onAddToast('Smart Bin Actuator', json.message, 'info');
      }
    } catch {
      if (onAddToast) onAddToast('Error', 'Failed to toggle bin lid', 'error');
    }
  };

  if (isLoading || !hardwareData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const { scale, scanner, smartBin, fleetGps } = hardwareData;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Hardware & IoT Operations Hub</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                IoT Gateway Online
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Direct physical interface for electronic weigh scales, USB/BLE barcode scanners, and automated bio-bin sensors.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHardware}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Poll Devices</span>
        </button>
      </div>

      {/* Grid: 4 Hardware Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. DIGITAL WEIGHING SCALE MODULE */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Scale className="w-5 h-5 text-rose-500" />
              <div>
                <h3 className="font-bold text-white text-base">Digital Biohazard Platform Scale</h3>
                <p className="text-xs text-slate-400 font-mono">{scale.port}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {scale.status}
            </span>
          </div>

          {/* Digital 7-Segment Green Display */}
          <div className="p-6 rounded-2xl bg-slate-950 border-2 border-slate-800 shadow-inner flex flex-col items-center justify-center space-y-1">
            <div className="text-xs font-mono tracking-widest text-slate-500 uppercase">
              LIVE SCALE TELEMETRY • HIGH PRECISION
            </div>
            <div className="text-5xl font-black font-mono tracking-wider text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]">
              {scale.currentWeightKg.toFixed(2)}
              <span className="text-2xl font-normal text-emerald-600 ml-2">kg</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>STABLE LOAD • TARE: {scale.isTareZero ? 'ACTIVE (0.00)' : 'UNLOCKED'}</span>
            </div>
          </div>

          {/* Scale Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleTareScale}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Tare / Zero Scale (0.00)</span>
            </button>
            <button
              onClick={() => handlePushScaleWeight(Number((Math.random() * 5 + 1.5).toFixed(2)))}
              disabled={isUpdatingScale}
              className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-rose-950 transition"
            >
              <Zap className="w-4 h-4" />
              <span>Simulate Bag Placed</span>
            </button>
          </div>

          {/* Manual Weight Slider for Developer / Staff Testing */}
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="font-semibold">Hardware Weight Simulator (Load Cell):</span>
              <span className="font-mono font-bold text-emerald-400">{simWeight} kg</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="15.0"
              step="0.05"
              value={simWeight}
              onChange={(e) => setSimWeight(parseFloat(e.target.value))}
              onMouseUp={() => handlePushScaleWeight(simWeight)}
              onTouchEnd={() => handlePushScaleWeight(simWeight)}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>
        </div>

        {/* 2. BARCODE & RFID HARDWARE SCANNER */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Zebra Laser Barcode Scanner</h3>
                  <p className="text-xs text-slate-400 font-mono">{scanner.interface}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {scanner.status}
              </span>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Last Hardware Laser Scan
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-base font-bold text-sky-400 flex items-center justify-between">
                <span>{scanner.lastScannedTag || 'NO ACTIVE SCAN'}</span>
                <span className="text-xs font-sans text-slate-500 font-normal">Auto-Ingested</span>
              </div>
            </div>

            {/* Scan History Feed */}
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Recent Physical Scans Feed
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {scanner.scanHistory.map((item, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="font-mono text-white font-semibold">{item.tagId}</span>
                    <span className="text-slate-400">{item.category} Category</span>
                    <span className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Simulate Laser Scan Form */}
          <form onSubmit={handleSimulateScan} className="pt-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Enter/Scan Tag (e.g. MW-2026-9901)"
              value={simBarcode}
              onChange={(e) => setSimBarcode(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate Scan</span>
            </button>
          </form>
        </div>

        {/* 3. SMART BIOHAZARD BIN SENSORS */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Radio className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-bold text-white text-base">Smart Biohazard Bin #A4</h3>
                <p className="text-xs text-slate-400 font-mono">{smartBin.deviceId}</p>
              </div>
            </div>
            <button
              onClick={handleToggleLid}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition ${
                smartBin.lidLocked
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              {smartBin.lidLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{smartBin.lidLocked ? 'Lid: LOCKED' : 'Lid: UNLOCKED'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Fill Level */}
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Fill Level</span>
                <span className="font-bold text-white">{smartBin.fillLevelPct}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    smartBin.fillLevelPct > 80 ? 'bg-rose-500' : 'bg-amber-400'
                  }`}
                  style={{ width: `${smartBin.fillLevelPct}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400 block">Ultrasonic Depth Transducer</span>
            </div>

            {/* Environmental Sensors */}
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-1 text-xs">
              <div className="text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                <span>Bin Temp: <strong>{smartBin.temperatureCelsius}°C</strong></span>
              </div>
              <div className="text-slate-400 flex items-center gap-1 pt-1">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>UV-C Sterilization: <strong className="text-emerald-400">Ready</strong></span>
              </div>
              <div className="text-[10px] text-slate-500 pt-1">Odor scrubber fan active</div>
            </div>
          </div>
        </div>

        {/* 4. CBWTF FLEET GPS & TELEMETRY */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-white text-base">CBWTF Transit Vehicle Telemetry</h3>
                <p className="text-xs text-slate-400 font-mono">{fleetGps.vehicleNumber}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {fleetGps.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase">Driver & Route</span>
              <span className="font-semibold text-white">{fleetGps.driver}</span>
              <p className="text-[11px] text-slate-400 truncate">{fleetGps.destination}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase">GPS & Speed</span>
              <div className="font-mono text-emerald-400 font-bold">{fleetGps.speedKmh} km/h</div>
              <p className="text-[10px] font-mono text-slate-400">{fleetGps.latitude}, {fleetGps.longitude}</p>
            </div>
          </div>

          {onNavigateToMap && (
            <button
              onClick={() => onNavigateToMap()}
              className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Open Fleet & Hospital Bags in Live Google Map</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. MACHINE-TO-MACHINE (M2M) IOT API SPECIFICATION */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-rose-500">
          <Terminal className="w-5 h-5" />
          <h3 className="font-bold text-white text-base">Physical Hardware Integration API (M2M REST Endpoints)</h3>
        </div>
        <p className="text-xs text-slate-400">
          Any physical device (ESP32, Raspberry Pi, Arduino, or Weighbridge terminal) can push weights and barcode readings directly via HTTP POST:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1 overflow-x-auto">
            <div className="text-rose-400 font-bold"># Push Live Scale Weight (from ESP32/Scale):</div>
            <div>curl -X POST http://localhost:5000/api/hardware/scale \</div>
            <div>  -H "Content-Type: application/json" \</div>
            <div>  -d '&#123; "weightKg": 5.40, "deviceId": "SCALE-01" &#125;'</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1 overflow-x-auto">
            <div className="text-sky-400 font-bold"># Push Barcode Scan (from Scanner / RFID):</div>
            <div>curl -X POST http://localhost:5000/api/hardware/scan \</div>
            <div>  -H "Content-Type: application/json" \</div>
            <div>  -d '&#123; "tagId": "MW-2026-1045", "category": "Red" &#125;'</div>
          </div>
        </div>
      </div>
    </div>
  );
}
