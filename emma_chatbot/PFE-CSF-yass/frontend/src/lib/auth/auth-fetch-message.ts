/** Parse le corps texte d’une réponse /api/auth/* (JSON ou vide). */
export function safeParseAuthJson(raw: string): { error?: unknown } {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as { error?: unknown }
  } catch {
    return {}
  }
}

/** Message d’erreur affiché côté client (login / register). */
export function messageFromAuthFetchResponse(
  res: Response,
  raw: string,
  data: { error?: unknown }
): string {
  if (typeof data.error === "string") return data.error
  if (raw) return raw.slice(0, 160)
  return `Erreur ${res.status}`
}
