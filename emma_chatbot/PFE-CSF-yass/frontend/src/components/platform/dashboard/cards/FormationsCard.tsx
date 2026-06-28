'use client';

interface FormationsCardProps {
  count?: number;
  completed?: number;
}

const BAR_HEIGHTS = [38, 62, 44, 72, 50, 88];

export default function FormationsCard({ count = 6, completed = 4 }: FormationsCardProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-[#1a3d5d]">Formations inscrites</h3>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-bold tabular-nums text-[#1a3d5d]">{count}</span>
        <span className="text-sm font-medium text-[#1a3d5d]/80">actives</span>
      </div>

      <div className="mt-5 flex h-14 items-end justify-between gap-1.5">
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className="min-h-[6px] flex-1 rounded-sm bg-[#1a3d5d]/25 transition-colors"
            style={{ height: `${Math.max(8, (h / 100) * 56)}px` }}
          />
        ))}
      </div>

      <div className="mt-6">
        <span className="inline-flex rounded-full bg-[#4caf50]/15 px-3 py-1.5 text-xs font-semibold text-[#2e7d32]">
          {completed} Formations terminées
        </span>
      </div>
    </div>
  );
}
