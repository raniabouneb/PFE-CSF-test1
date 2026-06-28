"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Award, Bell, Calendar, FileText, ShieldAlert } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { linkForLearnerNotification } from "@/lib/dashboard/learner-notification-routes"
import {
  fetchLearnerNotifications,
  markNotificationRead,
  type LearnerNotificationItem,
  type LearnerNotificationKind,
} from "@/lib/dashboard/learner-notifications-api"

const POLL_INTERVAL_MS = 30_000

function kindIcon(kind: LearnerNotificationKind) {
  switch (kind) {
    case "doc_validated":
    case "cert_available":
      return <Award size={18} className="shrink-0 text-emerald-600" aria-hidden />
    case "doc_rejected":
      return <ShieldAlert size={18} className="shrink-0 text-red-500" aria-hidden />
    case "session_scheduled":
      return <Calendar size={18} className="shrink-0 text-[#008080]" aria-hidden />
    default:
      return <FileText size={18} className="shrink-0 text-[#1a3d5d]" aria-hidden />
  }
}

function timeAgo(iso: string | null): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Hier"
  return `Il y a ${days}j`
}

type NotificationBellVariant = "hero" | "dashboard"

const TRIGGER_STYLES: Record<NotificationBellVariant, string> = {
  hero: "border-white/25 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 focus-visible:outline-white/80",
  dashboard:
    "border-[#0D3570]/15 bg-white text-[#0D3570] shadow-sm hover:bg-[#0D3570]/5 focus-visible:outline-[#0D3570]/40",
}

export function NotificationBell({
  className,
  variant = "hero",
}: {
  className?: string
  variant?: NotificationBellVariant
}) {
  const router = useRouter()
  const [items, setItems] = useState<LearnerNotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const load = useCallback(async () => {
    try {
      const data = await fetchLearnerNotifications()
      setItems(data)
      setUnreadCount(data.filter((n) => !n.isRead).length)
    } catch {
      // silent — don't block UI
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [load])

  const handleClick = async (n: LearnerNotificationItem) => {
    if (!n.isRead) {
      try {
        await markNotificationRead(n.id)
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {
        // silent
      }
    }
    router.push(linkForLearnerNotification(n.kind))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications (${unreadCount > 0 ? `${unreadCount} nouvelles` : "aucune nouvelle"})`}
          className={cn(
            "relative shrink-0 rounded-full border p-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
            TRIGGER_STYLES[variant],
            className,
          )}
        >
          <Bell size={22} className="opacity-95" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold tabular-nums text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
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
            {unreadCount > 0 ? (
              <span className="shrink-0 rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
                {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-500">À jour</span>
            )}
          </div>
        </div>

        <div role="list" className="divide-y divide-slate-100 px-4 py-2">
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Aucune notification</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                role="listitem"
                onClick={() => handleClick(n)}
                className={cn(
                  "flex w-full gap-3 py-3 text-left transition-colors first:pt-2 last:pb-2 hover:bg-slate-50 rounded-md px-1",
                  !n.isRead && "bg-blue-50/50",
                )}
              >
                <div className="mt-0.5">{kindIcon(n.kind)}</div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm leading-snug text-[#1a2a3a]", !n.isRead && "font-semibold")}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 line-clamp-2">{n.body}</p>
                  )}
                  <p className="mt-1.5 text-[11px] text-slate-500">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-blue-500" />
                )}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
