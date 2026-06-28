import { isCardScrollTargetId } from "@/lib/highlight-scroll-target"

/** Ancre `#` courante si cible carte module / certification reconnue. */
export function parseCardScrollTargetHashId(): string | null {
  if (typeof window === "undefined") return null
  const raw = window.location.hash.replace(/^#/, "")
  if (!isCardScrollTargetId(raw)) return null
  return raw
}

/**
 * Pages qui rendent les cartes côté client : le hook local gère scroll + survol forcé
 * (évite une course avec `AppHashScroll` avant le DOM).
 */
export function shouldDeferCardHashScrollToPage(pathname: string, hashId: string): boolean {
  if (!isCardScrollTargetId(hashId)) return false
  if (hashId.startsWith("ponctuelle-module-") && pathname.startsWith("/formations-ponctuelles")) {
    return true
  }
  if (
    hashId.startsWith("reconversion-pack-detail-mod-") &&
    pathname.startsWith("/formation/reconversion/")
  ) {
    return true
  }
  if (/^certification-\d+$/.test(hashId) && pathname.startsWith("/certifications")) {
    return true
  }
  return false
}

const CARD_DOM_ID_PREFIXES = [
  "ponctuelle-module-",
  "reconversion-pack-detail-mod-",
  "certification-",
] as const

/** Compare ancre `#…` et `id` DOM (suffixe éventuellement encodé dans l’URL). */
export function hashMatchesCardDomId(hashId: string, domId: string): boolean {
  if (hashId === domId) return true
  for (const prefix of CARD_DOM_ID_PREFIXES) {
    if (!hashId.startsWith(prefix) || !domId.startsWith(prefix)) continue
    const hashSuffix = hashId.slice(prefix.length)
    const domSuffix = domId.slice(prefix.length)
    try {
      return decodeURIComponent(hashSuffix) === decodeURIComponent(domSuffix)
    } catch {
      return hashSuffix === domSuffix
    }
  }
  return false
}
