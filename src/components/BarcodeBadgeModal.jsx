import React from 'react';
import { X, Printer, QrCode, ShieldAlert, Calendar, MapPin, User, Weight } from 'lucide-react';

export default function BarcodeBadgeModal({ isOpen, onClose, record }) {
  if (!isOpen || !record) return null;

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Yellow':
        return { bg: 'bg-amber-500', text: 'text-slate-950', border: 'border-amber-400' };
      case 'Red':
        return { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-500' };
      case 'White':
        return { bg: 'bg-slate-200', text: 'text-slate-950', border: 'border-slate-300' };
      case 'Blue':
        return { bg: 'bg-sky-500', text: 'text-slate-950', border: 'border-sky-400' };
      default:
        return { bg: 'bg-slate-700', text: 'text-white', border: 'border-slate-600' };
    }
  };

  const colors = getCategoryColor(record.category);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-rose-400" />
            <span className="font-bold text-sm text-white">Biomedical Waste Container Tag</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Tag Visual */}
        <div className="p-6">
          <div className="p-5 rounded-2xl bg-white text-slate-900 border-2 border-slate-800 shadow-xl space-y-4 font-mono">
            {/* Tag Header Banner */}
            <div className={`py-2 px-3 rounded-xl ${colors.bg} ${colors.text} text-center flex items-center justify-between`}>
              <span className="font-black text-xs tracking-wider uppercase">BIOHAZARD RECEPTACLE</span>
              <span className="font-extrabold text-sm">{record.category} CATEGORY</span>
            </div>

            {/* Barcode & Tag ID */}
            <div className="text-center py-2 border-y border-dashed border-slate-300 space-y-1">
              <div className="text-xs tracking-widest text-slate-500">TAG BARCODE IDENTIFIER</div>
              <div className="text-2xl font-black text-slate-950 tracking-wider">
                {record.tagId}
              </div>
              {/* Stylized Barcode Lines */}
              <div className="flex justify-center items-center gap-0.5 h-10 px-4 pt-1">
                {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6, 2, 6, 4, 3, 3, 8, 3, 2, 7, 9].map((val, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 h-full"
                    style={{ width: `${(val % 3) + 1}px` }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2 p-2 rounded-lg bg-slate-100 border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-semibold">HOSPITAL / FACILITY</span>
                <strong className="text-rose-700 text-sm block truncate">{record.hospitalName || 'Government Hospital of Khamgaon'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">DEPARTMENT</span>
                <strong className="text-slate-900">{record.department}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">WEIGHT (KG)</span>
                <strong className="text-slate-900 text-sm">{record.weightKg} kg</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">WARD / ROOM</span>
                <span className="text-slate-800 text-[11px] truncate block">{record.location}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">HANDLER</span>
                <span className="text-slate-800 text-[11px] truncate block">{record.handlerName}</span>
              </div>
            </div>

            {/* Timestamps & Facility */}
            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-600 flex justify-between">
              <span className="font-semibold">{record.hospitalName || 'Government Hospital of Khamgaon'}</span>
              <span>{new Date(record.createdAt).toLocaleDateString()} {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950"
          >
            <Printer className="w-4 h-4" />
            <span>Print Bag Label</span>
          </button>
        </div>
      </div>
    </div>
  );
}
