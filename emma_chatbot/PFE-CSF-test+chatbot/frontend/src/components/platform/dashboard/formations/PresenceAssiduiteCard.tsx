"use client"

import { KPI_GLASS_CARD_CLASS } from "@/components/platform/dashboard/kpi-glass-card"
import { cn } from "@/lib/utils"

interface PresenceAssiduiteCardProps {
  presentHours?: number
  absentHours?: number
  attendancePercent?: number
  formationTitle?: string | null
}

function HoursStat({
  hours,
  label,
  valueClassName,
  dotClassName,
}: {
  hours: number
  label: string
  valueClassName: string
  dotClassName: string
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
      <div className={`flex items-baseline justify-center gap-0.5 leading-none ${valueClassName}`}>
        <span className="font-mono text-xl font-bold tabular-nums">{hours}</span>
        <span className="text-[13px] font-semibold uppercase">H</span>
      </div>
      <div className="flex items-center justify-center gap-1.5">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", dotClassName)} aria-hidden />
        <span className="text-center text-[12px] text-white/75">{label}</span>
      </div>
    </div>
  )
}

export default function PresenceAssiduiteCard({
  presentHours = 0,
  absentHours = 0,
  attendancePercent = 0,
  formationTitle = null,
}: PresenceAssiduiteCardProps) {
  const total = presentHours + absentHours || 1

  const cx = 100
  const cy = 90
  const r = 74
  const strokeW = 25
  const halfCirc = Math.PI * r

  const presentLen = (presentHours / total) * halfCirc
  const absentLen = (absentHours / total) * halfCirc
  const absentStart = presentLen

  return (
    <div className={KPI_GLASS_CARD_CLASS}>
      <p className="text-[14px] font-semibold uppercase tracking-wider text-white/70">
        Engagement
      </p>
      {formationTitle ? (
        <p className="mt-0.5 line-clamp-2 text-[10px] text-white/75">{formationTitle}</p>
      ) : null}

      <div className="relative mx-auto mt-4 w-full max-w-[200px]">
        <svg viewBox="0 0 200 110" className="w-full overflow-visible">
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
          {presentHours > 0 && (
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth={strokeW}
              strokeLinecap="butt"
              strokeDasharray={`${presentLen} ${halfCirc}`}
              strokeDashoffset={0}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          )}
          {absentHours > 0 && (
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth={strokeW}
              strokeLinecap="butt"
              strokeDasharray={`${absentLen} ${halfCirc}`}
              strokeDashoffset={-absentStart}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          )}
        </svg>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <p className="font-mono text-4xl font-extrabold leading-none text-white">
            {Math.round(attendancePercent)}%
          </p>
          <p className="mt-0.5 text-[12px] text-white/75">Présence globale</p>
        </div>
      </div>

      <div className="mt-5 flex w-full justify-center gap-6 px-2">
        <HoursStat
          hours={presentHours}
          label="Présent"
          valueClassName="text-white"
          dotClassName="bg-white"
        />
        <HoursStat
          hours={absentHours}
          label="Absent"
          valueClassName="text-white/90"
          dotClassName="bg-white/65"
        />
      </div>
    </div>
  )
}
