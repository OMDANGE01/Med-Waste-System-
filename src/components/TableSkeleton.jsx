import React from 'react';

/**
 * TableSkeleton Component
 * Provides smooth, professional dark-mode loading skeleton state for enterprise data tables
 */
export default function TableSkeleton({ rows = 5, cols = 6, header = true }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-1">
      {header && (
        <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 animate-pulse">
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={`th-skel-${i}`}
              className="h-4 bg-slate-800 rounded-md"
              style={{ width: `${Math.max(12, 100 / cols - 4)}%` }}
            />
          ))}
        </div>
      )}
      <div className="divide-y divide-slate-800/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={`tr-skel-${r}`}
            className="flex items-center gap-4 px-6 py-4.5 animate-pulse"
            style={{ animationDelay: `${r * 120}ms` }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={`td-skel-${r}-${c}`}
                className="h-4 bg-slate-800/80 rounded-md"
                style={{
                  width: c === 0 ? '18%' : c === cols - 1 ? '10%' : `${Math.floor(12 + ((c + r) % 4) * 5)}%`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
