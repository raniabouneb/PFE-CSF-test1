"use client"

import { useEffect } from "react"
import { navDebug } from "@/lib/client/nav-debug"

/** Log F12 quand le client monte sur `/certifications` (si CSF_NAV_DEBUG=1). */
export function CertificationsRouteMountLogger() {
  useEffect(() => {
    navDebug("page Certifications : composant client monté", {
      path: window.location.pathname,
      hash: window.location.hash,
    })
  }, [])
  return null
}
