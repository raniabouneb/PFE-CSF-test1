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
    <div className="rounded-3xl border border-white/40 bg-white/20 p-5 md:p-6 shadow-[0_8px_32px_rgba(148,163,184,0.18)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold text-[#0B264F]">
          ⏳ Certifications soumises — en attente de décision admin
        </h3>
        <Link href="#" className="text-sm font-semibold text-[#5ab396] hover:underline">
          Exporter l&apos;historique
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#0B264F]/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#0B264F]/10 bg-white/40 text-xs font-semibold uppercase tracking-wide text-[#64748b]">
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
              <tr key={row.id} className="border-b border-[#0B264F]/10 last:border-0">
                <td className="px-4 py-4 font-medium text-[#0B264F]">{row.certification}</td>
                <td className="px-4 py-4 text-[#64748b]">{row.type}</td>
                <td className="px-4 py-4 tabular-nums text-[#64748b]">{row.date}</td>
                <td className="px-4 py-4 tabular-nums font-medium text-[#0B264F]">{row.score}</td>
                <td className="px-4 py-4">
                  <ResultBadge row={row} />
                </td>
                <td className="px-4 py-4 text-[#64748b]">{row.docStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
