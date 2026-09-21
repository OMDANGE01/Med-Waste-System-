import React, { useState } from 'react';
import { X, Truck, Calendar, Phone, CheckSquare, Square, Save, AlertCircle } from 'lucide-react';

export default function PickupScheduleModal({ isOpen, onClose, onSchedule, pendingWaste }) {
  const [formData, setFormData] = useState({
    treatmentFacility: 'Apex Bio-Clean & Incineration Services (CBWTF)',
    vehicleNumber: 'WB-04-E-9022',
    driverName: 'Robert Langdon',
    driverPhone: '+1 (555) 349-8821',
    selectedTagIds: pendingWaste.map((w) => w.tagId), // Default select all eligible
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleTag = (tagId) => {
    setFormData((prev) => {
      const exists = prev.selectedTagIds.includes(tagId);
      return {
        ...prev,
        selectedTagIds: exists
          ? prev.selectedTagIds.filter((id) => id !== tagId)
          : [...prev.selectedTagIds, tagId],
      };
    });
  };

  const selectAll = () => {
    setFormData((prev) => ({
      ...prev,
      selectedTagIds: pendingWaste.map((w) => w.tagId),
    }));
  };

  const deselectAll = () => {
    setFormData((prev) => ({ ...prev, selectedTagIds: [] }));
  };

  const selectedTotalWeight = pendingWaste
    .filter((w) => formData.selectedTagIds.includes(w.tagId))
    .reduce((acc, w) => acc + (Number(w.weightKg) || 0), 0);

  const validate = () => {
    const errs = {};
    if (!formData.vehicleNumber.trim()) errs.vehicleNumber = 'Vehicle registration number is required';
    if (!formData.driverName.trim()) errs.driverName = 'Driver name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSchedule({
        ...formData,
        wasteRecordIds: formData.selectedTagIds,
        totalWeightKg: parseFloat(selectedTotalWeight.toFixed(2)),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Schedule CBWTF Collection Manifest</h2>
              <p className="text-xs text-slate-400">Generate legal handover manifest for authorized treatment facility.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* CBWTF Facility Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Authorized Common Treatment Facility (CBWTF)
            </label>
            <select
              value={formData.treatmentFacility}
              onChange={(e) => setFormData({ ...formData, treatmentFacility: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
            >
              <option value="Apex Bio-Clean & Incineration Services (CBWTF)">Apex Bio-Clean & Incineration Services (CBWTF)</option>
              <option value="Metro Enviro Bio-Disposal Plant Ltd.">Metro Enviro Bio-Disposal Plant Ltd.</option>
              <option value="CleanHealth Regional Waste Sterilization Facility">CleanHealth Regional Waste Sterilization Facility</option>
            </select>
          </div>

          {/* Vehicle Plate & Driver */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Vehicle Registration # <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-rose-500"
                placeholder="e.g. WB-04-E-9022"
              />
              {errors.vehicleNumber && <p className="text-[11px] text-rose-400 mt-1">{errors.vehicleNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Driver Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
                placeholder="e.g. Robert Langdon"
              />
              {errors.driverName && <p className="text-[11px] text-rose-400 mt-1">{errors.driverName}</p>}
            </div>
          </div>

          {/* Phone & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Driver Emergency Phone
              </label>
              <input
                type="text"
                value={formData.driverPhone}
                onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
                placeholder="+1 (555) 349-8821"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Handling Instructions
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
                placeholder="e.g. Double-lock biohazard compartment"
              />
            </div>
          </div>

          {/* Pending Waste Bags Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Select Waste Bags for Consignment ({formData.selectedTagIds.length} of {pendingWaste.length} selected)
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button type="button" onClick={selectAll} className="text-rose-400 hover:text-rose-300">Select All</button>
                <span className="text-slate-600">•</span>
                <button type="button" onClick={deselectAll} className="text-slate-400 hover:text-slate-200">Clear</button>
              </div>
            </div>

            {pendingWaste.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center text-xs text-slate-400">
                No bags currently in 'Logged' or 'Awaiting Pickup' status. All on-site waste is already dispatched!
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                {pendingWaste.map((w) => {
                  const isChecked = formData.selectedTagIds.includes(w.tagId);
                  return (
                    <div
                      key={w.tagId}
                      onClick={() => toggleTag(w.tagId)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                        isChecked ? 'bg-slate-700 text-white' : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-rose-500" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                        <span className="font-mono font-semibold">{w.tagId}</span>
                        <span className="text-slate-400">• {w.category}</span>
                        <span className="text-slate-400">• {w.department}</span>
                      </div>
                      <span className="font-bold">{w.weightKg} kg</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Batch Weight Summary Bar */}
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Batch Consignment Weight:</span>
            <span className="text-lg font-bold text-rose-400 font-mono">
              {selectedTotalWeight.toFixed(2)} kg
            </span>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || formData.selectedTagIds.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-950 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Manifest'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
