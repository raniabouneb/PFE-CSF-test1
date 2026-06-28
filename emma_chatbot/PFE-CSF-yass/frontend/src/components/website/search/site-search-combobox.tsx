"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { getFormationSearchClientUrl } from "@/lib/client-public-backend"
import {
  sanitizeCertificationSearchHref,
  sanitizePonctuelleTopicHref,
  sanitizeReconversionTopicHref,
} from "@/lib/formation-topic-cards-shared"
import type { FormationSearchResponse, FormationSearchSuggestion } from "@/lib/types/formation-search"
import { cn } from "@/lib/utils"

const DEBOUNCE_MS = 300

export type SiteSearchComboboxVariant =
  | "formation-default"
  | "formation-hero"
  | "certifications-hero"
  | "ponctuelle-hero"

const SUGGESTION_KINDS = new Set<FormationSearchSuggestion["kind"]>([
  "reconversion",
  "reconversion_module",
  "ponctuelle",
  "ponctuelle_module",
  "certification",
  "certification_category",
])

/** Normalise une entrée API (id numérique, champs optionnels) avant affichage. */
function coerceApiSuggestion(item: unknown): FormationSearchSuggestion | null {
  if (!item || typeof item !== "object") return null
  const o = item as Record<string, unknown>
  const kind = o.kind
  if (typeof kind !== "string" || !SUGGESTION_KINDS.has(kind as FormationSearchSuggestion["kind"])) {
    return null
  }
  const id = o.id != null && o.id !== "" ? String(o.id) : ""
  const label = typeof o.label === "string" ? o.label : o.label != null ? String(o.label) : ""
  const href = typeof o.href === "string" ? o.href : o.href != null ? String(o.href) : ""
  if (!id || !label || !href) return null
  const sub = o.subtitle
  let subtitle: string | undefined
  if (typeof sub === "string" && sub.trim()) subtitle = sub.trim()
  else if (sub != null) {
    const t = String(sub).trim()
    if (t) subtitle = t
  }
  const out: FormationSearchSuggestion = { id, kind: kind as FormationSearchSuggestion["kind"], label, href }
  if (subtitle) out.subtitle = subtitle
  return out
}

/** Même logique que `app/api/formation/search/route.ts` (appel direct FastAPI côté client). */
function sanitizeSearchHrefClient(s: FormationSearchSuggestion): FormationSearchSuggestion {
  const k = s.kind
  if (k === "reconversion" || k === "reconversion_module") {
    return { ...s, href: sanitizeReconversionTopicHref(s.href) }
  }
  if (k === "ponctuelle" || k === "ponctuelle_module") {
    return { ...s, href: sanitizePonctuelleTopicHref(s.href) }
  }
  if (k === "certification") {
    return { ...s, href: sanitizeCertificationSearchHref(s.href) }
  }
  if (k === "certification_category") {
    return { ...s, href: (s.href ?? "/certifications").toString() }
  }
  return s
}

function subtitleLine(s: FormationSearchSuggestion): string | null {
  if (!s.subtitle?.trim()) return null
  if (s.kind === "ponctuelle_module") return `Formation : ${s.subtitle}`
  if (s.kind === "reconversion_module") return `Parcours : ${s.subtitle}`
  if (s.kind === "certification") return `Catégorie : ${s.subtitle}`
  return s.subtitle
}

export type SiteSearchComboboxProps = {
  variant?: SiteSearchComboboxVariant
  placeholder?: string
  /** Accessibilité (défaut = placeholder). */
  ariaLabel?: string
  /** Mode contrôlé : valeur du champ (ex. filtre local parallèle). */
  query?: string
  onQueryChange?: (q: string) => void
  className?: string
  containerClassName?: string
}

export function SiteSearchCombobox({
  variant = "formation-default",
  placeholder = "Rechercher une formation...",
  ariaLabel,
  query: controlledQuery,
  onQueryChange,
  className,
  containerClassName,
}: SiteSearchComboboxProps) {
  const isControlled = controlledQuery !== undefined
  const [internalQuery, setInternalQuery] = useState("")
  const query = isControlled ? (controlledQuery ?? "") : internalQuery

  const setQuery = useCallback(
    (q: string) => {
      if (!isControlled) setInternalQuery(q)
      onQueryChange?.(q)
    },
    [isControlled, onQueryChange],
  )

  const router = useRouter()
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Annule uniquement les appels `GET /api/formation/search` (requête non vide). */
  const searchAbortRef = useRef<AbortController | null>(null)
  /** Une seule requête « liste par défaut » à la fois ; pas d’abort (évite liste vide au focus). */
  const defaultListInflightRef = useRef<Promise<FormationSearchSuggestion[]> | null>(null)
  /** Incrémenté à chaque `runFetch` : ignore réponses / finally obsolètes (courses debounce / abort). */
  const fetchGenRef = useRef(0)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<FormationSearchSuggestion[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [defaultSuggestions, setDefaultSuggestions] = useState<FormationSearchSuggestion[] | null>(
    null,
  )
  /** Miroir de `defaultSuggestions` : évite que `runFetch` change d’identité au chargement des défauts (sinon l’effet debouncé annule la recherche en cours, ex. « système »). */
  const defaultSuggestionsRef = useRef<FormationSearchSuggestion[] | null>(null)
  defaultSuggestionsRef.current = defaultSuggestions

  const runFetch = useCallback(async (q: string) => {
    const myGen = ++fetchGenRef.current
    const trimmed = q.trim()
    const stillLeading = () => myGen === fetchGenRef.current

    setLoading(true)
    try {
      // Mode par défaut : focus + vide -> domaines formation + catégories certification.
      if (!trimmed) {
        searchAbortRef.current?.abort()
        const cachedDefaults = defaultSuggestionsRef.current
        if (cachedDefaults) {
          if (!stillLeading()) return
          setSuggestions(cachedDefaults)
          return
        }
        if (defaultListInflightRef.current) {
          const items = await defaultListInflightRef.current
          if (!stillLeading()) return
          setSuggestions(items)
          return
        }
        const loadPromise = (async (): Promise<FormationSearchSuggestion[]> => {
          const [topicRes, catRes] = await Promise.all([
            fetch("/api/formation-topic-cards"),
            fetch("/api/certification-categories"),
          ])
          const json = (await topicRes.json()) as {
            reconversion?: Array<{ title?: string; href?: string }>
            ponctuelle?: Array<{ title?: string; href?: string }>
          }
          const catJson = (await catRes.json()) as { categories?: string[] }
          const rc = Array.isArray(json.reconversion) ? json.reconversion : []
          const po = Array.isArray(json.ponctuelle) ? json.ponctuelle : []
          const cats = Array.isArray(catJson.categories) ? catJson.categories : []
          const items: FormationSearchSuggestion[] = [
            ...rc
              .filter((x) => typeof x?.href === "string" && typeof x?.title === "string")
              .map((x) => ({
                id: `reconversion-default:${x.href}`,
                kind: "reconversion" as const,
                label: `${x.title} — reconversion professionnelle`,
                href: x.href!,
              })),
            ...po
              .filter((x) => typeof x?.href === "string" && typeof x?.title === "string")
              .map((x) => ({
                id: `ponctuelle-default:${x.href}`,
                kind: "ponctuelle" as const,
                label: `${x.title} — formation à la carte`,
                href: x.href!,
              })),
            ...cats.map((c) => ({
              id: `cert-category:${c}`,
              kind: "certification_category" as const,
              label: `${c} — certification`,
              href: `/certifications?${new URLSearchParams({ formation: c }).toString()}`,
            })),
          ]
          return items
        })()
        defaultListInflightRef.current = loadPromise
        try {
          const items = await loadPromise
          if (!stillLeading()) return
          setDefaultSuggestions(items)
          setSuggestions(items)
        } finally {
          if (defaultListInflightRef.current === loadPromise) {
            defaultListInflightRef.current = null
          }
        }
        return
      }

      searchAbortRef.current?.abort()
      const ac = new AbortController()
      searchAbortRef.current = ac
      const res = await fetch(getFormationSearchClientUrl(trimmed), { signal: ac.signal })
      const json = (await res.json()) as FormationSearchResponse
      const raw = Array.isArray(json.suggestions) ? json.suggestions : []
      const next = raw
        .map((row) => coerceApiSuggestion(row))
        .filter((s): s is FormationSearchSuggestion => s != null)
        .map(sanitizeSearchHrefClient)
      if (!stillLeading()) return
      setSuggestions(next)
    } catch (e) {
      if ((e as Error).name === "AbortError") return
      if (!stillLeading()) return
      setSuggestions([])
    } finally {
      if (stillLeading()) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const q = query
    if (!q.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = null
      void runFetch(q)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void runFetch(q)
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, runFetch])

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const el = wrapRef.current
      if (!el || !(e.target instanceof Node)) return
      if (!el.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocMouseDown)
    return () => document.removeEventListener("mousedown", onDocMouseDown)
  }, [])

  const navigate = (href: string) => {
    setOpen(false)
    setQuery("")
    setSuggestions([])
    router.push(href)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < suggestions.length) {
      e.preventDefault()
      navigate(suggestions[activeIndex]!.href)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const isFormationHero = variant === "formation-hero"
  const isFormationDefault = variant === "formation-default"
  const isCertHero = variant === "certifications-hero"
  const isPonctuelleHero = variant === "ponctuelle-hero"

  const inputClass = cn(
    "w-full h-[70px] rounded-full px-4 py-3 pl-8 pr-12 text-sm md:text-base focus:outline-none focus:ring-2",
    isFormationHero &&
      "border border-[#1F6CA3]/30 bg-white/30 text-[#0f3555] shadow-sm backdrop-blur-md placeholder:text-slate-600/65 focus:border-[#1F6CA3]/45 focus:ring-[#1F6CA3]/25",
    isFormationDefault &&
      "border border-[#5CB0D6]/50 bg-[#5CB0D6]/10 text-[#335FA1] placeholder:text-[#335FA1]/55 focus:ring-[#5CB0D6]/35",
    (isCertHero || isPonctuelleHero) &&
      "border border-white/30 bg-white/20 text-white placeholder-blue-100 focus:ring-2 focus:ring-white",
    className,
  )

  const iconClass = cn(
    "pointer-events-none absolute right-8 top-1/2 h-6 w-6 -translate-y-1/2",
    isFormationHero && "text-[#1F6CA3]/70",
    isFormationDefault && "text-[#1F6CA3]/70",
    (isCertHero || isPonctuelleHero) && "text-[#50A3CC]",
  )

  const panelSurfaceClass = cn(
    // bg opacité fixée à 70%
    isFormationHero && "border border-[#1F6CA3]/30 bg-white/70 text-[#0f3555] backdrop-blur-md",
    isFormationDefault && "border border-[#5CB0D6]/50 bg-[#5CB0D6]/70 text-[#335FA1] backdrop-blur-md",
    (isCertHero || isPonctuelleHero) &&
      "border border-white/30 bg-white/70 text-white backdrop-blur-md",
  )

  const panelClass = cn(
    // ~6 suggestions avant scroll
    "absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[28rem] overflow-y-auto rounded-2xl py-2 shadow-lg",
    panelSurfaceClass,
    // Scrollbar en bleu
    "[scrollbar-color:rgba(31,108,163,.9)_rgba(255,255,255,0.2)]",
    "[&::-webkit-scrollbar]:w-2",
    "[&::-webkit-scrollbar-track]:bg-transparent",
    "[&::-webkit-scrollbar-thumb]:bg-[#1F6CA3]/80",
    "[&::-webkit-scrollbar-thumb]:rounded-full",
    "[&::-webkit-scrollbar-thumb]:border-2",
    "[&::-webkit-scrollbar-thumb]:border-transparent",
    "[&::-webkit-scrollbar-thumb]:bg-clip-content",
  )

  const mutedClass = cn(
    "px-4 py-3 text-sm",
    isFormationDefault || isFormationHero ? "text-[#335FA1]/70" : "text-white/80",
  )

  return (
    <div ref={wrapRef} className={cn("relative w-full max-w-[600px]", containerClassName)}>
      <div className="relative">
        <input
          type="search"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => {
            setOpen(true)
            if (!query.trim()) void runFetch("")
          }}
          onKeyDown={onKeyDown}
          className={cn(
            inputClass,
            // masque le X natif du search
            "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
          )}
        />
        <Search className={iconClass} aria-hidden />
      </div>

      {open ? (
        <div id={listId} role="listbox" className={cn(panelClass, "pt-10")}>
          <button
            type="button"
            aria-label="Fermer les suggestions"
            className={cn(
              "absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full shadow-sm backdrop-blur",
              "text-[#1F6CA3]",
              isFormationDefault &&
                "border border-[#5CB0D6]/50 bg-[#5CB0D6]/10 hover:bg-[#5CB0D6]/15",
              isFormationHero && "border border-[#1F6CA3]/30 bg-white/15 hover:bg-white/20",
              (isCertHero || isPonctuelleHero) &&
                "border border-white/30 bg-white/20 hover:bg-white/25",
            )}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          {loading ? (
            <p className={mutedClass}>Recherche…</p>
          ) : null}
          {!loading && suggestions.length === 0 ? (
            <p className={mutedClass}>Aucun résultat.</p>
          ) : null}
          {suggestions.map((s, idx) => {
            const sub = subtitleLine(s)
            return (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={idx === activeIndex}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left text-sm transition-colors md:text-base",
                  idx === activeIndex ? "bg-[#1F6CA3]/15" : "hover:bg-[#1F6CA3]/10",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => navigate(s.href)}
              >
                <span
                  className={cn(
                    "font-medium",
                    isCertHero || isPonctuelleHero ? "text-[#0f3555]" : "text-[#1F6CA3]",
                  )}
                >
                  {s.label}
                </span>
                {sub ? (
                  <span
                    className={cn(
                      "text-xs md:text-sm",
                      isCertHero || isPonctuelleHero
                        ? "text-[#0f3555]/80"
                        : "text-[#335FA1]/80",
                    )}
                  >
                    {sub}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
