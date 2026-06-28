"use client"

import { useTrackVisit } from "@/hooks/use-track-visit"

export function TrackPageVisit({ title }: { title?: string }) {
  useTrackVisit(title)
  return null
}
