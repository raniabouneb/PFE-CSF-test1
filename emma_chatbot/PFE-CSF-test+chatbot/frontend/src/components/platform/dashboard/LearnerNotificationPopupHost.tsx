"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Award, Calendar, FileText, ShieldAlert, X } from "lucide-react"
import { useAuthUser } from "@/components/platform/auth/auth-user-context"
import { isStaffRole } from "@/lib/auth/roles"
import { linkForLearnerNotification } from "@/lib/dashboard/learner-notification-routes"
import {
  fetchLearnerNotifications,
  markNotificationRead,
  type LearnerNotificationItem,
  type LearnerNotificationKind,
} from "@/lib/dashboard/learner-notifications-api"
import { cn } from "@/lib/utils"

const POLL_INTERVAL_MS = 8_000
const AUTO_DISMISS_MS = 12_000
const MAX_VISIBLE = 3
/** Notifs créées dans les N dernières minutes : popup même au 1er chargement de page */
const RECENT_ON_LOAD_MS = 10 * 60 * 1000

type ToastEntry = LearnerNotificationItem & { visibleAt: number }

function kindAccent(kind: LearnerNotificationKind) {
  switch (kind) {
    case "session_scheduled":
      return "border-l-[#008080]"
    case "doc_validated":
    case "cert_available":
      return "border-l-emerald-500"
    case "doc_rejected":
      return "border-l-red-500"
    default:
      return "border-l-[#0D3570]"
  }
}

function KindBadge({ kind }: { kind: LearnerNotificationKind }) {
  const iconClass = "h-4 w-4"
  switch (kind) {
    case "doc_validated":
    case "cert_available":
      return <Award className={cn(iconClass, "text-emerald-600")} aria-hidden />
    case "doc_rejected":
      return <ShieldAlert className={cn(iconClass, "text-red-500")} aria-hidden />
    case "session_scheduled":
      return <Calendar className={cn(iconClass, "text-[#008080]")} aria-hidden />
    default:
      return <FileText className={cn(iconClass, "text-[#0D3570]")} aria-hidden />
  }
}

function isRecentlyCreated(createdAt: string | null): boolean {
  if (!createdAt) return false
  const t = new Date(createdAt).getTime()
  if (Number.isNaN(t)) return false
  return Date.now() - t <= RECENT_ON_LOAD_MS
}

function maybeSystemNotify(item: LearnerNotificationItem) {
  if (typeof document === "undefined" || document.visibilityState !== "hidden") return
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return
  try {
    const n = new Notification(item.title, {
      body: item.body ?? undefined,
      icon: "/images/logo-csf.png",
      tag: `csf-notif-${item.id}`,
    })
    n.onclick = () => {
      window.focus()
      window.location.href = linkForLearnerNotification(item.kind)
      n.close()
    }
  } catch {
    /* ignore */
  }
}

function PopupCard({
  item,
  onDismiss,
  onOpen,
}: {
  item: ToastEntry
  onDismiss: (id: number) => void
  onOpen: (item: LearnerNotificationItem) => void
}) {
  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex w-[min(100vw-2rem,22rem)] gap-3 rounded-xl border border-slate-200/90 border-l-4 bg-white p-3.5 shadow-[0_12px_40px_rgba(15,23,42,0.18)]",
        "animate-in slide-in-from-right-8 fade-in duration-300",
        kindAccent(item.kind),
      )}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-[#f8fafc]">
        <Image src="/images/logo-csf.png" alt="CSF" fill className="object-contain p-1" sizes="48px" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-1.5">
          <KindBadge kind={item.kind} />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#008080]">CSF</span>
        </div>
        <p className="text-sm font-semibold leading-snug text-[#0f172a]">{item.title}</p>
        {item.body ? (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{item.body}</p>
        ) : null}
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="mt-2 text-xs font-medium text-[#0D3570] underline-offset-2 hover:underline"
        >
          Voir les détails
        </button>
      </div>
      <button
        type="button"
        aria-label="Fermer"
        onClick={() => onDismiss(item.id)}
        className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Popup CSF bas-droite + polling (apprenant connecté, en ligne). */
export function LearnerNotificationPopupHost() {
  const user = useAuthUser()
  const router = useRouter()
  const [online, setOnline] = useState(true)
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  /** IDs déjà vus lors d'un poll précédent (évite popup sur anciennes notifs au chargement) */
  const snapshotIdsRef = useRef<Set<number> | null>(null)
  /** IDs déjà affichés en popup cette session */
  const toastedIdsRef = useRef<Set<number>>(new Set())

  const isLearner = Boolean(user && !isStaffRole(user.role))

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true)
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [])

  const dismiss = useCallback((id: number) => {
    toastedIdsRef.current.add(id)
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const openNotification = useCallback(
    async (item: LearnerNotificationItem) => {
      dismiss(item.id)
      if (!item.isRead) {
        try {
          await markNotificationRead(item.id)
        } catch {
          /* ignore */
        }
      }
      router.push(linkForLearnerNotification(item.kind))
    },
    [dismiss, router],
  )

  const enqueue = useCallback(
    (items: LearnerNotificationItem[]) => {
      if (!items.length) return
      const now = Date.now()
      setToasts((prev) => {
        const existing = new Set(prev.map((t) => t.id))
        const added = items
          .filter((i) => !existing.has(i.id))
          .map((i) => ({ ...i, visibleAt: now }))
        return [...prev, ...added].slice(-MAX_VISIBLE)
      })
      for (const item of items) {
        toastedIdsRef.current.add(item.id)
        maybeSystemNotify(item)
        window.setTimeout(() => dismiss(item.id), AUTO_DISMISS_MS)
      }
    },
    [dismiss],
  )

  const poll = useCallback(async () => {
    if (!isLearner || !online) return
    try {
      const items = await fetchLearnerNotifications()
      const unread = items.filter((n) => !n.isRead)
      const currentIds = new Set(items.map((n) => n.id))
      const prevSnapshot = snapshotIdsRef.current

      if (prevSnapshot === null) {
        snapshotIdsRef.current = currentIds
        const recentUnread = unread.filter(
          (n) => isRecentlyCreated(n.createdAt) && !toastedIdsRef.current.has(n.id),
        )
        if (recentUnread.length) enqueue(recentUnread)
        return
      }

      const fresh: LearnerNotificationItem[] = []
      for (const n of unread) {
        if (prevSnapshot.has(n.id) || toastedIdsRef.current.has(n.id)) continue
        fresh.push(n)
      }
      snapshotIdsRef.current = currentIds
      if (fresh.length) enqueue(fresh)
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[CSF notifications popup]", err)
      }
    }
  }, [enqueue, isLearner, online])

  useEffect(() => {
    if (!isLearner) return
    void poll()
    const timer = setInterval(() => void poll(), POLL_INTERVAL_MS)
    const onFocus = () => void poll()
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll()
    }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(timer)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [isLearner, poll])

  if (!isLearner) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[250] flex flex-col-reverse gap-3 sm:bottom-6 sm:right-6"
    >
      {toasts.map((item) => (
        <PopupCard key={item.id} item={item} onDismiss={dismiss} onOpen={openNotification} />
      ))}
    </div>
  )
}
