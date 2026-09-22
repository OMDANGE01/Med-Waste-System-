import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Camera, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Flashlight,
  Sparkles,
  Barcode
} from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const SAMPLE_TAGS = [
    { tagId: 'MW-2026-1001', category: 'Yellow', dept: 'Operating Theater', weight: '6.40' },
    { tagId: 'MW-2026-1002', category: 'Red', dept: 'ICU', weight: '4.80' },
    { tagId: 'MW-2026-1003', category: 'Red', dept: 'Emergency', weight: '2.10' },
    { tagId: 'MW-2026-1004', category: 'Blue', dept: 'Pathology Lab', weight: '3.70' },
    { tagId: 'MW-2026-1009', category: 'Black', dept: 'Oncology', weight: '3.40' },
    { tagId: 'MW-2026-1010', category: 'White', dept: 'Operating Theater', weight: '1.20' },
  ];

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } else {
        setCameraError('Camera access not supported in this browser iframe. Use one-click barcode simulation below.');
      }
    } catch {
      setCameraError('Camera permission not granted or device camera unavailable. Use one-click barcode simulation below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  };

  const handleSelectSample = (sample) => {
    stopCamera();
    onScanSuccess(sample);
    onClose();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const tag = manualCode.trim().toUpperCase();
    stopCamera();
    onScanSuccess({ tagId: tag, category: 'Red', dept: 'Operating Theater', weight: '4.50' });
    onClose();
  };

  const handleRandomNew = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newTag = `MW-2026-${randomNum}`;
    const categories = ['Yellow', 'Red', 'Blue', 'Black', 'White'];
    const depts = ['Operating Theater', 'ICU', 'Emergency', 'Pathology Lab', 'General Ward', 'Oncology'];
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const dept = depts[Math.floor(Math.random() * depts.length)];
    const weight = (Math.random() * 6 + 1).toFixed(2);
    
    stopCamera();
    onScanSuccess({ tagId: newTag, category: cat, dept, weight });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">CPCB Barcode / QR Scanner</h3>
              <p className="text-xs text-slate-400">Scan container label or select simulated RFID/QR tag</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[260px] overflow-hidden">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-[260px] object-cover"
            />
          ) : (
            <div className="p-6 text-center space-y-3">
              <div className="inline-flex p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-400">
                <Camera className="w-10 h-10 text-rose-500 animate-pulse" />
              </div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {cameraError || 'Initializing video optical sensor...'}
              </p>
            </div>
          )}

          {/* Scanner Overlay HUD */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-48 h-48 border-2 border-rose-500/80 rounded-2xl shadow-[0_0_20px_rgba(225,29,72,0.4)]">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-rose-400"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-rose-400"></div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-rose-400"></div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-rose-400"></div>
              {/* Animated Laser Scanning Line */}
              <div className="absolute left-2 right-2 h-0.5 bg-rose-400/90 shadow-[0_0_8px_#f43f5e] animate-bounce"></div>
            </div>
          </div>

          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-400 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Optical Decoder Ready
            </span>
            <span className="text-slate-400 font-mono">1D Code 128 / 2D QR</span>
          </div>
        </div>

        {/* Quick Simulated RFID / Barcode Selection */}
        <div className="p-6 space-y-4 bg-slate-900">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="uppercase tracking-wider">Fast Scan Simulation (Click to Autofill)</span>
              <button
                type="button"
                onClick={handleRandomNew}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generate New Bag</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SAMPLE_TAGS.map((item) => (
                <button
                  key={item.tagId}
                  onClick={() => handleSelectSample(item)}
                  type="button"
                  className="flex flex-col text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-rose-500/50 transition group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-mono font-bold text-white group-hover:text-rose-400">
                      {item.tagId}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      item.category === 'Yellow' ? 'bg-amber-500/20 text-amber-300' :
                      item.category === 'Red' ? 'bg-rose-500/20 text-rose-300' :
                      item.category === 'Blue' ? 'bg-sky-500/20 text-sky-300' :
                      item.category === 'White' ? 'bg-slate-300/20 text-slate-200' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {item.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 truncate mt-1">
                    {item.dept}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-800 flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Or type barcode tag manually (e.g. MW-2026-8800)..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              Apply Tag
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
