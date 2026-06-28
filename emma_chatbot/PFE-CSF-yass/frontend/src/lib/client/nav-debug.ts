/**
 * Diagnostic navigation (page Certification, hash #partenaires, etc.)
 *
 * Dans le navigateur : F12 → onglet Console, puis tapez :
 *
 *   localStorage.setItem("CSF_NAV_DEBUG", "1")
 *
 * Rechargez ou naviguez : les lignes commencent par `[CSF NAV]`.
 * Pour couper : localStorage.removeItem("CSF_NAV_DEBUG") puis F5.
 */

export function navDebug(...args: unknown[]): void {
  if (typeof window === "undefined") return
  try {
    if (localStorage.getItem("CSF_NAV_DEBUG") !== "1") return
  } catch {
    return
  }
  console.info("[CSF NAV]", ...args)
}

export function isNavDebugEnabled(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem("CSF_NAV_DEBUG") === "1"
  } catch {
    return false
  }
}
