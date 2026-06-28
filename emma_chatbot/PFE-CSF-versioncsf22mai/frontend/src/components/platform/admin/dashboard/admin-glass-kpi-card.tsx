import { cn } from "@/lib/utils"

const GLASS_KPI_CLASS =
  "rounded-2xl border border-white/50 bg-white/35 p-5 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl ring-1 ring-white/60 sm:p-6"

export function AdminGlassKpiCard({
  label,
  sublabel,
  value,
  trend,
  className,
}: {
  label: string
  sublabel: string
  value: string
  trend?: string
  className?: string
}) {
  return (
    <div className={cn(GLASS_KPI_CLASS, "-mt-14", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-[#1a3d5d]/70">{sublabel}</p>
      <p className="mt-1 text-sm font-semibold text-[#0f172a]">{label}</p>
      <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-[#0D3570]">{value}</p>
      {trend ? (
        <p className="mt-2 text-xs font-medium text-emerald-700/90">{trend}</p>
      ) : null}
    </div>
  )
}
