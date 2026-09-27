import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, SignalHigh } from 'lucide-react';

/**
 * Android Material 3 Status Bar
 * Displays live native device clock, 5G carrier status, WiFi, and battery telemetry.
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
    <div className="w-full h-7 px-4 bg-slate-950 text-slate-300 flex items-center justify-between text-[11px] font-medium tracking-tight select-none border-b border-slate-900 z-50">
      {/* Left: Device Clock & CPCB Notification Badge */}
      <div className="flex items-center space-x-2">
        <span className="font-semibold text-white font-mono">{timeStr}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="CPCB Telemetry Online" />
      </div>

      {/* Right: Cellular 5G, Wi-Fi & Battery */}
      <div className="flex items-center space-x-2 text-slate-400">
        <span className="text-[10px] font-bold text-slate-300 font-mono">5G</span>
        <SignalHigh className="w-3.5 h-3.5 text-slate-300" />
        <Wifi className="w-3.5 h-3.5 text-slate-300" />
        <div className="flex items-center space-x-1">
          <span className="text-[10px] font-mono text-slate-300">88%</span>
          <BatteryMedium className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
    </div>
  );
}
