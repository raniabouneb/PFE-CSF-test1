import { FORMATION_BADGE_STYLES } from "@/components/platform/dashboard/formation-badge-styles"

interface MesFormationsIntroCardProps {
  title?: string
  enrollmentCount: number
  description?: string
}

function formatEnrollmentBadge(count: number): string {
  const n = Math.max(0, count)
  if (n === 0) return "Aucune formation inscrite"
  return `${n} formation${n > 1 ? "s" : ""} inscrite${n > 1 ? "s" : ""}`
}

export default function MesFormationsIntroCard({
  title = "Mes Formations",
  enrollmentCount,
  description = "Retrouvez l’ensemble de vos parcours, suivez votre progression module par module et accédez aux ressources associées.",
}: MesFormationsIntroCardProps) {
  return (
    <header className="mb-6 flex flex-col gap-3 border-b border-white/35 pb-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[14px] font-semibold uppercase tracking-wider text-[#64748b]">
          {title}
        </p>
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${FORMATION_BADGE_STYLES.success}`}
        >
          {formatEnrollmentBadge(enrollmentCount)}
        </span>
      </div>
      <p className="max-w-3xl text-sm leading-relaxed text-[#64748b]">{description}</p>
    </header>
  )
}
