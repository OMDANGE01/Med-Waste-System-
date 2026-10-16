import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Truck, 
  FileCheck2, 
  Cpu, 
  MapPin, 
  PlusCircle, 
  ChevronLeft, 
  ChevronRight, 
  PanelLeftClose, 
  PanelLeftOpen, 
  ShieldCheck, 
  Activity, 
  Radio, 
  HelpCircle,
  Menu,
  X,
  Database,
  Building2,
  Users
} from 'lucide-react';
import AppLogo from './AppLogo';

export default function CollapsibleSidebar({
  isCollapsed,
  onToggleCollapse,
  activeTab,
  setActiveTab,
  onOpenLogModal,
  currentUser,
  currentHospital,
  stats,
  apiOnline,
  mongoConnected
}) {
  const isSuperMonitor = (user) => {
    if (!user) return false;
    const r = (user.role || '').toLowerCase();
    const e = (user.email || '').toLowerCase();
    return user.hospitalId === 'ALL' || e.includes('supermonitor') || r.includes('inspector') || r.includes('directorate');
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
    return r.includes('superintendent') || r.includes('supervisor') || r.includes('officer') || r.includes('admin') || r.includes('head') || r.includes('doctor') || r.includes('surgeon');
  };

  let navItems = [];
  if (isSuperMonitor(currentUser)) {
    navItems = [
      { id: 'supermonitor', label: 'Hospitals Network', icon: Building2 },
      { id: 'driverroute', label: 'Multi-Hospital Route', icon: Truck, isLive: true },
      { id: 'registry', label: 'Global Registry', icon: ClipboardList, count: stats?.totalBags },
      { id: 'compliance', label: 'State Audit', icon: FileCheck2 },
      { id: 'hardware', label: 'Hardware & IoT', icon: Cpu },
    ];
  } else if (isDriver(currentUser)) {
    navItems = [
      { id: 'driverroute', label: 'Multi-Hospital Route', icon: Truck, isLive: true },
      { id: 'pickups', label: 'Pickup Manifests', icon: ClipboardList, count: stats?.recentPickupsCount },
      { id: 'livemap', label: 'Facility Map', icon: MapPin },
    ];
  } else if (isSupervisor(currentUser)) {
    navItems = [
      { id: 'dashboard', label: 'Hospital Dashboard', icon: LayoutDashboard },
      { id: 'staff', label: 'Workforce Roster', icon: Users, count: stats?.totalWorkersCount },
      { id: 'registry', label: 'Waste Registry', icon: ClipboardList, count: stats?.totalBags },
      { id: 'driverroute', label: 'Driver Status', icon: Truck, isLive: true },
      { id: 'compliance', label: 'Compliance & Audit', icon: FileCheck2 },
      { id: 'hardware', label: 'Hardware & IoT', icon: Cpu },
    ];
  } else {
    // Hospital staff
    navItems = [
      { id: 'staffportal', label: 'Waste Station', icon: ClipboardList, count: stats?.totalBags },
      { id: 'staff', label: 'Hospital Team', icon: Users },
      { id: 'driverroute', label: 'Driver Transit', icon: Truck },
    ];
  }

  return (
    <aside
      className={`hidden md:flex flex-col bg-white/95 dark:bg-slate-950/95 border-r border-slate-200 dark:border-slate-800/80 transition-all duration-300 select-none shrink-0 sticky top-16 h-[calc(100vh-4rem)] z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header & Collapse Toggle */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">
              {isSuperMonitor(currentUser) ? 'State Apex Grid' : 'Facility Console'}
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          )}
        </button>
      </div>

      {/* Quick Action Button */}
      {!isDriver(currentUser) && (
        <div className="p-3">
          <button
            onClick={onOpenLogModal}
            className={`w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-700/20 ${
              isCollapsed ? 'p-2.5' : 'py-2.5 px-3'
            }`}
            title="Log New Biohazard Bag"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Log Waste Bag</span>}
          </button>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 rounded-xl text-xs font-semibold transition-all duration-150 relative group ${
                isCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {/* Live badge */}
              {item.isLive && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}

              {/* Count badge */}
              {!isCollapsed && item.count !== undefined && item.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40">
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span>BioNet SLAM</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% ONLINE</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-slate-400" />
                <span>Cloud Target</span>
              </span>
              <span className={mongoConnected ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-sky-600 dark:text-sky-400 font-medium"}>
                {mongoConnected ? "Mongo Atlas" : "Local Store"}
              </span>
            </div>
            <div className="text-[11px] text-slate-800 dark:text-slate-300 font-medium truncate pt-1 border-t border-slate-100 dark:border-slate-800/60">
              {currentUser?.name || 'Authorized User'}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5" title={`BioNet Telemetry Online • Database: ${mongoConnected ? 'MongoDB Live' : 'Resilient Local Store'}`}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className={`w-1.5 h-1.5 rounded-full ${mongoConnected ? 'bg-emerald-500' : 'bg-sky-500'}`}></span>
          </div>
        )}
      </div>
    </aside>
  );
}
