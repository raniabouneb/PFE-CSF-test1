export const CSF_CHAT_SESSION_STORAGE_KEY = "csf_ai_chat_session_id"

export function persistChatSessionId(id: string): void {
  if (typeof window === "undefined" || !id.trim()) return
  try {
    localStorage.setItem(CSF_CHAT_SESSION_STORAGE_KEY, id.trim())
    sessionStorage.setItem(CSF_CHAT_SESSION_STORAGE_KEY, id.trim())
  } catch {
    /* ignore */
  }
}

export function getOrCreateChatSessionId(): string {
  if (typeof window === "undefined") {
    return ""
  }
  try {
    let id =
      localStorage.getItem(CSF_CHAT_SESSION_STORAGE_KEY) ||
      sessionStorage.getItem(CSF_CHAT_SESSION_STORAGE_KEY)
    if (!id || !id.trim()) {
      id = crypto.randomUUID()
      localStorage.setItem(CSF_CHAT_SESSION_STORAGE_KEY, id)
      sessionStorage.setItem(CSF_CHAT_SESSION_STORAGE_KEY, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}
