'use client';

import Link from 'next/link';
import FormationModuleCard from '@/components/platform/dashboard/formations/FormationModuleCard';
import {
  FORMATION_BADGE_STYLES,
  resolveFormationBadgeClassName,
} from '@/components/platform/dashboard/formation-badge-styles';

export type CourseBadgeVariant = 'neutral' | 'success' | 'warning';

export interface CourseBadge {
  label: string;
  variant: CourseBadgeVariant;
}

export interface CourseStat {
  label: string;
  value: string;
}

export interface CourseModule {
  id: string;
  title: string;
  statusLabel: string;
  variant: 'completed' | 'in_progress';
  progress?: number;
  locked?: boolean;
  thumbClassName?: string;
  imageSrc?: string;
}

export interface FormationCourseCardProps {
  groupLabel: string;
  groupId?: string;
  memberId?: string;
  title: string;
  subtitle: string;
  badges: CourseBadge[];
  stats: CourseStat[];
  progressLabel?: string;
  progressPercent: number;
  modules: CourseModule[];
}

const badgeStyles: Record<CourseBadgeVariant, string> = {
  neutral: FORMATION_BADGE_STYLES.neutral,
  success: FORMATION_BADGE_STYLES.success,
  warning: FORMATION_BADGE_STYLES.warning,
};

export default function FormationCourseCard({
  groupLabel,
  groupId,
  memberId,
  title,
  subtitle,
  badges,
  stats,
  progressLabel = 'Avancement global',
  progressPercent,
  modules,
}: FormationCourseCardProps) {
  const enrollmentId = groupId && memberId ? `${groupId}-${memberId}` : null;
  const showModuleGrid = modules.length > 1;
  const singleModule = modules.length === 1 ? modules[0] : null;
  const singleModuleHref =
    singleModule && !singleModule.locked && enrollmentId
      ? `/dashboard/formations/${enrollmentId}/modules/${encodeURIComponent(singleModule.id)}`
      : null;
  const allLocked = modules.length > 0 && modules.every((m) => Boolean(m.locked));
  const accessTag: CourseBadge | null =
    modules.length > 0
      ? { label: allLocked ? 'Verrouillé' : 'Déverrouillé', variant: allLocked ? 'neutral' : 'success' }
      : null;
  const displayBadges = accessTag ? [...badges, accessTag] : badges;

  return (
    <section className="border-b border-white/35 pb-8 last:border-0 last:pb-0">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#0A566E]">{groupLabel}</p>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold leading-snug text-[#0B264F]">{title}</h3>
          <p className="mt-1 text-sm text-[#64748b]">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {displayBadges.map((b) => (
            <span
              key={`${b.label}-${b.variant}`}
              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${resolveFormationBadgeClassName(b.label, badgeStyles[b.variant])}`}
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {singleModuleHref ? (
        <Link
          href={singleModuleHref}
          className="mt-6 block rounded-xl border border-white/35 bg-white/15 p-4 backdrop-blur-sm transition hover:border-white/60 hover:bg-white/25 md:p-5"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-end lg:gap-6">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">{s.label}</p>
                <p className="mt-1 text-base font-semibold tabular-nums text-[#0B264F]">{s.value}</p>
              </div>
            ))}
            <div className="sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">
                {progressLabel}
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/90">
                  <div
                    className="h-full rounded-full bg-gradient-to-b from-[#115C73] to-[#0B264F] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                  />
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-[#0B264F]">
                  {progressPercent}%
                </span>
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <div className="mt-6 rounded-xl border border-white/35 bg-white/15 p-4 backdrop-blur-sm md:p-5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-end lg:gap-6">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">{s.label}</p>
                <p className="mt-1 text-base font-semibold tabular-nums text-[#0B264F]">{s.value}</p>
              </div>
            ))}
            <div className="sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">
                {progressLabel}
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/90">
                  <div
                    className="h-full rounded-full bg-gradient-to-b from-[#115C73] to-[#0B264F] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                  />
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-[#0B264F]">
                  {progressPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModuleGrid ? (
        <div className="relative mt-8">
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/40 scrollbar-track-transparent">
            {modules.map((m) => (
              <div key={m.id} className="w-56 shrink-0">
                <FormationModuleCard
                  href={
                    m.locked || !enrollmentId
                      ? undefined
                      : `/dashboard/formations/${enrollmentId}/modules/${encodeURIComponent(m.id)}`
                  }
                  title={m.title}
                  statusLabel={m.statusLabel}
                  variant={m.variant}
                  progress={m.progress}
                  locked={m.locked}
                  thumbClassName={m.thumbClassName}
                  imageSrc={m.imageSrc}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
