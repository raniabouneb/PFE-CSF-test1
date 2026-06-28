import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { parseCookieValue } from "@/lib/csf-chat-guest-cookie"
import { getBackendUrl } from "@/lib/server/backend"

type RouteCtx = { params: Promise<{ id: string }> }

async function authHeaders(req: NextRequest): Promise<HeadersInit | NextResponse> {
  const token = parseCookieValue(req.headers.get("cookie"), SESSION_COOKIE)
  if (!token) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  }
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  }
}

function deleteUrl(id: string): string {
  const base = getBackendUrl()
  if (id.startsWith("admin-")) {
    return `${base}/api/v1/admin/staff/team/admin/${encodeURIComponent(id.slice(6))}`
  }
  return `${base}/api/v1/admin/staff/team/${encodeURIComponent(id)}`
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const headers = await authHeaders(req)
  if (headers instanceof NextResponse) return headers

  const { id } = await ctx.params

  try {
    const res = await fetch(deleteUrl(id), {
      method: "DELETE",
      headers,
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Backend indisponible." }, { status: 503 })
  }
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const headers = await authHeaders(req)
  if (headers instanceof NextResponse) return headers

  const { id } = await ctx.params
  if (id.startsWith("admin-")) {
    return NextResponse.json({ error: "Modifiez les droits via une fiche membre invitée." }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${getBackendUrl()}/api/v1/admin/staff/team/${encodeURIComponent(id)}/permissions`,
      {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    )
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Backend indisponible." }, { status: 503 })
  }
}
