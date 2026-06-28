import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import {
  CSF_CHAT_GUEST_COOKIE,
  ensureGuestSessionId,
  guestCookieOptions,
  parseCookieValue,
} from "@/lib/csf-chat-guest-cookie"
import { getBackendUrl } from "@/lib/server/backend"

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie")
  const token = parseCookieValue(cookieHeader, SESSION_COOKIE)
  const guestCookie = parseCookieValue(cookieHeader, CSF_CHAT_GUEST_COOKIE)
  const guestSessionId = ensureGuestSessionId(guestCookie)

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Guest-Session-Id": guestSessionId,
  }
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/chat/conversations`, {
      method: "GET",
      headers,
      cache: "no-store",
    })
    const text = await res.text()
    const out = new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    })
    out.cookies.set(CSF_CHAT_GUEST_COOKIE, guestSessionId, guestCookieOptions())
    return out
  } catch (e) {
    return NextResponse.json(
      { error: `Impossible de charger les conversations (${String(e)})` },
      { status: 502 },
    )
  }
}
