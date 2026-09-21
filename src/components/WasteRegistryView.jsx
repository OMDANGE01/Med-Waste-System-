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
  AlertCircle
} from 'lucide-react';

export default function WasteRegistryView({
  records,
  isLoading,
  filters,
  setFilters,
  onOpenLogModal,
  onEditRecord,
  onDeleteRecord,
  onUpdateStatus,
  onViewBarcode,
  onNavigateToMap
}) {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState('All');

  const categories = ['All', 'Yellow', 'Red', 'White', 'Blue'];
  const departments = ['All', 'ICU', 'Operating Theater', 'Emergency', 'Pathology Lab', 'General Ward', 'Oncology', 'Pediatrics'];
  const statuses = ['All', 'Logged', 'Awaiting Pickup', 'In Transit', 'Disposed'];

  // Extract unique hospital names from records
  const uniqueHospitals = Array.from(new Set(records.map(r => r.hospitalName || 'St. Jude Memorial Hospital'))).filter(Boolean);

  const displayedRecords = records.filter(r => {
    if (selectedHospital !== 'All' && (r.hospitalName || 'St. Jude Memorial Hospital') !== selectedHospital) {
      return false;
    }
    return true;
  });

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Yellow':
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
          icon: Flame,
          label: 'Yellow (Infectious)'
        };
      case 'Red':
        return {
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500',
          icon: Recycle,
          label: 'Red (Plastic)'
        };
      case 'White':
        return {
          badge: 'bg-slate-200/10 text-slate-200 border-slate-400/30',
          dot: 'bg-slate-200',
          icon: Scissors,
          label: 'White (Sharps)'
        };
      case 'Blue':
        return {
          badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          dot: 'bg-sky-400',
          icon: Wine,
          label: 'Blue (Glass/Metal)'
        };
      default:
        return {
          badge: 'bg-slate-700 text-slate-300 border-slate-600',
          dot: 'bg-slate-400',
          icon: AlertCircle,
          label: category
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
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Disposed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const totalFilteredWeight = records.reduce((acc, r) => acc + (Number(r.weightKg) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Biomedical Waste Registry</h1>
          <p className="text-slate-400 text-sm">
            Tracking {records.length} waste containers • Total weight: {totalFilteredWeight.toFixed(2)} kg
          </p>
        </div>
        <button
          onClick={() => onOpenLogModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-950 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Log Waste Bag</span>
        </button>
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
            if (cat === 'White') activeStyle = 'bg-slate-200 text-slate-950 font-bold';
            if (cat === 'Blue') activeStyle = 'bg-sky-500 text-slate-950 font-bold';

            return (
              <button
                key={cat}
                onClick={() => setFilters({ ...filters, category: cat })}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? activeStyle
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {cat === 'All' ? 'All Colors' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Waste Records Table / Card List */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full"></div>
          </div>
        ) : records.length === 0 ? (
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-850/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tag / Barcode</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Hospital & Department Location</th>
                  <th className="py-3.5 px-4">Weight</th>
                  <th className="py-3.5 px-4">Handler</th>
                  <th className="py-3.5 px-4">Status & Action</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {displayedRecords.map((record) => {
                  const catInfo = getCategoryBadge(record.category);
                  const isConfirmingDelete = deleteConfirmId === record._id;

                  return (
                    <tr key={record._id} className="hover:bg-slate-800/40 transition">
                      {/* Tag ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onViewBarcode(record)}
                            title="View barcode tag"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <div>
                            <span className="font-mono font-semibold text-white">{record.tagId}</span>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
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
                        <div className="text-[11px] text-slate-400 mt-1 max-w-[140px] truncate" title={record.hazardLevel}>
                          {record.hazardLevel}
                        </div>
                      </td>

                      {/* Hospital & Department Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-rose-400 text-xs mb-1">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[200px]" title={record.hospitalName || 'St. Jude Memorial Hospital'}>
                            {record.hospitalName || 'St. Jude Memorial Hospital'}
                          </span>
                        </div>
                        <div className="font-medium text-slate-200 text-xs">{record.department}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{record.location}</span>
                        </div>
                      </td>

                      {/* Weight */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-baseline gap-1 font-bold text-white text-base">
                          {record.weightKg}
                          <span className="text-xs font-normal text-slate-400">kg</span>
                        </div>
                        {record.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[160px]" title={record.notes}>
                            {record.notes}
                          </div>
                        )}
                      </td>

                      {/* Handler */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs">{record.handlerName}</span>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={record.status}
                          onChange={(e) => onUpdateStatus(record._id, e.target.value)}
                          className={`text-xs font-semibold py-1 px-2 rounded-lg border focus:outline-none ${getStatusBadge(record.status)} bg-slate-900 cursor-pointer`}
                        >
                          <option value="Logged" className="bg-slate-900 text-blue-400">Logged</option>
                          <option value="Awaiting Pickup" className="bg-slate-900 text-amber-400">Awaiting Pickup</option>
                          <option value="In Transit" className="bg-slate-900 text-purple-400">In Transit</option>
                          <option value="Disposed" className="bg-slate-900 text-emerald-400">Disposed</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isConfirmingDelete ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                onDeleteRecord(record._id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-medium"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onNavigateToMap && onNavigateToMap(record)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-400 border border-transparent hover:border-emerald-800/40 transition"
                              title="View on Live Google Map"
                            >
                              <Navigation className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEditRecord(record)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                              title="Edit Record"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(record._id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
