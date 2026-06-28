import { cookies } from "next/headers"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { backendErrorMessage, getBackendUrl } from "@/lib/server/backend"

async function bearerFromCookie(): Promise<string | null> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
}

export async function GET() {
  const token = await bearerFromCookie()
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

export async function PATCH(req: Request) {
  const token = await bearerFromCookie()
  if (!token) {
    return Response.json({ error: "Non authentifié." }, { status: 401 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 })
  }
  const r = await fetch(`${getBackendUrl()}/auth/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    return Response.json({ error: backendErrorMessage(data) }, { status: r.status })
  }
  return Response.json(data)
}
