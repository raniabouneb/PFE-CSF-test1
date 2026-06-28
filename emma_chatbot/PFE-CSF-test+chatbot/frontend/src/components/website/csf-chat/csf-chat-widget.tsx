"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Brain, Send, Upload, X, Loader2 } from "lucide-react"
import { clsx } from "clsx"
import { getCsfChatPostUrl, getCsfChatWithCvPostUrl } from "@/lib/csf-chat-config"
import { getOrCreateChatSessionId, persistChatSessionId } from "@/lib/csf-chat-session"

const CV_PROFILE_STORAGE_KEY = "csf_cv_profile"
const WELCOME_AUTOHIDE_MS = 14000

/** Suggestions rapides (grille 2×2) — prédéfinies CSF */
const QUICK_PROMPTS: readonly string[] = [
  "Je veux que tu me recommandes des formations selon mon profil.",
  "Quelles sont les services de CSF ?",
  "Comment fonctionne la reconversion professionnelle chez CSF ?",
  "Quelles certifications et parcours proposez-vous ?",
]

/** Suggestions — grand rayon, sans ombre, glass bleu / blanc */
const glassPromptCard =
  "flex w-full items-center rounded-[1.35rem] border border-white/60 bg-white/35 px-3 py-3.5 text-left text-[11px] leading-snug text-slate-700 backdrop-blur-xl transition hover:border-[#1F6CA3]/22 hover:bg-white/48 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6CA3]/28 md:px-4 sm:text-xs sm:leading-snug"

type ChatMessage = { role: "user" | "assistant"; content: string }

type ConversationItem = {
  id: string
  external_session_id: string
}

type ChatSuccessJson = {
  status?: string
  session_id?: string
  response?: string
  cv_profile?: Record<string, unknown>
}

function parseChatResponse(text: string): {
  text: string
  sessionId?: string
  conversationId?: string
  cvProfile?: Record<string, unknown>
} {
  try {
    const j = JSON.parse(text) as ChatSuccessJson & { conversation_id?: string }
    if (j && typeof j.response === "string") {
      const cp = j.cv_profile
      return {
        text: j.response,
        sessionId: j.session_id,
        conversationId: j.conversation_id,
        cvProfile: cp && typeof cp === "object" ? cp : undefined,
      }
    }
  } catch {
    /* plain text */
  }
  return { text }
}

function readStoredCvProfile(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(CV_PROFILE_STORAGE_KEY)
    if (!raw) return null
    const o = JSON.parse(raw) as unknown
    return o && typeof o === "object" ? (o as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function persistCvProfile(profile: Record<string, unknown> | null) {
  try {
    if (!profile) sessionStorage.removeItem(CV_PROFILE_STORAGE_KEY)
    else sessionStorage.setItem(CV_PROFILE_STORAGE_KEY, JSON.stringify(profile))
  } catch {
    /* ignore */
  }
}

export function CsfChatWidget() {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** PDF sélectionné pour le prochain envoi (multipart /chat/with-cv) */
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvAttachedName, setCvAttachedName] = useState<string | null>(null)
  const [hasStoredCv, setHasStoredCv] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimerRef = useRef<number | null>(null)
  /** Popup bienvenue à chaque chargement / reload de page */
  const [showWelcome, setShowWelcome] = useState(true)

  useEffect(() => {
    setMounted(true)
    try {
      // N'affiche jamais "CV mémorisé" par défaut au premier chargement.
      // Le badge réapparaît uniquement après un nouvel envoi de CV.
      sessionStorage.removeItem(CV_PROFILE_STORAGE_KEY)
      setHasStoredCv(false)
    } catch {
      setHasStoredCv(false)
    }
  }, [])

  /** Bienvenue : masquage auto + au clic lanceur */
  useEffect(() => {
    if (!showWelcome) return
    const t = window.setTimeout(() => setShowWelcome(false), WELCOME_AUTOHIDE_MS)
    return () => window.clearTimeout(t)
  }, [showWelcome])

  /** Split écran : réserve la place à droite pour le site (desktop) */
  useEffect(() => {
    if (!mounted) return
    const md = () => window.matchMedia("(min-width: 768px)").matches
    if (open && md()) {
      document.body.classList.add("csf-chat-split-open")
    } else {
      document.body.classList.remove("csf-chat-split-open")
    }
    return () => document.body.classList.remove("csf-chat-split-open")
  }, [open, mounted])

  useEffect(() => {
    if (!open) return
    try {
      setHasStoredCv(!!sessionStorage.getItem(CV_PROFILE_STORAGE_KEY))
    } catch {
      setHasStoredCv(false)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const loadHistory = async () => {
      try {
        const convRes = await fetch("/api/csf-chat/conversations", { cache: "no-store" })
        if (!convRes.ok) return
        const convs = (await convRes.json()) as ConversationItem[]
        if (!Array.isArray(convs) || convs.length === 0) {
          if (!cancelled) {
            setMessages([])
            setConversationId(null)
          }
          return
        }
        const latest = convs[0]
        const msgRes = await fetch(`/api/csf-chat/conversations/${encodeURIComponent(latest.id)}/messages`, {
          cache: "no-store",
        })
        if (!msgRes.ok) return
        const rows = (await msgRes.json()) as Array<{ role: string; content: string }>
        if (cancelled) return
        const restored: ChatMessage[] = (rows || [])
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content || "" }))
        if (restored.length > 0) {
          setMessages(restored)
          setConversationId(latest.id)
          if (latest.external_session_id) {
            persistChatSessionId(latest.external_session_id)
          }
        }
      } catch {
        /* ignore */
      }
    }
    void loadHistory()
    return () => {
      cancelled = true
    }
  }, [open])

  // Mode invité : suppression best-effort des conversations temporaires à la fermeture onglet/page.
  useEffect(() => {
    const onBeforeUnload = () => {
      try {
        navigator.sendBeacon("/api/csf-chat/guest/cleanup")
      } catch {
        // ignore
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading, open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        setOpen(false)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => {
    if (!open || !panelRef.current) return
    const root = panelRef.current
    const focusables = () =>
      root.querySelectorAll<HTMLElement>(
        'button, [href], textarea, input, select, [tabindex]:not([tabindex="-1"])',
      )
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      const nodes = [...focusables()].filter((el) => !el.hasAttribute("disabled"))
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    root.addEventListener("keydown", onKey)
    return () => root.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => {
    return () => {
      if (typingTimerRef.current !== null) {
        window.clearTimeout(typingTimerRef.current)
      }
    }
  }, [])

  const openPanel = useCallback(() => {
    setShowWelcome(false)
    setOpen(true)
  }, [])

  const typeAssistantReply = useCallback((replyText: string) => {
    const text = replyText || "(Réponse vide)"
    return new Promise<void>((resolve) => {
      // Create placeholder assistant bubble first.
      setMessages((m) => [...m, { role: "assistant", content: "" }])
      let i = 0
      const tick = () => {
        i = Math.min(text.length, i + 1)
        const partial = text.slice(0, i)
        setMessages((prev) => {
          if (prev.length === 0) return prev
          const next = [...prev]
          const last = next[next.length - 1]
          if (last?.role === "assistant") {
            next[next.length - 1] = { ...last, content: partial }
          }
          return next
        })
        if (i < text.length) {
          typingTimerRef.current = window.setTimeout(tick, 12)
        } else {
          typingTimerRef.current = null
          resolve()
        }
      }
      typingTimerRef.current = window.setTimeout(tick, 12)
    })
  }, [])

  const send = useCallback(
    async (messageOverride?: string) => {
      const text = (messageOverride ?? input).trim()
      const storedProfile = readStoredCvProfile()
      if (loading) return
      if (!text && !cvFile) {
        setError("Écrivez un message ou joignez un CV (PDF).")
        return
      }

      const sessionId = getOrCreateChatSessionId()
      if (!sessionId) {
        setError("Session indisponible (navigateur privé ?).")
        return
      }

      const userDisplay =
        cvFile != null ? (text ? `${text}\n\n` : "") + `📎 CV : ${cvFile.name}` : text

      setInput("")
      setError(null)
      setMessages((m) => [...m, { role: "user", content: userDisplay }])
      setLoading(true)

      try {
        let res: Response
        if (cvFile) {
          const fd = new FormData()
          fd.append("session_id", sessionId)
          fd.append("message", text)
          fd.append("cv", cvFile, cvFile.name)
          res = await fetch(getCsfChatWithCvPostUrl(), { method: "POST", body: fd })
        } else {
          const body: Record<string, unknown> = {
            message: text,
            session_id: sessionId,
            conversation_id: conversationId,
          }
          if (storedProfile) body.cv_profile = storedProfile
          res = await fetch(getCsfChatPostUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(body),
          })
        }

        const raw = await res.text()
        if (!res.ok) {
          let detail = `Erreur ${res.status}`
          try {
            const j = JSON.parse(raw) as { error?: string; detail?: string }
            detail = j.error ?? j.detail ?? (typeof j === "string" ? j : detail)
          } catch {
            if (raw) detail = raw.slice(0, 200)
          }
          throw new Error(detail)
        }

        const { text: reply, sessionId: newSid, conversationId: newConversationId, cvProfile } =
          parseChatResponse(raw)
        if (newSid) {
          persistChatSessionId(newSid)
        }
        if (newConversationId) {
          setConversationId(newConversationId)
        }
        if (cvProfile) {
          persistCvProfile(cvProfile)
          setHasStoredCv(true)
        }
        if (cvFile) {
          setCvFile(null)
          setCvAttachedName(null)
          if (fileInputRef.current) fileInputRef.current.value = ""
        }
        await typeAssistantReply(reply || "(Réponse vide)")
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Impossible d’envoyer le message. Réessayez plus tard."
        setError(msg)
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: `**Erreur** — ${msg}`,
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [input, loading, cvFile, typeAssistantReply, conversationId],
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void send()
  }

  if (!mounted) return null

  const panelWidthClass = "w-[min(100vw,440px)] md:w-[min(100vw,440px)] max-md:max-w-none"

  return createPortal(
    <>
      {/* Bulle lanceur : cerveau dans un cercle, plus haut que l’ancien bottom-6 */}
      {!open && (
        <div className="fixed bottom-24 left-6 z-[100] flex flex-col items-start gap-3 font-sans antialiased">
          {showWelcome && (
            <div
              role="dialog"
              aria-label="Bienvenue"
              className="max-w-[min(calc(100vw_-_3rem),20rem)] rounded-2xl border border-[#1F6CA3]/25 bg-white p-4 shadow-xl"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug text-slate-800">
                  Bienvenue sur CSF ! Cliquez sur l’icône{" "}
                  <span className="inline-flex items-center align-middle text-[#1F6CA3]">
                    <Brain className="inline h-4 w-4" aria-hidden />
                  </span>{" "}
                  pour ouvrir l’assistant : vous pourrez naviguer sur le site en parallèle.
                </p>
                <button
                  type="button"
                  onClick={() => setShowWelcome(false)}
                  className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Fermer le message de bienvenue"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={openPanel}
                className="mt-3 w-full rounded-xl bg-[#1F6CA3] py-2.5 text-sm font-semibold text-white transition hover:bg-[#185a8c]"
              >
                Ouvrir l’assistant
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={openPanel}
            className={clsx(
              "flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/30",
              "bg-gradient-to-br from-[#1F6CA3] to-[#2B5E94] text-white shadow-lg transition-all",
              "hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6CA3] focus-visible:ring-offset-2",
              showWelcome && "ring-4 ring-[#1F6CA3]/40 ring-offset-2",
            )}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label="Ouvrir l’assistant CSF"
            aria-controls={titleId}
          >
            <Brain className="h-7 w-7" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      )}

      {open && (
        <>
          {/* Mobile : léger voile ; desktop : pas de voile — navigation site visible à droite */}
          <button
            type="button"
            className="fixed inset-0 z-[90] bg-slate-900/15 backdrop-blur-[2px] md:hidden"
            aria-label="Fermer le chat"
            onClick={() => setOpen(false)}
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={clsx(
              "fixed z-[95] flex flex-col overflow-hidden font-sans antialiased text-slate-700",
              "border border-slate-200/70 shadow-[0_12px_40px_-16px_rgba(15,53,112,0.12)]",
              /* Proche du fond page (#f3f4f6 / blanc) — glass bleu-blanc, sans violet */
              "bg-gradient-to-b from-[#f8fafc]/97 via-[#f1f5f9]/96 to-[#eef4fa]/98 backdrop-blur-[2px]",
              panelWidthClass,
              "max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:h-[min(92dvh,100%)] max-md:max-h-[92dvh] max-md:rounded-t-[28px] max-md:border-x max-md:border-t max-md:border-slate-200/65",
              "md:left-0 md:top-0 md:h-full md:border-r md:border-slate-200/55 md:rounded-none",
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 max-md:rounded-t-[28px] bg-[radial-gradient(ellipse_120%_65%_at_50%_-20%,rgba(255,255,255,0.72),transparent_55%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 max-md:rounded-t-[28px] bg-[radial-gradient(ellipse_85%_55%_at_100%_100%,rgba(59,130,246,0.09),transparent_50%)]"
              aria-hidden
            />

            <header className="relative shrink-0 px-4 pb-3 pt-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-slate-200/80 bg-white/55 p-2 text-slate-600 backdrop-blur-md transition hover:bg-white/85 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6CA3]/30"
                  aria-label="Fermer le panneau"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <h2
                id={titleId}
                className={clsx(
                  "font-semibold tracking-tight",
                  messages.length === 0
                    ? "mt-3 px-1 text-center text-xl leading-snug sm:text-2xl md:text-[1.75rem]"
                    : "sr-only",
                )}
              >
                <span className="bg-gradient-to-r from-[#145387] via-[#1F6CA3] to-[#3980B3] bg-clip-text text-transparent">
                Prêt à te lancer ?
                </span>{" "}
                <span className="bg-gradient-to-r from-[#3F8499] to-[#3F997F] bg-clip-text text-transparent">
                On t'aide à trouver ta voie
                </span>
              
              </h2>
            </header>

            {messages.length === 0 ? (
              <div className="relative shrink-0 px-3 pb-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {QUICK_PROMPTS.map((text) => (
                    <button
                      key={text}
                      type="button"
                      disabled={loading}
                      onClick={() => void send(text)}
                      className={glassPromptCard}
                    >
                      <span className="line-clamp-4 min-w-0">{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-2">
              <p className="mb-3 rounded-full border border-slate-200/60 bg-white/40 px-3 py-1.5 text-center text-[10px] leading-relaxed text-slate-600 backdrop-blur-sm md:text-xs">
                Le site reste utilisable à droite — vous pouvez changer de page pendant la conversation.
              </p>
              <ul className="space-y-3">
                {messages.map((m, i) => (
                  <li
                    key={`${i}-${m.role}-${m.content.slice(0, 12)}`}
                    className={clsx(
                      "max-w-[95%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap backdrop-blur-md",
                      m.role === "user"
                        ? "ml-auto border border-[#1F6CA3]/22 bg-white/55 text-slate-800"
                        : "mr-auto border border-white/75 bg-white/50 text-slate-700 ring-1 ring-slate-200/40",
                    )}
                  >
                    {m.content}
                  </li>
                ))}
                {loading && messages[messages.length - 1]?.role !== "assistant" ? (
                  <li className="flex w-fit items-center gap-2 rounded-2xl border border-slate-200/65 bg-white/45 px-3 py-2 text-sm text-slate-600 backdrop-blur-md">
                    <Loader2 className="h-4 w-4 animate-spin text-[#1F6CA3]" aria-hidden />
                    Réponse en cours…
                  </li>
                ) : null}
                <div ref={endRef} />
              </ul>
              {error ? (
                <p
                  className="mt-3 rounded-xl border border-red-200/90 bg-red-50/90 px-3 py-2 text-sm text-red-700 backdrop-blur-sm"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>

            <form
              onSubmit={onSubmit}
              className="relative shrink-0 border-t border-slate-200/55 bg-[#f4f7fb]/75 px-3 pb-4 pt-3 backdrop-blur-xl"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                aria-hidden
                tabIndex={-1}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    setCvFile(f)
                    setCvAttachedName(f.name)
                  }
                }}
              />
              {(cvAttachedName || hasStoredCv) && (
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 md:text-xs">
                  {cvAttachedName ? (
                    <span className="rounded-full border border-white/45 bg-white/35 px-2.5 py-1 font-medium text-[#155a8a] backdrop-blur-sm">
                      Fichier : {cvAttachedName}
                    </span>
                  ) : null}
                  {hasStoredCv ? (
                    <span className="rounded-full border border-emerald-200/70 bg-emerald-50/90 px-2.5 py-1 font-medium text-emerald-900 backdrop-blur-sm">
                      CV mémorisé pour les prochaines questions
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="text-slate-600 underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
                    onClick={() => {
                      persistCvProfile(null)
                      setHasStoredCv(false)
                      setCvFile(null)
                      setCvAttachedName(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  >
                    Retirer le CV
                  </button>
                </div>
              )}
              {/* Barre pilule — glass bleu / blanc, halo bleu léger */}
              <div
                className={clsx(
                  "flex items-end gap-1 rounded-full border border-white/75 bg-white/40 px-1.5 py-1 backdrop-blur-2xl",
                  "shadow-[0_8px_32px_-10px_rgba(31,108,163,0.22),0_0_48px_-14px_rgba(59,130,246,0.14)]",
                  "ring-1 ring-white/90",
                )}
              >
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200/70 bg-white/60 text-[#1F6CA3] backdrop-blur-md transition hover:bg-white/90 disabled:opacity-50"
                  title="Joindre un fichier (PDF)"
                  aria-label="Téléverser un fichier PDF"
                >
                  <Upload className="h-5 w-5" aria-hidden />
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      void send()
                    }
                  }}
                  placeholder={
                    cvFile
                      ? "Optionnel : précisez votre question…"
                      : "Saisissez votre message…"
                  }
                  rows={1}
                  disabled={loading}
                  className="mb-0.5 min-h-[42px] max-h-28 flex-1 resize-none rounded-2xl border-0 bg-transparent px-2 py-2.5 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-0"
                  aria-label="Message à envoyer"
                />
                <button
                  type="submit"
                  disabled={loading || (!input.trim() && !cvFile)}
                  className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#1F6CA3]/35 bg-[#1F6CA3] text-white shadow-[0_6px_20px_-6px_rgba(31,108,163,0.35)] transition hover:bg-[#185a8c] disabled:opacity-45"
                  aria-label="Envoyer"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  ) : (
                    <Send className="h-5 w-5" aria-hidden />
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>,
    document.body,
  )
}