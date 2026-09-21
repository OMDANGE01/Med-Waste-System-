import React, { useState, useMemo } from 'react';
import { 
  PlusCircle, 
  Truck, 
  QrCode, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Send, 
  AlertCircle, 
  Flame, 
  Recycle, 
  Scissors, 
  Wine, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  ArrowRight,
  ShieldCheck,
  BellRing
} from 'lucide-react';

export default function HospitalStaffPortalView({
  currentUser,
  records = [],
  onOpenLogModal,
  onViewBarcode,
  onUpdateStatus,
  onNotifyDriver,
  addToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [pickupNote, setPickupNote] = useState('Central Holding Dock B, ground floor entrance.');
  const [isAlertingDriver, setIsAlertingDriver] = useState(false);
  const [lastPickupNotification, setLastPickupNotification] = useState(() => {
    try {
      const saved = localStorage.getItem('last_driver_pickup_notification');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Determine the hospital for current staff member
  const staffHospital = useMemo(() => {
    if (currentUser?.hospital) return currentUser.hospital;
    if (currentUser?.department && currentUser.department.includes('St. Jude')) return 'St. Jude Memorial Hospital';
    return 'St. Jude Memorial Hospital';
  }, [currentUser]);

  // Filter bags belonging to this hospital
  const hospitalRecords = useMemo(() => {
    return records.filter(r => (r.hospitalName || 'St. Jude Memorial Hospital') === staffHospital);
  }, [records, staffHospital]);

  // Compute bags ready for pickup (Logged or Awaiting Pickup)
  const readyForPickupBags = useMemo(() => {
    return hospitalRecords.filter(r => r.status === 'Logged' || r.status === 'Awaiting Pickup');
  }, [hospitalRecords]);

  const readyWeightKg = useMemo(() => {
    return readyForPickupBags.reduce((acc, r) => acc + (Number(r.weightKg) || 0), 0).toFixed(1);
  }, [readyForPickupBags]);

  // Filtered displayed records
  const displayedRecords = useMemo(() => {
    return hospitalRecords.filter(r => {
      if (selectedCategory !== 'All' && r.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tag = (r.tagId || '').toLowerCase();
        const handler = (r.handlerName || '').toLowerCase();
        const dept = (r.department || '').toLowerCase();
        if (!tag.includes(q) && !handler.includes(q) && !dept.includes(q)) return false;
      }
      return true;
    });
  }, [hospitalRecords, selectedCategory, searchQuery]);

  // Trigger "Tell Pickup Man for Pickup"
  const handleAlertPickupDriver = async () => {
    if (readyForPickupBags.length === 0) {
      addToast?.('No Bags Ready', 'There are no active bags awaiting pickup at this hospital right now.', 'info');
      return;
    }

    setIsAlertingDriver(true);

    const notificationPayload = {
      hospitalName: staffHospital,
      requestedBy: currentUser?.name || 'Hospital Staff',
      requestedByRole: currentUser?.role || 'Clinical Staff / Nurse',
      bagCount: readyForPickupBags.length,
      totalWeightKg: readyWeightKg,
      bagIds: readyForPickupBags.map(b => b.tagId),
      pickupNote: pickupNote.trim(),
      timestamp: new Date().toISOString(),
      driverName: 'Robert Langdon',
      driverPhone: '+1 (555) 349-8821',
      vehicleNumber: 'WB-04-E-8821',
      status: 'Driver Dispatched'
    };

    // Update bag statuses to 'Awaiting Pickup'
    for (const bag of readyForPickupBags) {
      if (bag.status === 'Logged' && onUpdateStatus) {
        onUpdateStatus(bag._id, 'Awaiting Pickup');
      }
    }

    // Call external driver notification handler or save to backend/localStorage
    if (onNotifyDriver) {
      await onNotifyDriver(notificationPayload);
    }

    try {
      localStorage.setItem('last_driver_pickup_notification', JSON.stringify(notificationPayload));
    } catch {
      // ignore
    }

    setLastPickupNotification(notificationPayload);
    setIsAlertingDriver(false);
    addToast?.(
      'Pickup Man Notified!',
      `Driver Robert Langdon notified for ${readyForPickupBags.length} bags (${readyWeightKg} kg) at ${staffHospital}.`,
      'success'
    );
  };

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'Yellow':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
          icon: Flame,
          label: 'Yellow (Infectious)'
        };
      case 'Red':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500',
          icon: Recycle,
          label: 'Red (Plastics)'
        };
      case 'White':
        return {
          bg: 'bg-slate-200/10 text-slate-200 border-slate-400/30',
          dot: 'bg-slate-200',
          icon: Scissors,
          label: 'White (Sharps)'
        };
      case 'Blue':
        return {
          bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          dot: 'bg-sky-400',
          icon: Wine,
          label: 'Blue (Glassware)'
        };
      default:
        return {
          bg: 'bg-slate-700 text-slate-300 border-slate-600',
          dot: 'bg-slate-400',
          icon: Flame,
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
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hospital Staff Identity Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-rose-500" />
              <span>{staffHospital}</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              Staff Ward Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-2">
            Biomedical Waste Logging & Pickup Dispatch
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Logged in as <strong className="text-slate-200">{currentUser?.name || 'Hospital Nurse'}</strong> ({currentUser?.role || 'Staff'}) • {currentUser?.department || 'Operating Theater'}
          </p>
        </div>

        {/* Primary Action: Add Bag */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenLogModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm shadow-xl shadow-rose-950 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ Add Waste Bag</span>
          </button>
        </div>
      </div>

      {/* Two Core Columns: Tell Pickup Man (Action Card) & Staff Waste Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Feature: Tell Pickup Man for Pickup (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-purple-950/40 border border-purple-500/30 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-md">
                <Truck className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Tell Pickup Man for Collection</h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Direct CBWTF Dispatch
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send immediate pickup request to the assigned CBWTF transit driver for this facility.
                </p>
              </div>
            </div>

            {/* Ready bags counter badge */}
            <div className="text-right hidden sm:block">
              <div className="text-2xl font-extrabold text-white">{readyWeightKg} <span className="text-xs font-normal text-slate-400">kg</span></div>
              <div className="text-xs text-purple-300 font-semibold">{readyForPickupBags.length} bag(s) awaiting van</div>
            </div>
          </div>

          {/* Pickup Status & Driver Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">Assigned CBWTF Driver</span>
              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                <span>🚚 Robert Langdon</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Van #WB-04-E-8821</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">Driver Direct Contact</span>
              <a
                href="tel:+15553498821"
                className="font-bold text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1.5 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>+1 (555) 349-8821</span>
              </a>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                On Duty • Transit Route
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">Ready Bags at {staffHospital.split(' ')[0]}</span>
              <div className="font-bold text-amber-400 text-sm">
                {readyForPickupBags.length} bags • {readyWeightKg} kg
              </div>
              <span className="text-[11px] text-slate-400">
                {readyForPickupBags.length === 0 ? 'All current bags collected' : 'Tagged & stored at dock'}
              </span>
            </div>
          </div>

          {/* Note for Driver */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Pickup Location & Notes for Driver:</span>
              <span className="text-[11px] text-slate-500 font-normal">Included in driver alert</span>
            </label>
            <input
              type="text"
              value={pickupNote}
              onChange={(e) => setPickupNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="e.g. Ground floor biohazard holding dock near door 3"
            />
          </div>

          {/* Action Trigger Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleAlertPickupDriver}
              disabled={isAlertingDriver || readyForPickupBags.length === 0}
              className={`w-full sm:flex-1 py-3 px-5 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition ${
                readyForPickupBags.length > 0
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-purple-950/60 hover:scale-[1.01] active:scale-[0.99]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <BellRing className={`w-4 h-4 ${readyForPickupBags.length > 0 ? 'animate-bounce' : ''}`} />
              <span>
                {isAlertingDriver
                  ? 'Alerting CBWTF Driver...'
                  : readyForPickupBags.length > 0
                  ? `Tell Pickup Man for Pickup (${readyForPickupBags.length} Bags Ready)`
                  : 'No Bags Awaiting Pickup (All Clear)'}
              </span>
            </button>

            <button
              onClick={onOpenLogModal}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <PlusCircle className="w-4 h-4 text-rose-400" />
              <span>Log Another Bag First</span>
            </button>
          </div>

          {/* Last Notification Status Banner */}
          {lastPickupNotification && (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold text-purple-200">Driver Alert Active: </span>
                  <span className="text-slate-300">
                    Robert Langdon alerted for {lastPickupNotification.bagCount} bags ({lastPickupNotification.totalWeightKg} kg) at {lastPickupNotification.hospitalName}.
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Sent at {new Date(lastPickupNotification.timestamp).toLocaleTimeString()} • Note: "{lastPickupNotification.pickupNote}"
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                Driver Notified
              </span>
            </div>
          )}
        </div>

        {/* Hospital Waste Stats Summary (1 col) */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base">Facility Waste Ledger</h3>
              <span className="text-xs text-rose-400 font-semibold">{staffHospital.split(' ')[0]}</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Biomedical waste generated and categorized under statutory CPCB guidelines at this center.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-300">Total Bags Tagged</span>
                <span className="font-extrabold text-white text-sm">{hospitalRecords.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-300">Awaiting Pickup</span>
                <span className="font-extrabold text-amber-400 text-sm">{readyForPickupBags.length} bags</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-300">Total Weight Logged</span>
                <span className="font-extrabold text-white text-sm">
                  {hospitalRecords.reduce((acc, r) => acc + (Number(r.weightKg) || 0), 0).toFixed(1)} kg
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-300">Safely Disposed</span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  {hospitalRecords.filter(r => r.status === 'Disposed').length} bags
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={onOpenLogModal}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center justify-center gap-1.5 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add New Waste Bag Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hospital Bags Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Active Bags at {staffHospital}</h2>
            <p className="text-xs text-slate-400">
              Containers recorded by ward staff. Print barcode tags or update disposal status.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tag or ward..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              {['All', 'Yellow', 'Red', 'White', 'Blue'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List of Bags */}
        {displayedRecords.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-slate-850/50 border border-slate-800">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No bags match current filter</h3>
            <p className="text-xs text-slate-500 mt-1">Click "+ Add Waste Bag" to register a new biohazard container.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedRecords.map((record) => {
              const catStyle = getCategoryStyles(record.category);
              const CatIcon = catStyle.icon;
              return (
                <div
                  key={record._id}
                  className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 transition shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${catStyle.bg} flex items-center gap-1`}>
                        <CatIcon className="w-3.5 h-3.5" />
                        <span>{record.category}</span>
                      </span>
                      <span className="font-mono font-bold text-xs text-white">{record.tagId}</span>
                    </div>
                    <span className="text-sm font-extrabold text-white">{record.weightKg} kg</span>
                  </div>

                  <div className="text-xs text-slate-300">
                    <div className="font-semibold text-white truncate">{record.department} • {record.location}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>{record.handlerName}</span>
                    </div>
                  </div>

                  {record.notes && (
                    <p className="text-[11px] text-slate-400 italic line-clamp-1 bg-slate-900/60 px-2 py-1 rounded">
                      "{record.notes}"
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${getStatusBadge(record.status)}`}>
                      {record.status}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {record.status === 'Logged' && (
                        <button
                          onClick={() => onUpdateStatus && onUpdateStatus(record._id, 'Awaiting Pickup')}
                          className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-semibold border border-amber-500/40 transition"
                          title="Mark ready for pickup"
                        >
                          Mark Ready
                        </button>
                      )}

                      <button
                        onClick={() => onViewBarcode && onViewBarcode(record)}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] transition flex items-center gap-1"
                        title="View & Print Barcode Badge"
                      >
                        <QrCode className="w-3.5 h-3.5 text-rose-400" />
                        <span>Barcode</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
