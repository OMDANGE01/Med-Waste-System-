import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  Stethoscope, 
  Building2,
  KeyRound,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import authService from '../../services/authService';

/**
 * Interface 2: Secure Staff Login Portal
 * Enforces real server-side credential verification with bcrypt password validation.
 * Zero instant-login shortcuts or visible plaintext passwords.
 */
export default function HospitalWorkerLogin({
  hospital,
  onLogin,
  onBackToHospitalSelect,
  theme = 'light',
}) {
  const isDark = theme === 'dark';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // First-time superintendent provision modal
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [setupForm, setSetupForm] = useState({
    name: hospital?.superintendent?.split('(')[0]?.trim() || '',
    email: '',
    password: '',
    confirmPassword: '',
    badgeNumber: `SUP-${hospital?.hospitalId || '01'}`,
  });
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');
  const [canReclaimSession, setCanReclaimSession] = useState(false);

  const handleFormLogin = async (e, forceReclaim = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!identifier.trim()) {
      setAuthError('Please enter your staff email or assigned badge ID.');
      return;
    }
    if (!password) {
      setAuthError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setAuthError('');
    setCanReclaimSession(false);

    try {
      const result = await authService.login(identifier, password, hospital?.hospitalId, forceReclaim);
      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        setAuthError(result.message || 'Authentication failed. Please verify your credentials.');
        if (
          result.code === 'CONCURRENT_SESSION_ACTIVE' ||
          (result.message && result.message.includes('already logged in'))
        ) {
          setCanReclaimSession(true);
        }
      }
    } catch {
      setAuthError('Could not reach authentication server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceReclaimLogin = () => {
    handleFormLogin(null, true);
  };

  const handleBootstrapSuperintendent = async (e) => {
    e.preventDefault();
    setSetupError('');
    setSetupSuccess('');

    if (!setupForm.name || !setupForm.email || !setupForm.password) {
      setSetupError('All fields are required.');
      return;
    }

    if (setupForm.password.length < 8) {
      setSetupError('Password must be at least 8 characters long.');
      return;
    }

    if (setupForm.password !== setupForm.confirmPassword) {
      setSetupError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.bootstrapSuperintendent({
        hospitalId: hospital.hospitalId,
        hospitalName: hospital.name,
        name: setupForm.name.trim(),
        email: setupForm.email.trim(),
        password: setupForm.password,
        badgeNumber: setupForm.badgeNumber.trim(),
      });

      if (res.success && res.user) {
        setSetupSuccess('Superintendent account provisioned successfully! Signing in...');
        setTimeout(() => {
          onLogin(res.user);
        }, 800);
      } else {
        setSetupError(res.message || 'Failed to provision account.');
      }
    } catch (err) {
      setSetupError('Server error during account provisioning.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Navigation & Selected Hospital Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          type="button"
          onClick={onBackToHospitalSelect}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Switch Hospital</span>
        </button>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <span>License: {hospital?.cpcbCode}</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">{hospital?.zone}</span>
        </div>
      </div>

      {/* Hospital Identity Card */}
      <div className={`rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 border ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
          }`}>
            {hospital?.icon || '🏥'}
          </div>
          <div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              {hospital?.badge || 'Registered Hospital'}
            </span>
            <h2 className={`text-2xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {hospital?.name}
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Superintendent: {hospital?.superintendent || 'Medical Officer'}
            </p>
          </div>
        </div>

        <div className={`text-right sm:border-l sm:pl-6 text-xs ${
          isDark ? 'sm:border-slate-800 text-slate-400' : 'sm:border-slate-200 text-slate-500'
        }`}>
          <span className="block font-mono text-[10px] text-slate-400 uppercase">Hospital ID</span>
          <span className={`font-mono font-bold text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{hospital?.hospitalId}</span>
          <span className="block text-[11px] mt-1">{hospital?.bedCapacity > 0 ? `${hospital.bedCapacity} Beds` : 'CBWTF'}</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className={`rounded-2xl p-6 sm:p-8 space-y-6 border transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`border-b pb-4 flex items-center justify-between ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div>
            <h3 className={`text-lg font-bold flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>Staff Credential Sign-in</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Enter your verified hospital email or badge number and password.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSetupOpen(!isSetupOpen)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              isDark
                ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                : 'text-emerald-700 hover:text-emerald-800 bg-emerald-50 border-emerald-200'
            }`}
          >
            {isSetupOpen ? 'Standard Login' : 'Provision Superintendent'}
          </button>
        </div>

        {authError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1 space-y-1.5">
              <span className="font-semibold block text-rose-200">Authentication Error</span>
              <p className="text-slate-200 leading-relaxed font-medium">{authError}</p>
              {canReclaimSession && (
                <div className="pt-2 border-t border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-300">
                    Did your previous browser tab close without logging out?
                  </span>
                  <button
                    type="button"
                    onClick={handleForceReclaimLogin}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition cursor-pointer shrink-0"
                  >
                    Force Reclaim & Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {isSetupOpen ? (
          /* First-Time Superintendent Provisioning */
          <form onSubmit={handleBootstrapSuperintendent} className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <span className="font-semibold block mb-0.5">Hospital Administrator Provisioning:</span>
              Set up the primary superintendent account for {hospital?.name}. Minimum 8 characters required.
            </div>

            {setupError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {setupError}
              </div>
            )}
            {setupSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                {setupSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Superintendent Full Name
              </label>
              <input
                type="text"
                required
                value={setupForm.name}
                onChange={(e) => setSetupForm({ ...setupForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Official Staff Email
              </label>
              <input
                type="email"
                required
                placeholder="superintendent@hospital.gov.in"
                value={setupForm.email}
                onChange={(e) => setSetupForm({ ...setupForm, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Set Strong Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={setupForm.password}
                  onChange={(e) => setSetupForm({ ...setupForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={setupForm.confirmPassword}
                  onChange={(e) => setSetupForm({ ...setupForm, confirmPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" message="" className="p-0" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Provision & Sign In as Superintendent</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Standard Verified Login Form */
          <form onSubmit={handleFormLogin} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Staff Email or Badge Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. dr.patil@khamgaon-gov.mh.gov.in or KHM-GOV-SUP-01"
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm transition-colors border focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your confidential password"
                  className={`w-full rounded-xl pl-10 pr-10 py-2.5 text-sm transition-colors border focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" message="" className="p-0" />
              ) : (
                <>
                  <span>Sign In Securely</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className={`p-3.5 rounded-xl border text-[11px] space-y-2 transition-colors ${
              isDark 
                ? 'bg-slate-950/60 border-slate-800 text-slate-400' 
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className={`font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  Demo Staff Credentials (Click to fill):
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                  Password: password 123 / Khamgaon@2026
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {/* 1. HospitalHead */}
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('dr.patil@khamgaon-gov.mh.gov.in');
                    setPassword('password 123');
                    setAuthError('');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                  }`}
                >
                  👨‍⚕️ HospitalHead (Dr. Patil)
                </button>

                {/* 2. DepartmentHead */}
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('dr.sonone@khamgaon-gov.mh.gov.in');
                    setPassword('Khamgaon@2026');
                    setAuthError('');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                  }`}
                >
                  🩺 DepartmentHead (Dr. Sonone)
                </button>

                {/* 3. Nurse */}
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('sunita.nurse@khamgaon-gov.mh.gov.in');
                    setPassword('Khamgaon@2026');
                    setAuthError('');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                  }`}
                >
                  👩‍⚕️ Nurse (Sister Sunita)
                </button>

                {/* 4. Driver */}
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('driver@cbwtf-khamgaon.org');
                    setPassword('Khamgaon@2026');
                    setAuthError('');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                  }`}
                >
                  🚚 Driver (Prakash Gawli)
                </button>

                {/* 5. Auditor */}
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('supermonitor@health.gov.in');
                    setPassword('password 123');
                    setAuthError('');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                    isDark 
                      ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/50' 
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 shadow-2xs'
                  }`}
                >
                  🛡️ Auditor (State MPCB)
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
