"use client"

import { AlertCircle, Bell, BookOpen, Calendar, Clock } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface LearnerNotification {
  id: string
  icon: "alert" | "clock" | "book" | "calendar"
  title: string
  description: string
  time: string
}

export const DEFAULT_LEARNER_NOTIFICATIONS: LearnerNotification[] = [
  {
    id: "1",
    icon: "calendar",
    title: "Changement d'horaire",
    description:
      "La classe 'Leadership Agile' est décalée au 22 oct. à 14h00.",
    time: "Il y a 2 heures",
  },
  {
    id: "2",
    icon: "clock",
    title: "Rappel de lab",
    description:
      "N'oubliez pas de soumettre le livrable du Lab Docker avant ce soir.",
    time: "Aujourd'hui, 09:00",
  },
  {
    id: "3",
    icon: "book",
    title: "Nouveau support disponible",
    description:
      'Les cours de la séance « Analyse prédictive » ont été ajoutés à vos ressources.',
    time: "Hier",
  },
]

function NotificationIcon({ type }: { type: LearnerNotification["icon"] }) {
  const cls = "shrink-0 text-[#1a3d5d]"
  switch (type) {
    case "alert":
      return <AlertCircle size={18} className={cls} aria-hidden />
    case "clock":
      return <Clock size={18} className={cls} aria-hidden />
    case "calendar":
      return <Calendar size={18} className={cls} aria-hidden />
    case "book":
      return <BookOpen size={18} className={cls} aria-hidden />
    default:
      return null
  }
}

export function DashboardNotificationsDropdown({
  notifications = DEFAULT_LEARNER_NOTIFICATIONS,
  newCount = 2,
  className,
}: {
  notifications?: LearnerNotification[]
  /** Pastille affichée sur l’icône (nouvelles). */
  newCount?: number
  className?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications (${newCount > 0 ? `${newCount} nouvelles` : "aucune nouvelle"})`}
          className={cn(
            "relative shrink-0 rounded-full border border-white/25 bg-white/15 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80",
            className,
          )}
        >
          <Bell size={22} className="opacity-95" aria-hidden />
          {newCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4caf50] px-1 text-[10px] font-bold tabular-nums text-white shadow-sm">
              {newCount > 9 ? "9+" : newCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className={cn(
          "w-[min(100vw-1.25rem,22rem)] max-h-[min(70vh,26rem)] overflow-y-auto rounded-xl border border-slate-200/90 bg-white p-0 shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="sticky top-0 z-[1] border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[#1a2a3a]">Notifications</p>
            {newCount > 0 ? (
              <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                {newCount} nouvelle{newCount > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-500">À jour</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Planning et rappels</p>
        </div>

        <div role="list" className="divide-y divide-slate-100 px-4 py-2">
          {notifications.map((n) => (
            <div key={n.id} role="listitem" className="flex gap-3 py-3 first:pt-2 last:pb-2">
              <div className="mt-0.5"><NotificationIcon type={n.icon} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-[#1a2a3a]">
                  {n.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {n.description}
                </p>
                <p className="mt-1.5 text-[11px] text-slate-500">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
