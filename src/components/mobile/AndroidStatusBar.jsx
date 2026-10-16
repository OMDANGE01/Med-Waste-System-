import React, { useState, useEffect } from 'react';

/**
 * Android Material 3 Status Bar
 * Displays live device clock and CPCB online telemetry.
 */
export default function AndroidStatusBar() {
  const [timeStr, setTimeStr] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-7 px-4 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 flex items-center justify-between text-[11px] font-medium tracking-tight select-none border-b border-slate-200 dark:border-slate-900 z-50">
      {/* Left: Device Clock & CPCB Notification Badge */}
      <div className="flex items-center space-x-2">
        <span className="font-semibold text-slate-800 dark:text-white font-mono">{timeStr}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="CPCB Telemetry Online" />
      </div>
    </div>
  );
}
