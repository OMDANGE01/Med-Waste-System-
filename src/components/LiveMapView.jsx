import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  APIProvider, 
  Map as GoogleMap, 
  AdvancedMarker, 
  InfoWindow, 
  useMap 
} from '@vis.gl/react-google-maps';
import { 
  Building2, 
  MapPin, 
  Flame, 
  Recycle, 
  Scissors, 
  Wine, 
  QrCode, 
  Truck, 
  Layers, 
  Filter, 
  Search, 
  PlusCircle, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Navigation
} from 'lucide-react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Predefined central biomedical waste treatment facility (CBWTF)
const CBWTF_FACILITY = {
  name: 'Khamgaon Central CBWTF Treatment Facility',
  type: 'CBWTF_PLANT',
  lat: 20.6720,
  lng: 76.5450,
  description: 'Regional High-Temperature Incineration, Autoclave & Shredding Facility (MIDC Industrial Area, Khamgaon)',
  capacity: '15,000 kg / day'
};

// Map controller to pan & zoom to selected bag or hospital
function MapController({ focusedLocation }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !focusedLocation) return;
    map.panTo({ lat: focusedLocation.lat, lng: focusedLocation.lng });
    map.setZoom(focusedLocation.zoom || 15);
  }, [map, focusedLocation]);

  return null;
}

export default function LiveMapView({ 
  records = [], 
  onViewBarcode, 
  onOpenLogModal, 
  onUpdateStatus,
  targetRecord = null 
}) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedHospitalFilter, setSelectedHospitalFilter] = useState('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedLocation, setFocusedLocation] = useState(null);
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'hybrid'
  const [isSimulatingTransit, setIsSimulatingTransit] = useState(true);

  // Live Simulated Transit Vehicle Coordinates
  const [vehiclePosition, setVehiclePosition] = useState({ lat: 20.0050, lng: 73.7820, heading: 45 });

  // Handle target record passed from outside (e.g. clicking "View on Live Map" from registry)
  useEffect(() => {
    if (targetRecord && targetRecord.lat && targetRecord.lng) {
      setSelectedRecord(targetRecord);
      setSelectedFacility(null);
      setFocusedLocation({ lat: targetRecord.lat, lng: targetRecord.lng, zoom: 16 });
    }
  }, [targetRecord]);

  // Simulate GPS movement for CBWTF Transit Truck
  useEffect(() => {
    if (!isSimulatingTransit) return;

    // Waypoints across Khamgaon hospitals leading to MIDC CBWTF facility
    const waypoints = [
      { lat: 20.6920, lng: 76.5695 }, // Government Hospital of Khamgaon
      { lat: 20.6854, lng: 76.5742 }, // Dwarka Hospital of Khamgaon
      { lat: 20.6812, lng: 76.5615 }, // Anand Hospital of Khamgaon
      { lat: 20.6970, lng: 76.5720 }, // Dr. Hedgewar Rugnalaya Khamgaon
      { lat: 20.6720, lng: 76.5450 }, // Khamgaon CBWTF Plant (MIDC)
    ];

    let wpIdx = 0;
    let step = 0;
    const totalSteps = 40;

    const interval = setInterval(() => {
      step++;
      if (step >= totalSteps) {
        step = 0;
        wpIdx = (wpIdx + 1) % waypoints.length;
      }

      const nextWpIdx = (wpIdx + 1) % waypoints.length;
      const cur = waypoints[wpIdx];
      const next = waypoints[nextWpIdx];

      const t = step / totalSteps;
      const lat = cur.lat + (next.lat - cur.lat) * t;
      const lng = cur.lng + (next.lng - cur.lng) * t;

      setVehiclePosition({
        lat,
        lng,
        heading: Math.atan2(next.lng - cur.lng, next.lat - cur.lat) * (180 / Math.PI)
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isSimulatingTransit]);

  // Unique hospitals extracted from records
  const uniqueHospitals = useMemo(() => {
    const map = new Map();
    records.forEach(r => {
      const name = r.hospitalName || 'Government Hospital of Khamgaon';
      const lat = r.lat || 20.6920;
      const lng = r.lng || 76.5695;
      if (!map.has(name)) {
        map.set(name, { name, lat, lng, bagCount: 1, totalWeight: r.weightKg || 0 });
      } else {
        const item = map.get(name);
        item.bagCount += 1;
        item.totalWeight += (r.weightKg || 0);
      }
    });
    return Array.from(map.values());
  }, [records]);

  // Filtered bags to render on map and in list
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const hosp = r.hospitalName || 'Government Hospital of Khamgaon';
      if (selectedHospitalFilter !== 'All' && hosp !== selectedHospitalFilter) return false;
      if (selectedCategoryFilter !== 'All' && r.category !== selectedCategoryFilter) return false;
      if (selectedStatusFilter !== 'All' && r.status !== selectedStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tag = (r.tagId || '').toLowerCase();
        const handler = (r.handlerName || '').toLowerCase();
        const dept = (r.department || '').toLowerCase();
        const hospName = hosp.toLowerCase();
        if (!tag.includes(q) && !handler.includes(q) && !dept.includes(q) && !hospName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [records, selectedHospitalFilter, selectedCategoryFilter, selectedStatusFilter, searchQuery]);

  // Total active weight and bag stats
  const totalWeight = useMemo(() => {
    return filteredRecords.reduce((acc, r) => acc + (r.weightKg || 0), 0).toFixed(1);
  }, [filteredRecords]);

  const inTransitCount = useMemo(() => {
    return records.filter(r => r.status === 'In Transit').length;
  }, [records]);

  // Category visual styles
  const getCategoryStyles = (category) => {
    switch (category) {
      case 'Yellow':
        return {
          bg: 'bg-amber-500',
          border: 'border-amber-400',
          text: 'text-amber-400',
          ring: 'ring-amber-500/30',
          label: 'Infectious / Anatomical',
          icon: Flame,
          pinBg: '#f59e0b'
        };
      case 'Red':
        return {
          bg: 'bg-rose-600',
          border: 'border-rose-400',
          text: 'text-rose-400',
          ring: 'ring-rose-600/30',
          label: 'Contaminated Plastic',
          icon: Recycle,
          pinBg: '#e11d48'
        };
      case 'White':
        return {
          bg: 'bg-slate-200',
          border: 'border-white',
          text: 'text-slate-200',
          ring: 'ring-slate-300/30',
          label: 'Sharps / Needles',
          icon: Scissors,
          pinBg: '#e2e8f0'
        };
      case 'Blue':
        return {
          bg: 'bg-sky-500',
          border: 'border-sky-400',
          text: 'text-sky-400',
          ring: 'ring-sky-500/30',
          label: 'Glassware / Ampoules',
          icon: Wine,
          pinBg: '#0ea5e9'
        };
      default:
        return {
          bg: 'bg-rose-500',
          border: 'border-rose-400',
          text: 'text-rose-400',
          ring: 'ring-rose-500/30',
          label: 'Hazardous Waste',
          icon: Flame,
          pinBg: '#f43f5e'
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Logged':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'Awaiting Pickup':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'In Transit':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40 animate-pulse';
      case 'Disposed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  const handleSelectHospital = (hospName) => {
    setSelectedHospitalFilter(hospName);
    if (hospName === 'All') {
      setFocusedLocation({ lat: 20.0050, lng: 73.7900, zoom: 12 });
    } else {
      const hosp = uniqueHospitals.find(h => h.name === hospName);
      if (hosp) {
        setFocusedLocation({ lat: hosp.lat, lng: hosp.lng, zoom: 15 });
      }
    }
  };

  const handleFocusBag = (record) => {
    setSelectedRecord(record);
    setSelectedFacility(null);
    setFocusedLocation({ lat: record.lat || 19.9975, lng: record.lng || 73.7898, zoom: 16 });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Live Biomedical Waste GPS Map</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-normal">
                Google Maps Live
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time geospatial custody tracking for all tagged bags per healthcare facility & transit fleet.
          </p>
        </div>

        {/* Live Metrics */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Total Bags</div>
            <div className="text-sm font-bold text-white">{filteredRecords.length} Bags</div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Total Weight</div>
            <div className="text-sm font-bold text-emerald-400">{totalWeight} kg</div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Hospitals</div>
            <div className="text-sm font-bold text-rose-400">{uniqueHospitals.length} Facilities</div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/40">
            <div className="text-[10px] uppercase font-semibold text-purple-300 flex items-center gap-1">
              <Truck className="w-3 h-3" /> In Transit
            </div>
            <div className="text-sm font-bold text-purple-400">{inTransitCount} Bags</div>
          </div>

          <button
            onClick={() => onOpenLogModal && onOpenLogModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950 transition ml-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Bag</span>
          </button>
        </div>
      </div>

      {/* Main Map + Sidebar Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 h-[720px]">
        {/* Left Interactive Sidebar (1 Col on XL) */}
        <div className="xl:col-span-1 flex flex-col rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          {/* Filter & Search Header */}
          <div className="p-3.5 border-b border-slate-800 space-y-3 bg-slate-850/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Tag, Hospital, Ward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Hospital Filter Select */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-rose-400" /> Hospital / Facility:
                </span>
                <span className="text-[10px] text-rose-400">{uniqueHospitals.length} active</span>
              </div>
              <select
                value={selectedHospitalFilter}
                onChange={(e) => handleSelectHospital(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-medium"
              >
                <option value="All">All Hospitals (Full View)</option>
                {uniqueHospitals.map(h => (
                  <option key={h.name} value={h.name}>
                    {h.name} ({h.bagCount} bags)
                  </option>
                ))}
              </select>
            </div>

            {/* Category Pills */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Hazard Category:</div>
              <div className="grid grid-cols-5 gap-1 text-[11px]">
                {['All', 'Yellow', 'Red', 'White', 'Blue'].map((cat) => {
                  const isActive = selectedCategoryFilter === cat;
                  let bg = isActive ? 'bg-rose-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white';
                  if (isActive && cat === 'Yellow') bg = 'bg-amber-500 text-slate-950 font-bold';
                  if (isActive && cat === 'Red') bg = 'bg-rose-600 text-white font-bold';
                  if (isActive && cat === 'White') bg = 'bg-slate-200 text-slate-950 font-bold';
                  if (isActive && cat === 'Blue') bg = 'bg-sky-500 text-slate-950 font-bold';

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`py-1 rounded-lg text-center transition ${bg}`}
                    >
                      {cat === 'All' ? 'All' : cat[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
              >
                <option value="All">All Statuses</option>
                <option value="Logged">Logged</option>
                <option value="Awaiting Pickup">Awaiting Pickup</option>
                <option value="In Transit">In Transit</option>
                <option value="Disposed">Disposed</option>
              </select>
            </div>
          </div>

          {/* Bag Records List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            <div className="px-2 py-1 text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between">
              <span>Bags on Map ({filteredRecords.length})</span>
              <span className="text-[10px] font-normal lowercase text-slate-500">click to focus</span>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No waste bags match current filters.
              </div>
            ) : (
              filteredRecords.map((record) => {
                const styles = getCategoryStyles(record.category);
                const Icon = styles.icon;
                const isSelected = selectedRecord?._id === record._id;

                return (
                  <div
                    key={record._id}
                    onClick={() => handleFocusBag(record)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer ${
                      isSelected 
                        ? 'bg-rose-950/40 border-rose-500 shadow-md' 
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${styles.bg}`}></span>
                        <span className="font-mono font-bold text-xs text-white">{record.tagId}</span>
                      </div>
                      <span className="text-xs font-bold text-white">{record.weightKg} kg</span>
                    </div>

                    {/* Hospital Name per bag */}
                    <div className="text-xs font-semibold text-rose-400 mt-1 flex items-center gap-1 truncate">
                      <Building2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{record.hospitalName || 'St. Jude Memorial Hospital'}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{record.department} • {record.location}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border ${getStatusBadge(record.status)} font-semibold`}>
                        {record.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewBarcode && onViewBarcode(record);
                        }}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5"
                      >
                        <QrCode className="w-3 h-3" /> Tag
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Map Canvas (3 Cols on XL) */}
        <div className="xl:col-span-3 relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
          {/* Floating Map Controls Top-Right */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {/* Map Type Switcher */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg flex items-center">
              <button
                onClick={() => setMapType('roadmap')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  mapType === 'roadmap' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setMapType('hybrid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  mapType === 'hybrid' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Satellite
              </button>
            </div>

            {/* Toggle Vehicle Tracking */}
            <button
              onClick={() => setIsSimulatingTransit(!isSimulatingTransit)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition ${
                isSimulatingTransit 
                  ? 'bg-purple-900/80 border-purple-600 text-purple-200' 
                  : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Toggle Live CBWTF Fleet GPS Tracking"
            >
              <Truck className="w-3.5 h-3.5 text-purple-400" />
              <span>Fleet GPS {isSimulatingTransit ? 'ON' : 'PAUSED'}</span>
            </button>
          </div>

          {/* Map Legend Overlay Bottom-Left */}
          <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 shadow-xl text-xs space-y-1.5 max-w-xs pointer-events-auto">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Map Legend</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-300">Yellow (Infectious)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span className="text-slate-300">Red (Plastic)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-400"></span>
                <span className="text-slate-300">White (Sharps)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span className="text-slate-300">Blue (Glassware)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-rose-400" />
                <span className="text-slate-300">Hospital Facility</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-3 h-3 text-purple-400" />
                <span className="text-slate-300">CBWTF Transit Van</span>
              </div>
            </div>
          </div>

          {/* Google Maps Render */}
          {API_KEY ? (
            <APIProvider apiKey={API_KEY}>
              <GoogleMap
                defaultCenter={{ lat: 20.6869, lng: 76.5670 }}
                defaultZoom={13}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                mapTypeId={mapType}
                gestureHandling="greedy"
                disableDefaultUI={false}
                style={{ width: '100%', height: '100%' }}
              >
                <MapController focusedLocation={focusedLocation} />

                {/* Central Treatment Plant Marker */}
                <AdvancedMarker
                  position={{ lat: CBWTF_FACILITY.lat, lng: CBWTF_FACILITY.lng }}
                  onClick={() => {
                    setSelectedFacility(CBWTF_FACILITY);
                    setSelectedRecord(null);
                  }}
                  title={CBWTF_FACILITY.name}
                >
                  <div className="cursor-pointer group flex flex-col items-center">
                    <div className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] shadow-lg border border-emerald-400 mb-1 group-hover:scale-110 transition whitespace-nowrap">
                      🏭 CBWTF Treatment Plant
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-700 border-2 border-white flex items-center justify-center shadow-lg text-white group-hover:scale-110 transition">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                </AdvancedMarker>

                {/* Unique Hospital Hub Markers */}
                {uniqueHospitals.map((hosp) => (
                  <AdvancedMarker
                    key={hosp.name}
                    position={{ lat: hosp.lat, lng: hosp.lng }}
                    onClick={() => {
                      setSelectedFacility({
                        name: hosp.name,
                        type: 'HOSPITAL',
                        lat: hosp.lat,
                        lng: hosp.lng,
                        bagCount: hosp.bagCount,
                        totalWeight: hosp.totalWeight
                      });
                      setSelectedRecord(null);
                    }}
                    title={hosp.name}
                  >
                    <div className="cursor-pointer group flex flex-col items-center">
                      <div className="px-2 py-0.5 rounded-md bg-slate-900/90 text-white font-bold text-[10px] shadow-lg border border-rose-500/40 mb-1 group-hover:scale-110 transition whitespace-nowrap flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-rose-400" />
                        <span>{hosp.name}</span>
                        <span className="px-1 rounded bg-rose-600/30 text-rose-300">{hosp.bagCount}</span>
                      </div>
                      <div className="w-7 h-7 rounded-xl bg-slate-900 border-2 border-rose-500 flex items-center justify-center shadow-xl text-rose-400 group-hover:scale-110 transition">
                        🏥
                      </div>
                    </div>
                  </AdvancedMarker>
                ))}

                {/* Waste Bags Markers */}
                {filteredRecords.map((record, index) => {
                  const styles = getCategoryStyles(record.category);
                  const isSelected = selectedRecord?._id === record._id;

                  // Add slight jitter if multiple bags share the exact same hospital coordinate
                  const jitterLat = (record.lat || 19.9975) + ((index % 5) - 2) * 0.0008;
                  const jitterLng = (record.lng || 73.7898) + (Math.floor(index / 5) - 1) * 0.0008;

                  return (
                    <AdvancedMarker
                      key={record._id}
                      position={{ lat: jitterLat, lng: jitterLng }}
                      onClick={() => {
                        setSelectedRecord(record);
                        setSelectedFacility(null);
                      }}
                      title={`${record.hospitalName || 'Hospital'} - ${record.tagId} (${record.weightKg}kg)`}
                    >
                      <div className="cursor-pointer group flex flex-col items-center">
                        {/* Weight & Tag Header Tag */}
                        <div className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-md border mb-0.5 transition ${
                          isSelected 
                            ? 'bg-rose-600 text-white border-white scale-110' 
                            : 'bg-slate-900/95 text-slate-100 border-slate-700'
                        }`}>
                          {record.weightKg}kg
                        </div>

                        {/* Category Pin */}
                        <div 
                          className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition ${
                            isSelected ? 'scale-125 ring-4 ring-rose-500/50' : 'group-hover:scale-110'
                          } ${styles.bg}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-white/90"></span>
                        </div>
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* Live Animated CBWTF Transit Van Marker */}
                {isSimulatingTransit && (
                  <AdvancedMarker
                    position={{ lat: vehiclePosition.lat, lng: vehiclePosition.lng }}
                    onClick={() => {
                      setSelectedFacility({
                        name: 'CBWTF Transit Fleet Unit #04',
                        type: 'VEHICLE',
                        lat: vehiclePosition.lat,
                        lng: vehiclePosition.lng,
                        description: 'Specialized Bio-Hazard Transport Vehicle with GPS Barcode Reader',
                        plateNumber: 'WB-04-E-8821',
                        driver: 'Rajesh Sharma',
                        activeLoad: '142.5 kg'
                      });
                      setSelectedRecord(null);
                    }}
                    title="Live CBWTF Transit Van"
                  >
                    <div className="cursor-pointer group flex flex-col items-center animate-bounce">
                      <div className="px-2 py-0.5 rounded-md bg-purple-700 text-white font-mono font-bold text-[10px] shadow-lg border border-purple-400 mb-1 whitespace-nowrap flex items-center gap-1">
                        <Truck className="w-3 h-3 text-purple-200" />
                        <span>WB-04-E-8821 [GPS LIVE]</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-purple-800 border-2 border-yellow-300 flex items-center justify-center shadow-xl text-white">
                        🚐
                      </div>
                    </div>
                  </AdvancedMarker>
                )}

                {/* InfoWindow for Clicked Waste Bag */}
                {selectedRecord && (
                  <InfoWindow
                    position={{
                      lat: selectedRecord.lat || 19.9975,
                      lng: selectedRecord.lng || 73.7898
                    }}
                    onCloseClick={() => setSelectedRecord(null)}
                  >
                    <div className="p-1 max-w-xs text-slate-900 space-y-2">
                      {/* Hospital Name Headline */}
                      <div className="pb-1.5 border-b border-slate-200">
                        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-700">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Hospital / Bag Origin</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-950 truncate">
                          {selectedRecord.hospitalName || 'St. Jude Memorial Hospital'}
                        </h4>
                      </div>

                      {/* Tag ID & Category */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                          {selectedRecord.tagId}
                        </span>
                        <span className="font-bold text-slate-900">{selectedRecord.weightKg} kg</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-500 block text-[10px]">CATEGORY</span>
                          <span className="font-semibold text-slate-800">{selectedRecord.category}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">STATUS</span>
                          <span className="font-semibold text-slate-800">{selectedRecord.status}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">DEPARTMENT</span>
                          <span className="text-slate-700 truncate block">{selectedRecord.department}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">WARD / ROOM</span>
                          <span className="text-slate-700 truncate block">{selectedRecord.location}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[10px]">HANDLER</span>
                          <span className="text-slate-700 truncate block">{selectedRecord.handlerName}</span>
                        </div>
                      </div>

                      {/* InfoWindow Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => onViewBarcode && onViewBarcode(selectedRecord)}
                          className="flex-1 py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium flex items-center justify-center gap-1 transition"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>Barcode Tag</span>
                        </button>
                        <button
                          onClick={() => {
                            const nextStatus = 
                              selectedRecord.status === 'Logged' ? 'Awaiting Pickup' :
                              selectedRecord.status === 'Awaiting Pickup' ? 'In Transit' :
                              selectedRecord.status === 'In Transit' ? 'Disposed' : 'Logged';
                            onUpdateStatus && onUpdateStatus(selectedRecord._id, nextStatus);
                            setSelectedRecord({ ...selectedRecord, status: nextStatus });
                          }}
                          className="py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold transition"
                          title="Advance bag custody status"
                        >
                          Next Status
                        </button>
                      </div>
                    </div>
                  </InfoWindow>
                )}

                {/* InfoWindow for Facility / Vehicle */}
                {selectedFacility && (
                  <InfoWindow
                    position={{ lat: selectedFacility.lat, lng: selectedFacility.lng }}
                    onCloseClick={() => setSelectedFacility(null)}
                  >
                    <div className="p-1 max-w-xs text-slate-900 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-rose-700">
                        {selectedFacility.type === 'HOSPITAL' && <Building2 className="w-4 h-4" />}
                        {selectedFacility.type === 'VEHICLE' && <Truck className="w-4 h-4" />}
                        {selectedFacility.type === 'CBWTF_PLANT' && <ShieldCheck className="w-4 h-4" />}
                        <span>{selectedFacility.type}</span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-950">{selectedFacility.name}</h4>

                      {selectedFacility.type === 'HOSPITAL' && (
                        <div className="text-xs space-y-1 bg-slate-50 p-2 rounded-lg">
                          <div>Active Bags at Facility: <strong>{selectedFacility.bagCount}</strong></div>
                          <div>Accumulated Weight: <strong>{selectedFacility.totalWeight?.toFixed(1)} kg</strong></div>
                          <button
                            onClick={() => {
                              setSelectedHospitalFilter(selectedFacility.name);
                              setSelectedFacility(null);
                            }}
                            className="mt-2 w-full py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold transition"
                          >
                            Filter Bags for this Hospital
                          </button>
                        </div>
                      )}

                      {selectedFacility.type === 'VEHICLE' && (
                        <div className="text-xs space-y-1 bg-slate-50 p-2 rounded-lg">
                          <div>Plate: <strong>{selectedFacility.plateNumber}</strong></div>
                          <div>Driver: <strong>{selectedFacility.driver}</strong></div>
                          <div>Current Payload: <strong>{selectedFacility.activeLoad}</strong></div>
                          <div className="text-[11px] text-emerald-700 font-semibold">GPS Status: Satellite Sync Active (5s ping)</div>
                        </div>
                      )}

                      {selectedFacility.type === 'CBWTF_PLANT' && (
                        <div className="text-xs space-y-1 bg-slate-50 p-2 rounded-lg">
                          <p className="text-[11px] text-slate-600">{selectedFacility.description}</p>
                          <div>Licensed Daily Capacity: <strong>{selectedFacility.capacity}</strong></div>
                          <div className="text-[11px] text-emerald-700 font-semibold">Incineration & Pyrolysis Ready</div>
                        </div>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </APIProvider>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-400" />
              <h3 className="text-base font-semibold text-white">Google Maps API Key Required</h3>
              <p className="text-xs max-w-md">
                Please set <code className="text-rose-400 font-mono">VITE_GOOGLE_MAPS_API_KEY</code> in your environment variables to enable the live interactive satellite map.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
