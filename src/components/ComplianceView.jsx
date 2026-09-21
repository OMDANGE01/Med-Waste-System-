import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  PlusCircle, 
  CheckCircle2, 
  Flame, 
  Recycle, 
  Scissors, 
  Wine, 
  Printer, 
  Calendar, 
  UserCheck,
  Building2,
  HelpCircle
} from 'lucide-react';

export default function ComplianceView({
  incidents,
  isLoadingIncidents,
  onOpenIncidentModal,
  wasteRecords,
  stats
}) {
  const [activeTab, setActiveTab] = useState('incidents'); // 'incidents' | 'rules' | 'manifest'

  const guidelines = [
    {
      color: 'Yellow',
      name: 'Yellow Category',
      bagType: 'Non-chlorinated yellow plastic bags',
      wasteTypes: 'Human anatomical waste, animal waste, soiled dressings, casts, expired cytotoxic medicines, chemical and microbiology lab cultures.',
      treatment: 'Incineration (temp >= 1050°C in secondary chamber) or Plasma Pyrolysis / Deep Burial in remote zones.',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      icon: Flame
    },
    {
      color: 'Red',
      name: 'Red Category',
      bagType: 'Non-chlorinated red plastic bags or containers',
      wasteTypes: 'Contaminated recyclable waste generated from disposable items: tubing, bottles, intravenous tubes and sets, catheters, urine bags, syringes (without needles).',
      treatment: 'Autoclaving or microwaving or hydroclaving followed by shredding or mutilation. Sent to registered recyclers.',
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/30',
      icon: Recycle
    },
    {
      color: 'White',
      name: 'White (Translucent)',
      bagType: 'Puncture-proof, leak-proof, tamper-proof container',
      wasteTypes: 'Waste sharps including needles, syringes with fixed needles, needles from needle tip cutter or burner, scalpels, blades, contaminated sharp objects.',
      treatment: 'Autoclaving or Dry Heat Sterilization followed by shredding or mutilation or encapsulation in metal/concrete.',
      textColor: 'text-slate-200',
      bgColor: 'bg-slate-700/40 border-slate-500/40',
      icon: Scissors
    },
    {
      color: 'Blue',
      name: 'Blue Category',
      bagType: 'Puncture-proof and leak-proof boxes or cardboard with blue marking',
      wasteTypes: 'Broken or discarded and contaminated glass including medicine vials and ampoules, metallic body implants, orthopedic hardware.',
      treatment: 'Disinfection (by soaking in sodium hypochlorite) or through autoclaving / microwaving / hydroclaving and recycling.',
      textColor: 'text-sky-400',
      bgColor: 'bg-sky-500/10 border-sky-500/30',
      icon: Wine
    },
  ];

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'High':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Moderate':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Compliance & Regulatory Audit</h1>
          <p className="text-slate-400 text-sm">
            Adherence monitoring for CPCB Bio-medical Waste Management Rules & Hospital Safety Audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Audit Log</span>
          </button>
          <button
            onClick={onOpenIncidentModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-950 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Safety Incident</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'incidents'
              ? 'bg-slate-800 text-white border border-slate-700 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Incident & Spill Log ({incidents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'rules'
              ? 'bg-slate-800 text-white border border-slate-700 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Statutory Color Guidelines</span>
        </button>

        <button
          onClick={() => setActiveTab('manifest')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'manifest'
              ? 'bg-slate-800 text-white border border-slate-700 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-sky-400" />
          <span>Statutory Manifest Preview</span>
        </button>
      </div>

      {/* TAB 1: INCIDENTS LOG */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Compliance Standard: High</div>
                <div className="text-xs text-slate-400">All recorded safety incidents have documented corrective interventions.</div>
              </div>
            </div>
            <span className="text-xl font-bold text-emerald-400 font-mono">{stats?.complianceScore || 98}%</span>
          </div>

          <div className="space-y-3">
            {isLoadingIncidents ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : incidents.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 text-sm">
                No compliance incidents reported. Clean safety audit!
              </div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc._id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-white">{inc.incidentId}</span>
                      <span className="text-sm font-semibold text-slate-200">• {inc.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity} Severity
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {inc.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(inc.reportedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Incident Description */}
                  <div className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="font-semibold text-slate-200">Incident Report: </span>
                    {inc.description}
                  </div>

                  {/* Corrective Action Taken */}
                  <div className="text-xs text-emerald-300 bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-emerald-400">Corrective Action Implemented: </span>
                      {inc.correctiveAction}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>Reported by: <strong className="text-slate-300">{inc.reportedBy}</strong></span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-medium">Status: {inc.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REGULATORY COLOR GUIDELINES */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {guidelines.map((guide) => {
            const Icon = guide.icon;
            return (
              <div
                key={guide.color}
                className={`p-6 rounded-2xl bg-slate-900/90 border ${guide.bgColor} shadow-lg space-y-4`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${guide.textColor}`} />
                    <h3 className={`font-bold text-lg ${guide.textColor}`}>{guide.name}</h3>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Rule Schedule I
                  </span>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Receptacle Container</div>
                  <div className="text-sm font-medium text-slate-200">{guide.bagType}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Waste Classification</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{guide.wasteTypes}</p>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Prescribed Treatment Option</div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">{guide.treatment}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: STATUTORY MANIFEST PREVIEW */}
      {activeTab === 'manifest' && (
        <div className="p-8 rounded-2xl bg-white text-slate-900 shadow-2xl space-y-6 font-sans border border-slate-300">
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <h2 className="text-xl font-black uppercase tracking-wide">Hospital Bio-Medical Waste Transfer Manifest</h2>
            <p className="text-xs text-slate-600 mt-1 font-semibold">Form VI • Central Pollution Control Board (CPCB) Regulatory Copy</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 p-4 rounded-lg bg-slate-50">
            <div>
              <p><strong>Health Care Facility:</strong> St. Jude Medical Center</p>
              <p><strong>License Authorization:</strong> HCF-BMW-2026-9941</p>
              <p><strong>Facility Contact:</strong> Biohazard Safety Division Ext 404</p>
            </div>
            <div>
              <p><strong>Authorized CBWTF:</strong> Apex Bio-Clean & Incineration Services</p>
              <p><strong>Manifest Generated:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Audit Status:</strong> In Good Standing (100% Certified)</p>
            </div>
          </div>

          <table className="w-full text-xs text-left border border-slate-300">
            <thead>
              <tr className="bg-slate-200 border-b border-slate-300 text-slate-800">
                <th className="p-2 border-r border-slate-300">Category</th>
                <th className="p-2 border-r border-slate-300">Total Bags</th>
                <th className="p-2 border-r border-slate-300">Weight (kg)</th>
                <th className="p-2">Mandatory Treatment Route</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2 border-r border-slate-300 font-bold text-amber-700">Yellow (Infectious/Anatomical)</td>
                <td className="p-2 border-r border-slate-300">{stats?.categoryBreakdown?.Yellow?.count || 0}</td>
                <td className="p-2 border-r border-slate-300 font-mono">{stats?.categoryBreakdown?.Yellow?.weightKg || 0} kg</td>
                <td className="p-2">High-Temp Incineration</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 border-r border-slate-300 font-bold text-rose-700">Red (Contaminated Plastics)</td>
                <td className="p-2 border-r border-slate-300">{stats?.categoryBreakdown?.Red?.count || 0}</td>
                <td className="p-2 border-r border-slate-300 font-mono">{stats?.categoryBreakdown?.Red?.weightKg || 0} kg</td>
                <td className="p-2">Autoclaving & Shredding</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 border-r border-slate-300 font-bold text-slate-700">White (Waste Sharps)</td>
                <td className="p-2 border-r border-slate-300">{stats?.categoryBreakdown?.White?.count || 0}</td>
                <td className="p-2 border-r border-slate-300 font-mono">{stats?.categoryBreakdown?.White?.weightKg || 0} kg</td>
                <td className="p-2">Sterilization & Encapsulation</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-300 font-bold text-blue-700">Blue (Glass & Implants)</td>
                <td className="p-2 border-r border-slate-300">{stats?.categoryBreakdown?.Blue?.count || 0}</td>
                <td className="p-2 border-r border-slate-300 font-mono">{stats?.categoryBreakdown?.Blue?.weightKg || 0} kg</td>
                <td className="p-2">Chemical Disinfection</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold">
                <td className="p-2 border-r border-slate-300">Total Batch Volume</td>
                <td className="p-2 border-r border-slate-300">{stats?.totalBags || 0} bags</td>
                <td className="p-2 border-r border-slate-300 font-mono text-slate-900">{stats?.totalWeightKg || 0} kg</td>
                <td className="p-2 text-slate-600">Verified by Certified Weigh-Bridge</td>
              </tr>
            </tfoot>
          </table>

          <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-slate-700">
            <div className="border-t border-slate-400 pt-2 text-center">
              <p className="font-bold">Medical Superintendent / Authorized HCF Officer</p>
              <p className="text-[10px] text-slate-500">St. Jude Medical Center Biohazard Verification</p>
            </div>
            <div className="border-t border-slate-400 pt-2 text-center">
              <p className="font-bold">Authorized CBWTF Transport Custodian</p>
              <p className="text-[10px] text-slate-500">Apex Bio-Clean & Incineration Services</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
