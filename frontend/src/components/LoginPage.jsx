import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Mail, 
  ArrowRight, 
  UserCheck, 
  Activity, 
  Building2, 
  Shield, 
  UserPlus, 
  LogIn,
  CheckCircle2,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

export default function LoginPage({ onLogin, onGuestAccess, theme, toggleTheme }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State (Original Email Sign Up)
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState('Clinical Staff / Nurse');
  const [registerDept, setRegisterDept] = useState('Operating Theater');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const demoRoles = [
    {
      name: 'Nurse Sarah Jenkins',
      role: 'Clinical Staff / Nurse',
      dept: 'Operating Theater',
      email: 'nurse@stjude.org',
      avatar: '👩‍⚕️',
      color: 'border-rose-500/30 hover:border-rose-500 bg-rose-950/20',
    },
    {
      name: 'Officer Marcus Cole',
      role: 'Biohazard Safety Officer',
      dept: 'Central Holding Bay',
      email: 'officer@stjude.org',
      avatar: '👨‍🔬',
      color: 'border-amber-500/30 hover:border-amber-500 bg-amber-950/20',
    },
    {
      name: 'Robert Langdon',
      role: 'CBWTF Transport Custodian',
      dept: 'Apex Bio-Clean Logistics',
      email: 'driver@cbwtf.org',
      avatar: '🚚',
      color: 'border-purple-500/30 hover:border-purple-500 bg-purple-950/20',
    },
    {
      name: 'Dr. Aaron Patel',
      role: 'Chief Medical Superintendent',
      dept: 'Hospital Administration',
      email: 'admin@stjude.org',
      avatar: '🩺',
      color: 'border-sky-500/30 hover:border-sky-500 bg-sky-950/20',
    },
  ];

  // Handle Login with Email
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setErrorMessage(data.message || 'Login failed. Check your email & password.');
      }
    } catch {
      // Fallback if offline
      const found = demoRoles.find((r) => r.email.toLowerCase() === loginEmail.toLowerCase());
      if (found) {
        onLogin(found);
      } else {
        onLogin({
          name: loginEmail.split('@')[0],
          role: 'Authorized Staff',
          department: 'General Ward',
          email: loginEmail,
          avatar: '👤',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register with New Original Email
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
          role: registerRole,
          department: registerDept,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Account created successfully! Logging you in...');
        setTimeout(() => {
          onLogin(data.user);
        }, 800);
      } else {
        setErrorMessage(data.message || 'Registration failed.');
      }
    } catch {
      // Fallback
      const newUser = {
        name: registerName,
        email: registerEmail,
        role: registerRole,
        department: registerDept,
        avatar: '👤',
      };
      onLogin(newUser);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (roleItem) => {
    setLoginEmail(roleItem.email);
    setLoginPassword('password123');
    onLogin({
      name: roleItem.name,
      role: roleItem.role,
      department: roleItem.dept,
      email: roleItem.email,
      avatar: roleItem.avatar,
    });
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#090d16] text-slate-100 clinical-grid-dark' : 'bg-slate-50 text-slate-900 clinical-grid-light'
    }`}>
      {/* Top Bar with Theme Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold shadow-sm hover:border-rose-500 transition"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Surgical Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-sky-600" />
              <span>Obsidian Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-700 items-center justify-center shadow-lg shadow-rose-900/20">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              MED_<span className="text-rose-600 dark:text-rose-500">WASTE</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              St. Jude Medical Center • Health Authority ID: #HA-94102
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>CPCB / WHO Certified Portal</span>
          </div>
        </div>

        {/* Card Container */}
        <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Email Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Original Email</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-medium">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Your Registered Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                    placeholder="e.g. yourname@gmail.com or nurse@stjude.org"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                    placeholder="Enter your passcode"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-sm shadow-lg shadow-rose-950 transition flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In to MED_WASTE'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER ORIGINAL EMAIL FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  placeholder="e.g. Dr. Alex Morgan"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Original Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    placeholder="e.g. alex@gmail.com or hospital staff email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Create Password (min 6 chars) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                  <select
                    value={registerRole}
                    onChange={(e) => setRegisterRole(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Clinical Staff / Nurse">Nurse / Staff</option>
                    <option value="Biohazard Safety Officer">Biohazard Officer</option>
                    <option value="CBWTF Transport Custodian">CBWTF Driver</option>
                    <option value="Chief Medical Superintendent">Superintendent / Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={registerDept}
                    onChange={(e) => setRegisterDept(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                    placeholder="e.g. ICU, Surgery"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 mt-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-sm shadow-lg shadow-rose-950 transition flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isLoading ? 'Creating Account...' : 'Register & Sign In'}</span>
              </button>
            </form>
          )}

          {/* Quick Demo Role Switcher */}
          <div className="space-y-2.5 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Instant 1-Click Demo Profiles</span>
              <span className="text-slate-500 text-[11px]">Click to auto-login</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoRoles.map((role) => (
                <button
                  key={role.email}
                  type="button"
                  onClick={() => handleQuickLogin(role)}
                  className={`p-2 rounded-xl border text-left transition ${role.color} hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{role.avatar}</span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">{role.name.split(' ')[0]} {role.name.split(' ')[1] || ''}</div>
                      <div className="text-[10px] text-slate-400 truncate">{role.role.split('/')[0]}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Guest Access Link */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onGuestAccess}
              className="text-xs text-slate-400 hover:text-rose-400 transition underline underline-offset-4"
            >
              Continue as Guest Inspector (Read/Write Access)
            </button>
          </div>
        </div>

        {/* Security Compliance Footer */}
        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>MED_WASTE • CPCB BMW 2016 Compliant • Encrypted</span>
        </div>
      </div>
    </div>
  );
}
