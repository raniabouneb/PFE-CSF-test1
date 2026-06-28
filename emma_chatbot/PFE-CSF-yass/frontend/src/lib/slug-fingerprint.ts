/**
 * Aligné sur `backend/app/services/catalog/ponctuelle_formations.py` — `_slug_fingerprint`.
 * Supprime uniquement les marques non-spacing (`Mn`), comme Python.
 */
export function slugFingerprint(s: string): string {
  if (!s) return ""
  let t = s.normalize("NFC").trim()
  for (const old of ["\u2010", "\u2011", "\u2012", "\u2013", "\u2014", "\uff0d"]) {
    t = t.split(old).join("-")
  }
  t = t.replace(/\ufeff/g, "")
  t = t.replace(/[,;]/g, " ")
  t = t.replace(/\s+/g, "-")
  t = t.toLowerCase()
  let folded = t.normalize("NFD").replace(/\p{Mn}/gu, "")
  while (folded.includes("--")) {
    folded = folded.replace("--", "-")
  }
  return folded.replace(/^-+|-+$/g, "")
}
