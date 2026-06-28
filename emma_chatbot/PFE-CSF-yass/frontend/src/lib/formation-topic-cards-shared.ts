/** Partagé client / serveur — pas d’import `server-only`. */

import { slugFingerprint } from "@/lib/slug-fingerprint"

export type FormationTopicCardItem = {
  title: string
  image: string
  href: string
}

export type FormationTopicCardsPayload = {
  reconversion: FormationTopicCardItem[]
  ponctuelle: FormationTopicCardItem[]
}

const PONCTUELLE_FALLBACK_HREF = "/formation?open=ponctuelle"

function decodePathSegment(seg: string): string {
  const s = (seg ?? "").trim().replace(/\+/g, " ")
  if (!s) return ""
  try {
    return decodeURIComponent(s).trim()
  } catch {
    return s.trim()
  }
}

/** Anciennes réponses / erreurs BD : évite /formations-ponctuelles/null ; normalise espaces / accents → segment URL stable. */
export function sanitizePonctuelleTopicHref(href: string): string {
  const h = (href ?? "").trim()
  if (!h) return PONCTUELLE_FALLBACK_HREF
  const lower = h.toLowerCase()
  if (
    lower === "/formations-ponctuelles/null" ||
    lower === "/formations-ponctuelles/undefined" ||
    lower.endsWith("/null") ||
    lower.endsWith("/undefined")
  ) {
    return PONCTUELLE_FALLBACK_HREF
  }
  const m = h.match(/^(.*\/formations-ponctuelles\/)([^/?#]+)(.*)$/)
  if (m) {
    const raw = decodePathSegment(m[2])
    const seg =
      slugFingerprint(raw) ||
      raw
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "")
    if (seg) {
      return `${m[1]}${encodeURIComponent(seg)}${m[3]}`
    }
  }
  return h
}

/** Même logique que les ponctuelles : évite des slugs avec espaces dans `/formation/reconversion/…`. */
export function sanitizeReconversionTopicHref(href: string): string {
  const h = (href ?? "").trim()
  if (!h) return h
  const m = h.match(/^(.*\/formation\/reconversion\/)([^/?#]+)(.*)$/)
  if (!m) return h
  const raw = decodePathSegment(m[2])
  const seg =
    slugFingerprint(raw) ||
    raw
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "")
  if (!seg) return h
  return `${m[1]}${encodeURIComponent(seg)}${m[3]}`
}

const CERTIFICATIONS_SEARCH_HREF = "/certifications"

/** Liens suggestions `kind: certification` : uniquement `/certifications#certification-{id}`. */
export function sanitizeCertificationSearchHref(href: string): string {
  const h = (href ?? "").trim()
  if (!h.toLowerCase().startsWith("/certifications")) {
    return CERTIFICATIONS_SEARCH_HREF
  }
  const hashIdx = h.indexOf("#")
  if (hashIdx === -1) return CERTIFICATIONS_SEARCH_HREF
  const frag = h.slice(hashIdx + 1)
  const m = /^certification-(\d+)$/.exec(frag)
  if (!m?.[1]) return CERTIFICATIONS_SEARCH_HREF
  return `${CERTIFICATIONS_SEARCH_HREF}#certification-${m[1]}`
}

export function sanitizeFormationTopicCardsPayload(
  data: FormationTopicCardsPayload | null | undefined,
): FormationTopicCardsPayload | null {
  if (!data) return null
  const reconversion = (data.reconversion ?? []).map((c) => ({
    ...c,
    href: sanitizeReconversionTopicHref(c.href),
  }))
  const ponctuelle = (data.ponctuelle ?? []).map((c) => ({
    ...c,
    href: sanitizePonctuelleTopicHref(c.href),
  }))
  if (reconversion.length === 0 && ponctuelle.length === 0) return null
  return { reconversion, ponctuelle }
}
