import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { CSF_CHAT_GUEST_COOKIE, parseCookieValue } from "@/lib/csf-chat-guest-cookie"
import { getBackendUrl } from "@/lib/server/backend"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const cookieHeader = req.headers.get("cookie")
  const token = parseCookieValue(cookieHeader, SESSION_COOKIE)
  const guestSessionId = parseCookieValue(cookieHeader, CSF_CHAT_GUEST_COOKIE) || ""

  const headers: Record<string, string> = {
    Accept: "application/json",
  }
  if (guestSessionId) headers["X-Guest-Session-Id"] = guestSessionId
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(
      `${getBackendUrl()}/api/v1/chat/conversations/${encodeURIComponent(id)}/messages`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    )
    const text = await res.text()
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    })
  } catch (e) {
    return NextResponse.json(
      { error: `Impossible de charger les messages (${String(e)})` },
      { status: 502 },
    )
  }
}
