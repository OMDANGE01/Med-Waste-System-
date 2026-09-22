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
  X
} from 'lucide-react';
import AppLogo from './AppLogo';

export default function CollapsibleSidebar({
  isCollapsed,
  onToggleCollapse,
  activeTab,
  setActiveTab,
  onOpenLogModal,
  currentUser,
  stats,
  apiOnline
}) {
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

  let navItems = [];
  if (isDriver(currentUser)) {
    navItems = [
      { id: 'pickups', label: 'Pickup Manifests', icon: Truck, count: stats?.recentPickupsCount },
      { id: 'livemap', label: 'Transit GPS Route', icon: MapPin, isLive: true },
    ];
  } else if (isSupervisor(currentUser)) {
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'registry', label: 'Waste Registry', icon: ClipboardList, count: stats?.totalBags },
      { id: 'livemap', label: 'Live GPS Map', icon: MapPin, isLive: true },
      { id: 'compliance', label: 'Compliance & Audit', icon: FileCheck2 },
      { id: 'hardware', label: 'Hardware & IoT', icon: Cpu },
    ];
  } else {
    navItems = [
      { id: 'staffportal', label: 'Waste Station', icon: ClipboardList, count: stats?.totalBags },
    ];
  }

  return (
    <aside
      className={`hidden lg:flex flex-col bg-slate-950/95 border-r border-slate-800/80 transition-all duration-300 select-none shrink-0 sticky top-16 h-[calc(100vh-4rem)] z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header & Collapse Toggle */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 truncate">
              Command Suite
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-rose-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Quick Action Button */}
      {!isDriver(currentUser) && (
        <div className="p-3">
          <button
            onClick={onOpenLogModal}
            className={`w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs transition shadow-lg shadow-rose-950/40 ${
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
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950 font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
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
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
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
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>BioNet SLAM</span>
              <span className="text-emerald-400 font-bold">100% ONLINE</span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium truncate">
              {currentUser?.name || 'Authorized User'}
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="BioNet Telemetry Online">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
        )}
      </div>
    </aside>
  );
}
