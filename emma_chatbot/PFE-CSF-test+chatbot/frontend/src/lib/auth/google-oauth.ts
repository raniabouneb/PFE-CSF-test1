import { getAppUrl } from "@/lib/auth/app-url"

export const GOOGLE_OAUTH_START_PATH = "/api/auth/google"

export function getGoogleRedirectUri(): string {
  return `${getAppUrl()}/api/auth/google/callback`
}

export function buildGoogleAuthorizeUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID manquant")
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeGoogleAuthorizationCode(code: string): Promise<{ access_token: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET manquant")
  }
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getGoogleRedirectUri(),
    grant_type: "authorization_code",
  })
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Échange code Google: ${res.status} ${t.slice(0, 200)}`)
  }
  return res.json() as Promise<{ access_token: string }>
}

export type GoogleUserInfo = {
  sub: string
  email: string
  email_verified: boolean
  name?: string
  picture?: string
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Google userinfo: ${res.status} ${t.slice(0, 200)}`)
  }
  return res.json() as Promise<GoogleUserInfo>
}
