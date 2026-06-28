/** Message d’erreur depuis une réponse JSON FastAPI ou proxy Next (`detail` / `error`). */
export function apiErrorMessage(data: unknown, fallback = "Erreur serveur."): string {
  if (!data || typeof data !== "object") return fallback
  const d = data as { detail?: unknown; error?: unknown }
  if (typeof d.error === "string" && d.error.trim()) return d.error
  if (typeof d.detail === "string" && d.detail.trim()) return d.detail
  if (Array.isArray(d.detail) && d.detail.length > 0) {
    const first = d.detail[0]
    if (typeof first === "object" && first !== null && "msg" in first) {
      return String((first as { msg: string }).msg)
    }
  }
  return fallback
}
