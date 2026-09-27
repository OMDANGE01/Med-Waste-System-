import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { KHAMGAON_HOSPITALS, hospitalService } from '../services/hospitalService';
import { authService, KHAMGAON_WORKERS } from '../services/authService';
import { wasteService } from '../services/wasteService';
import {
  DEFAULT_STATS,
  DEFAULT_WASTE_RECORDS,
  DEFAULT_PICKUPS,
  DEFAULT_INCIDENTS,
} from '../data/baselineData';

export const WasteContext = createContext(null);

export function WasteProvider({ children }) {
  // Theme state ('light' | 'dark')
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('medwaste_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('medwaste_theme', theme);
    } catch {}
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Auth User State
  const [currentUser, setCurrentUser] = useState(() => {
    return authService.getCurrentUser();
  });

  // Khamgaon Hospitals
  const [hospitals, setHospitals] = useState(KHAMGAON_HOSPITALS);
  const [currentHospital, setCurrentHospital] = useState(() => {
    const user = authService.getCurrentUser();
    if (user && user.hospitalId && user.hospitalId !== 'ALL') {
      return KHAMGAON_HOSPITALS.find((h) => h.hospitalId === user.hospitalId) || KHAMGAON_HOSPITALS[0];
    }
    return KHAMGAON_HOSPITALS[0];
  });

  // Super Dashboard modal state (unlocked via 5 taps on AppLogo)
  const [isSuperDashboardOpen, setIsSuperDashboardOpen] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Core Data States
  const [wasteRecords, setWasteRecords] = useState(DEFAULT_WASTE_RECORDS);
  const [pickups, setPickups] = useState(DEFAULT_PICKUPS);
  const [incidents, setIncidents] = useState(DEFAULT_INCIDENTS);
  const [stats, setStats] = useState(DEFAULT_STATS);

  // Loading & Network States
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Network online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('Network Restored', 'Connected back to Khamgaon Biohazard Network.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast('Offline Mode', 'Operating offline. Local records will queue automatically.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  // Global 5-tap secret trigger
  useEffect(() => {
    const handle5Taps = () => {
      setIsSuperDashboardOpen(true);
    };
    window.addEventListener('open-super-dashboard', handle5Taps);
    return () => window.removeEventListener('open-super-dashboard', handle5Taps);
  }, []);

  // Handle Login & set active facility
  const loginUser = useCallback((user) => {
    setCurrentUser(user);
    authService.persistUser(user);

    if (user.hospitalId && user.hospitalId !== 'ALL') {
      const matched = hospitals.find((h) => h.hospitalId === user.hospitalId) || {
        hospitalId: user.hospitalId,
        name: user.hospitalName || 'Government Hospital of Khamgaon',
      };
      setCurrentHospital(matched);
    }
  }, [hospitals]);

  const logoutUser = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
  }, []);

  // Add Waste Record
  const logWasteRecord = useCallback(async (recordPayload) => {
    setIsLoading(true);
    try {
      const created = await wasteService.createWasteRecord(recordPayload);
      setWasteRecords((prev) => [created, ...prev]);
      addToast('Waste Bag Logged', `${created.bagId} logged successfully.`, 'success');
      return created;
    } catch {
      addToast('Logging Failed', 'Could not record waste item.', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // Update Status
  const updateRecordStatus = useCallback(async (bagId, newStatus) => {
    try {
      const updated = await wasteService.updateWasteStatus(bagId, { status: newStatus });
      setWasteRecords((prev) =>
        prev.map((r) => (r.bagId === bagId ? { ...r, status: newStatus } : r))
      );
      addToast('Status Updated', `${bagId} is now ${newStatus}.`, 'info');
      return updated;
    } catch (err) {
      addToast('Update Failed', 'Failed to update bag status.', 'error');
      throw err;
    }
  }, [addToast]);

  const value = {
    theme,
    toggleTheme,
    currentUser,
    loginUser,
    logoutUser,
    hospitals,
    currentHospital,
    setCurrentHospital,
    isSuperDashboardOpen,
    setIsSuperDashboardOpen,
    activeTab,
    setActiveTab,
    wasteRecords,
    setWasteRecords,
    logWasteRecord,
    updateRecordStatus,
    pickups,
    setPickups,
    incidents,
    setIncidents,
    stats,
    setStats,
    isLoading,
    isOnline,
    toasts,
    addToast,
    removeToast,
  };

  return <WasteContext.Provider value={value}>{children}</WasteContext.Provider>;
}

export function useWasteContext() {
  const context = useContext(WasteContext);
  if (!context) {
    throw new Error('useWasteContext must be used within a WasteProvider');
  }
  return context;
}
