/**
 * Normalize untrusted image src values coming from DB/API.
 * Next/Image rejects trailing spaces/control chars, so we trim.
 */
export function normalizeImageSrc(src: string | null | undefined): string {
  return (src ?? "").trim()
}
