import { getBackendUrl } from "@/lib/server/backend"

/** Cache ISR des pages publiques (contenu catalogue / accueil). */
export const PUBLIC_API_REVALIDATE_SECONDS = 120

/**
 * GET public vers l’API FastAPI (`BACKEND_URL`). Pas d’exposition au client.
 * Par défaut : revalidation ISR (120s) pour des navigations fluides ; passer `revalidateSeconds: 0` pour forcer le frais.
 */
export async function fetchPublicApi<T>(
  path: string,
  options?: { revalidateSeconds?: number },
): Promise<T | null> {
  const p = path.startsWith("/") ? path : `/${path}`
  const url = `${getBackendUrl()}${p}`

  const revalidate =
    options?.revalidateSeconds !== undefined
      ? options.revalidateSeconds
      : PUBLIC_API_REVALIDATE_SECONDS

  const fetchInit: RequestInit & { next?: { revalidate: number } } =
    revalidate > 0
      ? { next: { revalidate } }
      : { cache: "no-store" }

  try {
    const res = await fetch(url, fetchInit)

    if (res.status === 404) {
      if (process.env.NODE_ENV === "development") {
        if (p.includes("/reconversion/topics/")) {
          console.warn(
            `[fetchPublicApi] 404 ${p} — souvent : aucune ligne reconversion_topic pour ce slug, ou mauvaise base côté FastAPI.`,
          )
        }
        if (p.includes("/ponctuelle/formations/")) {
          console.warn(
            `[fetchPublicApi] 404 ${p} — vérifier ponctuelle_formation.slug en base (identique au segment d’URL, BACKEND_URL / même DB que Prisma).`,
          )
        }
      }
      return null
    }

    if (!res.ok) {
      console.error("fetchPublicApi", p, res.status, await res.text())
      return null
    }

    if (res.status === 204) return null

    const text = await res.text()
    if (!text) return null

    try {
      return JSON.parse(text) as T
    } catch {
      console.error("fetchPublicApi", p, "réponse non JSON")
      return null
    }
  } catch (e) {
    console.error("fetchPublicApi", p, e)
    return null
  }
}
