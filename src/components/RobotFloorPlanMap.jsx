import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  BatteryCharging, 
  Crosshair, 
  MapPin, 
  Sparkles, 
  AlertCircle, 
  RotateCw, 
  Zap,
  Shield,
  Layers
} from 'lucide-react';

const WARDS = [
  { id: 'dock', name: 'Docking Base Alpha', x: 12, y: 15, w: 22, h: 20, color: 'emerald', type: 'Charging & Service' },
  { id: 'ot', name: 'Operating Theaters (OT-1 & 2)', x: 40, y: 12, w: 26, h: 24, color: 'rose', type: 'Surgical Sharps' },
  { id: 'icu', name: 'ICU Isolation Wing', x: 72, y: 12, w: 22, h: 24, color: 'amber', type: 'Bio-Infectious' },
  { id: 'corridor', name: 'Main Transport Corridor', x: 12, y: 44, w: 82, h: 14, color: 'slate', type: 'Transit Artery' },
  { id: 'er', name: 'Emergency Trauma Center', x: 12, y: 64, w: 26, h: 24, color: 'rose', type: 'Rapid Triage' },
  { id: 'chute', name: 'Waste Compactor Bay', x: 44, y: 64, w: 20, h: 24, color: 'amber', type: 'Discharge Node' },
  { id: 'pathology', name: 'Pathology & Diagnostic Lab', x: 70, y: 64, w: 24, h: 24, color: 'sky', type: 'Glass & Specimen' },
];

export default function RobotFloorPlanMap({ 
  robotData, 
  onCommand, 
  isAutonomousPatrol = true 
}) {
  const [selectedWard, setSelectedWard] = useState(null);
  const [robotPos, setRobotPos] = useState({ x: 50, y: 50 });
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [patrolIndex, setPatrolIndex] = useState(0);

  const WAYPOINTS = [
    { x: 50, y: 50, name: 'Main Transport Corridor' },
    { x: 53, y: 24, name: 'OT-2 Scrub & Prep' },
    { x: 82, y: 24, name: 'ICU Isolation' },
    { x: 50, y: 50, name: 'Crossroads Corridor' },
    { x: 24, y: 76, name: 'Emergency Trauma' },
    { x: 54, y: 76, name: 'Waste Compactor Bay' },
    { x: 82, y: 76, name: 'Pathology Lab' },
    { x: 22, y: 24, name: 'Docking Base Alpha' }
  ];

  // Auto-patrol simulation when robot is active
  useEffect(() => {
    if (robotData?.autoDockStatus === 'Charging') {
      setTargetPos({ x: 22, y: 24 });
      setRobotPos({ x: 22, y: 24 });
      return;
    }

    if (robotData?.status !== 'ONLINE' || robotData?.autoDockStatus === 'Idle') {
      return;
    }

    const interval = setInterval(() => {
      setPatrolIndex((prev) => {
        const next = (prev + 1) % WAYPOINTS.length;
        setTargetPos(WAYPOINTS[next]);
        return next;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [robotData?.autoDockStatus, robotData?.status]);

  // Smooth lerp movement toward target
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setRobotPos((curr) => {
        const dx = targetPos.x - curr.x;
        const dy = targetPos.y - curr.y;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return curr;
        return {
          x: curr.x + dx * 0.15,
          y: curr.y + dy * 0.15,
        };
      });
    }, 60);

    return () => clearInterval(stepInterval);
  }, [targetPos]);

  const handleWardClick = (ward) => {
    setSelectedWard(ward);
    setTargetPos({ x: ward.x + ward.w / 2, y: ward.y + ward.h / 2 });
    if (onCommand) {
      onCommand('navigate', ward.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-500" />
            Hospital Level 2 Floor Plan Grid (Autonomous Rover NavMesh)
          </h4>
          <p className="text-xs text-slate-400">
            Click any clinical zone to dispatch the bio-waste rover or monitor live patrol path.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            LiDAR SLAM Active
          </span>
          <span className="font-mono text-slate-400">Grid: 100 x 100 m</span>
        </div>
      </div>

      {/* Interactive Floor Plan Grid Container */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden shadow-inner select-none">
        {/* Architectural Grid Lines */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #475569 1px, transparent 1px),
              linear-gradient(to bottom, #475569 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Patrol Route Polyline Background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <polyline
            points="22,24 53,24 82,24 50,50 24,76 54,76 82,76 50,50 22,24"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.35"
          />
        </svg>

        {/* Clinical Ward Blocks */}
        {WARDS.map((ward) => {
          const isSelected = selectedWard?.id === ward.id;
          let borderTheme = 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80';
          let badgeText = 'text-slate-400';

          if (ward.color === 'emerald') {
            borderTheme = 'border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-500/60';
            badgeText = 'text-emerald-400';
          } else if (ward.color === 'rose') {
            borderTheme = 'border-rose-500/40 bg-rose-950/20 hover:border-rose-500/60';
            badgeText = 'text-rose-400';
          } else if (ward.color === 'amber') {
            borderTheme = 'border-amber-500/40 bg-amber-950/20 hover:border-amber-500/60';
            badgeText = 'text-amber-400';
          } else if (ward.color === 'sky') {
            borderTheme = 'border-sky-500/40 bg-sky-950/20 hover:border-sky-500/60';
            badgeText = 'text-sky-400';
          }

          return (
            <button
              key={ward.id}
              onClick={() => handleWardClick(ward)}
              style={{
                left: `${ward.x}%`,
                top: `${ward.y}%`,
                width: `${ward.w}%`,
                height: `${ward.h}%`,
              }}
              className={`absolute p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all backdrop-blur-xs group cursor-pointer ${borderTheme} ${
                isSelected ? 'ring-2 ring-rose-500 scale-[1.01]' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${badgeText}`}>
                    {ward.id === 'dock' ? '⚡ Dock Station' : ward.id.toUpperCase()}
                  </span>
                  {ward.id === 'dock' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                      Base #1
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-white leading-tight mt-0.5 group-hover:text-rose-300 transition">
                  {ward.name}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{ward.type}</span>
                <span className="opacity-0 group-hover:opacity-100 text-rose-400 font-bold transition">
                  Dispatch &rarr;
                </span>
              </div>
            </button>
          );
        })}

        {/* Autonomous Robot Rover Visual Node */}
        <div
          style={{
            left: `${robotPos.x}%`,
            top: `${robotPos.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute z-20 pointer-events-none transition-all duration-75 flex flex-col items-center"
        >
          {/* LiDAR Scan Arc Pulse */}
          <div className="absolute -top-3 w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/50 animate-ping"></div>

          {/* Robot Badge */}
          <div className="px-2 py-0.5 rounded-md bg-slate-950/90 text-white font-mono text-[9px] font-bold border border-rose-500 shadow-2xl mb-1 flex items-center gap-1 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>BIO-BOT-01</span>
            {robotData?.autoDockStatus === 'Charging' && <span className="text-emerald-400">⚡</span>}
          </div>

          {/* Physical Rover Icon */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-700 via-rose-600 to-rose-500 border-2 border-white flex items-center justify-center text-white shadow-2xl shadow-rose-950">
            <Navigation className="w-4 h-4 fill-white transform rotate-45" />
          </div>
        </div>

        {/* Live Map Legend Overlay */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Rover Position: ({Math.round(robotPos.x)}, {Math.round(robotPos.y)})</span>
            </span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline text-slate-300">
              State: <strong className="text-white">{robotData?.autoDockStatus || 'Active Patrol'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-[10px]">99.8% Dock Calibrated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
