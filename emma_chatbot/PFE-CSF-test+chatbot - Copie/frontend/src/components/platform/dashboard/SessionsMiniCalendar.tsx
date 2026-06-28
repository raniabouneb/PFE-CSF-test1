'use client'

import { useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg } from '@fullcalendar/core'
import type { SessionPlanifiee } from '@/types/learner'

interface SessionsMiniCalendarProps {
  sessions: SessionPlanifiee[]
  /** Appelé quand l'utilisateur clique sur un événement — passe la date "YYYY-MM-DD" */
  onDateClick: (date: string) => void
}

export default function SessionsMiniCalendar({
  sessions,
  onDateClick,
}: SessionsMiniCalendarProps) {
  const events = useMemo(
    () =>
      sessions.map((s) => ({
        id: s.session_id,
        title: s.module_titre ?? s.titre,
        date: s.date,
        extendedProps: { sessionDate: s.date },
      })),
    [sessions],
  )

  const handleEventClick = (arg: EventClickArg) => {
    const date = arg.event.extendedProps.sessionDate as string
    onDateClick(date)
  }

  return (
    <div className="sessions-mini-calendar">
      <style>{`
        /* Base FullCalendar v6 (pas de CSS npm — styles minimaux pour la grille) */
        .sessions-mini-calendar .fc { display: flex; flex-direction: column; }
        .sessions-mini-calendar .fc table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .sessions-mini-calendar .fc th,
        .sessions-mini-calendar .fc td { padding: 0; vertical-align: top; }
        .sessions-mini-calendar .fc a { color: inherit; text-decoration: none; }
        .sessions-mini-calendar .fc .fc-scrollgrid { width: 100%; }
        .sessions-mini-calendar .fc .fc-daygrid-body { width: 100% !important; }
        .sessions-mini-calendar .fc .fc-daygrid-day-frame { min-height: 36px; }

        .sessions-mini-calendar .fc {
          font-family: inherit;
          font-size: 12px;
        }

        .sessions-mini-calendar .fc-toolbar {
          padding: 0 0 8px 0;
          margin-bottom: 0 !important;
          align-items: center;
        }
        .sessions-mini-calendar .fc-toolbar-title {
          font-size: 13px !important;
          font-weight: 700;
          color: #0B264F;
          letter-spacing: 0.02em;
        }
        .sessions-mini-calendar .fc-button {
          background: transparent !important;
          border: 1px solid rgba(11,38,79,0.25) !important;
          color: #0B264F !important;
          border-radius: 8px !important;
          padding: 2px 8px !important;
          font-size: 13px !important;
          box-shadow: none !important;
          transition: background 0.15s;
        }
        .sessions-mini-calendar .fc-button:hover {
          background: rgba(11,38,79,0.08) !important;
        }
        .sessions-mini-calendar .fc-button:focus {
          outline: none !important;
          box-shadow: none !important;
        }

        .sessions-mini-calendar .fc-col-header-cell-cushion {
          color: rgba(11,38,79,0.5);
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 0;
          text-decoration: none !important;
        }

        .sessions-mini-calendar .fc-daygrid-day-number {
          color: #0B264F;
          font-size: 11px;
          font-weight: 500;
          padding: 3px 5px;
          text-decoration: none !important;
        }
        .sessions-mini-calendar .fc-day-today .fc-daygrid-day-number {
          background: #0D3570;
          color: white;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin: 3px auto 0;
        }
        .sessions-mini-calendar .fc-day-today {
          background: transparent !important;
        }

        .sessions-mini-calendar .fc-scrollgrid {
          border: none !important;
        }
        .sessions-mini-calendar .fc-scrollgrid-section > td {
          border: none !important;
        }
        .sessions-mini-calendar td,
        .sessions-mini-calendar th {
          border-color: rgba(11,38,79,0.08) !important;
        }
        .sessions-mini-calendar .fc-daygrid-day {
          min-height: 36px !important;
        }

        .sessions-mini-calendar .fc-daygrid-event-harness {
          display: flex;
          justify-content: center;
          margin-top: 2px;
        }
        .sessions-mini-calendar .fc-daygrid-event {
          background: #0D3570 !important;
          border: none !important;
          border-radius: 50% !important;
          width: 7px !important;
          height: 7px !important;
          min-height: unset !important;
          padding: 0 !important;
          margin: 0 1px !important;
          cursor: pointer;
          transition: transform 0.15s, background 0.15s;
        }
        .sessions-mini-calendar .fc-daygrid-event:hover {
          background: #1e4a72 !important;
          transform: scale(1.3);
        }
        .sessions-mini-calendar .fc-event-title,
        .sessions-mini-calendar .fc-event-time {
          display: none !important;
        }
        .sessions-mini-calendar .fc-daygrid-dot-event {
          padding: 0 !important;
        }

        .sessions-mini-calendar .fc-daygrid-more-link {
          font-size: 9px;
          color: #0D3570;
        }
      `}</style>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="fr"
        firstDay={1}
        headerToolbar={{
          left: 'prev',
          center: 'title',
          right: 'next',
        }}
        events={events}
        eventClick={handleEventClick}
        height="auto"
        dayMaxEvents={3}
        fixedWeekCount={false}
        showNonCurrentDates={false}
      />
    </div>
  )
}
