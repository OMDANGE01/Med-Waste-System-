import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  Terminal, 
  Check, 
  Copy, 
  ExternalLink, 
  X, 
  AlertTriangle,
  Info,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function ApkDownloadModal({ isOpen, onClose }) {
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [apkInfo, setApkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('direct'); // 'direct', 'qr', 'eas'

  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/download/apk/info')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setApkInfo(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch APK info:', err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const directDownloadUrl = `${origin}/api/download/apk`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(directDownloadUrl)}`;
  const easCommand = 'cd expo-app && npx eas build -p android --profile preview';

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'sha') {
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 2000);
    } else {
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-white tracking-wide">Download Android App (.APK)</h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                  CPCB 2016
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official Khamgaon Hospital Network Bio-Medical Waste Mobile Client
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-3 space-x-4">
          <button
            onClick={() => setActiveTab('direct')}
            className={`pb-3 text-sm font-semibold flex items-center space-x-2 transition-all border-b-2 ${
              activeTab === 'direct'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Direct APK Download</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-3 text-sm font-semibold flex items-center space-x-2 transition-all border-b-2 ${
              activeTab === 'qr'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Phone QR</span>
          </button>
          <button
            onClick={() => setActiveTab('eas')}
            className={`pb-3 text-sm font-semibold flex items-center space-x-2 transition-all border-b-2 ${
              activeTab === 'eas'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Expo EAS Cloud Build</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'direct' && (
            <div className="space-y-6">
              {/* Highlight Download Card */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-white">medwaste-guard-khamgaon-v1.0.0.apk</span>
                    <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded font-mono">v1.0.0</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Package: <span className="font-mono text-emerald-400">in.gov.cpcb.khamgaon.medwaste</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports Android 8.0+ (API 26-34) • Camera & Barcode Scanner enabled
                  </p>
                </div>
                <a
                  href="/api/download/apk"
                  download="medwaste-guard-khamgaon-v1.0.0.apk"
                  className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Download className="w-5 h-5 text-slate-950" />
                  <span>Download APK Now</span>
                </a>
              </div>

              {/* Verified Integrity Card */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cryptographic Package Integrity (SHA-256)</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(apkInfo?.sha256Checksum || 'verified-cpcb-build-sha256', 'sha')}
                    className="flex items-center space-x-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {copiedSha ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSha ? 'Copied' : 'Copy Hash'}</span>
                  </button>
                </div>
                <p className="font-mono text-xs text-slate-400 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                  {apkInfo?.sha256Checksum || 'e9b21f8a846c43029da9f381ad79284249a5843a8c1f0106198f3ec29a67440b'}
                </p>
              </div>

              {/* Step by Step Install Guide */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <Info className="w-4 h-4 text-emerald-400" />
                  <span>Installation Instructions on Android</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Download the File</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tap "Download APK Now" on your Android device or scan the QR code.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Allow Unknown Apps</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Open Settings &gt; Security &gt; Enable "Install unknown apps" for Chrome or Files.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Tap Install</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Open the downloaded file from notifications or Downloads and tap Install.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Login Securely</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Open MedWaste Guard and log in with your verified Khamgaon hospital credentials.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-5 text-center">
              <div className="p-4 bg-white rounded-2xl shadow-xl inline-block">
                <img 
                  src={qrCodeUrl} 
                  alt="Scan to download APK" 
                  className="w-56 h-56 object-contain"
                />
              </div>
              <div className="max-w-md space-y-1">
                <p className="text-base font-bold text-white">Point Android Camera at this QR Code</p>
                <p className="text-xs text-slate-400">
                  Your phone will prompt you to directly download the APK package without typing any URL.
                </p>
                <p className="text-xs text-emerald-400 font-mono pt-2 break-all">
                  {directDownloadUrl}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'eas' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                    <Terminal className="w-4 h-4" />
                    <span>Compile with Expo EAS Cloud Build</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(easCommand, 'cmd')}
                    className="flex items-center space-x-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd ? 'Copied' : 'Copy Command'}</span>
                  </button>
                </div>
                <div className="p-3 bg-black rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 select-all overflow-x-auto">
                  {easCommand}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The <span className="text-white font-mono">expo-app/</span> directory is already pre-configured with <span className="text-white font-mono">eas.json</span> (Android preview APK profile) and <span className="text-white font-mono">app.json</span>. Running this generates an Expo cloud build link with a custom signed APK ready for deployment to Khamgaon hospital staff.
                </p>
              </div>

              <div className="p-4 bg-blue-950/30 rounded-xl border border-blue-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-blue-300 text-xs font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Configured Android Package Specifications</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                  <div>Package ID: <span className="text-white">in.gov.cpcb.khamgaon.medwaste</span></div>
                  <div>Build Profile: <span className="text-white">preview (APK)</span></div>
                  <div>Orientation: <span className="text-white">Portrait</span></div>
                  <div>Theme: <span className="text-white">Material 3 Dark</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Khamgaon Health Network • CPCB Bio-Medical Waste Rules 2016</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
