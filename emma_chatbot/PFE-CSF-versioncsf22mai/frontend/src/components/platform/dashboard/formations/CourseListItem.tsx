import type { ModuleCourseItem } from '@/lib/dashboard/formations-module-details';

const statusClass: Record<ModuleCourseItem['status'], string> = {
  Terminé: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  'En cours': 'bg-amber-50 text-amber-900 ring-amber-200/80',
  'À faire': 'bg-slate-100 text-slate-700 ring-slate-200/80',
  'Soumission en attente': 'bg-violet-50 text-violet-900 ring-violet-200/80',
};

const typeClass: Record<ModuleCourseItem['typeLabel'], string> = {
  Cours: 'bg-blue-50 text-blue-800 ring-blue-200/60',
  Lab: 'bg-teal-50 text-teal-800 ring-teal-200/60',
  Test: 'bg-purple-50 text-purple-800 ring-purple-200/60',
  Projet: 'bg-rose-50 text-rose-800 ring-rose-200/60',
};

interface CourseListItemProps {
  course: ModuleCourseItem;
}

export default function CourseListItem({ course }: CourseListItemProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 shadow-sm transition hover:border-gray-300 hover:bg-white md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4 className="text-sm font-bold text-[#1a2a3a] md:text-base">{course.title}</h4>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-[#1a3d5d]">
              {course.progressPercent}%
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#1a3d5d] shadow-sm transition hover:bg-gray-50 sm:self-center"
        >
          Voir tout
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${typeClass[course.typeLabel]}`}
        >
          {course.typeLabel}
        </span>
        <span className="text-xs text-muted-foreground">{course.duration}</span>
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusClass[course.status]}`}
        >
          {course.status}
        </span>
      </div>
    </div>
  );
}
