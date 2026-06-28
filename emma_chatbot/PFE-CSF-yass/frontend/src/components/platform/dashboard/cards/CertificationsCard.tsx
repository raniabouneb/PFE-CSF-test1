'use client';

interface CertificationsCardProps {
  obtained?: number;
  total?: number;
  percentage?: number;
  failPercentage?: number;
}

export default function CertificationsCard({
  obtained = 11,
  total = 20,
  percentage = 72,
  failPercentage = 28,
}: CertificationsCardProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-[#1a3d5d]">Certifications</h3>
      <p className="mt-3 text-4xl font-bold tabular-nums text-[#1a3d5d]">
        {obtained}/{total}
      </p>

      <div className="mt-6">
        <div className="h-2.5 overflow-hidden rounded-full bg-[#e5e7eb]">
          <div
            className="h-full rounded-full bg-[#008080] transition-all"
            style={{ width: `${(obtained / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex rounded-full bg-[#4caf50]/15 px-3 py-1.5 text-xs font-semibold text-[#2e7d32]">
          Réussite globale : {percentage}%
        </span>
        <span className="inline-flex rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800">
          Échec : {failPercentage}%
        </span>
      </div>
    </div>
  );
}
