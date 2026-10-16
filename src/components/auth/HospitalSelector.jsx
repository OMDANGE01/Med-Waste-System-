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
  theme = 'light',
}) {
  const isDark = theme === 'dark';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
          isDark 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        }`}>
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>CPCB Bio-Medical Waste Rules 2016 • Khamgaon Cluster</span>
        </div>
        <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
          isDark ? 'text-slate-100' : 'text-slate-900'
        }`}>
          Hospital & Treatment Facility Selection
        </h1>
        <p className={`text-sm max-w-2xl mx-auto ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Select your registered facility to access the role-authorized staff terminal,
          clinical biohazard logging station, or transit manifest desk.
        </p>
      </div>

      {/* Grid of Khamgaon Hospitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {hospitals.map((hosp) => {
          const isCbwtf = hosp.hospitalId === 'CBWTF-01';
          return (
            <div
              key={hosp.hospitalId}
              onClick={() => onSelectHospital(hosp)}
              className={`group relative rounded-2xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between border ${
                isDark
                  ? 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-emerald-500/40 shadow-lg hover:shadow-emerald-950/30'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-emerald-500/50 shadow-sm hover:shadow-md'
              }`}
            >
              <div>
                {/* Badge & Type */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-2xl">{hosp.icon || (isCbwtf ? '🏭' : '🏥')}</span>
                  <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    isCbwtf 
                      ? (isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200')
                      : (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                  }`}>
                    {hosp.badge || (isCbwtf ? 'CBWTF Plant' : 'Healthcare Facility')}
                  </span>
                </div>

                {/* Hospital Name */}
                <h3 className={`text-lg font-bold transition-colors ${
                  isDark ? 'text-white group-hover:text-emerald-300' : 'text-slate-900 group-hover:text-emerald-700'
                }`}>
                  {hosp.name}
                </h3>

                <p className={`text-xs mt-1 flex items-start gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{hosp.address}</span>
                </p>

                {/* License & Superintendent */}
                <div className={`mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-xs ${
                  isDark ? 'border-slate-800/80' : 'border-slate-100'
                }`}>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">License Code</span>
                    <span className={`font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                      {hosp.cpcbCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Bed Capacity</span>
                    <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                      {hosp.bedCapacity > 0 ? `${hosp.bedCapacity} Beds` : 'Regional Plant'}
                    </span>
                  </div>
                </div>

                {/* Superintendent detail */}
                <div className="mt-3 text-xs">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Superintendent / In-Charge</span>
                  <span className={`truncate block font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {hosp.superintendent}
                  </span>
                </div>

                {/* Waste metrics bar */}
                <div className={`mt-4 p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-500" />
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Daily Logged:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {hosp.dailyWasteKg || 120} kg
                    </span>
                  </div>
                  <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {hosp.pendingKg ? `${hosp.pendingKg} kg pending` : 'All Cleared'}
                  </span>
                </div>
              </div>

              {/* Enter Button */}
              <div className={`mt-5 pt-3 border-t flex items-center justify-between font-semibold text-xs ${
                isDark
                  ? 'border-slate-800/60 text-emerald-400 group-hover:text-emerald-300'
                  : 'border-slate-100 text-emerald-700 group-hover:text-emerald-800'
              }`}>
                <span>Enter Hospital Portal</span>
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${
                  isDark
                    ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20 border-emerald-500/20'
                    : 'bg-emerald-50 group-hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                }`}>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance Notice */}
      <div className={`p-4 rounded-2xl border text-center max-w-xl mx-auto flex items-center justify-center gap-2 text-xs ${
        isDark
          ? 'bg-slate-900/60 border-slate-800 text-slate-400'
          : 'bg-white border-slate-200 text-slate-600 shadow-xs'
      }`}>
        <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>Strict compliance with CPCB 48-Hour Barcode Segregation & Barcode Tracking Protocol.</span>
      </div>
    </div>
  );
}
