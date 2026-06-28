import Link from 'next/link';
import { Clock, X } from 'lucide-react';
import type { PendingCertRow } from '@/lib/dashboard/certifications-page-data';
import { PENDING_CERTIFICATIONS } from '@/lib/dashboard/certifications-page-data';

function ResultBadge({ row }: { row: PendingCertRow }) {
  if (row.result === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-red-200/80">
        <X size={12} strokeWidth={3} className="text-red-600" aria-hidden />
        {row.resultLabel}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200/80">
      <Clock size={12} className="text-amber-700" aria-hidden />
      {row.resultLabel}
    </span>
  );
}

interface PendingCertificationsTableProps {
  rows?: PendingCertRow[];
}

export default function PendingCertificationsTable({
  rows = PENDING_CERTIFICATIONS,
}: PendingCertificationsTableProps) {
  return (
    <div className="rounded-xl  bg-white p-6  md:p-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold text-[#1a2a3a]">
          Certifications passées en attente d&apos;impression ou de décision
        </h3>
        <Link href="#" className="text-sm font-semibold text-[#0f766e] hover:underline">
          Exporter l&apos;historique
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/90 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3.5">Certification</th>
              <th className="px-4 py-3.5">Type</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5">Score</th>
              <th className="px-4 py-3.5">Résultat</th>
              <th className="px-4 py-3.5">Statut document</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-4 font-medium text-[#1a2a3a]">{row.certification}</td>
                <td className="px-4 py-4 text-muted-foreground">{row.type}</td>
                <td className="px-4 py-4 tabular-nums text-muted-foreground">{row.date}</td>
                <td className="px-4 py-4 tabular-nums font-medium text-[#1a2a3a]">{row.score}</td>
                <td className="px-4 py-4">
                  <ResultBadge row={row} />
                </td>
                <td className="px-4 py-4 text-muted-foreground">{row.docStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
