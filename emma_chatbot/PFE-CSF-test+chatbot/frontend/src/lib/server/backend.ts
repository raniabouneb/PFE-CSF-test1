import { apiErrorMessage } from "@/lib/api-error-message"

/** Message d’erreur renvoyé par FastAPI (detail string ou validation 422). */
export function backendErrorMessage(data: unknown): string {
  return apiErrorMessage(data)
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
