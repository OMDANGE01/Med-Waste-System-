import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, Check, Smartphone, Wifi, Globe, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';

export default function ShareQRModal({ isOpen, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Dynamically resolve current host (localhost, public cloud domain, or tunnel)
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(
        shareUrl,
        {
          width: 280,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (err, url) => {
          if (!err) setQrDataUrl(url);
        }
      );
    }
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Scan QR Code to Open on Phone</h2>
              <p className="text-xs text-slate-400">Instant mobile, tablet, or remote access</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Body */}
        <div className="p-6 text-center space-y-4">
          <div className="inline-block p-4 bg-white rounded-2xl shadow-xl border-4 border-slate-800">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="App QR Code" className="w-56 h-56 mx-auto rounded-lg" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                Generating QR...
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 py-1.5 px-3 rounded-xl border border-emerald-500/20">
              <Globe className="w-4 h-4" />
              <span>Point your smartphone camera to open this URL</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-200">
              <span className="truncate mr-2">{shareUrl}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-sans text-xs font-semibold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-left pt-3 border-t border-slate-800 space-y-1">
            <p className="flex items-center gap-1.5 text-slate-300">
              <Smartphone className="w-3.5 h-3.5 text-rose-400" />
              <strong>How to connect:</strong>
            </p>
            <ol className="list-decimal list-inside pl-1 text-slate-400 space-y-0.5">
              <li>Open your smartphone camera app.</li>
              <li>Point it directly at this QR code.</li>
              <li>Tap the pop-up notification to open the MedWaste Guard app!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-850 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
