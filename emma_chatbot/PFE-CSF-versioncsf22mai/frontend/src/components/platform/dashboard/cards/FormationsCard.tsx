"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { FORMATIONS_GLASS_CARD_CLASS } from "@/components/platform/dashboard/formations-glass-card"

export type ModuleProgressBar = {
  title: string
  percent: number
  presenceData?: {
    presentHours: number
    absentHours: number
    attendancePercent: number
  }
}

interface FormationsCardProps {
  count?: number
  moduleBars?: ModuleProgressBar[]
  selectedIndex?: number
  onSelectionChange?: (index: number) => void
}

function barLabel(title: string, index: number): string {
  const trimmed = title.trim()
  if (trimmed.length <= 4) return trimmed.toUpperCase()
  return `${index + 1}`.padStart(2, "0")
}

export default function FormationsCard({
  count = 0,
  moduleBars = [],
  selectedIndex,
  onSelectionChange,
}: FormationsCardProps) {
  const [internalSelected, setInternalSelected] = useState(0)
  const activeIndex = selectedIndex ?? internalSelected

  const bars = moduleBars

  function handleSelect(i: number) {
    setInternalSelected(i)
    onSelectionChange?.(i)
  }

  return (
    <div className={cn(FORMATIONS_GLASS_CARD_CLASS, "flex h-full flex-col")}>
      <p className="text-[14px] font-semibold uppercase tracking-wider text-[#64748b]">
      Formations inscrites
      </p>
      {/* 
      <h3 className="mt-1 text-sm font-bold text-[#0B264F]">Formations inscrites</h3>
*/}
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-mono text-4xl font-extrabold text-[#0B264F]">{count}</span>
        <span className="text-sm font-medium text-[#0B264F]">formations</span>
      </div>

      {bars.length > 0 ? (
        <div
          className="relative mt-5 grid w-full min-h-[116px] flex-1 items-end gap-0.5 pt-6"
          style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}
        >
          {bars.map((bar, i) => {
            const pct = Math.min(100, Math.max(0, bar.percent))
            const heightPx = Math.max(16, Math.round((pct / 100) * 88))
            const isActive = i === activeIndex
            return (
              <button
                key={`${bar.title}-${i}`} 
                type="button"
                onClick={() => handleSelect(i)}
                title={bar.title}
                className="group relative flex min-w-0 w-full cursor-pointer flex-col items-stretch gap-2 px-0.5 focus:outline-none"
                aria-pressed={isActive}
              >
                {isActive ? (
                  <span className="absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1e293b] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white shadow-md">
                    {pct}%
                  </span>
                ) : null}
                <div
                  className={cn(
                    "w-full min-w-[8px] rounded-full transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-b from-[#115C73] to-[#0B264F] shadow-[0_4px_14px_rgba(93,156,255,0.45)]"
                      : "bg-gradient-to-b from-white/95 to-white/35 hover:from-white hover:to-white/50",
                  )}
                  style={{ height: `${heightPx}px` }}
                />
                <span
                  className={cn(
                    "w-full truncate text-center text-[9px] font-medium uppercase tracking-wide",
                    isActive ? "font-bold text-[#334155]" : "text-[#94a3b8]",
                  )}
                >
                  {barLabel(bar.title, i)}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-5 flex flex-1 items-center justify-center">
          <p className="text-xs text-[#94a3b8]">Aucune formation</p>
        </div>
      )}
    </div>
  )
}
