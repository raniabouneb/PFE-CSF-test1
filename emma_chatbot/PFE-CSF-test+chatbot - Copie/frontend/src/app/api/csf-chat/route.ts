import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import {
  CSF_CHAT_GUEST_COOKIE,
  ensureGuestSessionId,
  guestCookieOptions,
  parseCookieValue,
} from "@/lib/csf-chat-guest-cookie"
import { getBackendUrl } from "@/lib/server/backend"

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 })
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body attendu : objet JSON." }, { status: 400 })
  }

  const msg = (body as { message?: unknown }).message
  const sid = (body as { session_id?: unknown }).session_id
  const cvProfile = (body as { cv_profile?: unknown }).cv_profile
  if (typeof msg !== "string" || !msg.trim()) {
    return NextResponse.json({ error: "Champ « message » requis (string non vide)." }, { status: 400 })
  }
  if (typeof sid !== "string" || !sid.trim()) {
    return NextResponse.json({ error: "Champ « session_id » requis." }, { status: 400 })
  }

  try {
    const cookieHeader = req.headers.get("cookie")
    const token = parseCookieValue(cookieHeader, SESSION_COOKIE)
    const guestCookie = parseCookieValue(cookieHeader, CSF_CHAT_GUEST_COOKIE)
    const guestSessionId = ensureGuestSessionId(guestCookie)

    const payload: Record<string, unknown> = {
      message: msg.trim(),
      session_id: sid.trim(),
      guest_session_id: guestSessionId,
    }
    if (cvProfile && typeof cvProfile === "object") payload.cv_profile = cvProfile

    const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" }
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(`${getBackendUrl()}/api/v1/chat/send`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
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
    console.error("[csf-chat proxy]", e)
    return NextResponse.json(
      { error: "Impossible de joindre le backend chat. Vérifiez que l’API backend est démarrée." },
      { status: 502 },
    )
  }
}
