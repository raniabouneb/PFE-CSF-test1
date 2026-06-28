import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import {
  CSF_CHAT_GUEST_COOKIE,
  ensureGuestSessionId,
  guestCookieOptions,
  parseCookieValue,
} from "@/lib/csf-chat-guest-cookie"
import { getBackendUrl } from "@/lib/server/backend"

/** Proxy multipart vers backend persistant `POST /api/v1/chat/send-with-cv`. */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const cookieHeader = req.headers.get("cookie")
    const token = parseCookieValue(cookieHeader, SESSION_COOKIE)
    const guestCookie = parseCookieValue(cookieHeader, CSF_CHAT_GUEST_COOKIE)
    const guestSessionId = ensureGuestSessionId(guestCookie)
    if (!formData.get("guest_session_id")) {
      formData.set("guest_session_id", guestSessionId)
    }

    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(`${getBackendUrl()}/api/v1/chat/send-with-cv`, {
      method: "POST",
      headers,
      body: formData,
    })

    const text = await res.text()
    const ct = res.headers.get("Content-Type") ?? "application/json"
    const out = new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": ct },
    })
    out.cookies.set(CSF_CHAT_GUEST_COOKIE, guestSessionId, guestCookieOptions())
    return out
  } catch (e) {
    console.error("[csf-chat/with-cv proxy]", e)
    return NextResponse.json(
      { error: "Impossible de joindre le backend chat. Vérifiez que l’API backend est démarrée." },
      { status: 502 },
    )
  }
}
