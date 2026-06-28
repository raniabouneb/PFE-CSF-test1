import { randomBytes } from "crypto"
import { NextResponse } from "next/server"
import { OAUTH_STATE_COOKIE } from "@/lib/auth/constants"
import { buildGoogleAuthorizeUrl } from "@/lib/auth/google-oauth"

export async function GET(request: Request) {
  try {
    const state = randomBytes(32).toString("hex")
    const url = buildGoogleAuthorizeUrl(state)
    const res = NextResponse.redirect(url)
    res.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    })
    return res
  } catch {
    const u = new URL("/authentification/connexion", request.url)
    u.searchParams.set("error", "Connexion Google indisponible (vérifiez GOOGLE_CLIENT_ID et NEXT_PUBLIC_APP_URL).")
    return NextResponse.redirect(u)
  }
}
