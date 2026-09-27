import React, { useState, useEffect } from 'react';
import AppLogo from './AppLogo';
import HospitalSelector from './auth/HospitalSelector';
import HospitalWorkerLogin from './auth/HospitalWorkerLogin';
import ErrorBoundary from './common/ErrorBoundary';
import { KHAMGAON_HOSPITALS, hospitalService } from '../services/hospitalService';
import authService from '../services/authService';
import { Sun, Moon, ShieldCheck, Lock, Smartphone } from 'lucide-react';

/**
 * Two-Interface Modular Login Page (CPCB 2016 Compliant):
 * Component 1: Hospital Facility Selection (HospitalSelector)
 * Component 2: Secure Staff Credential Login (HospitalWorkerLogin)
 * Strict server-side bcrypt validation with zero hidden gesture shortcuts.
 */
export default function LoginPage({
  onLogin,
  theme = 'dark',
  toggleTheme,
  onOpenApkModal,
}) {
  const [currentInterface, setCurrentInterface] = useState('HOSPITAL_SELECT'); // 'HOSPITAL_SELECT' | 'WORKER_LOGIN'
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitalsList, setHospitalsList] = useState(KHAMGAON_HOSPITALS);

  // Fetch verified hospital list from database backend
  useEffect(() => {
    let isMounted = true;
    hospitalService.getHospitals().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setHospitalsList(data);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleSelectHospital = (hospital) => {
    setSelectedHospital(hospital);
    setCurrentInterface('WORKER_LOGIN');
  };

  const handleBackToHospitalSelect = () => {
    setSelectedHospital(null);
    setCurrentInterface('HOSPITAL_SELECT');
  };

  const handleWorkerLogin = (user) => {
    if (onLogin) {
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Official Top Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <AppLogo size="sm" showTelemetryPulse={true} />
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>MedWaste Guard</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Khamgaon MH-56
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              CPCB Bio-Medical Waste Rules 2016 Compliant Terminal
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onOpenApkModal && (
            <button
              type="button"
              onClick={onOpenApkModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all shadow-sm"
              title="Download Android APK"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android APK</span>
            </button>
          )}

          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Encrypted Session</span>
          </div>

          {toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center">
        <ErrorBoundary>
          {currentInterface === 'HOSPITAL_SELECT' ? (
            <HospitalSelector
              hospitals={hospitalsList}
              onSelectHospital={handleSelectHospital}
              onOpenApkModal={onOpenApkModal}
            />
          ) : (
            <HospitalWorkerLogin
              hospital={selectedHospital}
              onLogin={handleWorkerLogin}
              onBackToHospitalSelect={handleBackToHospitalSelect}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        Maharashtra Pollution Control Board (MPCB) • Buldhana Sub-Division • Central Bio-Medical Waste Monitoring Grid
      </footer>
    </div>
  );
}
