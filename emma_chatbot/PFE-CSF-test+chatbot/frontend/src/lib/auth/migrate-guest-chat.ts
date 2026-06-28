import { CSF_CHAT_GUEST_COOKIE, parseCookieValue } from "@/lib/csf-chat-guest-cookie"
import { getBackendUrl } from "@/lib/server/backend"

/**
 * Après login réussi, rattache les conversations invité à l'utilisateur connecté.
 * Erreurs silencieuses (ne bloque jamais la connexion).
 */
export async function migrateGuestChatIfAny(
  req: Request,
  accessToken: string,
): Promise<void> {
  const guestSessionId = parseCookieValue(req.headers.get("cookie"), CSF_CHAT_GUEST_COOKIE)
  if (!guestSessionId) return
  try {
    await fetch(`${getBackendUrl()}/api/v1/chat/migrate-guest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ guest_session_id: guestSessionId }),
    })
  } catch {
    // no-op
  }
}
