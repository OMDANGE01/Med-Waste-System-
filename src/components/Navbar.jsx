import React, { useState } from 'react';
import AppLogo from './AppLogo';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  ClipboardList, 
  Truck, 
  FileCheck2, 
  PlusCircle, 
  RotateCcw, 
  Menu, 
  X, 
  Activity, 
  Database,
  Cpu,
  QrCode, 
  LogOut, 
  User, 
  Sun, 
  Moon,
  MapPin,
  Building2,
  Shield,
  BellRing,
  ChevronDown
} from 'lucide-react';

const DEMO_PROFILES = [
  {
    name: 'Dr. Aaron Patel',
    role: 'Chief Medical Superintendent',
    department: 'Hospital Administration',
    email: 'admin@stjude.org',
    avatar: '🩺',
    badge: 'Supervisor'
  },
  {
    name: 'Robert Langdon',
    role: 'CBWTF Transport Custodian',
    department: 'Apex Bio-Clean Logistics',
    email: 'driver@cbwtf.org',
    avatar: '🚚',
    badge: 'Driver'
  },
  {
    name: 'Nurse Sarah Jenkins',
    role: 'Clinical Staff / Nurse',
    department: 'Operating Theater',
    email: 'nurse@stjude.org',
    avatar: '👩‍⚕️',
    badge: 'Staff'
  },
  {
    name: 'Officer Marcus Cole',
    role: 'Biohazard Safety Officer',
    department: 'Central Holding Bay',
    email: 'officer@stjude.org',
    avatar: '👨‍🔬',
    badge: 'Safety'
  }
];

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenLogModal, 
  onOpenQRModal,
  onResetSeed, 
  isResetting,
  apiOnline,
  mongoConnected,
  stats,
  currentUser,
  onLogout,
  onSwitchUser,
  theme,
  toggleTheme
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  // Role identification helpers
  const isDriver = (user) => {
    if (!user || !user.role) return false;
    const r = user.role.toLowerCase();
    return r.includes('driver') || r.includes('custodian') || r.includes('transport') || r.includes('logistics');
  };

  const isSupervisor = (user) => {
    if (!user || !user.role) return false;
    const r = user.role.toLowerCase();
    return r.includes('superintendent') || r.includes('supervisor') || r.includes('officer') || r.includes('admin') || r.includes('head') || r.includes('chief') || r.includes('director') || r.includes('inspector');
  };

  const isStaff = (user) => {
    if (!user) return false;
    return !isDriver(user) && !isSupervisor(user);
  };

  // Strictly enforce role-based nav items:
  // - Only driver sees pickup manifest
  // - Only supervisor sees head of department dashboard
  // - Hospital staff can only see add bags and tell pickup man for pickup
  let navItems = [];
  if (isDriver(currentUser)) {
    navItems = [
      { id: 'pickups', label: 'Pickup Manifests', icon: Truck, count: stats?.recentPickupsCount },
      { id: 'livemap', label: 'Transit GPS Route Map', icon: MapPin, isLive: true },
    ];
  } else if (isSupervisor(currentUser)) {
    navItems = [
      { id: 'dashboard', label: 'Head of Dept Dashboard', icon: LayoutDashboard },
      { id: 'registry', label: 'Waste Registry', icon: ClipboardList, count: stats?.totalBags },
      { id: 'livemap', label: 'Live GPS Map', icon: MapPin, isLive: true },
      { id: 'compliance', label: 'Compliance & Audit', icon: FileCheck2 },
      { id: 'hardware', label: 'Hardware & IoT', icon: Cpu },
    ];
  } else {
    // Hospital staff
    navItems = [
      { id: 'staffportal', label: 'Hospital Waste Station', icon: ClipboardList, count: stats?.totalBags },
    ];
  }

  // Get human-readable role badge
  const getRoleBadge = (user) => {
    if (isDriver(user)) {
      return { label: 'CBWTF Driver', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
    }
    if (isSupervisor(user)) {
      return { label: 'Supervisor / Head of Dept', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' };
    }
    return { label: 'Hospital Staff', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
  };

  const roleBadge = getRoleBadge(currentUser);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 dark:bg-slate-950/90 text-white backdrop-blur-md border-b border-slate-800 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Facility */}
          <div className="flex items-center gap-3">
            <AppLogo size="md" showTelemetryPulse={apiOnline} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-wider">MED_<span className="text-rose-500">WASTE</span></span>
                {currentUser && (
                  <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block font-medium">St. Jude Medical Center • Enterprise Biohazard System</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-800/80 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-700/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.isLive && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions, Theme Toggle, QR & User Profile */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Surgical Light' : 'Obsidian Dark'} Theme`}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 dark:text-sky-300 text-xs font-medium border border-slate-700 transition flex items-center justify-center"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-300" />}
            </button>

            {/* Share QR Code Button */}
            <button
              onClick={onOpenQRModal}
              title="Share app via mobile scannable QR Code"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <QrCode className="w-3.5 h-3.5 text-rose-400" />
              <span>Share QR</span>
            </button>

            {/* Log Waste Bag Button (Visible to staff & supervisors) */}
            {!isDriver(currentUser) && (
              <button
                onClick={onOpenLogModal}
                className="btn-tactile flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-900/30 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Log Bag</span>
              </button>
            )}

            {/* User Profile Badge & Role Switcher */}
            {currentUser && (
              <div className="relative">
                <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRoleMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800/80 transition group text-left"
                    title="Switch role profile"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-rose-400 shadow-sm group-hover:border-rose-500 transition">
                      {currentUser.avatar || currentUser.name.split(' ').map(n=>n[0]).join('').slice(0,2) || 'US'}
                    </div>
                    <div className="hidden xl:block text-left text-xs leading-tight">
                      <div className="font-semibold text-white truncate max-w-[110px] flex items-center gap-1">
                        <span>{currentUser.name.split(' ')[0]}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition" />
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[110px]">{currentUser.role.split('/')[0]}</div>
                    </div>
                  </button>
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Role Switcher Popover */}
                {roleMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
                      <span>Switch Active Profile</span>
                      <span className="text-rose-400">RBAC Net</span>
                    </div>
                    {DEMO_PROFILES.map((p) => {
                      const isSelected = currentUser.email === p.email;
                      return (
                        <button
                          key={p.email}
                          type="button"
                          onClick={() => {
                            if (onSwitchUser) onSwitchUser(p);
                            setRoleMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition ${
                            isSelected
                              ? 'bg-rose-600/20 border border-rose-500/40 text-white'
                              : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span className="text-base">{p.avatar}</span>
                          <div className="truncate flex-1">
                            <div className="text-xs font-semibold truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{p.badge}</div>
                          </div>
                          {isSelected && <span className="text-[10px] text-rose-400 font-bold">Active</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={onOpenQRModal}
              className="p-2 rounded-lg bg-slate-800 text-slate-300"
              title="QR Code"
            >
              <QrCode className="w-5 h-5 text-rose-400" />
            </button>
            {!isDriver(currentUser) && (
              <button
                onClick={onOpenLogModal}
                className="p-2 rounded-lg bg-rose-600 text-white"
                title="Log Waste"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-2">
          {currentUser && (
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between mb-2">
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px]">Logged in as</span>
                <span className="font-bold text-white">{currentUser.name}</span>
                <span className="text-[11px] text-rose-400 block">{currentUser.role}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            </div>
          )}

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
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-rose-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300 border border-slate-700">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-800 space-y-2">
            {/* Quick Profile Switcher for Mobile */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 px-1">Switch Active Role</div>
              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_PROFILES.map((p) => {
                  const isSelected = currentUser?.email === p.email;
                  return (
                    <button
                      key={p.email}
                      type="button"
                      onClick={() => {
                        if (onSwitchUser) onSwitchUser(p);
                        setMobileMenuOpen(false);
                      }}
                      className={`p-2 rounded-xl text-left border text-xs transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-500 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="text-sm">{p.avatar}</span>
                      <span className="truncate">{p.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                onOpenQRModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold"
            >
              <QrCode className="w-4 h-4 text-rose-400" />
              <span>Share App via Mobile QR Code</span>
            </button>

            {currentUser && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-850 border border-slate-800">
                <div className="flex items-center gap-2 text-xs">
                  <span>{currentUser.avatar || '👤'}</span>
                  <div>
                    <div className="font-semibold text-white">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-400">{currentUser.role}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-2.5 py-1 rounded bg-rose-950/60 text-rose-400 text-xs font-semibold border border-rose-500/30"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
