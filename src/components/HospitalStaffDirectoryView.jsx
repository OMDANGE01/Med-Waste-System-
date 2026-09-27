import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Stethoscope, 
  UserCheck, 
  Phone, 
  Mail, 
  Building2, 
  Activity, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  X,
  Package,
  Truck,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import cloudSync from '../services/cloudSyncService';

export default function HospitalStaffDirectoryView({
  currentHospital,
  workers = [],
  currentUser,
  onRefreshWorkers,
  onAddToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Clinical Staff / Nurse',
    department: 'Operating Theater',
    phone: '',
    badgeNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter workers for current hospital (or show all if global admin)
  const hospitalWorkers = workers.filter((w) => {
    if (currentHospital && currentHospital.hospitalId !== 'ALL') {
      return w.hospitalId === currentHospital.hospitalId || w.hospitalId === 'ALL';
    }
    return true;
  });

  const filteredWorkers = hospitalWorkers.filter((w) => {
    const matchesSearch = 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || w.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      if (onAddToast) onAddToast('Please fill in name and email', 'error');
      return;
    }

    setIsSubmitting(true);
    const hospitalId = currentHospital?.hospitalId || 'HOSP-01';
    const hospitalName = currentHospital?.name || 'Government Hospital of Khamgaon';

    const payload = {
      ...formData,
      hospitalId,
      hospitalName,
      badgeNumber: formData.badgeNumber || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      dutyStatus: 'On Duty',
    };

    try {
      // 1. Queue into Edge SQL transaction ledger
      cloudSync.enqueueTransaction('workers', 'INSERT', payload);

      // 2. Direct API call if online
      if (!cloudSync.isOffline()) {
        await fetch(`/api/hospitals/${hospitalId}/workers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (onAddToast) {
        onAddToast(`Worker "${formData.name}" registered to hospital roster (Cloud Synced)`, 'success');
      }

      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        role: 'Clinical Staff / Nurse',
        department: 'Operating Theater',
        phone: '',
        badgeNumber: '',
      });

      if (onRefreshWorkers) onRefreshWorkers();
    } catch (err) {
      if (onAddToast) {
        onAddToast(`Buffered to local Edge SQL store: ${err.message}`, 'info');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDutyStatus = async (worker) => {
    const nextStatus = worker.dutyStatus === 'On Duty' ? 'Off Duty' : 'On Duty';

    // Queue update transaction
    cloudSync.enqueueTransaction('workers', 'UPDATE_STATUS', {
      workerId: worker.workerId,
      dutyStatus: nextStatus,
    });

    if (!cloudSync.isOffline()) {
      try {
        await fetch(`/api/hospitals/workers/${worker.workerId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dutyStatus: nextStatus }),
        });
      } catch {
        // queued offline
      }
    }

    if (onAddToast) {
      onAddToast(`Status updated: ${worker.name} is now ${nextStatus}`, 'info');
    }

    if (onRefreshWorkers) onRefreshWorkers();
  };

  return (
    <div className="space-y-6">
      {/* Hospital Roster Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-rose-500 uppercase">
              {currentHospital?.cpcbCode || 'FACILITY WORKFORCE REGISTRY'}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-medium">
              {currentHospital?.name || 'Government Hospital of Khamgaon'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Hospital Workforce & Biohazard Team
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered doctors, ward nurses, package registration specialists, internal porters, and assigned CBWTF transit drivers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Hospital Worker</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by worker name, employee badge ID, email, or department..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Roles ({hospitalWorkers.length})</option>
            <option value="Doctor / Lead Surgeon">Doctors & Surgeons</option>
            <option value="Clinical Staff / Nurse">Nurses & Ward Leads</option>
            <option value="Package Registration Worker">Package Registration</option>
            <option value="Internal Delivery Boy / Handler">Internal Delivery Porters</option>
            <option value="CBWTF Transport Custodian">Transit Drivers</option>
            <option value="Chief Medical Superintendent">Superintendents</option>
          </select>
        </div>
      </div>

      {/* Workers Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map((worker) => {
          const isDoc = worker.role?.includes('Doctor') || worker.role?.includes('Surgeon');
          const isNurse = worker.role?.includes('Nurse');
          const isReg = worker.role?.includes('Registration');
          const isDelivery = worker.role?.includes('Delivery') || worker.role?.includes('Handler');
          const isDriver = worker.role?.includes('Driver') || worker.role?.includes('Transport');

          return (
            <div 
              key={worker.workerId || worker._id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl shadow-inner">
                    {worker.avatar || '👤'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{worker.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{worker.role}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleDutyStatus(worker)}
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition ${
                    worker.dutyStatus === 'On Duty'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                      : worker.dutyStatus === 'In Transit'
                      ? 'bg-purple-950 text-purple-300 border-purple-800 hover:bg-purple-900'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Click to toggle duty status"
                >
                  {worker.dutyStatus}
                </button>
              </div>

              {/* Badges & Meta */}
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Department</span>
                  <span className="font-semibold text-white truncate max-w-[160px]">{worker.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Badge ID</span>
                  <span className="font-mono text-rose-400 font-bold">{worker.badgeNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Facility</span>
                  <span className="text-slate-300 truncate max-w-[160px]">{worker.hospitalName}</span>
                </div>
              </div>

              {/* Contact Links */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span className="truncate">{worker.email}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{worker.phone || '+91 98200 00000'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Worker Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold text-white">Register Hospital Staff Member</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name & Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Sharma or Nurse Anita Desai"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="worker@hospital.org"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Direct Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98200 12345"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Hospital Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                  >
                    <option value="Doctor / Lead Surgeon">Doctor / Lead Surgeon</option>
                    <option value="Clinical Staff / Nurse">Clinical Staff / Nurse</option>
                    <option value="Package Registration Worker">Package Registration Worker</option>
                    <option value="Internal Delivery Boy / Handler">Internal Delivery Boy / Handler</option>
                    <option value="CBWTF Transport Custodian">CBWTF Transit Driver</option>
                    <option value="Chief Medical Superintendent">Superintendent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                  >
                    <option value="Operating Theater">Operating Theater</option>
                    <option value="ICU">ICU Isolation</option>
                    <option value="Emergency">Emergency / Trauma</option>
                    <option value="Pathology Lab">Pathology Lab</option>
                    <option value="Oncology">Oncology & Chemo</option>
                    <option value="General Ward">General Ward</option>
                    <option value="Central Holding Bay">Central Bio-Vault</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Employee Badge / Staff ID
                </label>
                <input
                  type="text"
                  value={formData.badgeNumber}
                  onChange={(e) => setFormData({ ...formData, badgeNumber: e.target.value })}
                  placeholder="e.g. SJM-DOC-09 (optional, auto-generated if blank)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
                All newly registered personnel are automatically uploaded to the cloud and stored in the edge SQL ledger for offline resilience.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Save & Cloud Sync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
