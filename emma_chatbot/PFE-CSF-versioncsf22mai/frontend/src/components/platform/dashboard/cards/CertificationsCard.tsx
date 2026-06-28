"use client"

import { KPI_GLASS_CARD_CLASS } from "@/components/platform/dashboard/kpi-glass-card"

interface CertificationsCardProps {  obtained?: number
  total?: number
}

export default function CertificationsCard({
  obtained = 0,
  total = 0,
}: CertificationsCardProps) {
  const safeTotal = total || 1
  const pct = Math.round((obtained / safeTotal) * 100)

  return (
    <div className={KPI_GLASS_CARD_CLASS}>
      <p className="text-[14px] font-semibold uppercase tracking-wider text-white/80">
      Certifications
      </p>
      {/*
      <h3 className="mt-1 text-sm font-bold text-white">Certifications</h3>
*/}

      <div className="mt-10 flex items-baseline gap-1">
        <span className="font-mono text-4xl font-extrabold text-white">{obtained}</span>
        <span className="font-mono text-2xl font-bold text-white/70">/{total}</span>
      </div>
      <p className="mt-1 text-xs text-white/80">certifications obtenues</p>

      <div className="mt-5 flex-1">
        <div className="h-8 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-right text-xs font-semibold text-white">{pct}%</p>
      </div>

      <p className="mt-3 text-[12px] text-white/75">
        {total - obtained} certification{total - obtained > 1 ? "s" : ""} restante
        {total - obtained > 1 ? "s" : ""}
      </p>
    </div>
  )
}
