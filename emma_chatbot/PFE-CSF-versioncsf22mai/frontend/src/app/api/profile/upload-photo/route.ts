import { cookies } from "next/headers"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { backendErrorMessage, getBackendUrl } from "@/lib/server/backend"

export async function POST(req: Request) {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) {
    return Response.json({ error: "Non authentifié." }, { status: 401 })
  }

  const formData = await req.formData()

  const r = await fetch(`${getBackendUrl()}/auth/profile/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    return Response.json({ error: backendErrorMessage(data) }, { status: r.status })
  }
  return Response.json(data)
}
