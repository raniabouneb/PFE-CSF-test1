"use client"

import { useLayoutEffect, useRef } from "react"

interface HomeHashScrollProps {
  /** Offset pour éviter que la section soit masquée par la navbar sticky */
  offsetPx?: number
}

export function HomeHashScroll({ offsetPx = 90 }: HomeHashScrollProps) {
  // Ignore uniquement le `hashchange` déclenché par le navigateur
  // lors d'un chargement initial avec hash (évite un flash / double-scroll).
  const ignoreNextHashChange = useRef(false)

  useLayoutEffect(() => {
    const lastScrollYRef = { current: 0 }
    const pendingFromScrollYRef = { current: null as number | null }

    // Met à jour la dernière position de scroll (avant un saut d'ancre)
    const onScroll = () => {
      lastScrollYRef.current = window.scrollY
    }

    // Capture la position AVANT le changement de hash (pour empêcher un "jump" invisible).
    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const link = target?.closest?.('a[href]') as HTMLAnchorElement | null
      const href = link?.getAttribute?.('href') ?? ""

      // On ne gère que les liens du type "/#solution" (ou "#solution")
      if (href.startsWith("/#") || href.startsWith("#")) {
        pendingFromScrollYRef.current = window.scrollY
      }
    }

    const scrollToHashSmooth = () => {
      const hash = window.location.hash
      if (!hash || hash.length < 2) return

      const id = hash.slice(1)
      const el = document.getElementById(id)
      if (!el) return

      const desiredTop = el.getBoundingClientRect().top + window.scrollY - offsetPx
      const currentTop = window.scrollY
      const prevTop = pendingFromScrollYRef.current ?? lastScrollYRef.current
      pendingFromScrollYRef.current = null

      // Cas fréquent : le navigateur saute déjà au bon endroit (pas de smooth visible).
      // Si on est déjà proche de la cible mais qu'on venait d'une position différente,
      // on relance une transition "comme si on scrollait" depuis l'ancien point.
      const nearTarget = Math.abs(currentTop - desiredTop) < 4
      const cameFromFar = Math.abs(prevTop - desiredTop) > 20
      if (nearTarget && cameFromFar) {
        window.scrollTo({ top: prevTop, behavior: "auto" })
        requestAnimationFrame(() => {
          window.scrollTo({ top: desiredTop, behavior: "smooth" })
        })
        return
      }

      window.scrollTo({ top: desiredTop, behavior: "smooth" })
    }

    const hash = window.location.hash
    if (hash && hash.length >= 2) {
      // Navigation arrivant avec hash déjà présent.
      // Le navigateur peut "jump" directement : on neutralise le prochain hashchange
      // et on refait une transition smooth.
      ignoreNextHashChange.current = true
      window.scrollTo({ top: 0, behavior: "auto" })
      lastScrollYRef.current = 0
      requestAnimationFrame(() => {
        scrollToHashSmooth()
        ignoreNextHashChange.current = false
      })
    }

    const onHashChange = () => {
      if (ignoreNextHashChange.current) return
      scrollToHashSmooth()
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    document.addEventListener("click", onDocumentClick)
    window.addEventListener("hashchange", onHashChange)
    return () => {
      window.removeEventListener("scroll", onScroll)
      document.removeEventListener("click", onDocumentClick)
      window.removeEventListener("hashchange", onHashChange)
    }
  }, [offsetPx])

  return null
}

