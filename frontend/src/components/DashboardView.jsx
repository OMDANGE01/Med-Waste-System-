import React from 'react';
import { 
  Weight, 
  Package, 
  CheckCircle2, 
  ShieldCheck, 
  Flame, 
  Recycle, 
  Scissors, 
  Wine, 
  ArrowUpRight, 
  Clock, 
  Truck, 
  AlertOctagon,
  Building2,
  TrendingUp,
  MapPin
} from 'lucide-react';

export default function DashboardView({ stats, onNavigateToTab, onOpenLogModal }) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const {
    totalBags = 0,
    totalWeightKg = 0,
    activeWeightKg = 0,
    disposedWeightKg = 0,
    complianceScore = 95,
    statusCounts = {},
    categoryBreakdown = {},
    departmentBreakdown = {},
    openIncidents = 0
  } = stats;

  const categories = [
    {
      id: 'Yellow',
      name: 'Yellow Category',
      title: 'Infectious & Anatomical',
      treatment: 'High-Temp Incineration / Deep Burial',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      cardBg: 'from-amber-950/30 to-slate-900 border-amber-500/20 hover:border-amber-500/40',
      icon: Flame,
      iconColor: 'text-amber-400',
      count: categoryBreakdown.Yellow?.count || 0,
      weight: categoryBreakdown.Yellow?.weightKg || 0,
      description: 'Anatomical tissues, soiled gauze, expired medicines & chemotherapeutic kits.',
    },
    {
      id: 'Red',
      name: 'Red Category',
      title: 'Contaminated Plastics',
      treatment: 'Autoclaving / Microwaving & Recycling',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      cardBg: 'from-rose-950/30 to-slate-900 border-rose-500/20 hover:border-rose-500/40',
      icon: Recycle,
      iconColor: 'text-rose-400',
      count: categoryBreakdown.Red?.count || 0,
      weight: categoryBreakdown.Red?.weightKg || 0,
      description: 'Plastic catheters, IV tubing, saline bottles, syringes without needles, disposable gloves.',
    },
    {
      id: 'White',
      name: 'White Category',
      title: 'Waste Sharps (Puncture-Proof)',
      treatment: 'Dry Heat Sterilization & Shredding',
      badgeColor: 'bg-slate-200/10 text-slate-200 border-slate-400/30',
      cardBg: 'from-slate-800/40 to-slate-900 border-slate-700 hover:border-slate-500',
      icon: Scissors,
      iconColor: 'text-slate-100',
      count: categoryBreakdown.White?.count || 0,
      weight: categoryBreakdown.White?.weightKg || 0,
      description: 'Scalpels, surgical blades, hypodermic needles, contaminated needles in rigid boxes.',
    },
    {
      id: 'Blue',
      name: 'Blue Category',
      title: 'Glassware & Metallic Implants',
      treatment: 'Chemical Disinfection & Glass Autoclaving',
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      cardBg: 'from-sky-950/30 to-slate-900 border-sky-500/20 hover:border-sky-500/40',
      icon: Wine,
      iconColor: 'text-sky-400',
      count: categoryBreakdown.Blue?.count || 0,
      weight: categoryBreakdown.Blue?.weightKg || 0,
      description: 'Reagent vials, medicine ampoules, broken lab slides, orthopedic metal pins & plates.',
    },
  ];

  // Calculate highest department weight for progress bar scale
  const deptEntries = Object.entries(departmentBreakdown || {});
  const maxDeptWeight = deptEntries.reduce((max, [, data]) => Math.max(max, data.weightKg || 0), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome & Facility Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Healthcare Biohazard Control Hub</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Monitoring
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Real-time segregation tracking, chain-of-custody dispatch, and biomedical regulatory compliance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateToTab('livemap')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 text-sm font-semibold border border-rose-500/30 transition shadow-sm"
          >
            <MapPin className="w-4 h-4" />
            <span>Live GPS Map</span>
          </button>
          <button
            onClick={() => onNavigateToTab('registry')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
          >
            <span>View All Records</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenLogModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-950 transition"
          >
            <span>+ Log New Bag</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Waste */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active / On-Site Waste</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Weight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{activeWeightKg}</span>
            <span className="text-slate-400 font-medium text-sm">kg</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
            <span>Awaiting Pickup / In Transit</span>
            <span className="text-amber-400 font-semibold">{((activeWeightKg / (totalWeightKg || 1)) * 100).toFixed(0)}% of total</span>
          </div>
        </div>

        {/* Total Bags Tracked */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Bags Tracked</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{totalBags}</span>
            <span className="text-slate-400 font-medium text-sm">containers</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
            <span>Across 6 Ward Categories</span>
            <span className="text-rose-400 font-semibold">{statusCounts['Logged'] || 0} newly logged</span>
          </div>
        </div>

        {/* Disposed / Treated */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">CBWTF Treated & Disposed</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{disposedWeightKg}</span>
            <span className="text-slate-400 font-medium text-sm">kg</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
            <span>Verified Incineration & Shredding</span>
            <span className="text-emerald-400 font-semibold">{statusCounts['Disposed'] || 0} completed</span>
          </div>
        </div>

        {/* Compliance Rating */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">CPCB Compliance Index</span>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{complianceScore}%</span>
            <span className="text-emerald-400 font-semibold text-xs">High Standard</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
            <span>{openIncidents === 0 ? 'Zero active breaches' : `${openIncidents} action item pending`}</span>
            <span className="text-sky-400 font-semibold">Audited</span>
          </div>
        </div>
      </div>

      {/* 4 Biomedical Waste Categories Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Biomedical Waste Categories (WHO / CPCB Rules)</h2>
            <p className="text-xs text-slate-400">Color-coded segregation parameters and mandatory disposal methodologies.</p>
          </div>
          <span className="text-xs text-slate-400">Updated continuously</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const percentage = totalWeightKg > 0 ? ((cat.weight / totalWeightKg) * 100).toFixed(1) : 0;
            return (
              <div
                key={cat.id}
                className={`p-5 rounded-2xl bg-gradient-to-b ${cat.cardBg} border transition-all duration-200 hover:-translate-y-1 shadow-lg`}
              >
                <div className="flex items-start justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cat.badgeColor}`}>
                    {cat.name}
                  </span>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <Icon className={`w-5 h-5 ${cat.iconColor}`} />
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-semibold text-white text-base">{cat.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cat.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-bold text-white">{cat.weight}</span>
                      <span className="text-xs text-slate-400 ml-1">kg</span>
                    </div>
                    <span className="text-xs font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                      {cat.count} {cat.count === 1 ? 'bag' : 'bags'}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.id === 'Yellow' ? 'bg-amber-400' :
                        cat.id === 'Red' ? 'bg-rose-500' :
                        cat.id === 'White' ? 'bg-slate-200' : 'bg-sky-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(8, percentage))}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                    <span>{percentage}% of hospital total</span>
                    <span className="truncate max-w-[120px]">{cat.treatment.split(' / ')[0]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ward Distribution & Lifecycle Pipeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ward Generation Breakdown (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-white text-base">Department Waste Volume (kg)</h3>
            </div>
            <span className="text-xs text-slate-400">Generation ranking</span>
          </div>

          <div className="space-y-4">
            {deptEntries.map(([dept, data]) => {
              const pct = maxDeptWeight > 0 ? (data.weightKg / maxDeptWeight) * 100 : 0;
              return (
                <div key={dept} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-200">{dept}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{data.count} {data.count === 1 ? 'batch' : 'batches'}</span>
                      <span className="font-bold text-white">{data.weightKg} kg</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-600 to-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lifecycle Status Pipeline */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-white text-base">Chain-of-Custody Pipeline</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6">Current disposition of active and archived medical waste bags.</p>

            <div className="space-y-4">
              {/* Step 1: Logged */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Logged at Ward</div>
                    <div className="text-xs text-slate-400">Awaiting internal pickup</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300">
                  {statusCounts['Logged'] || 0}
                </span>
              </div>

              {/* Step 2: Awaiting Pickup */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Central Holding Bay</div>
                    <div className="text-xs text-slate-400">Ready for CBWTF truck</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300">
                  {statusCounts['Awaiting Pickup'] || 0}
                </span>
              </div>

              {/* Step 3: In Transit */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">In Transit (CBWTF)</div>
                    <div className="text-xs text-slate-400">En route to treatment plant</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300">
                  {statusCounts['In Transit'] || 0}
                </span>
              </div>

              {/* Step 4: Disposed */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Disposed & Treated</div>
                    <div className="text-xs text-slate-400">Incinerated / Autoclaved</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300">
                  {statusCounts['Disposed'] || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              onClick={() => onNavigateToTab('pickups')}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Truck className="w-4 h-4 text-slate-400" />
              <span>Manage Transit Manifests</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
