import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Thermometer, 
  Gauge, 
  Scale, 
  QrCode, 
  FileCheck2, 
  Building2, 
  ChevronRight, 
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';
import cloudSync from '../services/cloudSyncService';

export default function MultiHospitalDriverRouteView({
  hospitals = [],
  wasteRecords = [],
  pickups = [],
  currentUser,
  onUpdateRecordStatus,
  onAddToast
}) {
  const canvasRef = useRef(null);
  const [activeStopIndex, setActiveStopIndex] = useState(1);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(true);
  const [vehicleProgress, setVehicleProgress] = useState(0.35); // 0 to 1 between stops
  const [cargoTemp, setCargoTemp] = useState(3.8);
  const [vehicleSpeed, setVehicleSpeed] = useState(42);
  const [selectedHospitalForHandover, setSelectedHospitalForHandover] = useState(null);
  const [digitalSignerName, setDigitalSignerName] = useState('Sister Sunita Tayade');

  // Build ordered route stops across the connected Khamgaon hospitals ending at MIDC CBWTF
  const routeStops = [
    {
      stopIndex: 0,
      hospitalId: 'HOSP-01',
      name: 'Government Hospital of Khamgaon',
      zone: 'Jalamb Road Sector',
      cpcbCode: 'MPCB-KHM-GOV-2024',
      x: 180,
      y: 160,
      lat: 20.6920,
      lng: 76.5695,
      status: 'Collected',
      bagsToCollect: 3,
      weightKg: 17.1,
    },
    {
      stopIndex: 1,
      hospitalId: 'HOSP-02',
      name: 'Dwarka Hospital of Khamgaon',
      zone: 'Nandura Rd Highway Corridor',
      cpcbCode: 'MPCB-KHM-DWK-2023',
      x: 340,
      y: 110,
      lat: 20.6854,
      lng: 76.5742,
      status: 'Current Waypoint',
      bagsToCollect: 3,
      weightKg: 15.6,
    },
    {
      stopIndex: 2,
      hospitalId: 'HOSP-03',
      name: 'Anand Hospital of Khamgaon',
      zone: 'Ghatpuri Naka / Balaji Plots',
      cpcbCode: 'MPCB-KHM-AND-2022',
      x: 520,
      y: 150,
      lat: 20.6812,
      lng: 76.5615,
      status: 'Scheduled Next',
      bagsToCollect: 2,
      weightKg: 9.4,
    },
    {
      stopIndex: 3,
      hospitalId: 'HOSP-04',
      name: 'Dr. Hedgewar Rugnalaya Khamgaon',
      zone: 'Station Road Sector',
      cpcbCode: 'MPCB-KHM-HDG-2024',
      x: 640,
      y: 280,
      lat: 20.6970,
      lng: 76.5720,
      status: 'Scheduled',
      bagsToCollect: 2,
      weightKg: 7.7,
    },
    {
      stopIndex: 4,
      hospitalId: 'CBWTF-01',
      name: 'Khamgaon Central CBWTF Treatment Plant',
      zone: 'MIDC Industrial Treatment Park',
      cpcbCode: 'MPCB-CBWTF-KHM-01',
      x: 750,
      y: 420,
      lat: 20.6720,
      lng: 76.5450,
      status: 'Final Destination (Incinerator)',
      bagsToCollect: 0,
      weightKg: 0,
    },
  ];

  // Animation loop for vehicle driving between current and next stop
  useEffect(() => {
    let animFrame;
    const interval = setInterval(() => {
      if (isSimulatingDrive) {
        setVehicleProgress((prev) => {
          if (prev >= 1) return 0;
          return prev + 0.008;
        });
        // small telemetry jitter for realism
        setCargoTemp(Number((3.7 + Math.sin(Date.now() / 3000) * 0.3).toFixed(1)));
        setVehicleSpeed(Math.floor(38 + Math.sin(Date.now() / 2000) * 8));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isSimulatingDrive]);

  // Canvas GPS Map Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Dark grid background
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw route corridor line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    routeStops.forEach((stop, idx) => {
      if (idx === 0) ctx.moveTo(stop.x, stop.y);
      else ctx.lineTo(stop.x, stop.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw completed route segments
    ctx.strokeStyle = '#9333ea';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i <= activeStopIndex; i++) {
      if (i === 0) ctx.moveTo(routeStops[i].x, routeStops[i].y);
      else ctx.lineTo(routeStops[i].x, routeStops[i].y);
    }
    ctx.stroke();

    // Draw Hospital Nodes
    routeStops.forEach((stop, idx) => {
      const isCurrent = idx === activeStopIndex;
      const isPast = idx < activeStopIndex;
      const isFinal = idx === routeStops.length - 1;

      // Glow circle
      if (isCurrent) {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
        ctx.beginPath();
        ctx.arc(stop.x, stop.y, 24, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outer ring
      ctx.strokeStyle = isFinal ? '#ef4444' : isCurrent ? '#a855f7' : isPast ? '#10b981' : '#64748b';
      ctx.lineWidth = 3;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(stop.x, stop.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Node label
      ctx.fillStyle = isCurrent ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(stop.name, stop.x - 40, stop.y - 20);

      ctx.fillStyle = isPast ? '#10b981' : isCurrent ? '#c084fc' : '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(`Stop ${idx + 1}: ${stop.zone}`, stop.x - 40, stop.y + 26);
    });

    // Draw Animated Vehicle Position
    if (activeStopIndex < routeStops.length - 1) {
      const currentStop = routeStops[activeStopIndex];
      const nextStop = routeStops[activeStopIndex + 1];
      const truckX = currentStop.x + (nextStop.x - currentStop.x) * vehicleProgress;
      const truckY = currentStop.y + (nextStop.y - currentStop.y) * vehicleProgress;

      // Truck marker
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(truckX, truckY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Truck label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('MH-15-BW-4092', truckX + 14, truckY + 4);
    }
  }, [activeStopIndex, vehicleProgress]);

  // Handle Handover Confirmation
  const handleConfirmHandover = (hospital) => {
    // 1. Enqueue Edge SQL transaction
    cloudSync.enqueueTransaction('pickup_requests', 'UPDATE', {
      manifestNumber: 'MAN-2026-0089',
      hospitalName: hospital.name,
      status: 'In Transit',
      driverName: currentUser?.name || 'Robert Langdon',
      vehicleNumber: 'MH-15-BW-4092',
      signer: digitalSignerName,
      timestamp: new Date().toISOString(),
    });

    // 2. Update local waste bag status if available
    wasteRecords
      .filter((r) => r.hospitalName === hospital.name && r.status === 'Awaiting Pickup')
      .forEach((r) => {
        if (onUpdateRecordStatus) onUpdateRecordStatus(r.tagId, 'In Transit');
      });

    if (onAddToast) {
      onAddToast(`Chain of custody handover confirmed at ${hospital.name}. Digital signature logged.`, 'success');
    }

    // Advance to next stop
    if (activeStopIndex < routeStops.length - 1) {
      setActiveStopIndex(activeStopIndex + 1);
      setVehicleProgress(0);
    }

    setSelectedHospitalForHandover(null);
  };

  const handleCompleteFinalDelivery = () => {
    cloudSync.enqueueTransaction('pickup_requests', 'UPDATE', {
      manifestNumber: 'MAN-2026-0089',
      status: 'Completed',
      notes: 'All multi-hospital biomedical waste delivered to Apex Incinerator and Autoclave plant.',
    });

    wasteRecords.forEach((r) => {
      if (r.status === 'In Transit' && onUpdateRecordStatus) {
        onUpdateRecordStatus(r.tagId, 'Disposed');
      }
    });

    if (onAddToast) {
      onAddToast('Route Completed! All hospital bio-waste safely delivered to central treatment incinerators.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Driver Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
              CBWTF REGIONAL TRANSIT FLEET #4
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Multi-Hospital Biohazard Collection Circuit</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-purple-400" />
            <span>Driver Multi-Hospital Route Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connecting multiple patient facilities across districts with real-time GPS telemetry, cold-chain monitoring, and statutory chain-of-custody transfer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulatingDrive(!isSimulatingDrive)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              isSimulatingDrive
                ? 'bg-purple-950 text-purple-300 border-purple-700 hover:bg-purple-900'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isSimulatingDrive ? 'Pause Telemetry' : 'Resume Telemetry'}
          </button>
        </div>
      </div>

      {/* Live Telemetry HUD */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Vehicle ID</span>
            <Truck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono">
            MH-15-BW-4092
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            Refrigerated Biohazard Van
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Cargo Cold-Chain</span>
            <Thermometer className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-400 font-mono tabular-nums">
            {cargoTemp}°C
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1">
            Within CPCB Standard (&lt;8°C)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>GPS Velocity</span>
            <Gauge className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono tabular-nums">
            {vehicleSpeed} <span className="text-xs font-sans text-slate-500">km/h</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Next Stop ETA: 8 mins
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Current Cargo Weight</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
            24.8 <span className="text-xs font-sans text-slate-400">kg</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            7 Barcoded Bags Onboard
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Digital GPS Seal</span>
            <ShieldCheck className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-sm font-bold text-emerald-400 font-mono">
            SECURE & LOCKED
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Tamper-Proof Chain
          </div>
        </div>
      </div>

      {/* Main Interactive Map & Route Stops Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas GPS Map (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-purple-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Live Multi-Hospital Transit GPS Map
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Telemetry Feed Active</span>
            </div>
          </div>

          <div className="w-full flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative min-h-[360px] flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={860}
              height={480}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>Active Circuit: West District → City Center → North Ring → South Sector → CBWTF Plant</span>
            <span className="font-mono text-slate-300">Total Distance: 34.2 km</span>
          </div>
        </div>

        {/* Route Stops Checklist & Actions (1 Col) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono px-1">
            Hospital Route Waypoints ({routeStops.length})
          </h2>

          <div className="space-y-2.5">
            {routeStops.map((stop, idx) => {
              const isCurrent = idx === activeStopIndex;
              const isPast = idx < activeStopIndex;
              const isFinal = idx === routeStops.length - 1;

              return (
                <div
                  key={stop.hospitalId}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-purple-950/30 border-purple-600 shadow-md shadow-purple-950/50'
                      : isPast
                      ? 'bg-slate-900/60 border-slate-800 opacity-80'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isPast ? 'bg-emerald-950 text-emerald-300' : isCurrent ? 'bg-purple-950 text-purple-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          Stop {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-white">{stop.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{stop.zone}</p>
                    </div>

                    {isPast && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </div>

                  {!isFinal && (
                    <div className="flex items-center justify-between text-xs font-mono text-slate-300 pt-2 border-t border-slate-800/80 mb-2">
                      <span>Ready for Pickup:</span>
                      <span className="text-amber-400 font-bold">{stop.bagsToCollect} bags ({stop.weightKg} kg)</span>
                    </div>
                  )}

                  {isCurrent && !isFinal && (
                    <button
                      onClick={() => setSelectedHospitalForHandover(stop)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Arrive & Confirm Handover</span>
                    </button>
                  )}

                  {isCurrent && isFinal && (
                    <button
                      onClick={handleCompleteFinalDelivery}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Unload to Incinerator & Close Manifest</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Handover & Digital Signature Modal */}
      {selectedHospitalForHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Chain of Custody Handover</h3>
              </div>
              <button
                onClick={() => setSelectedHospitalForHandover(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400 font-medium">Origin Facility</div>
                <div className="text-sm font-bold text-white">{selectedHospitalForHandover.name}</div>
                <div className="text-[11px] font-mono text-purple-400">{selectedHospitalForHandover.cpcbCode}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Bags to Transfer</div>
                  <div className="text-xl font-bold text-amber-400 font-mono">
                    {selectedHospitalForHandover.bagsToCollect}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Certified Weight</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono">
                    {selectedHospitalForHandover.weightKg} kg
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hospital Authorized Custodian / Signer *
                </label>
                <input
                  type="text"
                  value={digitalSignerName}
                  onChange={(e) => setDigitalSignerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[11px] text-purple-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  By signing, custody transfers from hospital holding bay to CBWTF transit vehicle MH-15-BW-4092 per India Bio-Medical Waste Management Rules 2016.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedHospitalForHandover(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmHandover(selectedHospitalForHandover)}
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sign & Accept Handover</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
