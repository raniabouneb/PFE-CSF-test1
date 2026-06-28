'use client';

import { Check, X } from 'lucide-react';

export interface CertLieeRow {
  id: string;
  name: string;
  score: string;
  passed: boolean;
}

const DEFAULT_ROWS: CertLieeRow[] = [
  { id: '1', name: 'Fondations Data & SQL', score: '86 %', passed: true },
  { id: '2', name: 'Python & analyse', score: '72 %', passed: true },
  { id: '3', name: 'Projet tutoré', score: '54 %', passed: false },
  { id: '4', name: 'Anglais technique', score: '91 %', passed: true },
];

interface CertificationsLieesFormationsCardProps {
  rows?: CertLieeRow[];
}

export default function CertificationsLieesFormationsCard({
  rows = DEFAULT_ROWS,
}: CertificationsLieesFormationsCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md">
      <h3 className="mb-4 text-sm font-bold text-[#1a2a3a]">Certifications liées à ces formations</h3>

      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5">Test / Certification</th>
              <th className="px-3 py-2.5">Score</th>
              <th className="px-3 py-2.5">Statut</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-50 last:border-0">
                <td className="px-3 py-3 font-medium text-[#1a2a3a]">{row.name}</td>
                <td className="px-3 py-3 tabular-nums text-muted-foreground">{row.score}</td>
                <td className="px-3 py-3">
                  {row.passed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
                      <Check size={12} strokeWidth={3} className="text-emerald-600" aria-hidden />
                      Réussi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800 ring-1 ring-red-200/80">
                      <X size={12} strokeWidth={3} className="text-red-600" aria-hidden />
                      Échoué
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
