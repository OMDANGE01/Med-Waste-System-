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
  ShieldCheck,
  QrCode
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
  onOpenQRModal,
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
      { id: 'registry', label: 'Pick Bags', icon: ClipboardList, badge: stats?.totalBags },
      { id: 'pickups', label: 'Manifests', icon: FileCheck2 },
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md pb-safe shadow-lg transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className="flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 transition-all group relative cursor-pointer"
            >
              {/* Material 3 Active Pill Indicator */}
              <div
                className={`relative px-4 py-1 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 ring-1 ring-emerald-300 dark:ring-emerald-500/40'
                    : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-105' : ''} transition-transform`} />

                {/* Badge count */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-600 text-white font-mono shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] mt-1 tracking-tight transition-colors ${
                  isActive ? 'text-emerald-800 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400 font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Center Quick Action: Drivers get Scan & Pick, Clinical staff get Log Bag */}
        {isDriver(currentUser) ? (
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              if (onOpenQRModal) onOpenQRModal();
            }}
            className="flex flex-col items-center justify-center px-2 py-1 group cursor-pointer min-h-[48px]"
            title="Scan QR / Barcode to Pick or Deliver Bag"
          >
            <div className="w-11 h-11 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-900/30 active:scale-95 transition-all">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-[10px] mt-0.5 font-bold text-purple-700 dark:text-purple-400">Scan & Pick</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              if (onOpenLogModal) onOpenLogModal();
            }}
            className="flex flex-col items-center justify-center px-2 py-1 group cursor-pointer min-h-[48px]"
            title="Log Bio-Medical Waste Bag"
          >
            <div className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-700/25 active:scale-95 transition-all">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] mt-0.5 font-bold text-emerald-800 dark:text-emerald-400">Log Bag</span>
          </button>
        )}
      </div>
    </div>
  );
}
