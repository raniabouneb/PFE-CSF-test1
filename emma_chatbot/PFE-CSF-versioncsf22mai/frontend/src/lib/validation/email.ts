const EMAIL_STRUCTURE_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Vérifie une structure d'email de type nom@domaine.extension.
 */
export function isEmailStructureValid(email: string): boolean {
  return EMAIL_STRUCTURE_REGEX.test(email.trim())
}

/**
 * Retourne un message d'erreur prêt à afficher, sinon null.
 */
export function validateEmailStructure(email: string): string | null {
  const normalized = email.trim()
  if (!normalized) return "Email requis."
  if (!isEmailStructureValid(normalized)) {
    return "Format d'email invalide (nom@domaine.extension)."
  }
  return null
}
