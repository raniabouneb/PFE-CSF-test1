import { NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { getSessionCookieOptions } from "@/lib/auth/session"
import { CSF_CHAT_GUEST_COOKIE, guestCookieOptions } from "@/lib/csf-chat-guest-cookie"

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  })
  res.cookies.set(CSF_CHAT_GUEST_COOKIE, "", {
    ...guestCookieOptions(),
    maxAge: 0,
  })
  return res
}
