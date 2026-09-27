import React from 'react';
import { 
  Building2, 
  ChevronRight, 
  MapPin, 
  ShieldCheck, 
  Scale,
  Shield,
  FileCheck,
  Smartphone,
  Download
} from 'lucide-react';

/**
 * Interface 1: Hospital Login Selection Interface
 * Displays the verified healthcare institutions of Khamgaon (MH-56 / MH-28)
 * strictly pulled from the database backend.
 */
export default function HospitalSelector({ 
  hospitals = [], 
  onSelectHospital,
  onOpenApkModal,
}) {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>CPCB Bio-Medical Waste Rules 2016 • Khamgaon Cluster</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Hospital & Treatment Facility Selection
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Select your registered facility to access the role-authorized staff terminal,
          clinical biohazard logging station, or transit manifest desk.
        </p>

        {/* Quick APK Download Action Callout */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/api/download/apk"
            download="medwaste-guard-khamgaon-v1.0.0.apk"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all shadow-md shadow-emerald-950/20 hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Android APK (v1.0.0)</span>
          </a>
          {onOpenApkModal && (
            <button
              type="button"
              onClick={onOpenApkModal}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-slate-300 text-xs font-semibold transition"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Install Instructions & QR</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Khamgaon Hospitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {hospitals.map((hosp) => {
          const isCbwtf = hosp.hospitalId === 'CBWTF-01';
          return (
            <div
              key={hosp.hospitalId}
              onClick={() => onSelectHospital(hosp)}
              className="group relative bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-emerald-950/30 flex flex-col justify-between"
            >
              <div>
                {/* Badge & Type */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-2xl">{hosp.icon || (isCbwtf ? '🏭' : '🏥')}</span>
                  <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    isCbwtf 
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {hosp.badge || (isCbwtf ? 'CBWTF Plant' : 'Healthcare Facility')}
                  </span>
                </div>

                {/* Hospital Name */}
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {hosp.name}
                </h3>

                <p className="text-xs text-slate-400 mt-1 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{hosp.address}</span>
                </p>

                {/* License & Superintendent */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">License Code</span>
                    <span className="font-mono text-slate-300 font-semibold">{hosp.cpcbCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Bed Capacity</span>
                    <span className="font-medium text-slate-300">
                      {hosp.bedCapacity > 0 ? `${hosp.bedCapacity} Beds` : 'Regional Plant'}
                    </span>
                  </div>
                </div>

                {/* Superintendent detail */}
                <div className="mt-3 text-xs text-slate-400">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Superintendent / In-Charge</span>
                  <span className="text-slate-300 truncate block">{hosp.superintendent}</span>
                </div>

                {/* Waste metrics bar */}
                <div className="mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-400">Daily Logged:</span>
                    <span className="font-bold text-emerald-400 font-mono">{hosp.dailyWasteKg || 120} kg</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {hosp.pendingKg ? `${hosp.pendingKg} kg pending` : 'All Cleared'}
                  </span>
                </div>
              </div>

              {/* Enter Button */}
              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-emerald-400 group-hover:text-emerald-300 font-medium text-xs">
                <span>Enter Hospital Portal</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance Notice */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center max-w-xl mx-auto flex items-center justify-center gap-2 text-xs text-slate-400">
        <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Strict compliance with CPCB 48-Hour Barcode Segregation & Barcode Tracking Protocol.</span>
      </div>
    </div>
  );
}
