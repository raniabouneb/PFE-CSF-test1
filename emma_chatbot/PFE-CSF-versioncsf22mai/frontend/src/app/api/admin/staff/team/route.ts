import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { parseCookieValue } from "@/lib/csf-chat-guest-cookie"
import { getBackendUrl } from "@/lib/server/backend"

async function staffAuthHeaders(req: NextRequest): Promise<HeadersInit | NextResponse> {
  const token = parseCookieValue(req.headers.get("cookie"), SESSION_COOKIE)
  if (!token) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  }
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  }
}

export async function GET(req: NextRequest) {
  const headers = await staffAuthHeaders(req)
  if (headers instanceof NextResponse) return headers

  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/admin/staff/team`, {
      headers,
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Backend indisponible." }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const headers = await staffAuthHeaders(req)
  if (headers instanceof NextResponse) return headers

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 })
  }

  const payload =
    body && typeof body === "object"
      ? body
      : { email: body }

  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/admin/staff/team`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Backend indisponible." }, { status: 503 })
  }
}
