"use client"

import { usePathname } from "next/navigation"
import { useEffect, useLayoutEffect } from "react"
import { smoothScrollToIdWhenReady } from "@/lib/smooth-scroll-to-id"

function hashTargetId(pathname: string, rawHash: string): string | null {
  if (!rawHash) return null
  if (rawHash === "partenaires" || rawHash === "contact") return rawHash
  if (rawHash === "accueil" && pathname === "/") return "accueil"
  return null
}

/**
 * Au chargement / changement de route / historique : scroll fluide vers `#partenaires`, `#contact`
 * (ou `#accueil` sur `/`), même logique que la navbar (`smoothScrollToIdWhenReady` + `scrollend`).
 */
export function AppHashScroll() {
  const pathname = usePathname() ?? ""

  useLayoutEffect(() => {
    const raw = window.location.hash.replace(/^#/, "")
    const id = hashTargetId(pathname, raw)
    if (!id) return
    const ac = new AbortController()
    void smoothScrollToIdWhenReady(id, { signal: ac.signal })
    return () => ac.abort()
  }, [pathname])

  useEffect(() => {
    const run = () => {
      const path = window.location.pathname
      const raw = window.location.hash.replace(/^#/, "")
      const id = hashTargetId(path, raw)
      if (!id) return
      void smoothScrollToIdWhenReady(id)
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
