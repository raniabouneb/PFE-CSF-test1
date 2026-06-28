import { smoothScrollToIdWhenReady } from "@/lib/smooth-scroll-to-id"

export const SCROLL_TARGET_HIGHLIGHT_CLASS = "csf-scroll-target-highlight"
/** Wrapper `.group` ModuleCard : état survol forcé pendant la mise en avant. */
export const SCROLL_TARGET_HIGHLIGHT_GROUP_CLASS = "csf-scroll-target-highlight-group"

const BODY_HIGHLIGHT_SESSION_CLASS = "csf-scroll-highlight-session"
/** Court délai avant d’écouter la souris (évite une annulation parasite au clic lien / scroll auto). */
const POINTER_DISMISS_ARM_MS = 550

let activeHighlightEl: HTMLElement | null = null
let activeHighlightGroupEl: HTMLElement | null = null
let pointerDismissArmTimer: ReturnType<typeof setTimeout> | null = null
let pointerDismissCleanup: (() => void) | null = null

/** Applique le highlight sur la carte (border / radius), pas sur le wrapper d’ancre. */
function resolveHighlightCard(anchor: HTMLElement): HTMLElement {
  const article = anchor.querySelector("article")
  if (article instanceof HTMLElement) return article
  const child = anchor.firstElementChild
  if (child instanceof HTMLElement && child !== anchor) {
    const cn = child.className
    if (typeof cn === "string" && /\bborder\b/.test(cn)) return child
  }
  return anchor
}

function resolveHighlightGroup(card: HTMLElement, anchor: HTMLElement): HTMLElement | null {
  if (anchor.classList.contains("group")) return anchor
  const childGroup = anchor.querySelector(":scope > .group")
  if (childGroup instanceof HTMLElement) return childGroup
  return card.closest(".group")
}

function detachHighlightDismissListeners(): void {
  if (pointerDismissArmTimer) {
    window.clearTimeout(pointerDismissArmTimer)
    pointerDismissArmTimer = null
  }
  pointerDismissCleanup?.()
  pointerDismissCleanup = null
}

/** Annule le survol forcé dès que l’utilisateur déplace la souris ou scroll à la molette. */
function attachHighlightDismissOnPointerNavigation(): void {
  detachHighlightDismissListeners()

  const dismiss = () => {
    if (!activeHighlightEl && !activeHighlightGroupEl) return
    clearScrollTargetHighlight()
  }

  const armListeners = () => {
    pointerDismissArmTimer = null
    const onPointerMove = () => dismiss()
    const onWheel = () => dismiss()

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("wheel", onWheel, { passive: true })

    pointerDismissCleanup = () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("wheel", onWheel)
    }
  }

  pointerDismissArmTimer = window.setTimeout(armListeners, POINTER_DISMISS_ARM_MS)
}

/** Cibles carte module / certification (ancre # dans l’URL). */
export function isCardScrollTargetId(id: string): boolean {
  return (
    /^certification-\d+$/.test(id) ||
    /^ponctuelle-module-/.test(id) ||
    /^reconversion-pack-detail-mod-/.test(id)
  )
}

export function clearScrollTargetHighlight(): void {
  detachHighlightDismissListeners()
  if (activeHighlightEl) {
    activeHighlightEl.classList.remove(SCROLL_TARGET_HIGHLIGHT_CLASS)
    activeHighlightEl = null
  }
  if (activeHighlightGroupEl) {
    activeHighlightGroupEl.classList.remove(SCROLL_TARGET_HIGHLIGHT_GROUP_CLASS)
    activeHighlightGroupEl = null
  }
  if (typeof document !== "undefined") {
    document.body.classList.remove(BODY_HIGHLIGHT_SESSION_CLASS)
  }
  document.getElementById("csf-scroll-target-pointer")?.remove()
}

export function applyScrollTargetHighlight(anchor: HTMLElement): void {
  clearScrollTargetHighlight()
  const card = resolveHighlightCard(anchor)
  const group = resolveHighlightGroup(card, anchor)
  document.body.classList.add(BODY_HIGHLIGHT_SESSION_CLASS)
  card.classList.add(SCROLL_TARGET_HIGHLIGHT_CLASS)
  activeHighlightEl = card
  if (group) {
    group.classList.add(SCROLL_TARGET_HIGHLIGHT_GROUP_CLASS)
    activeHighlightGroupEl = group
  }
  attachHighlightDismissOnPointerNavigation()
}

async function waitForScrollTarget(
  elementId: string,
  maxWaitMs: number,
  signal?: AbortSignal,
): Promise<HTMLElement | null> {
  const deadline = Date.now() + maxWaitMs
  for (;;) {
    if (signal?.aborted) return null
    const el = document.getElementById(elementId)
    if (el) return el
    if (Date.now() > deadline) return null
    await new Promise<void>((r) => requestAnimationFrame(() => r()))
  }
}

/**
 * Scroll fluide vers la carte : survol forcé immédiat, annulé au mouvement de la souris ou à la molette.
 */
export async function scrollAndHighlightTarget(
  elementId: string,
  options?: {
    maxWaitMs?: number
    signal?: AbortSignal
  },
): Promise<boolean> {
  const maxWait = options?.maxWaitMs ?? 5000
  const anchor = await waitForScrollTarget(elementId, maxWait, options?.signal)
  if (!anchor) return false

  applyScrollTargetHighlight(anchor)

  await smoothScrollToIdWhenReady(elementId, options)
  if (options?.signal?.aborted) {
    clearScrollTargetHighlight()
    return false
  }
  /** Survol forcé conservé même si le scroll échoue (page longue, ancre hors écran). */
  return true
}
