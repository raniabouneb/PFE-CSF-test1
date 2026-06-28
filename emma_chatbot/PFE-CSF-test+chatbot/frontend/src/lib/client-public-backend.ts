/**
 * URL FastAPI lisible côté navigateur (NEXT_PUBLIC_*).
 * Alignée sur `lib/server/backend.ts` (défaut port 8010).
 */
export function getPublicBackendUrl(): string {
  return (process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://127.0.0.1:8010").replace(
    /\/$/,
    "",
  )
}

/**
 * GET recherche formation (suggestions). Si `NEXT_PUBLIC_API_URL` est défini, appelle
 * directement FastAPI depuis le navigateur (évite le relais Next serveur → `127.0.0.1`,
 * souvent vide sous Docker / WSL). Sinon relatif `/api/formation/search` (proxy Next).
 */
export function getFormationSearchClientUrl(trimmedQuery: string): string {
  const params = new URLSearchParams({ q: trimmedQuery }).toString()
  const apiV1 = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (apiV1) {
    return `${apiV1.replace(/\/$/, "")}/formation/search?${params}`
  }
  return `/api/formation/search?${params}`
}
