import React from 'react';
import { 
  Truck, 
  PlusCircle, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Phone, 
  ShieldCheck,
  Building,
  Navigation
} from 'lucide-react';

export default function PickupManifestView({
  pickups,
  isLoading,
  onOpenScheduleModal,
  onUpdatePickupStatus
}) {
  const getManifestStatusBadge = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'En Route':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Collected':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const totalManifestWeight = pickups.reduce((acc, p) => acc + (Number(p.totalWeightKg) || 0), 0);
  const completedDispatches = pickups.filter(p => p.status === 'Completed').length;
  const activeDispatches = pickups.filter(p => p.status !== 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CBWTF Pickup & Transit Manifests</h1>
          <p className="text-slate-400 text-sm">
            Legally binding chain-of-custody transfer records for Common Bio-medical Waste Treatment Facilities.
          </p>
        </div>
        <button
          onClick={onOpenScheduleModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-sm font-semibold shadow-lg shadow-rose-950 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Dispatch New Manifest</span>
        </button>
      </div>

      {/* Manifest Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Total Transferred Weight</div>
            <div className="text-2xl font-bold text-white mt-1">{totalManifestWeight.toFixed(1)} <span className="text-sm font-normal text-slate-400">kg</span></div>
          </div>
          <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Active Dispatches</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{activeDispatches} <span className="text-sm font-normal text-slate-400">consignments</span></div>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Navigation className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Certified Completed</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{completedDispatches} <span className="text-sm font-normal text-slate-400">batches</span></div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Manifests List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full"></div>
          </div>
        ) : pickups.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/80 border border-slate-800">
            <Truck className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No pickup manifests recorded yet</h3>
            <p className="text-xs text-slate-400 mt-1">Schedule a collection pickup for your pending waste containers.</p>
          </div>
        ) : (
          pickups.map((manifest) => (
            <div
              key={manifest._id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-base">{manifest.manifestNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getManifestStatusBadge(manifest.status)}`}>
                        {manifest.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span>{manifest.treatmentFacility}</span>
                    </div>
                  </div>
                </div>

                {/* Status Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Consignment Status:</span>
                  <select
                    value={manifest.status}
                    onChange={(e) => onUpdatePickupStatus(manifest._id, e.target.value)}
                    className={`text-xs font-semibold py-1.5 px-3 rounded-xl border focus:outline-none bg-slate-800 ${getManifestStatusBadge(manifest.status)}`}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="En Route">En Route</option>
                    <option value="Collected">Collected</option>
                    <option value="Completed">Completed & Treated</option>
                  </select>
                </div>
              </div>

              {/* Manifest Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Assigned Vehicle</span>
                  <span className="font-semibold text-white font-mono bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
                    {manifest.vehicleNumber}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Authorized Driver</span>
                  <span className="font-medium text-slate-200">{manifest.driverName}</span>
                  {manifest.driverPhone && (
                    <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{manifest.driverPhone}</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Batch Weight</span>
                  <div className="text-white font-bold text-sm">
                    {manifest.totalWeightKg} <span className="text-xs font-normal text-slate-400">kg</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {manifest.wasteRecordIds?.length || 0} container(s)
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Scheduled Date</span>
                  <div className="text-slate-200 font-medium">
                    {new Date(manifest.scheduledDate).toLocaleDateString()}
                  </div>
                  {manifest.completedDate && (
                    <span className="text-emerald-400 text-[11px]">
                      Treated: {new Date(manifest.completedDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Manifest Notes & Linked Bags */}
              {(manifest.notes || (manifest.wasteRecordIds && manifest.wasteRecordIds.length > 0)) && (
                <div className="pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  {manifest.notes ? (
                    <div className="text-slate-400 italic">
                      Note: "{manifest.notes}"
                    </div>
                  ) : <div></div>}

                  {manifest.wasteRecordIds && manifest.wasteRecordIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-slate-400 text-[11px]">Linked Bags:</span>
                      {manifest.wasteRecordIds.map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
