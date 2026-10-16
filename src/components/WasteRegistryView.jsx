import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  QrCode, 
  ArrowUpDown, 
  Flame, 
  Recycle, 
  Scissors, 
  Wine,
  Calendar,
  User,
  MapPin,
  Building2,
  Navigation,
  AlertCircle,
  Sparkles,
  Layers,
  ShieldAlert,
  Info
} from 'lucide-react';
import TableSkeleton from './TableSkeleton';
import AIClassificationLog from './AIClassificationLog';

export default function WasteRegistryView({
  records = [],
  isLoading = false,
  filters,
  setFilters,
  onOpenLogModal,
  onEditRecord,
  onDeleteRecord,
  onUpdateStatus,
  onViewBarcode,
  onNavigateToMap,
  onAddToast,
  currentUser
}) {
  const [activeSubTab, setActiveSubTab] = useState('registry'); // 'registry' | 'ai_vision'
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState('All');
  const [showCategoryGuide, setShowCategoryGuide] = useState(false);

  const isDriver = currentUser && (
    (currentUser.role || '').toLowerCase().includes('driver') ||
    (currentUser.role || '').toLowerCase().includes('custodian') ||
    (currentUser.role || '').toLowerCase().includes('transport')
  );

  const categories = ['All', 'Yellow', 'Red', 'Blue', 'Black'];
  const departments = ['All', 'ICU', 'Operating Theater', 'Emergency', 'Pathology Lab', 'General Ward', 'Oncology', 'Pediatrics'];
  const statuses = ['All', 'Logged', 'Awaiting Pickup', 'In Transit', 'Collected', 'Delivered', 'Disposed'];

  // Extract unique hospital names from records
  const uniqueHospitals = Array.from(new Set(records.map(r => r.hospitalName || 'Government Hospital of Khamgaon'))).filter(Boolean);

  const displayedRecords = records.filter(r => {
    if (selectedHospital !== 'All' && (r.hospitalName || 'Government Hospital of Khamgaon') !== selectedHospital) {
      return false;
    }
    return true;
  });

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Yellow':
        return {
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
          icon: Flame,
          label: 'Yellow (Anatomical & Pathological)',
          desc: 'Human tissues, organs, soiled dressings, expired cytotoxic medicines (Incineration / Deep Burial)'
        };
      case 'Red':
        return {
          badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500',
          icon: Recycle,
          label: 'Red (Contaminated & Sharps)',
          desc: 'Tubing, IV bottles, syringes, scalpels, blades, recyclable infected plastics (Autoclave & Shredding)'
        };
      case 'Blue':
        return {
          badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          dot: 'bg-sky-400',
          icon: Wine,
          label: 'Blue (Glassware & Metal)',
          desc: 'Broken ampoules, vials, orthopedic implants (Disinfection & Metal Recycling)'
        };
      case 'Black':
        return {
          badgeColor: 'bg-slate-700/60 text-slate-200 border-slate-600',
          dot: 'bg-slate-400',
          icon: ShieldAlert,
          label: 'Black (General & Cytotoxic)',
          desc: 'Office waste, sanitary paper, cytotoxic spill neutralization residue'
        };
      default:
        return {
          badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
          dot: 'bg-slate-400',
          icon: AlertCircle,
          label: category,
          desc: 'Bio-medical categorized waste'
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Logged':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Awaiting Pickup':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'In Transit':
      case 'Collected':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Disposed':
      case 'Delivered':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const totalFilteredWeight = records.reduce((acc, r) => acc + (Number(r.weightKg) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Navigation Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Biomedical Waste Registry</h1>
          <p className="text-slate-400 text-sm">
            Tracking {records.length} waste containers • Total weight: {totalFilteredWeight.toFixed(2)} kg
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sub-tab Switcher: Registry Table vs AI Vision Classification */}
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
            <button
              onClick={() => setActiveSubTab('registry')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'registry'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Waste Registry</span>
            </button>
            <button
              onClick={() => setActiveSubTab('ai_vision')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'ai_vision'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Classification Log</span>
            </button>
          </div>

          {activeSubTab === 'registry' && (
            <button
              onClick={() => onOpenLogModal()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-950 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Waste Bag</span>
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'ai_vision' ? (
        <AIClassificationLog onAddToast={onAddToast} />
      ) : (
        <>
          {/* Category Guide Banner Toggle */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-rose-400" />
                CPCB Standard Color Stream Definitions
              </span>
              <button
                onClick={() => setShowCategoryGuide(!showCategoryGuide)}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                {showCategoryGuide ? 'Hide Guide ▲' : 'Show Descriptions ▼'}
              </button>
            </div>

            {showCategoryGuide && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800 animate-fade-in text-xs">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    Yellow (Anatomical)
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Human tissues, organs, soiled dressings, expired cytotoxic medicines. Method: Incineration (1050°C) or plasma pyrolysis.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                  <div className="font-bold text-rose-400 flex items-center gap-1">
                    <Recycle className="w-3.5 h-3.5" />
                    Red (Contaminated & Sharps)
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    IV tubing, syringes, catheter sets, scalpels & needles. Method: Autoclaving/microwaving followed by shredding.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 space-y-1">
                  <div className="font-bold text-sky-400 flex items-center gap-1">
                    <Wine className="w-3.5 h-3.5" />
                    Blue (Glassware & Implants)
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Medicine vials, broken ampoules, orthopedic hardware. Method: 1% sodium hypochlorite disinfection & recycling.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <div className="font-bold text-slate-300 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Black (General & Cytotoxic)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    General non-infected hospital waste and cytotoxic residues. Method: Secured sanitary landfill / chemical neutralization.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search Input */}
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Tag ID (e.g. MW-2026), Handler name, or Location..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Hospital Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Building2 className="w-4 h-4 text-rose-400 hidden sm:block" />
                <select
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                  className="w-full md:w-56 py-2 px-3 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-rose-500 font-medium"
                >
                  <option value="All">All Hospitals ({uniqueHospitals.length})</option>
                  {uniqueHospitals.map((hosp) => (
                    <option key={hosp} value={hosp}>{hosp}</option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="w-full md:w-48 py-2 px-3 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="All">All Departments</option>
                  {departments.filter(d => d !== 'All').map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-auto">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full md:w-44 py-2 px-3 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="All">All Statuses</option>
                  {statuses.filter(s => s !== 'All').map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 mr-1">Hazard Category:</span>
              {categories.map((cat) => {
                const isActive = filters.category === cat;
                let activeStyle = 'bg-rose-600 text-white';
                if (cat === 'Yellow') activeStyle = 'bg-amber-500 text-slate-950 font-bold';
                if (cat === 'Red') activeStyle = 'bg-rose-600 text-white font-bold';
                if (cat === 'Blue') activeStyle = 'bg-sky-500 text-slate-950 font-bold';
                if (cat === 'Black') activeStyle = 'bg-slate-300 text-slate-950 font-bold';

                return (
                  <button
                    key={cat}
                    onClick={() => setFilters({ ...filters, category: cat })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? activeStyle
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Waste Records Table / Card List */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
            {isLoading ? (
              <TableSkeleton rows={5} cols={7} />
            ) : displayedRecords.length === 0 ? (
              <div className="text-center p-12 space-y-3">
                <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-semibold text-slate-200">No matching waste records found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try modifying your search keywords or category filters, or log a new bag.
                </p>
                <button
                  onClick={() => onOpenLogModal()}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Log New Record</span>
                </button>
              </div>
            ) : (
              <div>
                {/* Desktop View: Full Data Grid Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Tag / Barcode</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Hospital & Department Location</th>
                        <th className="py-3.5 px-4">Weight</th>
                        <th className="py-3.5 px-4">Handler</th>
                        <th className="py-3.5 px-4">Status & Action</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {displayedRecords.map((record) => {
                        const catInfo = getCategoryBadge(record.category);
                        const isConfirmingDelete = deleteConfirmId === record._id;

                        return (
                          <tr key={record._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            {/* Tag ID */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => onViewBarcode(record)}
                                  title="View barcode tag"
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                                >
                                  <QrCode className="w-4 h-4" />
                                </button>
                                <div>
                                  <span className="font-mono font-semibold text-slate-900 dark:text-white">{record.tagId}</span>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(record.createdAt).toLocaleDateString()} {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${catInfo.badgeColor}`}>
                                <span className={`w-2 h-2 rounded-full ${catInfo.dot}`}></span>
                                {record.category}
                              </span>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[160px] truncate" title={record.hazardLevel || catInfo.label}>
                                {record.hazardLevel || catInfo.label}
                              </div>
                            </td>

                            {/* Hospital & Department Location */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400 text-xs mb-1">
                                <Building2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate max-w-[200px]" title={record.hospitalName || 'Government Hospital of Khamgaon'}>
                                  {record.hospitalName || 'Government Hospital of Khamgaon'}
                                </span>
                              </div>
                              <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">{record.department}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[180px]">{record.location}</span>
                              </div>
                            </td>

                            {/* Weight */}
                            <td className="py-3.5 px-4">
                              <div className="inline-flex items-baseline gap-1 font-bold text-slate-900 dark:text-white text-base font-mono">
                                {record.weightKg}
                                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kg</span>
                              </div>
                              {record.notes && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]" title={record.notes}>
                                  {record.notes}
                                </div>
                              )}
                            </td>

                            {/* Handler */}
                            <td className="py-3.5 px-4">
                              <div className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>{record.handlerName}</span>
                              </div>
                            </td>

                            {/* Status & Quick Action */}
                            <td className="py-3.5 px-4">
                              <select
                                value={record.status}
                                onChange={(e) => onUpdateStatus(record._id, e.target.value)}
                                className={`text-xs font-semibold py-1.5 px-2.5 rounded-lg border focus:outline-none ${getStatusBadge(record.status)}`}
                              >
                                <option value="Logged">Logged</option>
                                <option value="Awaiting Pickup">Awaiting Pickup</option>
                                <option value="In Transit">In Transit</option>
                                <option value="Disposed">Disposed</option>
                              </select>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {onNavigateToMap && (
                                  <button
                                    onClick={() => onNavigateToMap(record)}
                                    title="View on GPS Route Map"
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-500 transition"
                                  >
                                    <Navigation className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => onEditRecord(record)}
                                  title="Edit Record"
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {isConfirmingDelete ? (
                                  <div className="flex items-center gap-1 animate-fade-in">
                                    <button
                                      onClick={() => {
                                        onDeleteRecord(record._id);
                                        setDeleteConfirmId(null);
                                      }}
                                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirmId(record._id)}
                                    title="Delete Record"
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Touch-Friendly Card Grid (< 768px) */}
                <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-3">
                  {displayedRecords.map((record) => {
                    const catInfo = getCategoryBadge(record.category);
                    const isConfirmingDelete = deleteConfirmId === record._id;

                    return (
                      <div key={record._id} className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onViewBarcode(record)}
                              title="View barcode tag"
                              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <div>
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{record.tagId}</span>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                {new Date(record.createdAt).toLocaleDateString()} {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${catInfo.badgeColor}`}>
                            <span className={`w-2 h-2 rounded-full ${catInfo.dot}`}></span>
                            {record.category}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                          <div>
                            <span className="text-[10px] uppercase font-mono text-slate-400 block">Department & Hospital</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{record.department}</span>
                            <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">{record.hospitalName}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-mono text-slate-400 block">Weight</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">{record.weightKg} <span className="text-xs font-normal text-slate-500">kg</span></span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                          <select
                            value={record.status}
                            onChange={(e) => onUpdateStatus(record._id, e.target.value)}
                            className={`flex-1 text-xs font-semibold py-2 px-3 rounded-xl border focus:outline-none ${getStatusBadge(record.status)}`}
                          >
                            <option value="Logged">Logged</option>
                            <option value="Awaiting Pickup">Awaiting Pickup</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Disposed">Disposed</option>
                          </select>

                          <div className="flex items-center gap-1">
                            {onNavigateToMap && (
                              <button
                                onClick={() => onNavigateToMap(record)}
                                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-500 shadow-2xs"
                                title="Map Location"
                              >
                                <Navigation className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => onEditRecord(record)}
                              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs"
                              title="Edit Record"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => { onDeleteRecord(record._id); setDeleteConfirmId(null); }}
                                  className="px-2.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold"
                                >
                                  Del
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(record._id)}
                                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 shadow-2xs"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
