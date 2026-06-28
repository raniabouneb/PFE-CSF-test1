'use client';

import DownloadReleveButton from '@/components/platform/dashboard/buttons/DownloadReleveButton';

interface PresenceRow {
  id: string;
  dotClass: string;
  label: string;
  value: string;
}

const DEFAULT_ROWS: PresenceRow[] = [
  {
    id: '1',
    dotClass: 'bg-emerald-500',
    label: 'Présent',
    value: '48 séances',
  },
  {
    id: '2',
    dotClass: 'bg-red-500',
    label: 'Absent',
    value: '6 séances à rattraper',
  },
  {
    id: '3',
    dotClass: 'bg-[#008080]',
    label: 'Taux global',
    value: '88,8 %',
  },
];

interface PresenceAssiduiteCardProps {
  rows?: PresenceRow[];
}

export default function PresenceAssiduiteCard({ rows = DEFAULT_ROWS }: PresenceAssiduiteCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[#1a2a3a]">Présence &amp; assiduité</h3>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground ring-1 ring-gray-200/80">
          30 derniers jours
        </span>
      </div>

      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="flex items-start gap-3 text-sm">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${row.dotClass}`} aria-hidden />
            <div className="flex min-w-0 flex-1 flex-wrap justify-between gap-1">
              <span className="font-medium text-[#1a2a3a]">{row.label}</span>
              <span className="text-muted-foreground">{row.value}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <DownloadReleveButton />
      </div>
    </div>
  );
}
