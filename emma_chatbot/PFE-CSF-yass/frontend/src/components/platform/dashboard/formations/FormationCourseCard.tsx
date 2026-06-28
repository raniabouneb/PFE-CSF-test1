'use client';

import FormationModuleCard from '@/components/platform/dashboard/formations/FormationModuleCard';

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
  thumbClassName?: string;
  imageSrc?: string;
}

export interface FormationCourseCardProps {
  groupLabel: string;
  title: string;
  subtitle: string;
  badges: CourseBadge[];
  stats: CourseStat[];
  progressLabel?: string;
  progressPercent: number;
  /** Vide pour une formation ponctuelle (un seul module) : pas de grille de modules */
  modules: CourseModule[];
}

const badgeStyles: Record<CourseBadgeVariant, string> = {
  neutral: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200/80',
  success: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
  warning: 'bg-orange-50 text-orange-800 ring-1 ring-orange-200/80',
};

export default function FormationCourseCard({
  groupLabel,
  title,
  subtitle,
  badges,
  stats,
  progressLabel = 'Avancement global',
  progressPercent,
  modules,
}: FormationCourseCardProps) {
  const showModuleGrid = modules.length > 0;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[#0f766e]">{groupLabel}</p>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#1a2a3a]">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {badges.map((b) => (
            <span
              key={b.label}
              className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${badgeStyles[b.variant]}`}
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* Barre unique : Présences | Absences | Évaluations | Avancement global */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-slate-50/90 p-4 md:p-5">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-end lg:gap-6">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-base font-semibold text-[#1a2a3a]">{s.value}</p>
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {progressLabel}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="shrink-0 text-base font-semibold tabular-nums text-[#1a2a3a]">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {showModuleGrid && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <FormationModuleCard
              key={m.id}
              href={`/dashboard/formations/${m.id}`}
              title={m.title}
              statusLabel={m.statusLabel}
              variant={m.variant}
              progress={m.progress}
              thumbClassName={m.thumbClassName}
              imageSrc={m.imageSrc}
            />
          ))}
        </div>
      )}
    </section>
  );
}
