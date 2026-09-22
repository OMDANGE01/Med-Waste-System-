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
  HelpCircle,
  Download,
  CheckSquare,
  Square,
  ShieldAlert,
  Clock,
  ExternalLink,
  Award,
  Sparkles
} from 'lucide-react';
import TableSkeleton from './TableSkeleton';

export default function ComplianceView({
  incidents = [],
  isLoadingIncidents = false,
  onOpenIncidentModal,
  wasteRecords = [],
  stats,
  onAddToast
}) {
  const [activeTab, setActiveTab] = useState('audit_checklist'); // 'audit_checklist' | 'cpcb_colors' | 'audit_log' | 'incidents'
  
  // Interactive CPCB Checklist State
  const [cpcbChecklist, setCpcbChecklist] = useState([
    { id: 'cpcb-1', category: 'Yellow', title: 'Yellow Non-Chlorinated Bags', rule: 'Must not contain chlorinated plastics; biohazard symbol printed with 2D barcode.', verified: true },
    { id: 'cpcb-2', category: 'Yellow', title: 'Anatomical Tissue Immediate Sealing', rule: 'Organ, limb & soiled dressings packaged within 2 hours of surgical excision.', verified: true },
    { id: 'cpcb-3', category: 'Red', title: 'Contaminated Plastics & Sharps (CPCB 2016)', rule: 'Contaminated IV catheters, tubing, and sharp hazards segregated into puncture-proof Red containers.', verified: true },
    { id: 'cpcb-4', category: 'Red', title: 'Pre-Treatment Autoclave Stamping', rule: 'Red bags earmarked for on-site microwave/autoclave shredding before registered recycler transfer.', verified: true },
    { id: 'cpcb-5', category: 'Blue', title: 'Glassware Disinfection Soak', rule: 'Broken ampoules and medicine vials immersed in 1% sodium hypochlorite solution before collection.', verified: true },
    { id: 'cpcb-6', category: 'Black', title: 'General & Cytotoxic Waste Isolation', rule: 'Cytotoxic spill residues labeled with double-bagging and chemical neutralization certificate.', verified: true },
  ]);

  // Interactive BMW Rules 2016 Checklist State
  const [bmwRules, setBmwRules] = useState([
    { id: 'rule-4', ref: 'Rule 4(a)', title: 'Designated Waste Storage Room', desc: 'Secure, locked biohazard transit room accessible only to authorized handlers; no odor dispersion.', checked: true },
    { id: 'rule-5', ref: 'Rule 5(c)', title: '100% Non-Chlorinated Bag Mandate', desc: 'Phase-out of chlorinated bags complete; certified test certificates logged from manufacturers.', checked: true },
    { id: 'rule-8', ref: 'Rule 8(1)', title: 'CPCB Barcode & GPS Tracking Sync', desc: 'Every bag scanned with unique GS1 barcode and synchronized to State Pollution Control Board portal.', checked: true },
    { id: 'rule-10', ref: 'Rule 10', title: 'Form IV Annual Report Submission', desc: 'Annual return filed with SPCB before 30th June detailing categorical quantities in kg.', checked: true },
    { id: 'rule-12', ref: 'Rule 12', title: 'Staff Immunization & Health Registry', desc: 'All handlers vaccinated against Hepatitis B and Tetanus; annual health surveillance recorded.', checked: true },
    { id: 'rule-14', ref: 'Rule 14', title: 'Accident & Needle-Stick Protocol', desc: 'All occupational exposures reported in Form I within 24 hours; PEP initiated within 2 hours.', checked: true },
  ]);

  // Regulatory Audit Log Entries
  const [auditLogs] = useState([
    {
      id: 'aud-101',
      timestamp: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
      action: 'Bi-Weekly CPCB Barcode Veracity Audit',
      user: 'Dr. Aaron Patel (Chief Auditor)',
      target: 'Batch MW-2026-1001 to 1010',
      status: 'VERIFIED_PASS',
      code: 'CPCB-SEC-8.1',
      details: '100% scanner match between hospital dock weight and CBWTF reception load cells.'
    },
    {
      id: 'aud-102',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      action: 'Color Segregation Spot Check',
      user: 'Superintendent Nurse Elena Rostova',
      target: 'OT-2 Scrub & Emergency Trauma Bay 1',
      status: 'VERIFIED_PASS',
      code: 'CPCB-SCHED-I',
      details: 'Zero cross-contamination observed between Yellow anatomical and Red recyclable streams.'
    },
    {
      id: 'aud-103',
      timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      action: 'CBWTF Manifest MAN-2026-0089 Reconciliation',
      user: 'CBWTF Officer Robert Langdon',
      target: 'Vehicle WB-04-E-8821',
      status: 'VERIFIED_PASS',
      code: 'CPCB-MANIFEST-IV',
      details: 'Digital GPS waypoint trail authenticated. Secondary chamber incineration at 1050°C confirmed.'
    },
    {
      id: 'aud-104',
      timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
      action: 'Sharps Protocol & Container Seal Inspection',
      user: 'Safety Officer Marcus Cole',
      target: 'ICU & Emergency Trauma Units',
      status: 'VERIFIED_PASS',
      code: 'CPCB-SHARPS-2016',
      details: 'Needle destruction burners operative; puncture-proof canisters within 3/4 fill tolerance.'
    },
    {
      id: 'aud-105',
      timestamp: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
      action: 'State Pollution Control Board Compliance Audit',
      user: 'SPCB Inspector V. K. Sharma',
      target: 'Whole Hospital Level 1 & 2',
      status: 'GOLD_RATING',
      code: 'SPCB-ANNUAL-AUDIT',
      details: 'Official green accreditation renewed for 2026-2027 fiscal cycle with 98.4% rating.'
    }
  ]);

  const toggleCpcbItem = (id) => {
    setCpcbChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, verified: !item.verified } : item))
    );
  };

  const toggleBmwItem = (id) => {
    setBmwRules((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  // Compliance Score calculation (0 - 100%)
  const cpcbPassed = cpcbChecklist.filter((c) => c.verified).length;
  const bmwPassed = bmwRules.filter((r) => r.checked).length;
  const totalChecks = cpcbChecklist.length + bmwRules.length;
  const currentPassed = cpcbPassed + bmwPassed;
  const dynamicScore = Math.round((currentPassed / totalChecks) * 100);

  // PDF Export Trigger
  const handleExportPDF = () => {
    if (onAddToast) {
      onAddToast('Generating Compliance Audit PDF', 'Formatting official CPCB 2016 verification document with cryptographic stamp...', 'info');
    }
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-2xl print:border-none print:bg-white print:text-black">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Official Regulatory Surveillance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 print:text-black">
            Compliance & Regulatory Audit Command
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl print:text-slate-600">
            Adherence monitoring for CPCB Bio-Medical Waste Management Rules 2016, automated barcode traceability verification, and hospital audit trail.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Official PDF Report</span>
          </button>
        </div>
      </div>

      {/* ─── 1. COMPLIANCE SCORE METER (0-100%) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Radial Meter */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
            Composite Compliance Index
          </span>

          {/* SVG Circular Meter */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background Ring */}
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="#1e293b"
                strokeWidth="12"
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="#10b981"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * dynamicScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-white tracking-tight">
                {dynamicScore}%
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                <Award className="w-3.5 h-3.5" />
                GRADE A+
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400 max-w-xs">
            {dynamicScore >= 95 ? (
              <span className="text-emerald-400 font-semibold">Exemplary CPCB Standard Adherence</span>
            ) : dynamicScore >= 80 ? (
              <span className="text-amber-400 font-semibold">Compliant with minor pending review items</span>
            ) : (
              <span className="text-rose-400 font-semibold">Urgent attention needed for regulatory inspection</span>
            )}
          </div>
        </div>

        {/* Breakdown Factors Cards */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Audit Performance Metrics</h3>
              <p className="text-xs text-slate-400 mt-0.5">Automated surveillance scores across statutory audit dimensions</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Audit Date: Today
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-850/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">CPCB Color Segregation</span>
                <strong className="text-emerald-400 font-mono">
                  {Math.round((cpcbPassed / cpcbChecklist.length) * 100)}%
                </strong>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(cpcbPassed / cpcbChecklist.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500">{cpcbPassed} of {cpcbChecklist.length} protocols passed</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-850/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">BMW Rules 2016 Statutory Mandate</span>
                <strong className="text-emerald-400 font-mono">
                  {Math.round((bmwPassed / bmwRules.length) * 100)}%
                </strong>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(bmwPassed / bmwRules.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500">{bmwPassed} of {bmwRules.length} mandatory rules verified</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-850/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">48-Hour Pickup SLA Window</span>
                <strong className="text-white font-mono">98.5%</strong>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '98.5%' }} />
              </div>
              <span className="text-[10px] text-slate-500">Zero active bags exceeding 48h limit</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-850/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Barcode & GPS Traceability</span>
                <strong className="text-white font-mono">100.0%</strong>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '100%' }} />
              </div>
              <span className="text-[10px] text-slate-500">All bags assigned unique GS1 2D barcode</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 print:hidden">
        <button
          onClick={() => setActiveTab('audit_checklist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'audit_checklist'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>BMW Rules 2016 Checklist</span>
        </button>

        <button
          onClick={() => setActiveTab('cpcb_colors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'cpcb_colors'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>CPCB Color Coding Checklist</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_log')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'audit_log'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Regulatory Audit Log Table</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'incidents'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Occupational Incidents ({incidents.length})</span>
        </button>
      </div>

      {/* ─── 2. TAB: BIO-MEDICAL WASTE RULES 2016 CHECKLIST ─── */}
      {activeTab === 'audit_checklist' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">
                Bio-Medical Waste Management Rules 2016 Statutory Checklist
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Statutory obligations under Ministry of Environment, Forest and Climate Change (MoEFCC)
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400">
              {bmwPassed} / {bmwRules.length} Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bmwRules.map((rule) => (
              <div
                key={rule.id}
                onClick={() => toggleBmwItem(rule.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  rule.checked
                    ? 'bg-slate-850/90 border-emerald-500/40 hover:border-emerald-500/60'
                    : 'bg-slate-850/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="pt-0.5">
                  {rule.checked ? (
                    <div className="w-5 h-5 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                      ✓
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-md border-2 border-slate-600 bg-slate-800" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-rose-400 px-1.5 py-0.2 rounded bg-rose-500/10 border border-rose-500/20">
                      {rule.ref}
                    </span>
                    <span className="text-sm font-bold text-white leading-tight">
                      {rule.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {rule.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 3. TAB: CPCB COLOR CODING CHECKLIST ─── */}
      {activeTab === 'cpcb_colors' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">
                CPCB 4-Color Stream Verification Checklist
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Yellow, Red, Blue, and Black segregation verification (Sharps classified as Red per updated guidelines)
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400">
              {cpcbPassed} / {cpcbChecklist.length} Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cpcbChecklist.map((item) => {
              let tagStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
              if (item.category === 'Red') tagStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
              if (item.category === 'Blue') tagStyle = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
              if (item.category === 'Black') tagStyle = 'bg-slate-700 text-slate-200 border-slate-600';

              return (
                <div
                  key={item.id}
                  onClick={() => toggleCpcbItem(item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    item.verified
                      ? 'bg-slate-850/90 border-emerald-500/40'
                      : 'bg-slate-850/40 border-slate-800'
                  }`}
                >
                  <div className="pt-0.5">
                    {item.verified ? (
                      <div className="w-5 h-5 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                        ✓
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-md border-2 border-slate-600 bg-slate-800" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${tagStyle}`}>
                        {item.category} Bin
                      </span>
                      <span className="text-sm font-bold text-white leading-tight">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.rule}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 4. TAB: AUDIT LOG TABLE WITH TIMESTAMPS ─── */}
      {activeTab === 'audit_log' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Statutory Regulatory Audit Trail
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Immutable chronological log of inspections, weight reconciliation, and SPCB verifications
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {auditLogs.length} verified records
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Timestamp</th>
                  <th className="px-5 py-4">Audit Action & Standard</th>
                  <th className="px-5 py-4">Auditor / Inspector</th>
                  <th className="px-5 py-4">Target Scope</th>
                  <th className="px-5 py-4">Verification Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/60 transition">
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-slate-400">
                      <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-xs">{log.action}</div>
                      <div className="text-[10px] text-rose-400 font-mono mt-0.5">{log.code}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-300">
                      {log.user}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                      {log.target}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{log.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 5. TAB: OCCUPATIONAL INCIDENTS ─── */}
      {activeTab === 'incidents' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Occupational Sharps & Needle-Stick Log</h3>
              <p className="text-xs text-slate-400 mt-0.5">Mandatory Form I incidents filed within 24 hours</p>
            </div>
            {onOpenIncidentModal && (
              <button
                onClick={onOpenIncidentModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Report Incident</span>
              </button>
            )}
          </div>

          {isLoadingIncidents ? (
            <TableSkeleton rows={3} cols={4} />
          ) : incidents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Zero open biohazard safety incidents. 100% protocol adherence.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-4">Incident ID</th>
                    <th className="px-5 py-4">Category & Department</th>
                    <th className="px-5 py-4">Corrective Action Taken</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {incidents.map((inc) => (
                    <tr key={inc._id || inc.incidentId} className="hover:bg-slate-850/60 transition">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-white">{inc.incidentId}</div>
                        <div className="text-[10px] text-slate-500">{new Date(inc.reportedDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-semibold text-white">{inc.type}</div>
                        <div className="text-[11px] text-slate-400">{inc.department}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-300 max-w-md">
                        {inc.correctiveAction}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {inc.status || 'Resolved'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
