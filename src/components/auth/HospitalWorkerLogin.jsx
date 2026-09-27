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
}) {
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

  const handleFormLogin = async (e) => {
    e.preventDefault();
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

    try {
      const result = await authService.login(identifier, password, hospital?.hospitalId);
      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        setAuthError(result.message || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err) {
      setAuthError('Could not reach authentication server. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl shrink-0">
            {hospital?.icon || '🏥'}
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              {hospital?.badge || 'Registered Hospital'}
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {hospital?.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Superintendent: {hospital?.superintendent || 'Medical Officer'}
            </p>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 text-xs text-slate-400">
          <span className="block font-mono text-[10px] text-slate-500 uppercase">Hospital ID</span>
          <span className="font-mono text-emerald-400 font-bold text-sm">{hospital?.hospitalId}</span>
          <span className="block text-[11px] text-slate-400 mt-1">{hospital?.bedCapacity > 0 ? `${hospital.bedCapacity} Beds` : 'CBWTF'}</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Staff Credential Sign-in</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your verified hospital email or badge number and password.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSetupOpen(!isSetupOpen)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-colors"
          >
            {isSetupOpen ? 'Standard Login' : 'Provision Superintendent'}
          </button>
        </div>

        {authError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <span className="font-semibold block">Authentication Error</span>
              <span>{authError}</span>
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff Email or Badge Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. dr.patil@khamgaon-gov.mh.gov.in or KHM-GOV-SUP-01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your confidential password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-950/40 cursor-pointer"
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

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">Security & RBAC Enforcement:</span>
              <p>Credentials are cryptographically verified using bcrypt hash algorithms. Sessions are signed via secure tokens and logged to the tamper-evident audit ledger.</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
