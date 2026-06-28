"use client"

import { usePathname } from "next/navigation"
import { useEffect, useLayoutEffect } from "react"
import { shouldDeferCardHashScrollToPage } from "@/lib/card-scroll-target-hash"
import {
  isCardScrollTargetId,
  scrollAndHighlightTarget,
} from "@/lib/highlight-scroll-target"
import { smoothScrollToIdWhenReady } from "@/lib/smooth-scroll-to-id"

function hashTargetId(pathname: string, rawHash: string): string | null {
  if (!rawHash) return null
  if (rawHash === "partenaires" || rawHash === "contact") return rawHash
  if (rawHash === "accueil" && pathname === "/") return "accueil"
  if (isCardScrollTargetId(rawHash)) {
    if (shouldDeferCardHashScrollToPage(pathname, rawHash)) return null
    return rawHash
  }
  return null
}

async function scrollToHashTarget(id: string, signal?: AbortSignal): Promise<void> {
  if (isCardScrollTargetId(id)) {
    await scrollAndHighlightTarget(id, { signal, maxWaitMs: 5000 })
    return
  }
  await smoothScrollToIdWhenReady(id, { signal })
}

/**
 * Au chargement / changement de route / historique : scroll vers l’ancre.
 * Modules & certifications : scroll + surbrillance de la carte ciblée.
 */
export function AppHashScroll() {
  const pathname = usePathname() ?? ""

  useLayoutEffect(() => {
    const raw = window.location.hash.replace(/^#/, "")
    const id = hashTargetId(pathname, raw)
    if (!id) return
    const ac = new AbortController()
    void scrollToHashTarget(id, ac.signal)
    return () => ac.abort()
  }, [pathname])

  useEffect(() => {
    const run = () => {
      const path = window.location.pathname
      const raw = window.location.hash.replace(/^#/, "")
      const id = hashTargetId(path, raw)
      if (!id) return
      void scrollToHashTarget(id)
    }
    window.addEventListener("popstate", run)
    window.addEventListener("hashchange", run)
    return () => {
      window.removeEventListener("popstate", run)
      window.removeEventListener("hashchange", run)
    }
  }, [])

  return null
}
