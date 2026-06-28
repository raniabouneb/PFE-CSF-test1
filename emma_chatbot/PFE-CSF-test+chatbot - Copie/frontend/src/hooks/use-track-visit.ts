"use client"

import { useEffect } from "react"

function getOrCreateSessionId(): string {
  const KEY = "csf_visitor_sid"
  let sid = ""
  try {
    sid = sessionStorage.getItem(KEY) ?? ""
  } catch {}
  if (!sid) {
    sid = crypto.randomUUID()
    try {
      sessionStorage.setItem(KEY, sid)
    } catch {}
  }
  return sid
}

export function useTrackVisit(pageTitle?: string) {
  useEffect(() => {
    const sid = getOrCreateSessionId()
    const path = window.location.pathname

    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_path: path,
        page_title: pageTitle ?? document.title,
        session_id: sid,
      }),
    }).catch(() => {})
  }, [pageTitle])
}
