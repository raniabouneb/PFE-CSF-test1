'use client';

import { Search } from 'lucide-react';

interface ModuleStatsSidebarProps {
  coursPercent: number;
  labsPercent: number;
  testsTotal: number;
  testsPassed: number;
  testsFailed: number;
}

function LinearStatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[#1a3d5d]">{value}%</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-[#2563eb]"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function RingMini({
  label,
  sub,
  percent,
  colorClass,
}: {
  label: string;
  sub: string;
  percent: number;
  colorClass: string;
}) {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gray-100"
        style={{
          background: `conic-gradient(${colorClass} 0% ${p}%, #e5e7eb ${p}% 100%)`,
        }}
      >
        <div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-white text-xs font-bold text-[#1a2a3a]">
          {label}
        </div>
      </div>
      <span className="max-w-[5rem] text-[10px] leading-tight text-muted-foreground">{sub}</span>
    </div>
  );
}

export default function ModuleStatsSidebar({
  coursPercent,
  labsPercent,
  testsTotal,
  testsPassed,
  testsFailed,
}: ModuleStatsSidebarProps) {
  const passPct = testsTotal > 0 ? (testsPassed / testsTotal) * 100 : 0;
  const failPct = testsTotal > 0 ? (testsFailed / testsTotal) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex h-11 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 shadow-sm">
        <Search size={18} className="shrink-0 text-muted-foreground" aria-hidden />
        <input
          type="search"
          placeholder="Rechercher dans le module…"
          className="min-w-0 flex-1 bg-transparent text-sm text-[#1a2a3a] placeholder:text-muted-foreground focus:outline-none"
          aria-label="Rechercher dans le module"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <LinearStatCard label="Cours" value={coursPercent} />
        <LinearStatCard label="Labs" value={labsPercent} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tests passés
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-[#1a2a3a]">{testsTotal}</p>
        {testsTotal > 0 && (
          <div className="mt-4 flex justify-center gap-6">
            <RingMini
              label={String(testsPassed)}
              sub={`${testsPassed} réussi${testsPassed > 1 ? 's' : ''}`}
              percent={passPct}
              colorClass="#2563eb"
            />
            <RingMini
              label={String(testsFailed)}
              sub={`${testsFailed} échoué${testsFailed > 1 ? 's' : ''}`}
              percent={failPct}
              colorClass="#dc2626"
            />
          </div>
        )}
        {testsTotal === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">Aucun test planifié pour ce module.</p>
        )}
      </div>
    </div>
  );
}
