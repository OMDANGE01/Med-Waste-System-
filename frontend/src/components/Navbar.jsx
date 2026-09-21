import React, { useState } from 'react';
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
  MapPin
} from 'lucide-react';

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
  theme,
  toggleTheme
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'registry', label: 'Waste Registry', icon: ClipboardList, count: stats?.totalBags },
    { id: 'livemap', label: 'Live GPS Map', icon: MapPin, isLive: true },
    { id: 'pickups', label: 'Pickup Manifests', icon: Truck, count: stats?.recentPickupsCount },
    { id: 'compliance', label: 'Compliance & Audit', icon: FileCheck2 },
    { id: 'hardware', label: 'Hardware & IoT', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 dark:bg-slate-950/90 text-white backdrop-blur-md border-b border-slate-800 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Facility */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-700 flex items-center justify-center shadow-md shadow-rose-900/30">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-wider">MED_<span className="text-rose-500">WASTE</span></span>
                <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  <Activity className="w-3 h-3 animate-pulse text-rose-400" /> CPCB/WHO ID:#941
                </span>
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

            {/* Log Waste Bag Button */}
            <button
              onClick={onOpenLogModal}
              className="btn-tactile flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-900/30 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Bag</span>
            </button>

            {/* User Profile Badge */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-rose-400 shadow-sm">
                  {currentUser.name.split(' ').map(n=>n[0]).join('').slice(0,2) || 'US'}
                </div>
                <div className="hidden xl:block text-left text-xs leading-tight">
                  <div className="font-semibold text-white truncate max-w-[110px]">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[110px]">{currentUser.role.split('/')[0]}</div>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
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
            <button
              onClick={onOpenLogModal}
              className="p-2 rounded-lg bg-rose-600 text-white"
              title="Log Waste"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
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
