import type { ModuleDayAttendance } from '@/lib/dashboard/formations-module-details';

interface ModuleAttendanceCalendarProps {
  monthLabel: string;
  legend: string;
  days: ModuleDayAttendance[];
}

const WEEKDAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

function statusBadgeClass(status: ModuleDayAttendance['status']) {
  switch (status) {
    case 'present':
      return 'bg-emerald-100 text-emerald-900 ring-emerald-200/80';
    case 'absent':
      return 'bg-red-100 text-red-900 ring-red-200/80';
    default:
      return 'bg-gray-100 text-gray-700 ring-gray-200/80';
  }
}

function statusLabel(status: ModuleDayAttendance['status']) {
  switch (status) {
    case 'present':
      return 'Présent';
    case 'absent':
      return 'Absent';
    default:
      return 'Libre';
  }
}

export default function ModuleAttendanceCalendar({
  monthLabel,
  legend,
  days,
}: ModuleAttendanceCalendarProps) {
  const yearMonth = monthLabel.trim();
  const firstWeekday = days[0]?.weekdayShort;
  const startOffset = Math.max(0, WEEKDAYS.indexOf(firstWeekday ?? 'LUN'));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md">
      <h3 className="text-sm font-bold text-[#1a2a3a]">Calendrier de présence — {yearMonth}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{legend}</p>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square min-h-[4.5rem]" aria-hidden />
        ))}
        {days.map((d) => (
          <div
            key={d.day}
            className="flex aspect-square min-h-[4.5rem] flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50/80 p-1 text-center"
          >
            <span className="text-[9px] font-medium text-muted-foreground">{d.weekdayShort}</span>
            <span className="text-sm font-bold text-[#1a2a3a]">{d.day}</span>
            <span
              className={`mt-0.5 max-w-full truncate rounded px-1 py-0.5 text-[8px] font-semibold ring-1 ${statusBadgeClass(d.status)}`}
            >
              {statusLabel(d.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
