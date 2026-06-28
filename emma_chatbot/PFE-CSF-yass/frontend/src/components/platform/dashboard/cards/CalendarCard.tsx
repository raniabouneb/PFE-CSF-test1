'use client';

import { Calendar } from 'lucide-react';

interface CalendarEvent {
  id: string;
  day: number;
  month: string;
  title: string;
  time: string;
  description?: string;
}

interface CalendarCardProps {
  events?: CalendarEvent[];
}

const defaultEvents: CalendarEvent[] = [
  {
    id: '1',
    day: 14,
    month: 'OCT',
    title: 'Classe virtuelle : Python Avancé',
    time: '14:00 – 16:30',
    description: 'Reconversion Métier Data Analyst',
  },
  {
    id: '2',
    day: 16,
    month: 'OCT',
    title: 'Lab encadré : Déploiement CI/CD',
    time: '09:00 – 12:00',
    description: 'Docker et Kubernetes',
  },
  {
    id: '3',
    day: 20,
    month: 'OCT',
    title: 'Examen de certification (Data)',
    time: '10:00 – 11:30',
    description: 'Évaluation finale requise',
  },
];

/** Lun–Dim : Ma / Me pour éviter deux « M » identiques (clés React + lisibilité). */
const MINI_WEEK = ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'] as const;
const MINI_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function CalendarCard({ events = defaultEvents }: CalendarCardProps) {
  const highlighted = new Set(events.map((e) => e.day));

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Calendar size={18} className="text-[#008080]" strokeWidth={1.75} />
        <h3 className="text-sm font-semibold text-[#1a2a3a]">Prochaines Séances</h3>
      </div>

      <div className="mb-5 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-[#1a3d5d]">Octobre 2026</span>
          <span className="text-[10px] text-muted-foreground">Aperçu</span>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-medium text-muted-foreground">
          {MINI_WEEK.map((d, i) => (
            <span key={`mini-week-${i}`} className="py-0.5">
              {d}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-0.5">
          {MINI_DAYS.map((day) => {
            const isHi = highlighted.has(day);
            return (
              <span
                key={day}
                className={`flex aspect-square items-center justify-center rounded text-[10px] font-medium ${
                  isHi ? 'bg-[#1a3d5d] text-white shadow-sm' : 'text-[#1a2a3a]/75'
                }`}
              >
                {day}
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="flex gap-3 border-b border-[#f3f4f6] pb-4 last:border-0 last:pb-0">
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md border border-[#e5e7eb] bg-white text-center shadow-sm">
              <span className="text-[9px] font-semibold uppercase leading-none text-muted-foreground">
                {event.month}
              </span>
              <span className="text-base font-bold leading-tight text-[#1a3d5d]">{event.day}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug text-[#1a2a3a]">{event.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{event.time}</p>
              {event.description && (
                <p className="mt-0.5 text-xs text-muted-foreground/90">{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
