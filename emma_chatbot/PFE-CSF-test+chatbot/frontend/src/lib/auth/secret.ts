export function getAuthSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET?.trim()
  if (!s || s.length < 16) {
    throw new Error(
      "AUTH_SECRET manquant ou trop court : ajoute AUTH_SECRET (≥16 caractères) dans .env"
    )
  }
  return new TextEncoder().encode(s)
}
