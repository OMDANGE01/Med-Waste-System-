import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Truck, 
  FileCheck2, 
  PlusCircle, 
  Building2, 
  Users,
  MapPin,
  ShieldCheck
} from 'lucide-react';

/**
 * Material Design 3 Bottom Navigation Bar
 * Follows Android guidelines with pill selection indicators, labels, and haptic response.
 */
export default function MaterialBottomNav({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenLogModal,
  stats,
}) {
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
  };

  const handleTabClick = (tabId) => {
    triggerHaptic();
    setActiveTab(tabId);
  };

  // Determine authorized tabs per role
  const isSuperMonitor = (user) => {
    if (!user) return false;
    const r = (user.role || '').toLowerCase();
    const e = (user.email || '').toLowerCase();
    return user.hospitalId === 'ALL' || e.includes('supermonitor') || r.includes('monitor');
  };

  const isDriver = (user) => {
    if (!user || !user.role) return false;
    const r = user.role.toLowerCase();
    return r.includes('driver') || r.includes('custodian') || r.includes('transport');
  };

  const isSupervisor = (user) => {
    if (!user || !user.role) return false;
    if (isSuperMonitor(user)) return false;
    const r = user.role.toLowerCase();
    return r.includes('superintendent') || r.includes('supervisor') || r.includes('admin') || r.includes('officer');
  };

  let tabs = [];

  if (isSuperMonitor(currentUser)) {
    tabs = [
      { id: 'supermonitor', label: 'Network', icon: Building2 },
      { id: 'driverroute', label: 'Fleet', icon: Truck },
      { id: 'registry', label: 'Registry', icon: ClipboardList, badge: stats?.totalBags },
      { id: 'compliance', label: 'Audit Trail', icon: FileCheck2 },
    ];
  } else if (isDriver(currentUser)) {
    tabs = [
      { id: 'driverroute', label: 'Route', icon: Truck },
      { id: 'pickups', label: 'Manifests', icon: ClipboardList, badge: stats?.recentPickupsCount },
      { id: 'livemap', label: 'Live GPS', icon: MapPin },
    ];
  } else if (isSupervisor(currentUser)) {
    tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'registry', label: 'Registry', icon: ClipboardList, badge: stats?.totalBags },
      { id: 'driverroute', label: 'Transit', icon: Truck },
      { id: 'compliance', label: 'Compliance', icon: FileCheck2 },
      { id: 'staff', label: 'Staff', icon: Users },
    ];
  } else {
    // Ward Nurses, Doctors, Waste Staff
    tabs = [
      { id: 'staffportal', label: 'Ward Station', icon: ClipboardList, badge: stats?.totalBags },
      { id: 'registry', label: 'Registry', icon: ClipboardList },
      { id: 'driverroute', label: 'Van Arrival', icon: Truck },
    ];
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-lg pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-1 transition-all group relative cursor-pointer"
            >
              {/* Material 3 Active Pill Indicator */}
              <div
                className={`relative px-4 py-1 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-105' : ''} transition-transform`} />

                {/* Badge count */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500 text-slate-950 font-mono">
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] mt-1 font-medium tracking-tight transition-colors ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Center Quick Action: Log Waste (Only for clinical / waste staff) */}
        {!isDriver(currentUser) && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              if (onOpenLogModal) onOpenLogModal();
            }}
            className="flex flex-col items-center justify-center px-2 py-1 group cursor-pointer"
            title="Log Bio-Medical Waste Bag"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 active:scale-95 transition-all">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] mt-1 font-bold text-emerald-400">Log Bag</span>
          </button>
        )}
      </div>
    </div>
  );
}
