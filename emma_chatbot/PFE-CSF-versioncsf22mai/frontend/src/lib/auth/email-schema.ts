import { z } from "zod"

/**
 * Email strict : format RFC via Zod + domaine avec TLD (≥2 caractères), parties longueur raisonnable.
 * Utilisé côté API et importable côté client pour la même logique.
 */
export const emailFieldSchema = z
  .string()
  .trim()
  .min(1, "L’email est requis.")
  .max(254, "Email trop long.")
  .email("Adresse email invalide.")
  .refine(
    (raw) => {
      const s = raw.trim().toLowerCase()
      const at = s.lastIndexOf("@")
      if (at < 1) return false
      const local = s.slice(0, at)
      const domain = s.slice(at + 1)
      if (local.length === 0 || local.length > 64) return false
      if (domain.length === 0 || domain.length > 253) return false
      if (!domain.includes(".")) return false
      const tld = domain.split(".").pop() ?? ""
      return tld.length >= 2
    },
    { message: "Adresse email invalide (domaine incorrect, ex. nom@fournisseur.com)." }
  )
  .transform((s) => s.trim().toLowerCase())
