import {
  ADMIN_DASHBOARD_CARD_CLASS,
  ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS,
  ADMIN_DASHBOARD_CARD_TITLE_CLASS,
} from "@/lib/admin/dashboard-card-styles"
import { cn } from "@/lib/utils"

type SegmentItem = { title: string; score: number; metricLabel: string }

function SegmentColumn({ item }: { item: SegmentItem }) {
  const pct = Math.min(100, Math.max(4, item.score))
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <span className="text-sm font-semibold tabular-nums text-[#0f172a]">{item.score.toFixed(1)}</span>
      <div
        className="relative mt-3 h-[132px] w-11 overflow-hidden rounded-full bg-[#b8d4f0] shadow-inner sm:w-12"
        role="presentation"
        aria-hidden
      >
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full bg-[#0c2744] transition-[height] duration-500"
          style={{ height: `${pct}%` }}
        />
      </div>
      <p
        className="mt-3 max-w-[4.8rem] text-center text-[10px] font-medium leading-tight text-neutral-700 sm:max-w-[5.5rem] sm:text-[11px]"
        title={item.title}
      >
        {item.title}
      </p>
      <span className="mt-1 text-[9px] text-neutral-500">{item.metricLabel}</span>
    </div>
  )
}

export function AdminFormationSegmentBars({
  title,
  subtitle,
  items,
  metricSuffix,
  className,
}: {
  title: string
  subtitle?: string
  items: { title: string; score: number; visits?: number; enrollments?: number }[]
  metricSuffix: string
  className?: string
}) {
  const normalized: SegmentItem[] = items.map((it) => ({
    title: it.title,
    score: it.score,
    metricLabel:
      it.visits != null
        ? `${it.visits.toLocaleString("fr-FR")} ${metricSuffix}`
        : it.enrollments != null
          ? `${it.enrollments} ${metricSuffix}`
          : metricSuffix,
  }))

  return (
    <section className={cn(ADMIN_DASHBOARD_CARD_CLASS, className)}>
      <h3 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>{title}</h3>
      {subtitle ? <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>{subtitle}</p> : null}
      <div className="mt-6 overflow-x-auto pb-1">
        <div className="flex min-w-[520px] justify-between gap-2 sm:min-w-0 sm:gap-3">
          {normalized.map((it) => (
            <SegmentColumn key={it.title} item={it} />
          ))}
        </div>
      </div>
    </section>
  )
}
