import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { CSF_CHAT_GUEST_COOKIE, parseCookieValue } from "@/lib/csf-chat-guest-cookie"
import { getBackendUrl } from "@/lib/server/backend"

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie")
  const token = parseCookieValue(cookieHeader, SESSION_COOKIE)
  const guest = parseCookieValue(cookieHeader, CSF_CHAT_GUEST_COOKIE)
  if (!guest) return NextResponse.json({ ok: true, deleted_conversations: 0 })

  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/chat/guest/cleanup`, {
      method: "POST",
      headers,
      body: JSON.stringify({ guest_session_id: guest }),
      cache: "no-store",
    })
    const text = await res.text()
    return new NextResponse(text || '{"ok":true}', {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `cleanup indisponible (${String(e)})` },
      { status: 502 },
    )
  }
}
