import React, { useState } from 'react';
import AppLogo from './AppLogo';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  ClipboardList, 
  Truck, 
  FileCheck2, 
  PlusCircle, 
  Menu, 
  X, 
  Activity, 
  Cpu, 
  QrCode, 
  LogOut, 
  User, 
  Sun, 
  Moon, 
  MapPin, 
  Building2, 
  Shield, 
  ChevronDown, 
  Users,
  ShieldCheck,
  Clock,
  Sparkles,
  Smartphone,
  Download
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenLogModal, 
  onOpenQRModal, 
  onOpenSyncModal, 
  onOpenApkModal,
  stats, 
  currentUser, 
  currentHospital, 
  onLogout, 
  theme, 
  toggleTheme 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileCardOpen, setProfileCardOpen] = useState(false);

  // Role identification helpers
  const isSuperMonitor = (user) => {
    if (!user) return false;
    const r = (user.role || '').toLowerCase();
    const e = (user.email || '').toLowerCase();
    return user.hospitalId === 'ALL' || e.includes('supermonitor') || r.includes('monitor') || r.includes('directorate');
  };

  const isDriver = (user) => {
    if (!user || !user.role) return false;
    const r = user.role.toLowerCase();
    return r.includes('driver') || r.includes('custodian') || r.includes('transport') || r.includes('logistics');
  };

  const isSupervisor = (user) => {
    if (!user || !user.role) return false;
    if (isSuperMonitor(user)) return false;
    const r = user.role.toLowerCase();
    return r.includes('superintendent') || r.includes('supervisor') || r.includes('officer') || r.includes('admin') || r.includes('head');
  };

  const isDoctorOrNurse = (user) => {
    if (!user || !user.role) return false;
    const r = user.role.toLowerCase();
    return r.includes('doctor') || r.includes('surgeon') || r.includes('nurse') || r.includes('clinical');
  };

  // Nav items strictly scoped per role
  let navItems = [];
  if (isSuperMonitor(currentUser)) {
    navItems = [
      { id: 'supermonitor', label: 'Hospitals Network', icon: Building2 },
      { id: 'driverroute', label: 'Transit Fleet', icon: Truck, isLive: true },
      { id: 'registry', label: 'CPCB Master Registry', icon: ClipboardList, count: stats?.totalBags },
      { id: 'compliance', label: 'State Audit Trail', icon: FileCheck2 },
    ];
  } else if (isDriver(currentUser)) {
    navItems = [
      { id: 'driverroute', label: 'Pickup Route', icon: Truck, isLive: true },
      { id: 'pickups', label: 'Manifest Sign-off', icon: ClipboardList, count: stats?.recentPickupsCount },
      { id: 'livemap', label: 'Transit GPS', icon: MapPin },
    ];
  } else if (isSupervisor(currentUser)) {
    navItems = [
      { id: 'dashboard', label: 'Superintendent Dashboard', icon: LayoutDashboard },
      { id: 'registry', label: 'Waste Registry & 48hr Clock', icon: ClipboardList, count: stats?.totalBags },
      { id: 'driverroute', label: 'Transit Vans', icon: Truck, isLive: true },
      { id: 'compliance', label: 'CPCB Compliance & Audit', icon: FileCheck2 },
      { id: 'staff', label: 'Staff Directory', icon: Users, count: stats?.totalWorkersCount },
    ];
  } else {
    // Ward Nurses, Doctors, Waste Collection Staff
    navItems = [
      { id: 'staffportal', label: 'Ward Station & Log', icon: ClipboardList, count: stats?.totalBags },
      { id: 'registry', label: 'Bag Registry', icon: ClipboardList },
      { id: 'driverroute', label: 'Van Arrival ETA', icon: Truck },
    ];
  }

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: App Logo & Hospital Identity */}
          <div className="flex items-center space-x-3">
            <AppLogo size="sm" showTelemetryPulse={true} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white tracking-tight">
                  MedWaste Guard
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  CPCB 2016
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[220px] sm:max-w-xs">
                {currentHospital?.name || 'Khamgaon Hospital Network'}
              </p>
            </div>
          </div>

          {/* Center: Desktop Navigation Bar */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.isLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Actions & User Authenticated Profile */}
          <div className="flex items-center space-x-2.5">
            {/* APK Download Button */}
            {onOpenApkModal && (
              <button
                type="button"
                onClick={onOpenApkModal}
                title="Download CPCB Android App (.APK)"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition shadow-sm hover:border-emerald-400/60"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Get APK</span>
              </button>
            )}

            {/* Theme Toggle */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                title="Toggle Theme"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700/60 transition"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
              </button>
            )}

            {/* Log Waste Bag Button (Visible to clinical staff, waste collection staff, superintendents) */}
            {!isDriver(currentUser) && (
              <button
                onClick={onOpenLogModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/30 transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Log Bag</span>
              </button>
            )}

            {/* Authenticated Staff Chip */}
            {currentUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileCardOpen((prev) => !prev)}
                  className="flex items-center space-x-2 p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    {currentUser.name ? currentUser.name[0] : 'U'}
                  </div>
                  <div className="hidden lg:block text-left text-xs leading-tight">
                    <span className="font-semibold text-white block max-w-[100px] truncate">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono block">
                      {currentUser.badgeNumber || 'Staff'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
                </button>

                {/* Secure Profile Card (No mock switcher) */}
                {profileCardOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg font-bold">
                        {currentUser.avatar || '🩺'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{currentUser.name}</h4>
                        <p className="text-xs text-emerald-400 font-medium truncate">{currentUser.role}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Badge: {currentUser.badgeNumber}</p>
                      </div>
                    </div>

                    <div className="py-3 space-y-1.5 text-xs text-slate-400 border-b border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono">Facility</span>
                        <span className="text-slate-200 font-medium">{currentUser.hospitalName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono">Department</span>
                        <span className="text-slate-200">{currentUser.department || 'General Ward'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono">Session Security</span>
                        <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>JWT Authenticated</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-3">
                      <button
                        onClick={() => {
                          setProfileCardOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/20 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out Securely</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}

            {onOpenApkModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenApkModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
              >
                <div className="flex items-center space-x-2.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Download Android App (.APK)</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 font-mono">v1.0.0</span>
              </button>
            )}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
