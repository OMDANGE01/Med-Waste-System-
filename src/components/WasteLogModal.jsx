import React, { useState, useEffect } from 'react';
import { 
  X, 
  Flame, 
  Recycle, 
  Wine, 
  QrCode, 
  AlertCircle, 
  Save, 
  Building2, 
  MapPin, 
  Navigation,
  ShieldAlert,
  Camera,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import QRScannerModal from './QRScannerModal';

const HOSPITAL_PRESETS = [
  { name: 'St. Jude Memorial Hospital', lat: 19.9975, lng: 73.7898 },
  { name: 'Metro City General Hospital', lat: 20.0125, lng: 73.7650 },
  { name: 'Apex Healthcare Research Center', lat: 19.9850, lng: 73.8120 },
  { name: 'Apollo Super Specialty Hospital', lat: 20.0210, lng: 73.7780 },
  { name: 'Fortis Care Medical Center', lat: 19.9760, lng: 73.8240 },
  { name: 'Dwarka Multi-Specialty Hospital', lat: 20.0063, lng: 73.7902 },
];

export default function WasteLogModal({ isOpen, onClose, onSave, editingRecord }) {
  const [formData, setFormData] = useState({
    tagId: '',
    category: 'Yellow',
    department: 'Operating Theater',
    weightKg: '',
    handlerName: '',
    hospitalName: 'St. Jude Memorial Hospital',
    location: '',
    lat: 19.9975,
    lng: 73.7898,
    hazardLevel: 'Bio-Infectious Anatomical',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [customHospital, setCustomHospital] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (editingRecord) {
      const isKnownPreset = HOSPITAL_PRESETS.some(h => h.name === editingRecord.hospitalName);
      setCustomHospital(!isKnownPreset && !!editingRecord.hospitalName);
      setFormData({
        tagId: editingRecord.tagId || '',
        category: editingRecord.category || 'Yellow',
        department: editingRecord.department || 'Operating Theater',
        weightKg: editingRecord.weightKg?.toString() || '',
        handlerName: editingRecord.handlerName || '',
        hospitalName: editingRecord.hospitalName || 'St. Jude Memorial Hospital',
        location: editingRecord.location || '',
        lat: editingRecord.lat || 19.9975,
        lng: editingRecord.lng || 73.7898,
        hazardLevel: editingRecord.hazardLevel || 'Bio-Infectious Anatomical',
        notes: editingRecord.notes || '',
      });
    } else {
      generateTagId();
      setCustomHospital(false);
      setFormData((prev) => ({
        ...prev,
        category: 'Yellow',
        department: 'Operating Theater',
        weightKg: '',
        handlerName: 'Nurse Sarah Jenkins',
        hospitalName: 'St. Jude Memorial Hospital',
        location: 'OT-2 Scrub & Prep',
        lat: 19.9975,
        lng: 73.7898,
        hazardLevel: 'Bio-Infectious Anatomical',
        notes: '',
      }));
    }
    setErrors({});
  }, [editingRecord, isOpen]);

  const generateTagId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const tag = `MW-${new Date().getFullYear()}-${randomNum}`;
    setFormData((prev) => ({ ...prev, tagId: tag }));
  };

  const handleHospitalChange = (e) => {
    const selected = e.target.value;
    if (selected === 'CUSTOM') {
      setCustomHospital(true);
      setFormData((prev) => ({ ...prev, hospitalName: '' }));
    } else {
      setCustomHospital(false);
      const preset = HOSPITAL_PRESETS.find(h => h.name === selected);
      setFormData((prev) => ({
        ...prev,
        hospitalName: selected,
        lat: preset ? preset.lat : prev.lat,
        lng: preset ? preset.lng : prev.lng,
      }));
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingLocation(false);
        setFormData((prev) => ({
          ...prev,
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        }));
      },
      (err) => {
        setIsDetectingLocation(false);
        console.warn('Geolocation failed or denied, keeping default coords:', err.message);
      },
      { timeout: 8000 }
    );
  };

  const handleScanSuccess = (tagId, sampleItem) => {
    setFormData((prev) => ({
      ...prev,
      tagId: tagId || prev.tagId,
      category: sampleItem?.category || prev.category,
      department: sampleItem?.dept || prev.department,
      weightKg: sampleItem?.weight || prev.weightKg,
    }));
    setIsScannerOpen(false);
  };

  if (!isOpen) return null;

  const categories = [
    { 
      id: 'Yellow', 
      name: 'Yellow', 
      label: 'Anatomical & Pathological', 
      desc: 'Human tissue, organs, soiled dressings, cytotoxic meds',
      icon: Flame, 
      color: 'text-amber-400', 
      border: 'border-amber-500/50', 
      bg: 'bg-amber-500/10' 
    },
    { 
      id: 'Red', 
      name: 'Red', 
      label: 'Contaminated & Sharps', 
      desc: 'IV tubing, catheters, syringes, scalpels, needles',
      icon: Recycle, 
      color: 'text-rose-400', 
      border: 'border-rose-500/50', 
      bg: 'bg-rose-500/10' 
    },
    { 
      id: 'Blue', 
      name: 'Blue', 
      label: 'Glassware & Metallic', 
      desc: 'Broken medicine ampoules, vials, orthopedic implants',
      icon: Wine, 
      color: 'text-sky-400', 
      border: 'border-sky-500/50', 
      bg: 'bg-sky-500/10' 
    },
    { 
      id: 'Black', 
      name: 'Black', 
      label: 'General & Cytotoxic', 
      desc: 'General non-infectious hospital waste, spill residue',
      icon: ShieldAlert, 
      color: 'text-slate-300', 
      border: 'border-slate-500/50', 
      bg: 'bg-slate-700/30' 
    },
  ];

  const departments = ['Operating Theater', 'ICU', 'Emergency', 'Pathology Lab', 'General Ward', 'Oncology', 'Pediatrics'];

  const validate = () => {
    const errs = {};
    if (!formData.tagId.trim()) errs.tagId = 'Tag ID is required';
    if (!formData.hospitalName.trim()) errs.hospitalName = 'Hospital Name is required';
    if (!formData.weightKg || isNaN(Number(formData.weightKg)) || Number(formData.weightKg) <= 0) {
      errs.weightKg = 'Valid weight in kg is required (e.g. 3.5)';
    }
    if (!formData.handlerName.trim()) errs.handlerName = 'Handler / Staff name is required';
    if (!formData.location.trim()) errs.location = 'Room / Ward location is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        weightKg: parseFloat(formData.weightKg),
        lat: Number(formData.lat) || 19.9975,
        lng: Number(formData.lng) || 73.7898,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-850">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {editingRecord ? 'Edit Waste Record' : 'Log New Biomedical Waste Bag'}
              </h2>
              <p className="text-xs text-slate-400">
                Record bag barcode tag, CPCB color stream, tare weight, and hospital custody.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Quick Barcode Scanner Trigger Button */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-850 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Optical Scanner Quick-Fill</div>
                  <div className="text-[11px] text-slate-400">Scan physical bag label via camera / simulated barcode</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan Barcode</span>
              </button>
            </div>

            {/* Tag ID & Barcode generation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Bag Barcode / Tag ID <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateTagId}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Generate New ID
                </button>
              </div>
              <div className="relative">
                <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.tagId}
                  onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
                  placeholder="e.g. MW-2026-1008"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 font-mono text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              {errors.tagId && <p className="text-xs text-rose-500 mt-1">{errors.tagId}</p>}
            </div>

            {/* Category Selector Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select CPCB Color Category <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = formData.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                        isSelected
                          ? `${cat.border} ${cat.bg} ring-2 ring-rose-500/40 shadow-md`
                          : 'border-slate-800 bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-5 h-5 ${cat.color}`} />
                        <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-rose-500' : 'bg-slate-700'}`}></span>
                      </div>
                      <div className="mt-2">
                        <div className={`font-bold text-xs ${cat.color}`}>{cat.name} ({cat.label})</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {cat.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hospital / Healthcare Facility per bag */}
            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Hospital / Healthcare Facility <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Bag Origin</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Select Facility</label>
                  <select
                    value={customHospital ? 'CUSTOM' : formData.hospitalName}
                    onChange={handleHospitalChange}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    {HOSPITAL_PRESETS.map((h) => (
                      <option key={h.name} value={h.name}>{h.name}</option>
                    ))}
                    <option value="CUSTOM">➕ Other / Custom Hospital...</option>
                  </select>
                </div>

                {customHospital ? (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Custom Hospital Name</label>
                    <input
                      type="text"
                      value={formData.hospitalName}
                      onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="Enter hospital name"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">GPS Coordinates</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 font-mono">
                        {Number(formData.lat).toFixed(4)}, {Number(formData.lng).toFixed(4)}
                      </div>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isDetectingLocation}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                        title="Acquire device geolocation"
                      >
                        <Navigation className={`w-4 h-4 ${isDetectingLocation ? 'animate-spin text-rose-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Department & Specific Ward Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Originating Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Room / Ward Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. OT-2 Scrub & Prep, Bed 12"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
                />
                {errors.location && <p className="text-xs text-rose-500 mt-1">{errors.location}</p>}
              </div>
            </div>

            {/* Weight (kg) & Handler Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Weight (kg) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    placeholder="e.g. 4.65"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                    kg
                  </span>
                </div>
                {errors.weightKg && <p className="text-xs text-rose-500 mt-1">{errors.weightKg}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Handler / Nurse Custodian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.handlerName}
                  onChange={(e) => setFormData({ ...formData, handlerName: e.target.value })}
                  placeholder="e.g. Nurse Sarah Jenkins"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
                />
                {errors.handlerName && <p className="text-xs text-rose-500 mt-1">{errors.handlerName}</p>}
              </div>
            </div>

            {/* Clinical Notes / Handling Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Clinical Notes / Handling Instructions
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional special instructions or batch comments..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950 transition"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : editingRecord ? 'Update Record' : 'Log Waste Bag'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Optical Scanner Modal */}
      {isScannerOpen && (
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </>
  );
}
