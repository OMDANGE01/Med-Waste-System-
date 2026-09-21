import React, { useState } from 'react';
import { X, AlertTriangle, Save, ShieldAlert } from 'lucide-react';

export default function IncidentModal({ isOpen, onClose, onReport }) {
  const [formData, setFormData] = useState({
    type: 'Needle-Stick / Sharp Injury',
    department: 'Emergency',
    severity: 'Moderate',
    reportedBy: 'Staff Nurse Elena Rostova',
    description: '',
    correctiveAction: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const incidentTypes = [
    'Needle-Stick / Sharp Injury',
    'Bag Puncture / Leak',
    'Chemical / Liquid Spill',
    'Improper Segregation',
    'Transport Delay',
  ];

  const departments = ['Emergency', 'Operating Theater', 'ICU', 'Pathology Lab', 'General Ward', 'Oncology', 'Pediatrics'];

  const validate = () => {
    const errs = {};
    if (!formData.reportedBy.trim()) errs.reportedBy = 'Reporter name is required';
    if (!formData.description.trim()) errs.description = 'Incident description is required';
    if (!formData.correctiveAction.trim()) errs.correctiveAction = 'Corrective action is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onReport(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Report Safety & Biohazard Incident</h2>
              <p className="text-xs text-slate-400">Statutory record for hospital occupational safety audits.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Incident Classification <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
            >
              {incidentTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Severity Level
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Low">Low (Internal review)</option>
                <option value="Moderate">Moderate (Corrective action)</option>
                <option value="High">High (Immediate intervention)</option>
                <option value="Critical">Critical (Statutory reporting)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reported By (Officer / Nurse Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.reportedBy}
              onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
              placeholder="e.g. Staff Nurse Elena Rostova"
            />
            {errors.reportedBy && <p className="text-[11px] text-rose-400 mt-1">{errors.reportedBy}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Incident Description & Location Details <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              placeholder="Detail what happened, exact room or disposal receptacle, and individuals involved."
            ></textarea>
            {errors.description && <p className="text-[11px] text-rose-400 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Corrective Action Taken <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={formData.correctiveAction}
              onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              placeholder="Describe decontamination, PEP prophylaxis, sterilization or staff retraining applied."
            ></textarea>
            {errors.correctiveAction && <p className="text-[11px] text-rose-400 mt-1">{errors.correctiveAction}</p>}
          </div>

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
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-950 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Logging...' : 'File Audit Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
