import { cookies } from "next/headers"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { backendErrorMessage, getBackendUrl } from "@/lib/server/backend"

/** Relais `GET /auth/me` avec le cookie de session (rôle à jour depuis la base). */
export async function GET() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) {
    return Response.json({ error: "Non authentifié." }, { status: 401 })
  }
  const r = await fetch(`${getBackendUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    return Response.json({ error: backendErrorMessage(data) }, { status: r.status })
  }
  return Response.json(data)
}
