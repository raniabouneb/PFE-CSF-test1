"use client"

import { useState } from "react"
import { TrackHero } from "./shell/track-hero"
import { ReservationRequestModal } from "./shell/reservation-request-modal"

interface ReconversionHeroSectionProps {
  title: string
  subtitle: string
  backgroundImageUrl?: string | null
  buttonText: string
  enrolledCount: string
}

/** Hero de la page parcours reconversion (visuel + CTA + modal réservation). */
export function ReconversionHeroSection({
  title,
  subtitle,
  backgroundImageUrl,
  buttonText,
  enrolledCount,
}: ReconversionHeroSectionProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <TrackHero
        title={title}
        subtitle={subtitle}
        backgroundImageUrl={backgroundImageUrl}
        buttonText={buttonText}
        enrolledCount={enrolledCount}
        onButtonClick={() => setOpen(true)}
      />
      <ReservationRequestModal
        open={open}
        onClose={() => setOpen(false)}
        requestKind="reservation"
        category="reconversion"
        trackName={title}
        formationTitle={title}
      />
    </>
  )
}
