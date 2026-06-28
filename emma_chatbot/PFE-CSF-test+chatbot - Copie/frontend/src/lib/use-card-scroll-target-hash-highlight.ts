"use client"

import { useCallback, useEffect, useLayoutEffect, useRef } from "react"
import { parseCardScrollTargetHashId } from "@/lib/card-scroll-target-hash"
import { scrollAndHighlightTarget } from "@/lib/highlight-scroll-target"

type UseCardScrollTargetHashHighlightOptions = {
  /** Nombre de cartes prêtes (ou booléen). Tant que 0 / false, pas de tentative. */
  targetsReady: number | boolean
  /** Réaffiche la cible si masquée par un filtre / recherche locale. */
  onUnhideTarget?: () => void
  isTargetVisible: (hashId: string) => boolean
}

const MAX_ATTEMPT_FRAMES = 180

/**
 * Scroll + survol forcé vers `#ponctuelle-module-*`, `#reconversion-pack-detail-mod-*`,
 * `#certification-*`. Réessaie jusqu’à ce que la carte soit dans le DOM.
 */
export function useCardScrollTargetHashHighlight({
  targetsReady,
  onUnhideTarget,
  isTargetVisible,
}: UseCardScrollTargetHashHighlightOptions) {
  const ready = typeof targetsReady === "number" ? targetsReady > 0 : targetsReady
  const onUnhideRef = useRef(onUnhideTarget)
  const isVisibleRef = useRef(isTargetVisible)
  const unhideRequestedRef = useRef(false)
  const lastAppliedHashRef = useRef<string | null>(null)

  onUnhideRef.current = onUnhideTarget
  isVisibleRef.current = isTargetVisible

  const attemptHighlight = useCallback(async (): Promise<boolean> => {
    const hashId = parseCardScrollTargetHashId()
    if (!hashId) return false

    for (let frame = 0; frame < MAX_ATTEMPT_FRAMES; frame += 1) {
      if (!isVisibleRef.current(hashId)) {
        if (!unhideRequestedRef.current) {
          unhideRequestedRef.current = true
          onUnhideRef.current?.()
        }
        await new Promise<void>((r) => requestAnimationFrame(() => r()))
        continue
      }

      unhideRequestedRef.current = false
      if (document.getElementById(hashId)) {
        const ok = await scrollAndHighlightTarget(hashId, { maxWaitMs: 2500 })
        if (ok) {
          lastAppliedHashRef.current = hashId
          return true
        }
      }

      await new Promise<void>((r) => requestAnimationFrame(() => r()))
    }

    return false
  }, [])

  useLayoutEffect(() => {
    if (!ready) return
    lastAppliedHashRef.current = null
    unhideRequestedRef.current = false
    void attemptHighlight()
  }, [ready, attemptHighlight])

  useEffect(() => {
    if (!ready) return
    const hashId = parseCardScrollTargetHashId()
    if (!hashId) return

    const retry = () => {
      if (lastAppliedHashRef.current === hashId) return
      void attemptHighlight()
    }

    const t1 = window.setTimeout(retry, 60)
    const t2 = window.setTimeout(retry, 280)
    const t3 = window.setTimeout(retry, 700)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [ready, attemptHighlight])

  useEffect(() => {
    const onHash = () => {
      lastAppliedHashRef.current = null
      unhideRequestedRef.current = false
      void attemptHighlight()
    }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [attemptHighlight])
}
