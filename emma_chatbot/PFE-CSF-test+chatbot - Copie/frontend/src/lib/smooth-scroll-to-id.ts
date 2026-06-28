/**
 * Scroll fluide vers une ancre : attente du nœud (navigation client depuis d’autres pages),
 * `prefers-reduced-motion`, fin observable via `scrollend` quand le navigateur le supporte.
 */

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth"
}

function supportsScrollEndEvent(): boolean {
  if (typeof document === "undefined") return false
  return "onscrollend" in document.documentElement
}

/**
 * Enregistre l’attente **avant** `scrollIntoView` pour ne pas rater `scrollend`.
 */
function afterNextScrollSettles(behavior: ScrollBehavior): Promise<void> {
  if (behavior === "auto") {
    return Promise.resolve()
  }
  const root = document.scrollingElement ?? document.documentElement
  if (!supportsScrollEndEvent()) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, 650)
    })
  }
  return new Promise((resolve) => {
    const finish = () => {
      root.removeEventListener("scrollend", finish)
      window.clearTimeout(fallback)
      resolve()
    }
    const fallback = window.setTimeout(finish, 1400)
    root.addEventListener("scrollend", finish, { passive: true })
  })
}

/**
 * Attend que `document.getElementById(id)` existe puis scroll fluide.
 * @returns `true` si l’élément a été trouvé et le scroll exécuté
 */
export async function smoothScrollToIdWhenReady(
  elementId: string,
  options?: { maxWaitMs?: number; signal?: AbortSignal },
): Promise<boolean> {
  if (typeof document === "undefined") return false

  const maxWait = options?.maxWaitMs ?? 4500
  const deadline = Date.now() + maxWait
  const behavior = scrollBehavior()

  for (;;) {
    if (options?.signal?.aborted) return false
    const el = document.getElementById(elementId)
    if (el) {
      const settled = afterNextScrollSettles(behavior)
      el.scrollIntoView({ behavior, block: "start" })
      await settled
      return true
    }
    if (Date.now() > deadline) return false
    await new Promise<void>((r) => {
      requestAnimationFrame(() => r())
    })
  }
}
