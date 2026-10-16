import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  X,
  Flame,
  Recycle,
  Wine,
  ShieldAlert,
  Sparkles,
  PlusCircle,
  PackageCheck
} from 'lucide-react';
import cloudSync from '../services/cloudSyncService';

export default function MultiHospitalDriverRouteView({
  hospitals = [],
  wasteRecords = [],
  pickups = [],
  currentUser,
  onUpdateRecordStatus,
  onAddToast,
  onOpenQRScanner,
  onQuickLogSample
}) {
  const canvasRef = useRef(null);
  const [activeStopIndex, setActiveStopIndex] = useState(1);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(true);
  const [vehicleProgress, setVehicleProgress] = useState(0.35); // 0 to 1 between stops
  const [cargoTemp, setCargoTemp] = useState(3.8);
  const [vehicleSpeed, setVehicleSpeed] = useState(42);
  const [selectedHospitalForHandover, setSelectedHospitalForHandover] = useState(null);
  const [digitalSignerName, setDigitalSignerName] = useState('Sister Sunita Tayade');

  // Driver Console Sub-Tab: 'awaiting_pickup' | 'awaiting_disposal' | 'disposed_history'
  const [consoleTab, setConsoleTab] = useState('awaiting_pickup');
  const [selectedHospitalFilter, setSelectedHospitalFilter] = useState('all');

  // Animation loop for vehicle driving between current and next stop
  useEffect(() => {
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

  // Segregate bags by dynamic lifecycle states
  const {
    bagsAwaitingPickup,
    bagsAwaitingDisposal,
    bagsDisposed,
    totalOnboardWeight,
    totalPickupWeight,
    totalDisposedWeight
  } = useMemo(() => {
    const awaitingPickup = [];
    const awaitingDisposal = [];
    const disposed = [];

    let onboardWeight = 0;
    let pickupWeight = 0;
    let dispWeight = 0;

    wasteRecords.forEach((r) => {
      const w = Number(r.weightKg) || 0;
      const status = r.status || 'Logged';

      if (status === 'Logged' || status === 'Awaiting Pickup') {
        awaitingPickup.push(r);
        pickupWeight += w;
      } else if (status === 'In Transit' || status === 'Collected') {
        awaitingDisposal.push(r);
        onboardWeight += w;
      } else if (status === 'Disposed' || status === 'Delivered') {
        disposed.push(r);
        dispWeight += w;
      }
    });

    return {
      bagsAwaitingPickup: awaitingPickup,
      bagsAwaitingDisposal: awaitingDisposal,
      bagsDisposed: disposed,
      totalOnboardWeight: onboardWeight.toFixed(2),
      totalPickupWeight: pickupWeight.toFixed(2),
      totalDisposedWeight: dispWeight.toFixed(2)
    };
  }, [wasteRecords]);

  // Dynamically compute stops data from actual waste records
  const routeStops = useMemo(() => {
    const baseStops = [
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
      },
    ];

    return baseStops.map((stop, idx) => {
      const isFinal = idx === baseStops.length - 1;
      let bagsToCollect = 0;
      let weightKg = 0;
      let status = 'Scheduled';

      if (isFinal) {
        // Final destination stop displays bags awaiting final disposal
        bagsToCollect = bagsAwaitingDisposal.length;
        weightKg = Number(totalOnboardWeight);
        status = 'Final Destination (Incinerator)';
      } else {
        const matching = bagsAwaitingPickup.filter(
          (r) => r.hospitalId === stop.hospitalId || (r.hospitalName && r.hospitalName.toLowerCase().includes(stop.name.toLowerCase().split(' ')[0]))
        );
        bagsToCollect = matching.length;
        weightKg = matching.reduce((sum, r) => sum + (Number(r.weightKg) || 0), 0);

        if (idx < activeStopIndex) status = 'Collected';
        else if (idx === activeStopIndex) status = 'Current Waypoint';
        else if (idx === activeStopIndex + 1) status = 'Scheduled Next';
      }

      return {
        ...stop,
        bagsToCollect,
        weightKg: Number(weightKg.toFixed(2)),
        status,
      };
    });
  }, [bagsAwaitingPickup, bagsAwaitingDisposal, totalOnboardWeight, activeStopIndex]);

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
    ctx.beginPath();
    routeStops.forEach((stop, i) => {
      if (i === 0) ctx.moveTo(stop.x, stop.y);
      else ctx.lineTo(stop.x, stop.y);
    });
    ctx.stroke();

    // Draw traveled path in glowing purple
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i <= activeStopIndex && i < routeStops.length; i++) {
      if (i === 0) ctx.moveTo(routeStops[i].x, routeStops[i].y);
      else if (i < activeStopIndex) ctx.lineTo(routeStops[i].x, routeStops[i].y);
      else if (i === activeStopIndex && activeStopIndex > 0) {
        // Interpolate along segment
        const prev = routeStops[i - 1];
        const curr = routeStops[i];
        const curX = prev.x + (curr.x - prev.x) * vehicleProgress;
        const curY = prev.y + (curr.y - prev.y) * vehicleProgress;
        ctx.lineTo(curX, curY);
      }
    }
    ctx.stroke();

    // Draw stops
    routeStops.forEach((stop, i) => {
      const isCurrent = i === activeStopIndex;
      const isPast = i < activeStopIndex;
      const isFinal = i === routeStops.length - 1;

      ctx.beginPath();
      ctx.arc(stop.x, stop.y, isCurrent ? 14 : 9, 0, Math.PI * 2);
      ctx.fillStyle = isFinal ? '#e11d48' : isPast ? '#10b981' : isCurrent ? '#a855f7' : '#475569';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isCurrent ? 3 : 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(stop.name.replace(' of Khamgaon', ''), stop.x - 40, stop.y - 18);

      if (!isFinal && stop.bagsToCollect > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`${stop.bagsToCollect} bags`, stop.x - 20, stop.y + 24);
      }
    });

    // Draw Vehicle Icon at Current Position
    if (activeStopIndex < routeStops.length) {
      const prev = activeStopIndex > 0 ? routeStops[activeStopIndex - 1] : routeStops[0];
      const curr = routeStops[activeStopIndex];
      const vx = prev.x + (curr.x - prev.x) * vehicleProgress;
      const vy = prev.y + (curr.y - prev.y) * vehicleProgress;

      ctx.beginPath();
      ctx.arc(vx, vy, 18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(vx, vy, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#ec4899';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [activeStopIndex, vehicleProgress, routeStops]);

  // Handle Pick Bag (Transition from Logged -> In Transit)
  const handlePickBag = async (record) => {
    if (!onUpdateRecordStatus) return;
    const extra = {
      driverName: currentUser?.name || 'Prakash Gawli',
      vehicleNumber: 'MH-15-BW-4092',
    };
    await onUpdateRecordStatus(record.tagId || record._id, 'In Transit', extra);
    if (onAddToast) {
      onAddToast('Bag Picked Up', `Bag ${record.tagId} loaded onto biohazard transit van MH-15-BW-4092. Status: In Transit`, 'success');
    }
  };

  // Handle Dispose Bag (Transition from In Transit -> Disposed at CBWTF Incinerator)
  const handleDisposeBag = async (record) => {
    if (!onUpdateRecordStatus) return;
    const extra = {
      disposalFacility: 'Khamgaon Central Bio-Medical Waste Treatment Facility (CBWTF MIDC)',
      incineratorChamberTemp: '1120°C',
    };
    await onUpdateRecordStatus(record.tagId || record._id, 'Disposed', extra);
    if (onAddToast) {
      onAddToast('Disposal Certified', `Bag ${record.tagId} certified destroyed in dual-chamber incinerator at 1120°C per CPCB norms.`, 'success');
    }
  };

  // Handle Handover confirmation at a specific hospital stop
  const handleConfirmHandover = (hospital) => {
    cloudSync.enqueueTransaction('pickup_requests', 'CREATE', {
      manifestNumber: `MAN-2026-${Date.now().toString().slice(-4)}`,
      hospitalName: hospital.name,
      status: 'In Transit',
      driverName: currentUser?.name || 'Prakash Gawli',
      vehicleNumber: 'MH-15-BW-4092',
      signer: digitalSignerName,
      timestamp: new Date().toISOString(),
    });

    // Update matching bags at this hospital to 'In Transit'
    const bagsAtHospital = wasteRecords.filter(
      (r) =>
        (r.hospitalId === hospital.hospitalId || (r.hospitalName && r.hospitalName.includes(hospital.name.split(' ')[0]))) &&
        (r.status === 'Awaiting Pickup' || r.status === 'Logged')
    );

    bagsAtHospital.forEach((r) => {
      if (onUpdateRecordStatus) {
        onUpdateRecordStatus(r.tagId || r._id, 'In Transit', {
          driverName: currentUser?.name || 'Prakash Gawli',
          vehicleNumber: 'MH-15-BW-4092',
        });
      }
    });

    if (onAddToast) {
      onAddToast('Handover Certified', `Chain of custody signed at ${hospital.name}. ${bagsAtHospital.length} bags loaded into transit vehicle.`, 'success');
    }

    // Advance to next stop
    if (activeStopIndex < routeStops.length - 1) {
      setActiveStopIndex(activeStopIndex + 1);
      setVehicleProgress(0);
    }

    setSelectedHospitalForHandover(null);
  };

  // Handle Complete Final Delivery & Batch Dispose All Onboard Bags
  const handleCompleteFinalDelivery = async () => {
    cloudSync.enqueueTransaction('pickup_requests', 'UPDATE', {
      manifestNumber: 'MAN-2026-FINAL',
      status: 'Completed',
      notes: 'All multi-hospital biomedical waste delivered to Apex Incinerator and Autoclave plant.',
    });

    const onboardBags = wasteRecords.filter((r) => r.status === 'In Transit' || r.status === 'Collected');

    for (const r of onboardBags) {
      if (onUpdateRecordStatus) {
        await onUpdateRecordStatus(r.tagId || r._id, 'Disposed', {
          disposalFacility: 'Khamgaon Central Bio-Medical Waste Treatment Facility (CBWTF MIDC)',
          incineratorChamberTemp: '1120°C',
        });
      }
    }

    if (onAddToast) {
      onAddToast('Consignment Completed!', `All ${onboardBags.length} bags safely incinerated & treated at central CBWTF plant. Form IV manifest signed.`, 'success');
    }
  };

  // Quick generate a sample waste bag at current waypoint (allows testing when all waste is dispatched)
  const handleQuickAddSample = async () => {
    if (onQuickLogSample) {
      const currentStop = routeStops[activeStopIndex] || routeStops[0];
      const categories = ['Yellow', 'Red', 'Blue', 'Black'];
      const randomCat = categories[Math.floor(Math.random() * categories.length)];
      const sampleWeight = (Math.random() * 4 + 1.5).toFixed(2);
      const sampleTag = `KHM-${currentStop.hospitalId ? currentStop.hospitalId.split('-')[1] : 'GOV'}-${Date.now().toString().slice(-4)}`;

      await onQuickLogSample({
        tagId: sampleTag,
        hospitalId: currentStop.hospitalId || 'HOSP-01',
        hospitalName: currentStop.name,
        category: randomCat,
        department: 'Emergency & Trauma',
        weightKg: sampleWeight,
        weightSource: 'Web Serial Digital Scale (9600 baud)',
        handlerName: 'Sister Sunita Tayade',
        status: 'Logged',
        notes: `Simulated bio-medical bag logged at ${currentStop.name}`,
      });

      if (onAddToast) {
        onAddToast('Fresh Bag Logged', `Generated new sample waste bag ${sampleTag} (${sampleWeight} kg, ${randomCat}) at ${currentStop.name}.`, 'info');
      }
    }
  };

  // Filtered lists for console
  const displayedAwaitingPickup = bagsAwaitingPickup.filter((r) => {
    if (selectedHospitalFilter !== 'all') {
      return r.hospitalId === selectedHospitalFilter || (r.hospitalName && r.hospitalName.includes(selectedHospitalFilter));
    }
    return true;
  });

  const displayedAwaitingDisposal = bagsAwaitingDisposal.filter((r) => {
    if (selectedHospitalFilter !== 'all') {
      return r.hospitalId === selectedHospitalFilter || (r.hospitalName && r.hospitalName.includes(selectedHospitalFilter));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ─── 1. DRIVER HEADER ─── */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
              CBWTF REGIONAL TRANSIT FLEET #4 • DRIVER WORKSPACE
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Multi-Hospital Biohazard Collection & Disposal Circuit</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-purple-400" />
            <span>Driver Route & Disposal Operations Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Autonomous bio-medical waste collection, real-time GPS telemetry, cold-chain temperature verification, and statutory incineration handover at Khamgaon Central CBWTF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenQRScanner && (
            <button
              onClick={onOpenQRScanner}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950 transition cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR / Barcode</span>
            </button>
          )}

          <button
            onClick={() => setIsSimulatingDrive(!isSimulatingDrive)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              isSimulatingDrive
                ? 'bg-purple-950 text-purple-300 border-purple-700 hover:bg-purple-900'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isSimulatingDrive ? 'Pause Telemetry' : 'Resume Telemetry'}
          </button>
        </div>
      </div>

      {/* ─── 2. LIVE TELEMETRY HUD METRICS ─── */}
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
            Prakash Gawli (Custodian)
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
            <span>Cargo Weight Onboard</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
            {totalOnboardWeight} <span className="text-xs font-sans text-slate-400">kg</span>
          </div>
          <div className="text-[11px] text-purple-400 font-mono mt-1 font-semibold">
            {bagsAwaitingDisposal.length} Bags Awaiting Disposal
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Awaiting Pickup</span>
            <PackageCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono tabular-nums">
            {bagsAwaitingPickup.length} <span className="text-xs font-sans text-slate-400">bags</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            {totalPickupWeight} kg ready on circuit
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

      {/* ─── 3. MAIN INTERACTIVE MAP & ROUTE STOPS LAYOUT ─── */}
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
            <span>Active Circuit: Government Hospital → Dwarka → Anand → Hedgewar → CBWTF MIDC</span>
            <span className="font-mono text-slate-300">Total Distance: 34.2 km</span>
          </div>
        </div>

        {/* Route Stops Checklist & Actions (1 Col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Hospital Waypoints ({routeStops.length})
            </h2>
            <button
              onClick={handleQuickAddSample}
              className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition flex items-center gap-1 cursor-pointer"
              title="Add a sample waste bag to test pickup flow"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Test Bag</span>
            </button>
          </div>

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
                      <span className={`font-bold ${stop.bagsToCollect > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {stop.bagsToCollect} bags ({stop.weightKg} kg)
                      </span>
                    </div>
                  )}

                  {isFinal && (
                    <div className="flex items-center justify-between text-xs font-mono text-purple-300 pt-2 border-t border-slate-800/80 mb-2">
                      <span>Onboard Awaiting Incineration:</span>
                      <span className="font-bold text-white">
                        {stop.bagsToCollect} bags ({stop.weightKg} kg)
                      </span>
                    </div>
                  )}

                  {isCurrent && !isFinal && (
                    <button
                      onClick={() => setSelectedHospitalForHandover(stop)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Arrive & Confirm Handover ({stop.bagsToCollect} bags)</span>
                    </button>
                  )}

                  {isCurrent && isFinal && (
                    <button
                      onClick={handleCompleteFinalDelivery}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Unload to Incinerator & Close Manifest ({bagsAwaitingDisposal.length} bags)</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 4. DEDICATED DRIVER BIO-WASTE TRANSIT & DISPOSAL CONSOLE ─── */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        {/* Console Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Driver Bio-Waste Collection & Disposal Console</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage bag pickup from hospitals, track onboard cargo, and certify final disposal at the CBWTF incinerator.
            </p>
          </div>

          {/* Sub-Tabs: Awaiting Pickup | Awaiting Disposal | Disposed History */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setConsoleTab('awaiting_pickup')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                consoleTab === 'awaiting_pickup'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Awaiting Pickup ({bagsAwaitingPickup.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setConsoleTab('awaiting_disposal')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                consoleTab === 'awaiting_disposal'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Awaiting Disposal ({bagsAwaitingDisposal.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setConsoleTab('disposed_history')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                consoleTab === 'disposed_history'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Disposed Today ({bagsDisposed.length})</span>
            </button>
          </div>
        </div>

        {/* ─── TAB 1: AWAITING PICKUP (HOSPITAL HOLDING BAYS) ─── */}
        {consoleTab === 'awaiting_pickup' && (
          <div className="space-y-3">
            {bagsAwaitingPickup.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">All On-Site Waste Is Already Collected & Dispatched!</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    There are currently no bags in 'Logged' or 'Awaiting Pickup' status at the healthcare facilities. All waste has been picked up into transit or processed.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setConsoleTab('awaiting_disposal')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>View Bags Awaiting Disposal ({bagsAwaitingDisposal.length} onboard)</span>
                  </button>

                  <button
                    onClick={handleQuickAddSample}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-rose-400 hover:text-rose-300 text-xs font-bold transition cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Generate Sample Bag (Holding Bay)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Waste Bags ready at hospitals for driver collection:</span>
                  <span className="font-mono text-amber-400 font-bold">{bagsAwaitingPickup.length} bags • {totalPickupWeight} kg</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayedAwaitingPickup.map((bag) => (
                    <div
                      key={bag.tagId || bag._id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 space-y-3 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              bag.category === 'Yellow' ? 'bg-amber-400' :
                              bag.category === 'Red' ? 'bg-rose-500' :
                              bag.category === 'Blue' ? 'bg-sky-400' : 'bg-slate-400'
                            }`} />
                            <span className="text-xs font-mono font-bold text-white">{bag.tagId}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                              bag.category === 'Yellow' ? 'bg-amber-500/20 text-amber-300' :
                              bag.category === 'Red' ? 'bg-rose-500/20 text-rose-300' :
                              bag.category === 'Blue' ? 'bg-sky-500/20 text-sky-300' :
                              'bg-slate-700 text-slate-300'
                            }`}>
                              {bag.category}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-slate-300 mt-1">
                            {bag.hospitalName || 'Government Hospital of Khamgaon'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Ward: {bag.department || 'ICU'} • Logged: {bag.createdAt ? new Date(bag.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black text-white font-mono">
                            {bag.weightKg} kg
                          </div>
                          <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                            {bag.status || 'Logged'}
                          </div>
                        </div>
                      </div>

                      {/* Action Button: Pick Bag */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handlePickBag(bag)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Pick Bag (Load into Van)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: ONBOARD / AWAITING DISPOSAL (IN TRANSIT TO CBWTF) ─── */}
        {consoleTab === 'awaiting_disposal' && (
          <div className="space-y-3">
            {bagsAwaitingDisposal.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">No Bags Currently Onboard Vehicle</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    All picked bags have been delivered, or no bags have been loaded yet. Pick up bags from hospital waypoints to load cargo onto transit vehicle MH-15-BW-4092.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setConsoleTab('awaiting_pickup')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition cursor-pointer mx-auto"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>View Bags Awaiting Pickup at Hospitals</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-purple-950/20 border border-purple-800/40">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-sky-400" />
                    <span className="text-xs text-slate-300">
                      Onboard Cold-Chain: <strong className="text-sky-300 font-mono">{cargoTemp}°C</strong> (SLA Compliant)
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs font-mono text-purple-300 font-bold">
                      {bagsAwaitingDisposal.length} bags awaiting final disposal ({totalOnboardWeight} kg)
                    </span>
                  </div>

                  <button
                    onClick={handleCompleteFinalDelivery}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition cursor-pointer shrink-0"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Deliver & Dispose All Onboard to CBWTF</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayedAwaitingDisposal.map((bag) => (
                    <div
                      key={bag.tagId || bag._id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-purple-800/50 space-y-3 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              bag.category === 'Yellow' ? 'bg-amber-400' :
                              bag.category === 'Red' ? 'bg-rose-500' :
                              bag.category === 'Blue' ? 'bg-sky-400' : 'bg-slate-400'
                            }`} />
                            <span className="text-xs font-mono font-bold text-white">{bag.tagId}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-purple-950 text-purple-300 border border-purple-800/60">
                              Onboard ({bag.category})
                            </span>
                          </div>
                          <div className="text-xs font-medium text-slate-300 mt-1">
                            Origin: {bag.hospitalName || 'Government Hospital of Khamgaon'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Dept: {bag.department || 'General'} • Vehicle: MH-15-BW-4092
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black text-purple-300 font-mono">
                            {bag.weightKg} kg
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Status: In Transit
                          </div>
                        </div>
                      </div>

                      {/* Action Button: Dispose / Deliver at CBWTF */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handleDisposeBag(bag)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Deliver & Dispose at Incinerator / Autoclave</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: DISPOSED TODAY (CBWTF INCINERATOR & AUTOCLAVE CERTIFIED) ─── */}
        {consoleTab === 'disposed_history' && (
          <div className="space-y-3">
            {bagsDisposed.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-xs">
                No bags processed at the CBWTF incinerator today yet.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Waste Bags certified disposed at CBWTF treatment plant:</span>
                  <span className="font-mono text-emerald-400 font-bold">{bagsDisposed.length} bags • {totalDisposedWeight} kg</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {bagsDisposed.map((bag) => (
                    <div
                      key={bag.tagId || bag._id}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-mono font-bold text-white">{bag.tagId}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({bag.category})</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">{bag.weightKg} kg</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>Facility: Khamgaon MIDC CBWTF</span>
                        <span className="font-mono text-slate-500">
                          {bag.certification ? bag.certification.slice(-10) : 'CERTIFIED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 5. HANDOVER & DIGITAL SIGNATURE MODAL ─── */}
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
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
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmHandover(selectedHospitalForHandover)}
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
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
