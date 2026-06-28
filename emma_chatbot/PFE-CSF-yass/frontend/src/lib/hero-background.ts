/** Image hero par défaut (parcours reconversion / ponctuelles). */
export const DEFAULT_HERO_BG = "/images/reconversion-hero.png"

/** Page d’accueil si la ligne `home_page_hero` est absente ou vide. */
export const DEFAULT_HOME_HERO_BG = "/images/hero-6.jpg"

export function isAllowedHeroBackgroundUrl(url: string): boolean {
  const u = url.trim()
  if (!u || u.length > 4096) return false
  const lower = u.toLowerCase()
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) return false
  return u.startsWith("/") || u.startsWith("https://") || u.startsWith("http://")
}

export function resolveHeroBackgroundSrc(
  backgroundImageUrl: string | null | undefined,
  defaultBg: string = DEFAULT_HERO_BG
): { bgSrc: string; isRemote: boolean } {
  const raw = backgroundImageUrl?.trim()
  const bgSrc = raw && isAllowedHeroBackgroundUrl(raw) ? raw : defaultBg
  const isRemote = bgSrc.startsWith("http://") || bgSrc.startsWith("https://")
  return { bgSrc, isRemote }
}
