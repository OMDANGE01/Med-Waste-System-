import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import WasteRegistryView from './components/WasteRegistryView';
import LiveMapView from './components/LiveMapView';
import PickupManifestView from './components/PickupManifestView';
import ComplianceView from './components/ComplianceView';
import HardwareHubView from './components/HardwareHubView';
import LoginPage from './components/LoginPage';
import WasteLogModal from './components/WasteLogModal';
import PickupScheduleModal from './components/PickupScheduleModal';
import IncidentModal from './components/IncidentModal';
import BarcodeBadgeModal from './components/BarcodeBadgeModal';
import ShareQRModal from './components/ShareQRModal';
import Toast from './components/Toast';

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

  // Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('medwaste_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [stats, setStats] = useState(null);
  const [wasteRecords, setWasteRecords] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [incidents, setIncidents] = useState([]);
  
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
    addToast('Welcome Back', `Authenticated as ${user.name}`, 'success');
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
      role: 'Visiting Inspector',
      department: 'Compliance Audit Directorate',
      email: 'guest@health.gov',
      avatar: '🩺',
    };
    handleLogin(guestUser);
  };

  // Check API health
  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setApiOnline(true);
        setMongoConnected(data.mongoConnected);
        setStorageEngine(data.storageEngine);
      } else {
        setApiOnline(false);
      }
    } catch {
      setApiOnline(false);
    }
  };

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/waste/stats');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setStats(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats', err);
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

      const res = await fetch(`/api/waste?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setWasteRecords(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch waste records', err);
      addToast('Network Error', 'Failed to retrieve waste logs', 'error');
    } finally {
      setIsLoadingWaste(false);
    }
  }, [filters]);

  // Fetch Pickups
  const fetchPickups = useCallback(async () => {
    setIsLoadingPickups(true);
    try {
      const res = await fetch('/api/pickups');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setPickups(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch pickups', err);
    } finally {
      setIsLoadingPickups(false);
    }
  }, []);

  // Fetch Incidents
  const fetchIncidents = useCallback(async () => {
    setIsLoadingIncidents(true);
    try {
      const res = await fetch('/api/incidents');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setIncidents(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch incidents', err);
    } finally {
      setIsLoadingIncidents(false);
    }
  }, []);

  // Initial Load & Polling
  useEffect(() => {
    checkHealth();
    fetchStats();
    fetchWasteRecords();
    fetchPickups();
    fetchIncidents();

    const interval = setInterval(() => {
      checkHealth();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchPickups, fetchIncidents]);

  // Refetch waste on filters change
  useEffect(() => {
    fetchWasteRecords();
  }, [fetchWasteRecords]);

  // Handlers for Waste Actions
  const handleSaveWasteRecord = async (recordData) => {
    try {
      let res;
      if (editingRecord) {
        res = await fetch(`/api/waste/${editingRecord._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordData),
        });
      } else {
        res = await fetch('/api/waste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordData),
        });
      }

      const json = await res.json();
      if (json.success) {
        addToast(
          editingRecord ? 'Record Updated' : 'Waste Logged',
          `Tag ${recordData.tagId} (${recordData.category} - ${recordData.weightKg} kg) saved successfully.`,
          'success'
        );
        fetchWasteRecords();
        fetchStats();
      } else {
        addToast('Validation Error', json.message || 'Failed to save waste record', 'error');
      }
    } catch {
      addToast('Error', 'An unexpected error occurred while saving', 'error');
    }
  };

  const handleUpdateWasteStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/waste/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Status Updated', `Container status changed to "${status}"`, 'success');
        fetchWasteRecords();
        fetchStats();
      } else {
        addToast('Update Failed', json.message, 'error');
      }
    } catch {
      addToast('Error', 'Failed to update container status', 'error');
    }
  };

  const handleDeleteWasteRecord = async (id) => {
    try {
      const res = await fetch(`/api/waste/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        addToast('Record Deleted', 'Waste container deleted from system', 'warning');
        fetchWasteRecords();
        fetchStats();
      } else {
        addToast('Error', json.message, 'error');
      }
    } catch {
      addToast('Error', 'Failed to delete record', 'error');
    }
  };

  // Pickup Handlers
  const handleSchedulePickup = async (pickupData) => {
    try {
      const res = await fetch('/api/pickups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pickupData),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Dispatch Scheduled', `Manifest ${json.data.manifestNumber} generated for vehicle ${pickupData.vehicleNumber}`, 'success');
        fetchPickups();
        fetchWasteRecords();
        fetchStats();
      } else {
        addToast('Error', json.message, 'error');
      }
    } catch {
      addToast('Error', 'Failed to schedule pickup', 'error');
    }
  };

  const handleUpdatePickupStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/pickups/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Manifest Updated', `Consignment marked as "${status}"`, 'success');
        fetchPickups();
        fetchWasteRecords();
        fetchStats();
      }
    } catch {
      addToast('Error', 'Failed to update manifest status', 'error');
    }
  };

  // Incident Handlers
  const handleReportIncident = async (incidentData) => {
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Incident Filed', `Compliance incident ${json.data.incidentId} recorded with corrective action.`, 'warning');
        fetchIncidents();
        fetchStats();
      } else {
        addToast('Error', json.message, 'error');
      }
    } catch {
      addToast('Error', 'Failed to submit incident report', 'error');
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
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            onNavigateToTab={setActiveTab}
            onOpenLogModal={() => {
              setEditingRecord(null);
              setIsLogModalOpen(true);
            }}
          />
        )}

        {activeTab === 'registry' && (
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

        {activeTab === 'livemap' && (
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

        {activeTab === 'pickups' && (
          <PickupManifestView
            pickups={pickups}
            isLoading={isLoadingPickups}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            onUpdatePickupStatus={handleUpdatePickupStatus}
          />
        )}

        {activeTab === 'compliance' && (
          <ComplianceView
            incidents={incidents}
            isLoadingIncidents={isLoadingIncidents}
            onOpenIncidentModal={() => setIsIncidentModalOpen(true)}
            wasteRecords={wasteRecords}
            stats={stats}
          />
        )}

        {activeTab === 'hardware' && (
          <HardwareHubView 
            onAddToast={addToast} 
            onNavigateToMap={handleNavigateToMap} 
          />
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
        onReport={handleReportIncident}
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

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MED_WASTE • Clinical Biomedical Waste & Incineration Logistics</span>
          <span>CPCB BMW Rules 2016 Compliant • Node.js & React</span>
        </div>
      </footer>
    </div>
  );
}
