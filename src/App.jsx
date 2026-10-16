import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import WasteRegistryView from './components/WasteRegistryView';
import LiveMapView from './components/LiveMapView';
import PickupManifestView from './components/PickupManifestView';
import ComplianceView from './components/ComplianceView';
import HardwareHubView from './components/HardwareHubView';
import HospitalStaffPortalView from './components/HospitalStaffPortalView';
import SuperMonitorView from './components/SuperMonitorView';
import MultiHospitalDriverRouteView from './components/MultiHospitalDriverRouteView';
import AuditorExcelLedgerView from './components/AuditorExcelLedgerView';
import HospitalStaffDirectoryView from './components/HospitalStaffDirectoryView';
import CloudSyncModal from './components/CloudSyncModal';
import LoginPage from './components/LoginPage';
import MaterialBottomNav from './components/mobile/MaterialBottomNav';
import authService from './services/authService';
import WasteLogModal from './components/WasteLogModal';
import PickupScheduleModal from './components/PickupScheduleModal';
import IncidentModal from './components/IncidentModal';
import BarcodeBadgeModal from './components/BarcodeBadgeModal';
import QRScannerModal from './components/QRScannerModal';
import ShareQRModal from './components/ShareQRModal';
import ApkDownloadModal from './components/ApkDownloadModal';
import Toast from './components/Toast';
import OfflineIndicator from './components/OfflineIndicator';
import CollapsibleSidebar from './components/CollapsibleSidebar';
import { ShieldAlert } from 'lucide-react';
import cloudSync from './services/cloudSyncService';
import socketService from './services/socketService';
import {
  DEFAULT_STATS,
  DEFAULT_WASTE_RECORDS,
  DEFAULT_PICKUPS,
  DEFAULT_INCIDENTS,
} from './data/baselineData';

// Resilient network request helper with exponential backoff and auth header injection
const fetchWithRetry = async (url, options = {}, maxRetries = 3, initialDelay = 300) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('medwaste_auth_token') : null;
  const mergedHeaders = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, { ...options, headers: mergedHeaders });
      return res;
    } catch {
      if (attempt === maxRetries - 1) {
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, initialDelay * (attempt + 1)));
    }
  }
  return null;
};

// RBAC Role Verification Helpers
export const isSuperMonitor = (user) => {
  if (!user) return false;
  const r = (user.role || '').toLowerCase();
  const e = (user.email || '').toLowerCase();
  return (
    user.hospitalId === 'ALL' ||
    e.includes('supermonitor') ||
    r.includes('auditor') ||
    r.includes('monitor') ||
    r.includes('inspector') ||
    r.includes('directorate')
  );
};

export const isDriver = (user) => {
  if (!user || !user.role) return false;
  const r = user.role.toLowerCase();
  return r.includes('driver') || r.includes('custodian') || r.includes('transport') || r.includes('logistics');
};

export const isSupervisor = (user) => {
  if (!user || !user.role) return false;
  if (isSuperMonitor(user)) return false;
  const r = user.role.toLowerCase();
  return r.includes('superintendent') || r.includes('supervisor') || r.includes('officer') || r.includes('admin') || r.includes('head') || r.includes('doctor') || r.includes('surgeon');
};

export const isStaff = (user) => {
  if (!user) return false;
  return !isDriver(user) && !isSupervisor(user) && !isSuperMonitor(user);
};

export const getInitialTabForUser = (user) => {
  if (!user) return 'staffportal';
  if (isSuperMonitor(user)) return 'supermonitor';
  if (isDriver(user)) return 'driverroute';
  if (isSupervisor(user)) return 'dashboard';
  return 'staffportal';
};

export default function App() {
  // Theme State ('light' | 'dark') - Defaults to clean clinical white theme
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('medwaste_theme');
      // If user specifically requested white theme or no preference set
      if (!stored || stored === 'dark') {
        localStorage.setItem('medwaste_theme', 'light');
        document.documentElement.classList.remove('dark');
        return 'light';
      }
      return stored;
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

  // Auth State - Clean Start on Khamgaon Login Page (Clears legacy dummy profiles)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('medwaste_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.hospitalName && !parsed.hospitalName.includes('St. Jude') && !parsed.hospitalName.includes('Apollo Super Specialty') && !parsed.name.includes('Aaron')) {
          return parsed;
        }
        localStorage.removeItem('medwaste_user');
      }
      return null;
    } catch {
      return null;
    }
  });

  // Active Tab State
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('medwaste_user');
      const user = saved ? JSON.parse(saved) : { role: 'Chief Medical Superintendent' };
      return getInitialTabForUser(user);
    } catch {
      return 'dashboard';
    }
  });

  // Connected Hospitals & Active Facility
  const [hospitals, setHospitals] = useState([]);
  const [currentHospital, setCurrentHospital] = useState(null);
  const [workers, setWorkers] = useState([]);

  // Data States
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
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [mapTargetRecord, setMapTargetRecord] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('medwaste_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('medwaste_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

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

  // Tab Guards based on Role
  useEffect(() => {
    if (!currentUser) return;
    if (isSuperMonitor(currentUser)) {
      const allowed = ['supermonitor', 'driverroute', 'registry', 'compliance', 'hardware', 'dashboard', 'staff'];
      if (!allowed.includes(activeTab)) setActiveTab('supermonitor');
    } else if (isDriver(currentUser)) {
      const allowed = ['driverroute', 'pickups', 'livemap'];
      if (!allowed.includes(activeTab)) setActiveTab('driverroute');
    } else if (isSupervisor(currentUser)) {
      const allowed = ['dashboard', 'staff', 'registry', 'driverroute', 'compliance', 'hardware', 'livemap'];
      if (!allowed.includes(activeTab)) setActiveTab('dashboard');
    } else {
      const allowed = ['staffportal', 'staff', 'driverroute'];
      if (!allowed.includes(activeTab)) setActiveTab('staffportal');
    }
  }, [currentUser, activeTab]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    if (user.hospitalId && user.hospitalId !== 'ALL') {
      if (isDriver(user)) {
        // Driver collects from all hospitals; default to primary hospital network
        const defaultHosp = hospitals.find(h => h.hospitalId === 'HOSP-01') || hospitals[0] || {
          hospitalId: 'HOSP-01',
          name: 'Government Hospital of Khamgaon',
        };
        setCurrentHospital(defaultHosp);
      } else {
        const match = hospitals.find(h => h.hospitalId === user.hospitalId) || {
          hospitalId: user.hospitalId,
          name: user.hospitalName || 'Government Hospital of Khamgaon',
        };
        setCurrentHospital(match);
      }
    }
    try {
      localStorage.setItem('medwaste_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    const targetTab = getInitialTabForUser(user);
    setActiveTab(targetTab);
    addToast('Welcome to Hospital Portal', `Signed in as ${user.name} (${user.role} • ${user.hospitalName || 'Khamgaon'})`, 'success');
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    setCurrentUser(null);
    addToast('Signed Out', 'You have been safely signed out. Active session flag cleared.', 'info');
  };

  // Strict Single-Session Heartbeat & Abandonment Cleanup
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(async () => {
      try {
        const res = await authService.heartbeat();
        if (res && res.code === 'SESSION_SUPERSEDED') {
          clearInterval(interval);
          handleLogout();
          addToast('Session Ended', 'This account has been logged in on another device. You have been signed out.', 'warning');
        }
      } catch {}
    }, 25000); // 25s heartbeat

    const handlePageHide = () => {
      const token = localStorage.getItem('medwaste_auth_token');
      if (token && currentUser?.email) {
        const blob = new Blob([JSON.stringify({ email: currentUser.email })], { type: 'application/json' });
        navigator.sendBeacon('/api/auth/logout', blob);
      }
    };
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [currentUser]);

  // Fetch Hospitals
  const fetchHospitals = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/hospitals', {}, 2, 200);
      if (res && res.ok) {
        const data = await res.json();
        if (data.data) {
          setHospitals(data.data);
          if (!currentHospital) {
            const matched = data.data.find(h => h.hospitalId === currentUser?.hospitalId) || data.data[0];
            setCurrentHospital(matched);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch hospitals:', err);
    }
  }, [currentUser, currentHospital]);

  // Fetch Workers
  const fetchWorkers = useCallback(async () => {
    try {
      const hospId = currentHospital?.hospitalId || 'HOSP-01';
      const res = await fetchWithRetry(`/api/hospitals/${hospId}/workers`, {}, 2, 200);
      if (res && res.ok) {
        const data = await res.json();
        if (data.data) {
          setWorkers(data.data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch workers:', err);
    }
  }, [currentHospital]);

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
        setApiOnline(true);
      }
    } catch {
      setApiOnline(false);
    }
  };

  // Fetch Stats (Scoped to user hospital, universal for Driver/Auditor)
  const fetchStats = useCallback(async () => {
    try {
      const isUniversal = isSuperMonitor(currentUser) || isDriver(currentUser);
      const userHospId = currentUser?.hospitalId;
      let effectiveHosp = null;
      if (!isUniversal && userHospId && userHospId !== 'ALL' && userHospId !== 'CBWTF-01') {
        effectiveHosp = userHospId;
      } else if (!isUniversal && currentHospital && currentHospital.hospitalId !== 'ALL' && currentHospital.hospitalId !== 'CBWTF-01') {
        effectiveHosp = currentHospital.hospitalId;
      }

      const hospParam = effectiveHosp ? `?hospitalId=${effectiveHosp}` : '';
      let res = await fetchWithRetry(`/api/stats${hospParam}`, {}, 3, 300);
      if (!res.ok) {
        res = await fetchWithRetry(`/api/waste/stats${hospParam}`, {}, 2, 300);
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
    } catch (err) {
      console.warn('Stats fetch notice, using fallback data:', err.message);
    }
  }, [currentHospital, currentUser]);

  // Fetch Waste Records (Strict Hospital Isolation, Universal Driver Access)
  const fetchWasteRecords = useCallback(async () => {
    setIsLoadingWaste(true);
    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'All') params.append('category', filters.category);
      if (filters.department && filters.department !== 'All') params.append('department', filters.department);
      if (filters.status && filters.status !== 'All') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const isUniversal = isSuperMonitor(currentUser) || isDriver(currentUser);
      const userHospId = currentUser?.hospitalId;
      let effectiveHosp = null;
      if (!isUniversal && userHospId && userHospId !== 'ALL' && userHospId !== 'CBWTF-01') {
        effectiveHosp = userHospId;
      } else if (!isUniversal && currentHospital && currentHospital.hospitalId !== 'ALL' && currentHospital.hospitalId !== 'CBWTF-01') {
        effectiveHosp = currentHospital.hospitalId;
      }

      if (effectiveHosp) {
        params.append('hospitalId', effectiveHosp);
      }

      const res = await fetchWithRetry(`/api/waste?${params.toString()}`, {}, 3, 300);
      if (res && res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.data) {
            // Strict hospital isolation: Drivers and Auditors see network bags; hospital staff only see their own hospital bags
            const filtered = (!isUniversal && userHospId && userHospId !== 'ALL' && userHospId !== 'CBWTF-01')
              ? data.data.filter((r) => r.hospitalId === userHospId)
              : data.data;
            setWasteRecords(filtered);
          }
        }
      }
    } catch (err) {
      console.warn('Waste records fetch notice:', err.message);
    } finally {
      setIsLoadingWaste(false);
    }
  }, [filters, currentHospital, currentUser]);

  // Fetch Pickups
  const fetchPickups = useCallback(async () => {
    setIsLoadingPickups(true);
    try {
      const res = await fetchWithRetry('/api/pickups', {}, 2, 300);
      if (res && res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.data) {
            setPickups(data.data);
          }
        }
      }
    } catch (err) {
      console.warn('Pickups fetch notice:', err.message);
    } finally {
      setIsLoadingPickups(false);
    }
  }, []);

  // Fetch Incidents
  const fetchIncidents = useCallback(async () => {
    setIsLoadingIncidents(true);
    try {
      const res = await fetchWithRetry('/api/incidents', {}, 2, 300);
      if (res && res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.data) {
            setIncidents(data.data);
          }
        }
      }
    } catch (err) {
      console.warn('Incidents fetch notice:', err.message);
    } finally {
      setIsLoadingIncidents(false);
    }
  }, []);

  // Initial Data Load & Socket.io Real-Time Event Bus (NO client-side polling)
  useEffect(() => {
    checkHealth();
    fetchHospitals();
    fetchWorkers();
    fetchStats();
    fetchWasteRecords();
    fetchPickups();
    fetchIncidents();

    // Initialize Socket.io connection
    socketService.initSocket();

    // 1. Live Waste Creation event (Strict Hospital Isolation)
    const unsubCreated = socketService.subscribeToWasteCreated((newRecord) => {
      const isUniversal = isSuperMonitor(currentUser) || isDriver(currentUser);
      const userHospId = currentUser?.hospitalId;
      const targetHospId = currentHospital?.hospitalId;

      // Strict hospital isolation: never show another hospital's logged bags!
      if (!isUniversal && userHospId && userHospId !== 'ALL' && newRecord.hospitalId !== userHospId) {
        return;
      }
      if (!isUniversal && targetHospId && targetHospId !== 'ALL' && newRecord.hospitalId !== targetHospId) {
        return;
      }

      setWasteRecords((prev) => [newRecord, ...prev.filter((r) => r.tagId !== newRecord.tagId)]);
      fetchStats();
      addToast(
        'Bio-Waste Bag Logged',
        `Bag #${newRecord.tagId} (${newRecord.weightKg} kg - ${newRecord.category}) registered at ${newRecord.hospitalName}`,
        'success'
      );
    });

    // 2. Live Status Transition event (Driver marked Collected / Delivered)
    const unsubStatus = socketService.subscribeToWasteStatusUpdated((payload) => {
      if (!payload || !payload.record) return;
      const isUniversal = isSuperMonitor(currentUser) || isDriver(currentUser);
      const userHospId = currentUser?.hospitalId;

      if (!isUniversal && userHospId && userHospId !== 'ALL' && payload.record.hospitalId !== userHospId) {
        return;
      }

      setWasteRecords((prev) =>
        prev.map((r) =>
          r._id === payload.record._id || r.tagId === payload.record.tagId
            ? { ...r, ...payload.record }
            : r
        )
      );
      fetchStats();
    });

    // 3. Dedicated Collected event for Hospital Head and Auditor screens
    const unsubCollected = socketService.subscribeToWasteCollected((payload) => {
      if (!payload || !payload.record) return;
      const isUniversal = isSuperMonitor(currentUser) || isDriver(currentUser);
      const userHospId = currentUser?.hospitalId;

      if (!isUniversal && userHospId && userHospId !== 'ALL' && payload.record.hospitalId !== userHospId) {
        return;
      }

      addToast(
        'Real-Time Bag Collection',
        `Driver ${payload.actor?.name || 'Driver'} collected Bag #${payload.record.tagId} from ${payload.record.hospitalName}`,
        'info'
      );
    });

    return () => {
      unsubCreated();
      unsubStatus();
      unsubCollected();
    };
  }, [fetchHospitals, fetchWorkers, fetchStats, fetchWasteRecords, fetchPickups, fetchIncidents, currentUser, currentHospital]);

  // Handle Save / Create Waste Record (Locked to User's Registered Facility)
  const handleSaveWasteRecord = async (recordData) => {
    const userHospId = currentUser?.hospitalId && currentUser.hospitalId !== 'ALL' ? currentUser.hospitalId : null;
    const userHospName = currentUser?.hospitalName && currentUser.hospitalId !== 'ALL' ? currentUser.hospitalName : null;

    const enrichedData = {
      ...recordData,
      hospitalId: userHospId || recordData.hospitalId || currentHospital?.hospitalId || 'HOSP-01',
      hospitalName: userHospName || recordData.hospitalName || currentHospital?.name || 'Government Hospital of Khamgaon',
      handlerName: currentUser?.name || recordData.handlerName || 'Sister Sunita Tayade',
    };

    try {
      // 1. Enqueue Edge SQL write
      cloudSync.enqueueTransaction('waste_records', editingRecord ? 'UPDATE' : 'INSERT', enrichedData);

      // 2. Direct API call with Bearer token
      const url = editingRecord ? `/api/waste/${editingRecord._id || editingRecord.id}` : '/api/waste';
      const method = editingRecord ? 'PUT' : 'POST';
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('medwaste_auth_token') : null;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(enrichedData),
      });

      const json = await res.json();
      if (json.success) {
        addToast(
          editingRecord ? 'Record Updated' : 'Waste Bag Logged & QR Generated',
          `Tag #${json.data.tagId} recorded at ${enrichedData.hospitalName} (${json.data.weightKg} kg - ${json.data.category})`,
          'success'
        );
        setIsLogModalOpen(false);
        setEditingRecord(null);
        setBarcodeModalRecord(json.data);
      } else {
        addToast('Notice', json.message || 'Error saving record', 'error');
        setIsLogModalOpen(false);
      }
    } catch (e) {
      console.error(e);
      addToast('Notice', 'Request processed. Stored in resilient registry.', 'info');
      setIsLogModalOpen(false);
    }
  };

  // Handle Delete Waste Record
  const handleDeleteWasteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this waste record? This action will be audited.')) {
      return;
    }

    cloudSync.enqueueTransaction('waste_records', 'DELETE', { tagId: id });

    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('medwaste_auth_token') : null;
      const res = await fetch(`/api/waste/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json.success) {
        addToast('Record Deleted', 'Waste record removed from active registry', 'info');
        fetchWasteRecords();
        fetchStats();
      }
    } catch (e) {
      addToast('Notice', 'Delete operation logged.', 'info');
    }
  };

  // Handle Status Quick Change
  const handleUpdateWasteStatus = async (id, newStatus, extraData = {}) => {
    cloudSync.enqueueTransaction('waste_records', 'UPDATE', { tagId: id, status: newStatus, ...extraData });

    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('medwaste_auth_token') : null;
      const res = await fetch(`/api/waste/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus, ...extraData }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Status Updated', `Waste Bag status marked as "${newStatus}"`, 'success');
        fetchWasteRecords();
        fetchStats();
      } else {
        addToast('Permission Check', json.message || 'Status transition rejected.', 'error');
      }
    } catch (e) {
      addToast('Status Change', `Transition to "${newStatus}" processed.`, 'info');
    }
  };

  // Helper: Quick Generate Sample Waste Bag (Allows drivers and staff to test collection & disposal anytime)
  const handleQuickGenerateSampleBag = async () => {
    const hosp = currentHospital || hospitals[0] || {
      hospitalId: 'HOSP-01',
      name: 'Government Hospital of Khamgaon',
    };
    const categories = ['Yellow', 'Red', 'Blue', 'Black'];
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    const weight = (Math.random() * 4 + 1.8).toFixed(2);
    const tagId = `KHM-${hosp.hospitalId ? hosp.hospitalId.split('-')[1] : 'GOV'}-${Date.now().toString().slice(-4)}`;

    await handleSaveWasteRecord({
      tagId,
      hospitalId: hosp.hospitalId || 'HOSP-01',
      hospitalName: hosp.name,
      category: randomCat,
      department: 'Emergency & Trauma',
      weightKg: weight,
      weightSource: 'Web Serial Digital Scale (9600 baud)',
      handlerName: currentUser?.name || 'Sister Sunita Tayade',
      status: 'Logged',
      notes: `Simulated bio-medical waste bag generated at ${hosp.name}`,
    });
  };

  // Handle Staff Alerting Pickup Driver
  const handleStaffNotifyDriver = async (payload) => {
    const pickupPayload = {
      treatmentFacility: 'Apex Bio-Clean & Incineration Services (CBWTF)',
      vehicleNumber: payload.vehicleNumber || 'MH-15-BW-4092',
      driverName: payload.driverName || 'Robert Langdon',
      driverPhone: payload.driverPhone || '+91 98240 77119',
      wasteRecordIds: payload.bagIds,
      totalWeightKg: payload.totalWeightKg,
      notes: `Pickup called by ${payload.requestedBy} (${currentHospital?.name}): ${payload.pickupNote}`,
    };

    cloudSync.enqueueTransaction('pickup_requests', 'INSERT', pickupPayload);

    try {
      await fetch('/api/pickups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pickupPayload)
      });
    } catch (err) {
      console.warn('Queued locally:', err);
    }

    addToast('Driver Dispatched', `CBWTF Driver assigned to collect ${payload.bagIds.length} bags from ${currentHospital?.name}`, 'success');
    fetchWasteRecords();
    fetchPickups();
    fetchStats();
  };

  // Handle Schedule Pickup
  const handleSchedulePickup = async (pickupData) => {
    cloudSync.enqueueTransaction('pickup_requests', 'INSERT', pickupData);

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
      }
    } catch (e) {
      addToast('Buffered', 'Pickup manifest saved to local Edge SQL store', 'info');
      setIsScheduleModalOpen(false);
    }
  };

  // Handle Update Pickup Status (Driver)
  const handleUpdatePickupStatus = async (id, status, driverName, vehicleNumber) => {
    cloudSync.enqueueTransaction('pickup_requests', 'UPDATE', { manifestNumber: id, status, driverName, vehicleNumber });

    try {
      const res = await fetch(`/api/pickups/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, driverName, vehicleNumber }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Manifest Updated', `Pickup manifest #${json.data.manifestNumber} marked as ${status}`, 'success');
        fetchPickups();
        fetchWasteRecords();
        fetchStats();
      }
    } catch (e) {
      addToast('Buffered', `Manifest update marked as ${status} in local Edge SQL buffer`, 'info');
    }
  };

  // Handle Log Incident
  const handleLogIncident = async (incidentData) => {
    cloudSync.enqueueTransaction('incidents', 'INSERT', incidentData);

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Incident Logged', `Incident ${json.data.incidentId} recorded. Safety officer notified.`, 'error');
        setIsIncidentModalOpen(false);
        fetchIncidents();
        fetchStats();
      }
    } catch (e) {
      addToast('Buffered', 'Incident recorded in local Edge SQL store', 'info');
      setIsIncidentModalOpen(false);
    }
  };

  // Reset to Seed
  const handleResetSeed = async () => {
    if (!window.confirm('Reset database to statutory biomedical baseline dataset?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/stats/reset', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        addToast('Database Reset', 'Initialized official multi-hospital biomedical dataset', 'success');
        fetchHospitals();
        fetchWorkers();
        fetchStats();
        fetchWasteRecords();
        fetchPickups();
        fetchIncidents();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col transition-colors`}>
        <div className="flex-1 flex flex-col">
          <LoginPage
            onLogin={handleLogin}
            theme={theme}
            toggleTheme={toggleTheme}
            hospitals={hospitals}
            onOpenApkModal={() => setIsApkModalOpen(true)}
          />
        </div>
        <ApkDownloadModal
          isOpen={isApkModalOpen}
          onClose={() => setIsApkModalOpen(false)}
        />
      </div>
    );
  }

  const pendingWasteForPickup = wasteRecords.filter(
    (r) => r.status === 'Logged' || r.status === 'Awaiting Pickup' || r.status === 'In Transit' || r.status === 'Collected'
  );

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors`}>
      {/* Toast Notification Stream */}
      <Toast toasts={toasts} removeToast={removeToast} onDismiss={removeToast} />

      {/* Offline Status & IndexedDB Auto-Sync Indicator */}
      <OfflineIndicator />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogModal={() => {
          setEditingRecord(null);
          setIsLogModalOpen(true);
        }}
        onOpenQRModal={() => setIsQRModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onResetSeed={handleResetSeed}
        isResetting={isResetting}
        apiOnline={apiOnline}
        mongoConnected={mongoConnected}
        stats={stats}
        currentUser={currentUser}
        currentHospital={currentHospital}
        hospitals={hospitals}
        onSelectHospital={(h) => setCurrentHospital(h)}
        onLogout={handleLogout}
        onSwitchUser={handleLogin}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Workspace with Collapsible Sidebar */}
      <div className="flex flex-1 w-full min-h-0">
        <CollapsibleSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenLogModal={() => {
            setEditingRecord(null);
            setIsLogModalOpen(true);
          }}
          currentUser={currentUser}
          currentHospital={currentHospital}
          stats={stats}
          apiOnline={apiOnline}
          mongoConnected={mongoConnected}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 overflow-x-hidden">
          
          {/* VIEW: Super Monitor (State Health Authority & SPCB Apex Portal) */}
          {activeTab === 'supermonitor' && (
            <SuperMonitorView
              hospitals={hospitals}
              workers={workers}
              wasteRecords={wasteRecords}
              pickups={pickups}
              incidents={incidents}
              onSelectHospital={(h) => {
                setCurrentHospital(h);
                setActiveTab('dashboard');
              }}
              onOpenDriverRoute={() => setActiveTab('driverroute')}
              onAddToast={addToast}
            />
          )}

          {/* VIEW: Multi-Hospital Driver Route & Transit GPS */}
          {activeTab === 'driverroute' && (
            <MultiHospitalDriverRouteView
              hospitals={hospitals}
              wasteRecords={wasteRecords}
              pickups={pickups}
              currentUser={currentUser}
              onUpdateRecordStatus={handleUpdateWasteStatus}
              onAddToast={addToast}
              onOpenQRScanner={() => setIsQRModalOpen(true)}
              onQuickLogSample={handleQuickGenerateSampleBag}
            />
          )}

          {/* VIEW: Hospital Workforce Directory */}
          {activeTab === 'staff' && (
            <HospitalStaffDirectoryView
              currentHospital={currentHospital}
              workers={workers}
              currentUser={currentUser}
              onRefreshWorkers={fetchWorkers}
              onAddToast={addToast}
            />
          )}

          {/* VIEW: Hospital Staff Portal */}
          {activeTab === 'staffportal' && (
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

          {/* VIEW: Head of Department Dashboard */}
          {activeTab === 'dashboard' && (
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

          {/* VIEW: Waste Registry */}
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
              onAddToast={addToast}
              currentUser={currentUser}
            />
          )}

          {/* VIEW: Auditor Master Excel Spreadsheet Ledger */}
          {activeTab === 'auditorledger' && (
            <AuditorExcelLedgerView
              wasteRecords={wasteRecords}
              currentUser={currentUser}
              hospitals={hospitals}
              onRefresh={fetchWasteRecords}
            />
          )}

          {/* VIEW: Live GPS Map */}
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

          {/* VIEW: Pickup Manifests */}
          {activeTab === 'pickups' && (
            <PickupManifestView
              pickups={pickups}
              isLoading={isLoadingPickups}
              onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
              onUpdatePickupStatus={handleUpdatePickupStatus}
            />
          )}

          {/* VIEW: Compliance & Audit */}
          {activeTab === 'compliance' && (
            <ComplianceView
              incidents={incidents}
              isLoading={isLoadingIncidents}
              onOpenIncidentModal={() => setIsIncidentModalOpen(true)}
              wasteRecords={wasteRecords}
              stats={stats}
              currentUser={currentUser}
              currentHospital={currentHospital}
              onAddToast={addToast}
            />
          )}

          {/* VIEW: Hardware & IoT */}
          {activeTab === 'hardware' && (
            <HardwareHubView 
              onAddToast={addToast} 
              onNavigateToMap={handleNavigateToMap} 
            />
          )}
        </main>
      </div>

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
        onQuickLogSample={handleQuickGenerateSampleBag}
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

      <QRScannerModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        records={wasteRecords}
        currentUser={currentUser}
        onTransitionStatus={handleUpdateWasteStatus}
      />

      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        mongoConnected={mongoConnected}
      />

      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* Android Material 3 Bottom Navigation Bar */}
      <MaterialBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenLogModal={() => {
          setEditingRecord(null);
          setIsLogModalOpen(true);
        }}
        stats={stats}
      />
    </div>
  );
}
