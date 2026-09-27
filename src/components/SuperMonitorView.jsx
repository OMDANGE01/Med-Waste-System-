import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Truck, 
  AlertTriangle, 
  MapPin, 
  Users, 
  Scale, 
  FileText, 
  ExternalLink, 
  Activity, 
  ArrowUpRight, 
  CheckCircle2, 
  ChevronRight,
  Filter,
  Search,
  Sparkles,
  RefreshCw,
  Plus
} from 'lucide-react';
import AppLogo from './AppLogo';

export default function SuperMonitorView({
  hospitals = [],
  workers = [],
  wasteRecords = [],
  pickups = [],
  incidents = [],
  onSelectHospital,
  onOpenDriverRoute,
  onAddToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');

  // Filter hospitals
  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch = 
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.cpcbCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.superintendent.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = selectedZone === 'ALL' || h.zone.includes(selectedZone);
    return matchesSearch && matchesZone;
  });

  // Calculate global metrics
  const totalBeds = hospitals.reduce((acc, h) => acc + (h.bedCapacity || 0), 0);
  const totalKg = wasteRecords.reduce((acc, r) => acc + (parseFloat(r.weightKg) || 0), 0);
  const awaitingPickupBags = wasteRecords.filter((r) => r.status === 'Awaiting Pickup');
  const awaitingPickupKg = awaitingPickupBags.reduce((acc, r) => acc + (parseFloat(r.weightKg) || 0), 0);
  const activeIncidents = incidents.filter((i) => i.status !== 'Resolved');

  return (
    <div className="space-y-6">
      {/* Top Banner: State Health Directorate Authority */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/30 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono tracking-widest text-rose-400 uppercase font-bold">
                STATE HEALTH DIRECTORATE & SPCB APEX PORTAL
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-medium">Regional Bio-Medical Waste Command</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Centralized Hospital Network Monitor
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Real-time oversight of all connected healthcare facilities, multi-hospital CBWTF transit fleets, 
              ward-level color segregation, and CPCB Rule 2016 statutory chain-of-custody.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onOpenDriverRoute) onOpenDriverRoute();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition"
            >
              <Truck className="w-4 h-4" />
              <span>Multi-Hospital Driver Route</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Macro KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Connected Hospitals</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {hospitals.filter(h => h.hospitalId !== 'CBWTF-01').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
            <span>Total Beds:</span>
            <span className="text-slate-200 font-bold">{totalBeds.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Total Waste Logged</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {totalKg.toFixed(1)} <span className="text-xs font-sans font-medium text-slate-400">kg</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <span>{wasteRecords.length} Barcoded Bags</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Awaiting CBWTF Pickup</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono tabular-nums">
            {awaitingPickupBags.length} <span className="text-xs font-sans font-medium text-slate-400">bags</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {awaitingPickupKg.toFixed(1)} kg ready for transit
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Connected Workforce</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {workers.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Doctors, Nurses, Porters & Drivers
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Grid Compliance Index</span>
            <ShieldCheck className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
            98.6%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            CPCB Rules 2016 Certified
          </div>
        </div>
      </div>

      {/* Hospital Selector & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hospitals by name, CPCB authorization code, or superintendent..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Zone:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-medium"
          >
            <option value="ALL">All Medical Zones</option>
            <option value="West">West District</option>
            <option value="Central">Central Urban</option>
            <option value="South">South Sector</option>
            <option value="North">North Sector</option>
            <option value="Highway">Highway Hub</option>
          </select>
        </div>
      </div>

      {/* Connected Hospitals Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
            <Building2 className="w-4 h-4 text-rose-500" />
            <span>Monitored Hospital Facilities ({filteredHospitals.length})</span>
          </h2>
          <span className="text-xs text-slate-500">
            Click any hospital to inspect facility inventory and personnel
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHospitals.map((hospital) => {
            const hBags = wasteRecords.filter((r) => r.hospitalId === hospital.hospitalId || r.hospitalName === hospital.name);
            const hWeight = hBags.reduce((acc, r) => acc + (parseFloat(r.weightKg) || 0), 0);
            const hAwaiting = hBags.filter((r) => r.status === 'Awaiting Pickup').length;
            const hWorkers = workers.filter((w) => w.hospitalId === hospital.hospitalId);
            const isCBWTF = hospital.hospitalId === 'CBWTF-01';

            return (
              <div
                key={hospital.hospitalId}
                onClick={() => onSelectHospital && onSelectHospital(hospital)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.01] hover:shadow-xl relative ${
                  isCBWTF
                    ? 'bg-purple-950/20 border-purple-800/60 hover:border-purple-500'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header Lockup */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                      {hospital.cpcbCode}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors mt-0.5 line-clamp-1">
                      {hospital.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {hospital.address}
                    </p>
                  </div>

                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border shrink-0 ${
                    isCBWTF
                      ? 'bg-purple-950 text-purple-300 border-purple-700'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}>
                    {isCBWTF ? 'TREATMENT PLANT' : 'HOSPITAL'}
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-3 text-center">
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Bed Capacity</div>
                    <div className="text-sm font-bold text-white font-mono tabular-nums">
                      {isCBWTF ? 'Facility' : hospital.bedCapacity}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Logged (kg)</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                      {hWeight.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Ready Pickup</div>
                    <div className="text-sm font-bold text-amber-400 font-mono tabular-nums">
                      {hAwaiting}
                    </div>
                  </div>
                </div>

                {/* Staff Roster Snapshot */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{hospital.superintendent}</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-300 font-medium text-[11px] group-hover:text-rose-400 transition-colors">
                    <span>Inspect Facility</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
