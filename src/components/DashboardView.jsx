import React, { useState, useMemo, useEffect } from 'react';
import { 
  Weight, 
  Package, 
  CheckCircle2, 
  ShieldCheck, 
  Flame, 
  Recycle, 
  Scissors, 
  Wine, 
  ArrowUpRight, 
  Clock, 
  Truck, 
  AlertOctagon,
  Building2,
  TrendingUp,
  MapPin,
  ExternalLink,
  Layers,
  Crosshair,
  Shield,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { 
  APIProvider, 
  Map as GoogleMap, 
  AdvancedMarker, 
  InfoWindow, 
  useMap 
} from '@vis.gl/react-google-maps';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Predefined Network Hospitals under the Biohazard System Net
const DEFAULT_NETWORK_HOSPITALS = [
  {
    name: 'St. Jude Memorial Hospital',
    code: 'NET-HOSP-01',
    address: 'Plot 42, Health City, West Zone',
    lat: 19.9975,
    lng: 73.7898,
    type: 'Apex Multispecialty Center',
    bedCapacity: 650,
    status: 'Operational'
  },
  {
    name: 'Metro City General Hospital',
    code: 'NET-HOSP-02',
    address: 'Sector 8, Civil Hospital Road',
    lat: 20.0125,
    lng: 73.7650,
    type: 'Government Teaching Hospital',
    bedCapacity: 920,
    status: 'Operational'
  },
  {
    name: 'Apollo Super Specialty Hospital',
    code: 'NET-HOSP-03',
    address: 'Ring Road Medical Corridor',
    lat: 20.0210,
    lng: 73.7780,
    type: 'Tertiary Care Super Specialty',
    bedCapacity: 450,
    status: 'Operational'
  },
  {
    name: 'Apex Healthcare Research Center',
    code: 'NET-HOSP-04',
    address: 'Innovation Park, East Campus',
    lat: 19.9850,
    lng: 73.8120,
    type: 'Research & Pathology Institute',
    bedCapacity: 300,
    status: 'Operational'
  },
  {
    name: 'Fortis Care Medical Center',
    code: 'NET-HOSP-05',
    address: 'South Arterial Highway Sector 4',
    lat: 19.9760,
    lng: 73.8240,
    type: 'Emergency & Trauma Hospital',
    bedCapacity: 500,
    status: 'Operational'
  }
];

// Central CBWTF Treatment Plant
const CBWTF_PLANT = {
  name: 'Apex Central CBWTF Treatment Plant',
  type: 'CBWTF_PLANT',
  lat: 20.0350,
  lng: 73.8450,
  description: 'Regional High-Temp Incineration, Autoclave & Shredding Facility'
};

// Map Pan Controller
function MapController({ focusedLocation }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !focusedLocation) return;
    map.panTo({ lat: focusedLocation.lat, lng: focusedLocation.lng });
    map.setZoom(focusedLocation.zoom || 14);
  }, [map, focusedLocation]);
  return null;
}

export default function DashboardView({ 
  stats, 
  records = [], 
  onNavigateToTab, 
  onOpenLogModal,
  onViewBarcode,
  onNavigateToMap
}) {
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [focusedLocation, setFocusedLocation] = useState(null);
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'hybrid'

  // Compute Hospital-Wise Aggregated Waste Statistics
  const hospitalWiseStats = useMemo(() => {
    const map = new Map();

    // Seed network hospitals
    DEFAULT_NETWORK_HOSPITALS.forEach(h => {
      map.set(h.name, {
        ...h,
        totalWeightKg: 0,
        totalBags: 0,
        activeBags: 0,
        activeWeightKg: 0,
        disposedBags: 0,
        disposedWeightKg: 0,
        categoryBreakdown: { Yellow: 0, Red: 0, White: 0, Blue: 0 }
      });
    });

    // Aggregate records
    records.forEach(r => {
      const name = r.hospitalName || 'St. Jude Memorial Hospital';
      if (!map.has(name)) {
        map.set(name, {
          name,
          code: `NET-HOSP-0${map.size + 1}`,
          address: r.location || 'Network Health Facility',
          lat: r.lat || 19.9975,
          lng: r.lng || 73.7898,
          type: 'Affiliated Healthcare Facility',
          bedCapacity: 350,
          status: 'Operational',
          totalWeightKg: 0,
          totalBags: 0,
          activeBags: 0,
          activeWeightKg: 0,
          disposedBags: 0,
          disposedWeightKg: 0,
          categoryBreakdown: { Yellow: 0, Red: 0, White: 0, Blue: 0 }
        });
      }

      const hosp = map.get(name);
      const weight = Number(r.weightKg) || 0;
      hosp.totalWeightKg += weight;
      hosp.totalBags += 1;

      if (r.status === 'Disposed') {
        hosp.disposedBags += 1;
        hosp.disposedWeightKg += weight;
      } else {
        hosp.activeBags += 1;
        hosp.activeWeightKg += weight;
      }

      if (hosp.categoryBreakdown[r.category] !== undefined) {
        hosp.categoryBreakdown[r.category] += weight;
      }
    });

    return Array.from(map.values()).map(h => ({
      ...h,
      totalWeightKg: Number(h.totalWeightKg.toFixed(1)),
      activeWeightKg: Number(h.activeWeightKg.toFixed(1)),
      disposedWeightKg: Number(h.disposedWeightKg.toFixed(1)),
      categoryBreakdown: {
        Yellow: Number(h.categoryBreakdown.Yellow.toFixed(1)),
        Red: Number(h.categoryBreakdown.Red.toFixed(1)),
        White: Number(h.categoryBreakdown.White.toFixed(1)),
        Blue: Number(h.categoryBreakdown.Blue.toFixed(1))
      }
    }));
  }, [records]);

  // Network Grand Totals
  const networkTotalWeight = useMemo(() => {
    return hospitalWiseStats.reduce((acc, h) => acc + h.totalWeightKg, 0);
  }, [hospitalWiseStats]);

  const maxHospitalWeight = useMemo(() => {
    return Math.max(...hospitalWiseStats.map(h => h.totalWeightKg), 1);
  }, [hospitalWiseStats]);

  const handleFocusHospitalOnMap = (hosp) => {
    setSelectedHospital(hosp);
    setFocusedLocation({ lat: hosp.lat, lng: hosp.lng, zoom: 15 });
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const {
    totalBags = 0,
    totalWeightKg = 0,
    activeWeightKg = 0,
    disposedWeightKg = 0,
    complianceScore = 95,
    statusCounts = {},
    categoryBreakdown = {},
    departmentBreakdown = {},
    openIncidents = 0
  } = stats;

  const categories = [
    {
      id: 'Yellow',
      name: 'Yellow Category',
      title: 'Infectious & Anatomical',
      treatment: 'High-Temp Incineration / Deep Burial',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      cardBg: 'from-amber-950/30 to-slate-900 border-amber-500/20 hover:border-amber-500/40',
      icon: Flame,
      iconColor: 'text-amber-400',
      count: categoryBreakdown.Yellow?.count || 0,
      weight: categoryBreakdown.Yellow?.weightKg || 0,
      description: 'Anatomical tissues, soiled gauze, expired medicines & chemotherapeutic kits.',
    },
    {
      id: 'Red',
      name: 'Red Category',
      title: 'Contaminated Plastics',
      treatment: 'Autoclaving / Microwaving & Recycling',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      cardBg: 'from-rose-950/30 to-slate-900 border-rose-500/20 hover:border-rose-500/40',
      icon: Recycle,
      iconColor: 'text-rose-400',
      count: categoryBreakdown.Red?.count || 0,
      weight: categoryBreakdown.Red?.weightKg || 0,
      description: 'Plastic catheters, IV tubing, saline bottles, syringes without needles, disposable gloves.',
    },
    {
      id: 'White',
      name: 'White Category',
      title: 'Waste Sharps (Puncture-Proof)',
      treatment: 'Dry Heat Sterilization & Shredding',
      badgeColor: 'bg-slate-200/10 text-slate-200 border-slate-400/30',
      cardBg: 'from-slate-800/40 to-slate-900 border-slate-700 hover:border-slate-500',
      icon: Scissors,
      iconColor: 'text-slate-100',
      count: categoryBreakdown.White?.count || 0,
      weight: categoryBreakdown.White?.weightKg || 0,
      description: 'Scalpels, surgical blades, hypodermic needles, contaminated needles in rigid boxes.',
    },
    {
      id: 'Blue',
      name: 'Blue Category',
      title: 'Glassware & Metallic Implants',
      treatment: 'Chemical Disinfection & Glass Autoclaving',
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      cardBg: 'from-sky-950/30 to-slate-900 border-sky-500/20 hover:border-sky-500/40',
      icon: Wine,
      iconColor: 'text-sky-400',
      count: categoryBreakdown.Blue?.count || 0,
      weight: categoryBreakdown.Blue?.weightKg || 0,
      description: 'Reagent vials, medicine ampoules, broken lab slides, orthopedic metal pins & plates.',
    },
  ];

  const deptEntries = Object.entries(departmentBreakdown || {});
  const maxDeptWeight = deptEntries.reduce((max, [, data]) => Math.max(max, data.weightKg || 0), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome & Department Supervisor Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
              Supervisor Oversight
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Head of Department Biohazard Dashboard
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Real-time live Google Map location and hospital-wise biomedical waste collection monitoring across our network.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateToTab('livemap')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 text-sm font-semibold border border-rose-500/30 transition shadow-sm"
          >
            <MapPin className="w-4 h-4" />
            <span>Full Transit Map</span>
          </button>
          <button
            onClick={() => onNavigateToTab('registry')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
          >
            <span>Waste Registry</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenLogModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-950 transition"
          >
            <span>+ Log New Bag</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Waste */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active / On-Site Waste</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Weight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{activeWeightKg}</span>
            <span className="text-slate-400 font-medium text-sm">kg</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
            <span>Awaiting Pickup / In Transit</span>
            <span className="text-amber-400 font-semibold">{((activeWeightKg / (totalWeightKg || 1)) * 100).toFixed(0)}% of total</span>
          </div>
        </div>

        {/* Total Bags Tracked */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Network Hospitals</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{hospitalWiseStats.length}</span>
            <span className="text-slate-400 font-medium text-sm">centers</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
            <span>Live Monitored</span>
            <span className="text-emerald-400 font-semibold">100% Online</span>
          </div>
        </div>

        {/* Total Disposed */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Waste Generated</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{totalWeightKg}</span>
            <span className="text-slate-400 font-medium text-sm">kg</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
            <span>{totalBags} total bags tracked</span>
            <span className="text-blue-400 font-semibold">{disposedWeightKg} kg treated</span>
          </div>
        </div>

        {/* Statutory Compliance Score */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">CPCB Compliance Score</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{complianceScore}%</span>
            <span className="text-emerald-400 font-semibold text-xs">High Standard</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
            <span>{openIncidents === 0 ? 'Zero active breaches' : `${openIncidents} action items`}</span>
            <span className="text-sky-400 font-semibold">WHO Certified</span>
          </div>
        </div>
      </div>

      {/* CORE FEATURE: Live Google Map of Network Hospitals + Hospital-Wise Total Waste Collection */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Live Google Map: Network Hospitals & Waste Collection
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Geolocating all affiliated hospitals under our network with their live total waste collection in kilograms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Map Type Switcher */}
            <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center">
              <button
                onClick={() => setMapType('roadmap')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  mapType === 'roadmap' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Street Map
              </button>
              <button
                onClick={() => setMapType('hybrid')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  mapType === 'hybrid' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Satellite
              </button>
            </div>

            <button
              onClick={() => setFocusedLocation({ lat: 20.0050, lng: 73.7900, zoom: 12 })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition"
              title="Reset map view to network center"
            >
              <Crosshair className="w-3.5 h-3.5 text-rose-400" />
              <span>Reset Center</span>
            </button>
          </div>
        </div>

        {/* Map Canvas + Info Cards Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Upper: Google Map Container (7 cols on lg) */}
          <div className="lg:col-span-7 h-[460px] relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
            {API_KEY ? (
              <APIProvider apiKey={API_KEY}>
                <GoogleMap
                  defaultCenter={{ lat: 20.0050, lng: 73.7900 }}
                  defaultZoom={12}
                  mapId="HOSPITAL_NETWORK_MAP_ID"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  mapTypeId={mapType}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  style={{ width: '100%', height: '100%' }}
                >
                  <MapController focusedLocation={focusedLocation} />

                  {/* Central Treatment Facility Marker */}
                  <AdvancedMarker
                    position={{ lat: CBWTF_PLANT.lat, lng: CBWTF_PLANT.lng }}
                    onClick={() => {
                      setSelectedHospital({
                        name: CBWTF_PLANT.name,
                        type: 'CBWTF Central Plant',
                        address: CBWTF_PLANT.description,
                        totalWeightKg: networkTotalWeight,
                        totalBags: totalBags,
                        activeBags: 0,
                        isCBWTF: true
                      });
                    }}
                    title={CBWTF_PLANT.name}
                  >
                    <div className="cursor-pointer group flex flex-col items-center">
                      <div className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] shadow-lg border border-emerald-400 mb-1 group-hover:scale-110 transition whitespace-nowrap">
                        🏭 CBWTF Treatment Plant
                      </div>
                      <div className="w-7 h-7 rounded-full bg-emerald-700 border-2 border-white flex items-center justify-center shadow-lg text-white group-hover:scale-110 transition">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    </div>
                  </AdvancedMarker>

                  {/* Network Hospitals Markers with Total Waste Collection Badges */}
                  {hospitalWiseStats.map((hosp) => (
                    <AdvancedMarker
                      key={hosp.name}
                      position={{ lat: hosp.lat, lng: hosp.lng }}
                      onClick={() => setSelectedHospital(hosp)}
                      title={`${hosp.name} - Total Waste: ${hosp.totalWeightKg} kg`}
                    >
                      <div className="cursor-pointer group flex flex-col items-center">
                        {/* Live Total Waste Collection Badge over Hospital */}
                        <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 text-white font-bold text-[11px] shadow-2xl border border-rose-500/60 mb-1 group-hover:scale-110 transition whitespace-nowrap flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="max-w-[130px] truncate">{hosp.name.replace(' Hospital', '')}</span>
                          <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono text-[10px]">
                            {hosp.totalWeightKg} kg
                          </span>
                        </div>

                        {/* Hospital Pin Icon */}
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-700 to-rose-600 border-2 border-white flex items-center justify-center shadow-2xl text-white group-hover:scale-110 transition">
                          <span className="text-xs font-bold">🏥</span>
                        </div>
                      </div>
                    </AdvancedMarker>
                  ))}

                  {/* Hospital Detail InfoWindow */}
                  {selectedHospital && (
                    <InfoWindow
                      position={{ lat: selectedHospital.lat, lng: selectedHospital.lng }}
                      onCloseClick={() => setSelectedHospital(null)}
                    >
                      <div className="p-2 text-slate-900 max-w-xs space-y-2">
                        <div className="flex items-center justify-between gap-2 border-b pb-1.5 border-slate-200">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 leading-tight">
                              {selectedHospital.name}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {selectedHospital.code || 'Network Node'} • {selectedHospital.type}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                            Live
                          </span>
                        </div>

                        {/* Total Waste Collection Display */}
                        <div className="bg-rose-50 p-2 rounded-lg border border-rose-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-rose-800 font-semibold uppercase tracking-wider block">
                              Total Waste Collection
                            </span>
                            <span className="text-xl font-extrabold text-rose-700">
                              {selectedHospital.totalWeightKg} <span className="text-xs font-normal">kg</span>
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded shadow-sm">
                            {selectedHospital.totalBags} bags
                          </span>
                        </div>

                        {/* Category Breakdown (if hospital) */}
                        {!selectedHospital.isCBWTF && selectedHospital.categoryBreakdown && (
                          <div className="grid grid-cols-2 gap-1 text-[10px]">
                            <div className="bg-amber-50 p-1 rounded border border-amber-200 text-amber-900">
                              Yellow: <strong>{selectedHospital.categoryBreakdown.Yellow} kg</strong>
                            </div>
                            <div className="bg-rose-50 p-1 rounded border border-rose-200 text-rose-900">
                              Red: <strong>{selectedHospital.categoryBreakdown.Red} kg</strong>
                            </div>
                            <div className="bg-slate-100 p-1 rounded border border-slate-300 text-slate-800">
                              White: <strong>{selectedHospital.categoryBreakdown.White} kg</strong>
                            </div>
                            <div className="bg-sky-50 p-1 rounded border border-sky-200 text-sky-900">
                              Blue: <strong>{selectedHospital.categoryBreakdown.Blue} kg</strong>
                            </div>
                          </div>
                        )}

                        <div className="pt-1 flex justify-between items-center text-[10px] text-slate-500">
                          <span>Awaiting Pickup: <strong>{selectedHospital.activeWeightKg || 0} kg</strong></span>
                          <button
                            onClick={() => onNavigateToTab('registry')}
                            className="text-rose-600 hover:text-rose-700 font-bold underline"
                          >
                            View Registry
                          </button>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </APIProvider>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-slate-900">
                <MapPin className="w-12 h-12 text-rose-500 animate-bounce mb-3" />
                <h3 className="text-base font-bold text-white">Google Maps Network Integration</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Active hospital network locations mapped across western medical district.
                </p>
              </div>
            )}

            {/* Map Legend Overlay */}
            <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 shadow-xl text-[11px] flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span className="font-semibold text-white">Live Hospital Node</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300">Central CBWTF Plant</span>
              </div>
            </div>
          </div>

          {/* Right / Lower: Hospital-Wise Waste Breakdown Cards (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="font-bold text-white text-sm">Hospital-Wise Waste Collection</h3>
                <span className="text-xs text-slate-400">Click hospital to focus map</span>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-500/30">
                Net: {networkTotalWeight.toFixed(1)} kg
              </span>
            </div>

            {/* Scrollable Hospital Cards */}
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {hospitalWiseStats.map((hosp) => {
                const isSelected = selectedHospital?.name === hosp.name;
                const percentage = maxHospitalWeight > 0 ? (hosp.totalWeightKg / maxHospitalWeight) * 100 : 0;

                return (
                  <div
                    key={hosp.name}
                    onClick={() => handleFocusHospitalOnMap(hosp)}
                    className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-rose-500 ring-1 ring-rose-500 shadow-md'
                        : 'bg-slate-850/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-rose-600 text-white' : 'bg-slate-800 text-rose-400'}`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                            <span className="truncate max-w-[170px]">{hosp.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{hosp.code}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {hosp.address}
                          </div>
                        </div>
                      </div>

                      {/* Total Collection Badge */}
                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-white">
                          {hosp.totalWeightKg} <span className="text-[10px] font-normal text-slate-400">kg</span>
                        </div>
                        <span className="text-[10px] text-rose-400 font-medium">
                          {hosp.totalBags} {hosp.totalBags === 1 ? 'bag' : 'bags'}
                        </span>
                      </div>
                    </div>

                    {/* Proportional Volume Bar */}
                    <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-rose-600 to-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(6, percentage)}%` }}
                      ></div>
                    </div>

                    {/* Category Distribution Mini Pills */}
                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-mono">
                          Y: {hosp.categoryBreakdown.Yellow}kg
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 font-mono">
                          R: {hosp.categoryBreakdown.Red}kg
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-700/60 text-slate-300 font-mono">
                          W: {hosp.categoryBreakdown.White}kg
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-300 font-mono">
                          B: {hosp.categoryBreakdown.Blue}kg
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFocusHospitalOnMap(hosp);
                        }}
                        className="text-[10px] text-rose-400 hover:text-white flex items-center gap-0.5 font-medium"
                      >
                        <Crosshair className="w-3 h-3" /> Focus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Biomedical Waste Categories Breakdown (CPCB Standard) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Biomedical Waste Categories (WHO / CPCB Rules)</h2>
            <p className="text-xs text-slate-400">Color-coded segregation parameters and mandatory disposal methodologies.</p>
          </div>
          <span className="text-xs text-slate-400">Statutory segregation parameters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const percentage = totalWeightKg > 0 ? ((cat.weight / totalWeightKg) * 100).toFixed(1) : 0;
            return (
              <div
                key={cat.id}
                className={`p-5 rounded-2xl bg-gradient-to-b ${cat.cardBg} border transition-all duration-200 hover:-translate-y-1 shadow-lg`}
              >
                <div className="flex items-start justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cat.badgeColor}`}>
                    {cat.name}
                  </span>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <Icon className={`w-5 h-5 ${cat.iconColor}`} />
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-semibold text-white text-base">{cat.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cat.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-bold text-white">{cat.weight}</span>
                      <span className="text-xs text-slate-400 ml-1">kg</span>
                    </div>
                    <span className="text-xs font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                      {cat.count} {cat.count === 1 ? 'bag' : 'bags'}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.id === 'Yellow' ? 'bg-amber-400' :
                        cat.id === 'Red' ? 'bg-rose-500' :
                        cat.id === 'White' ? 'bg-slate-200' : 'bg-sky-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(8, percentage))}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                    <span>{percentage}% of hospital total</span>
                    <span className="truncate max-w-[120px]">{cat.treatment.split(' / ')[0]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ward Distribution & Lifecycle Pipeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ward Generation Breakdown (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-white text-base">Department Waste Volume (kg)</h3>
            </div>
            <span className="text-xs text-slate-400">Generation ranking</span>
          </div>

          <div className="space-y-4">
            {deptEntries.map(([dept, data]) => {
              const pct = maxDeptWeight > 0 ? (data.weightKg / maxDeptWeight) * 100 : 0;
              return (
                <div key={dept} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-200">{dept}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{data.count} {data.count === 1 ? 'batch' : 'batches'}</span>
                      <span className="font-bold text-white">{data.weightKg} kg</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-600 to-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lifecycle Status Pipeline */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-white text-base">Chain-of-Custody Pipeline</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6">Current disposition of active and archived medical waste bags.</p>

            <div className="space-y-4">
              {/* Step 1: Logged */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Logged at Ward</div>
                    <div className="text-xs text-slate-400">Awaiting internal pickup</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300">
                  {statusCounts['Logged'] || 0}
                </span>
              </div>

              {/* Step 2: Awaiting Pickup */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Central Holding Bay</div>
                    <div className="text-xs text-slate-400">Ready for CBWTF truck</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300">
                  {statusCounts['Awaiting Pickup'] || 0}
                </span>
              </div>

              {/* Step 3: In Transit */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">In Transit (CBWTF)</div>
                    <div className="text-xs text-slate-400">En route to treatment plant</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300">
                  {statusCounts['In Transit'] || 0}
                </span>
              </div>

              {/* Step 4: Disposed */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Disposed & Treated</div>
                    <div className="text-xs text-slate-400">Incinerated / Autoclaved</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300">
                  {statusCounts['Disposed'] || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              onClick={() => onNavigateToTab('livemap')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Inspect Live GPS Tracking Map</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
