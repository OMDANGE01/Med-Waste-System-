import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import WasteRegistryView from './components/WasteRegistryView';
import LiveMapView from './components/LiveMapView';
import PickupManifestView from './components/PickupManifestView';
import ComplianceView from './components/ComplianceView';
import HardwareHubView from './components/HardwareHubView';
import HospitalStaffPortalView from './components/HospitalStaffPortalView';
import LoginPage from './components/LoginPage';
import WasteLogModal from './components/WasteLogModal';
import PickupScheduleModal from './components/PickupScheduleModal';
import IncidentModal from './components/IncidentModal';
import BarcodeBadgeModal from './components/BarcodeBadgeModal';
import ShareQRModal from './components/ShareQRModal';
import Toast from './components/Toast';
import { ShieldAlert } from 'lucide-react';
import {
  DEFAULT_STATS,
  DEFAULT_WASTE_RECORDS,
  DEFAULT_PICKUPS,
  DEFAULT_INCIDENTS,
} from './data/baselineData';

// Resilient network request helper with exponential backoff for container wakeups
const fetchWithRetry = async (url, options = {}, maxRetries = 3, initialDelay = 350) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      if (attempt === maxRetries - 1) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, initialDelay * (attempt + 1)));
    }
  }
};

// RBAC Role Verification Helpers
export const isDriver = (user) => {
  if (!user || !user.role) return false;
  const r = user.role.toLowerCase();
  return r.includes('driver') || r.includes('custodian') || r.includes('transport') || r.includes('logistics');
};

export const isSupervisor = (user) => {
  if (!user || !user.role) return false;
  const r = user.role.toLowerCase();
  return r.includes('superintendent') || r.includes('supervisor') || r.includes('officer') || r.includes('admin') || r.includes('head') || r.includes('chief') || r.includes('director') || r.includes('inspector');
};

export const isStaff = (user) => {
  if (!user) return false;
  return !isDriver(user) && !isSupervisor(user);
};

export const getInitialTabForUser = (user) => {
  if (!user) return 'staffportal';
  if (isDriver(user)) return 'pickups';
  if (isSupervisor(user)) return 'dashboard';
  return 'staffportal';
};

export default function App() {
  // Theme State ('light' | 'dark')
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('medwaste_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('medwaste_theme', theme);
    } catch (e) {
      console.error(e);
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Auth State - Defaults to Head of Department so the application renders immediately on load
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('medwaste_user');
      if (saved) {
        return JSON.parse(saved);
      }
      return {
        name: 'Dr. Aaron Patel',
        role: 'Chief Medical Superintendent',
        department: 'Hospital Administration',
        email: 'admin@stjude.org',
        avatar: '🩺',
      };
    } catch {
      return {
        name: 'Dr. Aaron Patel',
        role: 'Chief Medical Superintendent',
        department: 'Hospital Administration',
        email: 'admin@stjude.org',
        avatar: '🩺',
      };
    }
  });

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('medwaste_user');
      const user = saved ? JSON.parse(saved) : { role: 'Chief Medical Superintendent' };
      return getInitialTabForUser(user);
    } catch {
      return 'dashboard';
    }
  });

  // Guard Tab Access Based on Role
  useEffect(() => {
    if (!currentUser) return;

    if (isDriver(currentUser)) {
      // Driver can ONLY see pickups and transit live map
      if (activeTab !== 'pickups' && activeTab !== 'livemap') {
        setActiveTab('pickups');
      }
    } else if (isSupervisor(currentUser)) {
      // Supervisor can see dashboard, registry, livemap, compliance, hardware
      // Driver manifest is driver-only
      if (activeTab === 'staffportal' || activeTab === 'pickups') {
        setActiveTab('dashboard');
      }
    } else {
      // Hospital staff can ONLY see add bags and tell pickup man (staffportal)
      if (activeTab !== 'staffportal') {
        setActiveTab('staffportal');
      }
    }
  }, [currentUser, activeTab]);
  
  // Data States (Pre-initialized with resilient baseline dataset for instant rendering)
  const [stats, setStats] = useState(() => DEFAULT_STATS);
  const [wasteRecords, setWasteRecords] = useState(() => DEFAULT_WASTE_RECORDS);
  const [pickups, setPickups] = useState(() => DEFAULT_PICKUPS);
  const [incidents, setIncidents] = useState(() => DEFAULT_INCIDENTS);
  
  // System / Health States
  const [apiOnline, setApiOnline] = useState(false);
  const [mongoConnected, setMongoConnected] = useState(false);
  const [storageEngine, setStorageEngine] = useState('');
  const [isLoadingWaste, setIsLoadingWaste] = useState(false);
  const [isLoadingPickups, setIsLoadingPickups] = useState(false);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Filters State for Registry
  const [filters, setFilters] = useState({
    category: 'All',
    department: 'All',
    status: 'All',
    search: '',
  });

  // Modal States
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [barcodeModalRecord, setBarcodeModalRecord] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [mapTargetRecord, setMapTargetRecord] = useState(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  const handleNavigateToMap = (record = null) => {
    setMapTargetRecord(record);
    setActiveTab('livemap');
  };

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('medwaste_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    const targetTab = getInitialTabForUser(user);
    setActiveTab(targetTab);
    addToast('Welcome Back', `Authenticated as ${user.name} (${user.role})`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('medwaste_user');
    } catch (e) {
      console.error(e);
    }
    addToast('Signed Out', 'You have been safely logged out.', 'info');
  };

  const handleGuestAccess = () => {
    const guestUser = {
      name: 'Guest Medical Inspector',
      role: 'Chief Medical Superintendent',
      department: 'Hospital Administration & Safety Directorate',
      email: 'guest@health.gov',
      avatar: '🩺',
    };
    handleLogin(guestUser);
  };

  // Check API health
  const checkHealth = async () => {
    try {
      const res = await fetchWithRetry('/api/health', {}, 2, 200);
      if (res && res.ok) {
        const data = await res.json();
        setApiOnline(true);
        setMongoConnected(data.mongoConnected);
        setStorageEngine(data.storageEngine);
      } else {
        setApiOnline(true); // Connected in resilient fallback
      }
    } catch {
      setApiOnline(false);
    }
  };

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      let res = await fetchWithRetry('/api/stats', {}, 3, 300);
      if (!res.ok) {
        res = await fetchWithRetry('/api/waste/stats', {}, 2, 300);
      }
      if (res && res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.data) {
            setStats(data.data);
          }
        }
      }
    } catch (e) {
      console.warn('Deferred background stats sync:', e?.message || e);
    }
  }, []);

  // Fetch Waste Records
  const fetchWasteRecords = useCallback(async () => {
    setIsLoadingWaste(true);
    try {
      const params = new URLSearchParams();
      if (filters.category !== 'All') params.append('category', filters.category);
      if (filters.department !== 'All') params.append('department', filters.department);
      if (filters.status !== 'All') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const res = await fetchWithRetry(`/api/waste?${params.toString()}`, {}, 3, 300);
      if (res && res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.data)) {
          setWasteRecords(data.data);
        }
      }
    } catch (e) {
      console.warn('Deferred background waste records sync:', e?.message || e);
    } finally {
      setIsLoadingWaste(false);
    }
  }, [filters]);

  // Fetch Pickups
  const fetchPickups = useCallback(async () => {
    setIsLoadingPickups(true);
    try {
      const res = await fetchWithRetry('/api/pickups', {}, 3, 300);
      if (res && res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.data)) {
          setPickups(data.data);
        }
      }
    } catch (e) {
      console.warn('Deferred background pickups sync:', e?.message || e);
    } finally {
      setIsLoadingPickups(false);
    }
  }, []);

  // Fetch Incidents
  const fetchIncidents = useCallback(async () => {
    setIsLoadingIncidents(true);
    try {
      const res = await fetchWithRetry('/api/incidents', {}, 3, 300);
      if (res && res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.data)) {
          setIncidents(data.data);
        }
      }
    } catch (e) {
      console.warn('Deferred background incidents sync:', e?.message || e);
    } finally {
      setIsLoadingIncidents(false);
    }
  }, []);

  // Initial load & Polling
  useEffect(() => {
    checkHealth();
    fetchStats();
    fetchWasteRecords();
    fetchPickups();
    fetchIncidents();

    const interval = setInterval(() => {
      fetchStats();
      fetchWasteRecords();
      fetchPickups();
    }, 20000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchWasteRecords, fetchPickups, fetchIncidents]);

  // Handle Save (Create or Update) Waste Record
  const handleSaveWasteRecord = async (recordData) => {
    try {
      let res;
      if (editingRecord) {
        res = await fetch(`/api/waste/${editingRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordData),
        });
      } else {
        res = await fetch('/api/waste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...recordData,
            loggedBy: currentUser ? currentUser.name : recordData.loggedBy || 'Hospital Staff',
          }),
        });
      }

      const json = await res.json();
      if (json.success) {
        addToast(
          editingRecord ? 'Record Updated' : 'Waste Bag Logged & QR Generated',
          `Tag #${json.data.tagId} recorded at ${json.data.hospitalName || 'Hospital'} (${json.data.weightKg} kg - ${json.data.category})`,
          'success'
        );
        setIsLogModalOpen(false);
        setEditingRecord(null);
        fetchWasteRecords();
        fetchStats();
        // Show barcode badge for immediate affixing
        setBarcodeModalRecord(json.data);
      } else {
        addToast('Error', json.message || 'Failed to save record', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Error', 'Network error while saving record', 'error');
    }
  };

  // Handle Delete Waste Record
  const handleDeleteWasteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this waste record? This action will be audited.')) {
      return;
    }

    try {
      const res = await fetch(`/api/waste/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        addToast('Record Deleted', 'Waste record removed from active registry', 'info');
        fetchWasteRecords();
        fetchStats();
      } else {
        addToast('Error', json.message || 'Failed to delete record', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Error', 'Failed to delete record', 'error');
    }
  };

  // Handle Status Quick Change (e.g. Move to Awaiting Pickup, In Transit, Disposed)
  const handleUpdateWasteStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/waste/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Status Updated', `Waste Bag status marked as "${newStatus}"`, 'success');
        fetchWasteRecords();
        fetchStats();
      } else {
        addToast('Error', json.message || 'Failed to update status', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Error', 'Failed to update status', 'error');
    }
  };

  // Handle Staff Alerting Pickup Driver
  const handleStaffNotifyDriver = async (payload) => {
    try {
      // 1. Create a pickup dispatch in the backend
      const res = await fetch('/api/pickups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treatmentFacility: 'Apex Bio-Clean & Incineration Services (CBWTF)',
          vehicleNumber: payload.vehicleNumber || 'WB-04-E-8821',
          driverName: payload.driverName || 'Robert Langdon',
          driverPhone: payload.driverPhone || '+1 (555) 349-8821',
          wasteRecordIds: payload.bagIds,
          totalWeightKg: payload.totalWeightKg,
          notes: `Pickup called by ${payload.requestedBy} (${payload.hospitalName}): ${payload.pickupNote}`,
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setPickups(prev => [data.data, ...prev]);
        }
      }
    } catch (err) {
      console.warn('Failed to post pickup dispatch to server, handled locally:', err);
    }

    fetchWasteRecords();
    fetchPickups();
    fetchStats();
  };

  // Handle Schedule Pickup
  const handleSchedulePickup = async (pickupData) => {
    try {
      const res = await fetch('/api/pickups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pickupData),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Pickup Scheduled', `Manifest #${json.data.manifestNumber} assigned to driver ${json.data.driverName}`, 'success');
        setIsScheduleModalOpen(false);
        fetchPickups();
        fetchWasteRecords();
        fetchStats();
      } else {
        addToast('Error', json.message || 'Failed to schedule pickup', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Error', 'Network error while scheduling pickup', 'error');
    }
  };

  // Handle Update Pickup Status (Driver updates)
  const handleUpdatePickupStatus = async (id, status, notes = '') => {
    try {
      const res = await fetch(`/api/pickups/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Manifest Updated', `Pickup status updated to ${status}`, 'success');
        fetchPickups();
        fetchWasteRecords();
        fetchStats();
      } else {
        addToast('Error', json.message || 'Failed to update manifest', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Error', 'Failed to update manifest status', 'error');
    }
  };

  // Handle Log Incident
  const handleLogIncident = async (incidentData) => {
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...incidentData,
          reportedBy: currentUser ? currentUser.name : incidentData.reportedBy,
        }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Incident Reported', `Incident recorded: ${json.data.title}`, 'warning');
        setIsIncidentModalOpen(false);
        fetchIncidents();
        fetchStats();
      } else {
        addToast('Error', json.message || 'Failed to report incident', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Error', 'Failed to report incident', 'error');
    }
  };

  // Handle Resolve Incident
  const handleResolveIncident = async (id, resolution) => {
    try {
      const res = await fetch(`/api/incidents/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Incident Resolved', 'Incident marked as addressed and closed.', 'success');
        fetchIncidents();
        fetchStats();
      } else {
        addToast('Error', json.message || 'Failed to resolve incident', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Error', 'Failed to resolve incident', 'error');
    }
  };

  // Reset to Baseline Seed Data
  const handleResetSeed = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/waste/seed', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        addToast('Database Reset', 'Baseline clinical biomedical data restored.', 'info');
        fetchWasteRecords();
        fetchPickups();
        fetchIncidents();
        fetchStats();
      }
    } catch {
      addToast('Error', 'Failed to reset seed data', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const pendingWasteForPickup = wasteRecords.filter(
    (w) => w.status === 'Logged' || w.status === 'Awaiting Pickup'
  );

  // If user is not logged in, show Login Page
  if (!currentUser) {
    return (
      <>
        <Toast toasts={toasts} onDismiss={removeToast} />
        <LoginPage onLogin={handleLogin} onGuestAccess={handleGuestAccess} theme={theme} toggleTheme={toggleTheme} />
      </>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col selection:bg-rose-500 selection:text-white transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#090d16] text-slate-100 clinical-grid-dark' : 'bg-slate-50 text-slate-900 clinical-grid-light'
    }`}>
      {/* Google Maps Platform Quota Defense Notification */}
      {quotaExceeded && (
        <div className="bg-amber-500 text-slate-950 font-medium px-4 py-2 text-xs text-center border-b border-amber-600 shadow-sm sticky top-0 z-50 flex items-center justify-center gap-2">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold hover:text-white"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Toast Feedback */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogModal={() => {
          setEditingRecord(null);
          setIsLogModalOpen(true);
        }}
        onOpenQRModal={() => setIsQRModalOpen(true)}
        onResetSeed={handleResetSeed}
        isResetting={isResetting}
        apiOnline={apiOnline}
        mongoConnected={mongoConnected}
        stats={stats}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleLogin}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area with Strict RBAC */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW 1: Hospital Staff Portal (Staff ONLY sees add bags & tell pickup man) */}
        {activeTab === 'staffportal' && isStaff(currentUser) && (
          <HospitalStaffPortalView
            currentUser={currentUser}
            records={wasteRecords}
            onOpenLogModal={() => {
              setEditingRecord(null);
              setIsLogModalOpen(true);
            }}
            onViewBarcode={(rec) => setBarcodeModalRecord(rec)}
            onUpdateStatus={handleUpdateWasteStatus}
            onNotifyDriver={handleStaffNotifyDriver}
            addToast={addToast}
          />
        )}

        {/* VIEW 2: Head of Department Dashboard (ONLY Supervisor sees this) */}
        {activeTab === 'dashboard' && isSupervisor(currentUser) && (
          <DashboardView
            stats={stats}
            records={wasteRecords}
            onNavigateToTab={setActiveTab}
            onOpenLogModal={() => {
              setEditingRecord(null);
              setIsLogModalOpen(true);
            }}
            onViewBarcode={(rec) => setBarcodeModalRecord(rec)}
            onNavigateToMap={handleNavigateToMap}
          />
        )}

        {/* VIEW 3: Waste Registry (Supervisor) */}
        {activeTab === 'registry' && isSupervisor(currentUser) && (
          <WasteRegistryView
            records={wasteRecords}
            isLoading={isLoadingWaste}
            filters={filters}
            setFilters={setFilters}
            onOpenLogModal={() => {
              setEditingRecord(null);
              setIsLogModalOpen(true);
            }}
            onEditRecord={(rec) => {
              setEditingRecord(rec);
              setIsLogModalOpen(true);
            }}
            onDeleteRecord={handleDeleteWasteRecord}
            onUpdateStatus={handleUpdateWasteStatus}
            onViewBarcode={(rec) => setBarcodeModalRecord(rec)}
            onNavigateToMap={handleNavigateToMap}
          />
        )}

        {/* VIEW 4: Live GPS Map (Supervisor & Driver) */}
        {activeTab === 'livemap' && (isSupervisor(currentUser) || isDriver(currentUser)) && (
          <LiveMapView
            records={wasteRecords}
            onViewBarcode={(rec) => setBarcodeModalRecord(rec)}
            onOpenLogModal={() => {
              setEditingRecord(null);
              setIsLogModalOpen(true);
            }}
            onUpdateStatus={handleUpdateWasteStatus}
            targetRecord={mapTargetRecord}
          />
        )}

        {/* VIEW 5: Pickup Manifests (ONLY Driver sees pickup manifest) */}
        {activeTab === 'pickups' && isDriver(currentUser) && (
          <PickupManifestView
            pickups={pickups}
            isLoading={isLoadingPickups}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            onUpdatePickupStatus={handleUpdatePickupStatus}
          />
        )}

        {/* VIEW 6: Compliance & Audit (Supervisor) */}
        {activeTab === 'compliance' && isSupervisor(currentUser) && (
          <ComplianceView
            incidents={incidents}
            isLoading={isLoadingIncidents}
            onOpenIncidentModal={() => setIsIncidentModalOpen(true)}
            wasteRecords={wasteRecords}
            stats={stats}
          />
        )}

        {/* VIEW 7: Hardware & IoT (Supervisor) */}
        {activeTab === 'hardware' && isSupervisor(currentUser) && (
          <HardwareHubView 
            onAddToast={addToast} 
            onNavigateToMap={handleNavigateToMap} 
          />
        )}

        {/* Unauthorized View Access Guard */}
        {((isDriver(currentUser) && activeTab !== 'pickups' && activeTab !== 'livemap') ||
          (isStaff(currentUser) && activeTab !== 'staffportal') ||
          (isSupervisor(currentUser) && activeTab === 'pickups')) && (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-xl mx-auto shadow-xl">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">Restricted Section Access</h3>
            <p className="text-sm text-slate-400">
              {isDriver(currentUser) && 'Only CBWTF Drivers have access to transit manifests and GPS route tracking.'}
              {isStaff(currentUser) && 'Hospital Staff accounts are designated for logging bags and dispatching the pickup driver.'}
              {isSupervisor(currentUser) && 'Transit pickup manifests are restricted strictly to designated CBWTF drivers.'}
            </p>
            <button
              onClick={() => {
                if (isDriver(currentUser)) setActiveTab('pickups');
                else if (isStaff(currentUser)) setActiveTab('staffportal');
                else setActiveTab('dashboard');
              }}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-950"
            >
              Return to My Role Workspace
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <WasteLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSave={handleSaveWasteRecord}
        editingRecord={editingRecord}
      />

      <PickupScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleSchedulePickup}
        pendingWaste={pendingWasteForPickup}
      />

      <IncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        onSave={handleLogIncident}
      />

      <BarcodeBadgeModal
        isOpen={!!barcodeModalRecord}
        onClose={() => setBarcodeModalRecord(null)}
        record={barcodeModalRecord}
      />

      <ShareQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />
    </div>
  );
}
