"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { isNavDebugEnabled, navDebug } from "@/lib/client/nav-debug"

/**
 * Affiche dans F12 → Console les changements de route et erreurs globales
 * lorsque `localStorage CSF_NAV_DEBUG === "1"` (voir nav-debug.ts).
 */
export function CsfClientDiagnostics() {
  const pathname = usePathname()
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    if (!isNavDebugEnabled()) return
    const from = prevPath.current
    if (from === pathname && from !== null) return
    navDebug("changement de route", {
      depuis: from,
      vers: pathname ?? "",
      hash: typeof window !== "undefined" ? window.location.hash : "",
    })
    prevPath.current = pathname ?? ""
  }, [pathname])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!isNavDebugEnabled()) return

    const onError = (e: ErrorEvent) => {
      console.error("[CSF NAV] erreur window", {
        message: e.message,
        fichier: e.filename,
        ligne: e.lineno,
        col: e.colno,
      })
    }
    const onRejection = (e: PromiseRejectionEvent) => {
      console.error("[CSF NAV] promesse rejetée (non gérée)", e.reason)
    }
    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    console.info(
      "%c[CSF NAV] Diagnostic actif%c — localStorage CSF_NAV_DEBUG=1",
      "color:#0d9488;font-weight:bold",
      "color:inherit;font-weight:normal",
    )
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}
