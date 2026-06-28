/** Message d’erreur renvoyé par FastAPI (detail string ou validation 422). */
export function backendErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "Erreur serveur."
  const d = data as { detail?: unknown }
  if (typeof d.detail === "string") return d.detail
  if (Array.isArray(d.detail) && d.detail.length > 0) {
    const first = d.detail[0]
    if (typeof first === "object" && first !== null && "msg" in first) {
      return String((first as { msg: string }).msg)
    }
  }
  return "Erreur serveur."
}

/** Surchargez avec `BACKEND_URL` si besoin — défaut uvicorn projet (8010, voir `frontend/.env`). */
export function getBackendUrl(): string {
  const fromEnv =
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
    "http://127.0.0.1:8010"
  return fromEnv.replace(/\/$/, "")
}

/** Base FastAPI incluant le préfixe global `/api/v1`. */
export function getApiV1BaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    `${getBackendUrl()}/api/v1`
  return fromEnv.replace(/\/$/, "")
}
