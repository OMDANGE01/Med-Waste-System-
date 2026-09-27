import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...', size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 space-y-3 ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 animate-ping absolute inset-0" />
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <Loader2 className={`${sizeClasses[size] || sizeClasses.md} text-emerald-400 animate-spin`} />
        </div>
      </div>
      {message && (
        <p className="text-xs font-medium text-slate-400 font-mono tracking-wide">
          {message}
        </p>
      )}
    </div>
  );
}
