/**
 * URL du service RAG CSF (FastAPI `POST /chat`).
 * - Si `NEXT_PUBLIC_CSF_AI_URL` est défini : appel direct (le service doit autoriser CORS).
 * - Sinon : appel relatif `/api/csf-chat` (proxy Next, voir `CSF_AI_SERVICE_URL` côté serveur).
 */
export function getCsfChatPostUrl(): string {
  const base = (process.env.NEXT_PUBLIC_CSF_AI_URL ?? "").trim().replace(/\/$/, "")
  if (base) {
    return `${base}/chat`
  }
  return "/api/csf-chat"
}

/** Multipart PDF + message (`POST /chat/with-cv`). */
export function getCsfChatWithCvPostUrl(): string {
  const base = (process.env.NEXT_PUBLIC_CSF_AI_URL ?? "").trim().replace(/\/$/, "")
  if (base) {
    return `${base}/chat/with-cv`
  }
  return "/api/csf-chat/with-cv"
}
