import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  Edit3, 
  Clock, 
  Eye, 
  ChevronRight, 
  Flame, 
  Recycle, 
  Wine, 
  ShieldAlert, 
  Camera, 
  Check, 
  X,
  Layers,
  ArrowRightLeft,
  RotateCcw
} from 'lucide-react';

export const INITIAL_AI_CLASSIFICATIONS = [
  {
    id: 'ai-001',
    tagId: 'MW-2026-1001',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    itemDescription: 'Soiled surgical gauze & excised appendiceal tissue',
    detectedType: 'Human Anatomical & Soiled Dressing',
    confidence: 96.8,
    assignedColor: 'Yellow',
    assignedCategoryName: 'Yellow (Anatomical/Pathological)',
    overrideColor: null,
    overriddenBy: null,
    modelName: 'MedVision BioNet-v4',
    thumbnailBg: 'from-amber-600/30 to-amber-900/40',
    icon: Flame,
    iconColor: 'text-amber-400'
  },
  {
    id: 'ai-002',
    tagId: 'MW-2026-1002',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    itemDescription: 'Contaminated IV line tubing & empty saline drip bottle',
    detectedType: 'Contaminated Recyclable Plastics',
    confidence: 94.2,
    assignedColor: 'Red',
    assignedCategoryName: 'Red (Contaminated/Recyclable)',
    overrideColor: null,
    overriddenBy: null,
    modelName: 'MedVision BioNet-v4',
    thumbnailBg: 'from-rose-600/30 to-rose-900/40',
    icon: Recycle,
    iconColor: 'text-rose-400'
  },
  {
    id: 'ai-003',
    tagId: 'MW-2026-1003',
    timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    itemDescription: 'Used suture needles & disposable scalpel blades',
    detectedType: 'Sharp Hazard (CPCB India Recyclable/Sharps)',
    confidence: 88.5,
    assignedColor: 'Red',
    assignedCategoryName: 'Red (Contaminated/Recyclable)',
    overrideColor: null,
    overriddenBy: null,
    modelName: 'MedVision BioNet-v4',
    thumbnailBg: 'from-rose-600/30 to-rose-900/40',
    icon: ShieldAlert,
    iconColor: 'text-rose-400'
  },
  {
    id: 'ai-004',
    tagId: 'MW-2026-1004',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    itemDescription: 'Broken antibiotic glass ampoules & specimen slides',
    detectedType: 'Contaminated Glassware / Metallic Implants',
    confidence: 92.1,
    assignedColor: 'Blue',
    assignedCategoryName: 'Blue (Glassware/Metallic)',
    overrideColor: null,
    overriddenBy: null,
    modelName: 'MedVision BioNet-v4',
    thumbnailBg: 'from-sky-600/30 to-sky-900/40',
    icon: Wine,
    iconColor: 'text-sky-400'
  },
  {
    id: 'ai-005',
    tagId: 'MW-2026-1009',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    itemDescription: 'Cytotoxic chemo drug packaging & general room waste',
    detectedType: 'General / Cytotoxic Waste',
    confidence: 76.4,
    assignedColor: 'Black',
    assignedCategoryName: 'Black (General/Cytotoxic)',
    overrideColor: null,
    overriddenBy: null,
    modelName: 'MedVision BioNet-v4',
    thumbnailBg: 'from-slate-700/40 to-slate-900/60',
    icon: ShieldAlert,
    iconColor: 'text-slate-300'
  },
  {
    id: 'ai-006',
    tagId: 'MW-2026-1011',
    timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    itemDescription: 'Disinfectant wipe with blood smudge on plastic casing',
    detectedType: 'Borderline Soiled Material vs Recyclable Plastic',
    confidence: 64.9,
    assignedColor: 'Yellow',
    assignedCategoryName: 'Yellow (Anatomical/Pathological)',
    overrideColor: 'Red',
    overriddenBy: 'Dr. Aaron Patel (Chief Superintendent)',
    modelName: 'MedVision BioNet-v4',
    thumbnailBg: 'from-amber-600/30 to-rose-900/40',
    icon: Recycle,
    iconColor: 'text-rose-400'
  },
  {
    id: 'ai-007',
    tagId: 'MW-2026-1012',
    timestamp: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    itemDescription: 'Rigid puncture-proof sharps canister casing',
    detectedType: 'Translucent Sharps Container',
    confidence: 97.4,
    assignedColor: 'White',
    assignedCategoryName: 'White (Puncture-Proof)',
    overrideColor: null,
    overriddenBy: null,
    modelName: 'MedVision BioNet-v4',
    thumbnailBg: 'from-slate-500/30 to-slate-800/40',
    icon: ShieldAlert,
    iconColor: 'text-slate-200'
  }
];

export default function AIClassificationLog({ onAddToast }) {
  const [items, setItems] = useState(INITIAL_AI_CLASSIFICATIONS);
  const [filterColor, setFilterColor] = useState('All');
  const [filterConfidence, setFilterConfidence] = useState('All'); // 'All' | 'High' (>90) | 'Medium' (70-90) | 'Low' (<70)
  const [overrideModalItem, setOverrideModalItem] = useState(null);
  const [selectedOverrideColor, setSelectedOverrideColor] = useState('Yellow');
  const [overrideReason, setOverrideReason] = useState('');
  const [previewItem, setPreviewItem] = useState(null);

  // Confidence badge logic
  const getConfidenceBadge = (confidence) => {
    if (confidence >= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          {confidence.toFixed(1)}% High
        </span>
      );
    }
    if (confidence >= 70) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          {confidence.toFixed(1)}% Moderate
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        {confidence.toFixed(1)}% Low
      </span>
    );
  };

  const getBinBadge = (colorName) => {
    switch (colorName) {
      case 'Yellow':
        return {
          pill: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
          label: 'Yellow Bin'
        };
      case 'Red':
        return {
          pill: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-400',
          label: 'Red Bin'
        };
      case 'Blue':
        return {
          pill: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          dot: 'bg-sky-400',
          label: 'Blue Bin'
        };
      case 'Black':
        return {
          pill: 'bg-slate-700 text-slate-200 border-slate-600',
          dot: 'bg-slate-400',
          label: 'Black Bin'
        };
      case 'White':
        return {
          pill: 'bg-slate-200/20 text-slate-200 border-slate-400/40',
          dot: 'bg-slate-300',
          label: 'White Bin'
        };
      default:
        return {
          pill: 'bg-slate-800 text-slate-400 border-slate-700',
          dot: 'bg-slate-500',
          label: colorName
        };
    }
  };

  const handleOpenOverride = (item) => {
    setOverrideModalItem(item);
    setSelectedOverrideColor(item.overrideColor || item.assignedColor);
    setOverrideReason('');
  };

  const handleApplyOverride = (e) => {
    e.preventDefault();
    if (!overrideModalItem) return;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === overrideModalItem.id) {
          return {
            ...item,
            overrideColor: selectedOverrideColor,
            overriddenBy: 'Supervisor Reviewer',
          };
        }
        return item;
      })
    );

    if (onAddToast) {
      onAddToast(
        'AI Classification Overridden',
        `Item ${overrideModalItem.tagId} manually reassigned to ${selectedOverrideColor} Bin.`,
        'success'
      );
    }

    setOverrideModalItem(null);
  };

  const handleSimulateNewScan = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const bins = ['Yellow', 'Red', 'Blue', 'Black'];
    const detected = [
      { type: 'Disposable Dialysis Catheter Line', bin: 'Red', conf: 95.4, desc: 'Contaminated polymer tubing' },
      { type: 'Pathological Biopsy Tissue Container', bin: 'Yellow', conf: 97.2, desc: 'Organic laboratory sample' },
      { type: 'Sterile Saline Injection Ampoule', bin: 'Blue', conf: 91.8, desc: 'Heavy borosilicate glass bottle' },
      { type: 'Chemotherapy Handling Gowns', bin: 'Black', conf: 82.5, desc: 'Cytotoxic exposure garments' },
      { type: 'Uncapped Hypodermic Syringe with Needle', bin: 'Red', conf: 68.4, desc: 'Sharp hazard detected per CPCB' }
    ];

    const pick = detected[Math.floor(Math.random() * detected.length)];
    const newItem = {
      id: `ai-${Date.now()}`,
      tagId: `MW-2026-${randomNum}`,
      timestamp: new Date().toISOString(),
      itemDescription: pick.desc,
      detectedType: pick.type,
      confidence: pick.conf,
      assignedColor: pick.bin,
      assignedCategoryName: `${pick.bin} Bin`,
      overrideColor: null,
      overriddenBy: null,
      modelName: 'MedVision BioNet-v4',
      thumbnailBg: pick.bin === 'Yellow' ? 'from-amber-600/30 to-amber-900/40' :
                   pick.bin === 'Red' ? 'from-rose-600/30 to-rose-900/40' :
                   pick.bin === 'Blue' ? 'from-sky-600/30 to-sky-900/40' : 'from-slate-700/40 to-slate-900/60',
      icon: pick.bin === 'Yellow' ? Flame : pick.bin === 'Red' ? Recycle : pick.bin === 'Blue' ? Wine : ShieldAlert,
      iconColor: pick.bin === 'Yellow' ? 'text-amber-400' : pick.bin === 'Red' ? 'text-rose-400' : pick.bin === 'Blue' ? 'text-sky-400' : 'text-slate-300'
    };

    setItems((prev) => [newItem, ...prev]);
    if (onAddToast) {
      onAddToast('AI Vision Classified', `New item tagged ${newItem.tagId} assigned to ${newItem.assignedColor} Bin (${newItem.confidence}%).`, 'info');
    }
  };

  // Filtered list
  const filteredItems = items.filter((item) => {
    const activeColor = item.overrideColor || item.assignedColor;
    if (filterColor !== 'All' && activeColor !== filterColor) return false;
    if (filterConfidence === 'High' && item.confidence < 90) return false;
    if (filterConfidence === 'Medium' && (item.confidence < 70 || item.confidence >= 90)) return false;
    if (filterConfidence === 'Low' && item.confidence >= 70) return false;
    return true;
  });

  const avgConfidence = (items.reduce((acc, curr) => acc + curr.confidence, 0) / items.length).toFixed(1);
  const overrideCount = items.filter((item) => item.overrideColor).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Stats Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Automated Computer Vision Feed
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
            AI Waste Classification & Vision Log
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time inference logs from automated sorting stations and autonomous waste robots. Every item is verified against CPCB 2016 segregation protocols with staff override authority.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSimulateNewScan}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-950 transition"
          >
            <Camera className="w-4 h-4" />
            <span>+ Simulate AI Scan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-slate-400">Total Classified</span>
            <div className="text-2xl font-extrabold text-white mt-1">{items.length} items</div>
            <span className="text-xs text-emerald-400">Continuous 24/7 vision stream</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-rose-400 border border-slate-700">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-slate-400">Mean Confidence</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{avgConfidence}%</div>
            <span className="text-xs text-slate-400">MedVision BioNet-v4 accuracy</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-slate-400">Manual Overrides</span>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">{overrideCount}</div>
            <span className="text-xs text-slate-400">{((overrideCount / items.length) * 100).toFixed(1)}% human supervisor touch</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-rose-400" />
            <span>Bin Color:</span>
          </span>
          {['All', 'Yellow', 'Red', 'Blue', 'Black', 'White'].map((c) => (
            <button
              key={c}
              onClick={() => setFilterColor(c)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterColor === c
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Confidence Tier:</span>
          <select
            value={filterConfidence}
            onChange={(e) => setFilterConfidence(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-rose-500"
          >
            <option value="All">All Scores</option>
            <option value="High">&gt; 90% (High Confidence)</option>
            <option value="Medium">70% - 90% (Moderate)</option>
            <option value="Low">&lt; 70% (Requires Review)</option>
          </select>
        </div>
      </div>

      {/* Classification Log Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-4">Timestamp</th>
              <th className="px-5 py-4">Image Thumbnail</th>
              <th className="px-5 py-4">Detected Item Type</th>
              <th className="px-5 py-4">Confidence %</th>
              <th className="px-5 py-4">Assigned Bin Color</th>
              <th className="px-5 py-4 text-right">Override Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No AI classification records matching your filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const activeBinColor = item.overrideColor || item.assignedColor;
                const badge = getBinBadge(activeBinColor);
                const ItemIcon = item.icon || Flame;

                return (
                  <tr key={item.id} className="hover:bg-slate-850/60 transition group">
                    {/* Timestamp */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-mono text-xs text-white font-semibold">{item.tagId}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                    </td>

                    {/* Image Thumbnail Placeholder */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div 
                        onClick={() => setPreviewItem(item)}
                        className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.thumbnailBg} border border-slate-700/80 flex items-center justify-center cursor-pointer shadow-md group-hover:scale-105 transition-transform`}
                        title="Click to preview item visual snapshot"
                      >
                        <ItemIcon className={`w-5 h-5 ${item.iconColor}`} />
                      </div>
                    </td>

                    {/* Detected Type */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white text-sm">{item.detectedType}</div>
                      <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.itemDescription}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">{item.modelName}</div>
                    </td>

                    {/* Confidence % */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getConfidenceBadge(item.confidence)}
                    </td>

                    {/* Assigned Bin Color */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.pill}`}>
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                          {badge.label}
                        </span>
                        {item.overrideColor && (
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Overridden from {item.assignedColor}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Override Action */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenOverride(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition shadow-sm"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-rose-400" />
                        <span>{item.overrideColor ? 'Re-Override' : 'Override Bin'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Override Modal */}
      {overrideModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Manual Bin Override</h3>
                  <p className="text-xs text-slate-400">Tag ID: {overrideModalItem.tagId}</p>
                </div>
              </div>
              <button
                onClick={() => setOverrideModalItem(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-xs">
              <div className="text-slate-400">AI Initial Classification:</div>
              <div className="font-semibold text-white">{overrideModalItem.detectedType}</div>
              <div className="text-slate-400">Detected Confidence: <strong className="text-rose-400">{overrideModalItem.confidence}%</strong></div>
            </div>

            <form onSubmit={handleApplyOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Assign Authorized Destination Bin:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Yellow', label: 'Yellow Bin', desc: 'Anatomical / Pathological' },
                    { id: 'Red', label: 'Red Bin', desc: 'Contaminated / Sharps' },
                    { id: 'Blue', label: 'Blue Bin', desc: 'Glassware / Metallic' },
                    { id: 'Black', label: 'Black Bin', desc: 'General / Cytotoxic' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedOverrideColor(b.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedOverrideColor === b.id
                          ? 'bg-rose-500/15 border-rose-500 text-white'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs">{b.label}</div>
                      <div className="text-[11px] text-slate-400">{b.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Override (Regulatory Audit Trail):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Visual verification confirmed sharp tip presence..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOverrideModalItem(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg transition"
                >
                  Confirm & Log Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Snapshot Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Optical Telemetry Snapshot</h3>
              <button onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={`w-full h-48 rounded-2xl bg-gradient-to-tr ${previewItem.thumbnailBg} border border-slate-700 flex flex-col items-center justify-center p-4 shadow-inner relative overflow-hidden`}>
              <previewItem.icon className={`w-16 h-16 ${previewItem.iconColor} drop-shadow-lg`} />
              <div className="absolute top-2 left-2 text-[10px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded">
                RES: 1920x1080 • LiDAR Grounded
              </div>
              <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded">
                {previewItem.tagId}
              </div>
            </div>
            <div className="text-xs space-y-1 text-slate-300">
              <div><strong className="text-white">Classification:</strong> {previewItem.detectedType}</div>
              <div><strong className="text-white">Confidence:</strong> {previewItem.confidence}%</div>
              <div><strong className="text-white">Assigned Bin:</strong> {previewItem.assignedColor}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
