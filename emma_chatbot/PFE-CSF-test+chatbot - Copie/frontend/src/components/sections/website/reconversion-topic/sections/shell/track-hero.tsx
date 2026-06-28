"use client"

import Image from "next/image"
import { SiteSearchCombobox } from "@/components/website/search/site-search-combobox"
import { resolveHeroBackgroundSrc } from "@/lib/hero-background"

interface TrackHeroProps {
  title: string
  subtitle: string
  backgroundImageUrl?: string | null
  buttonText?: string
  enrolledCount?: string
  onButtonClick?: () => void
}

export function TrackHero({
  title,
  subtitle,
  backgroundImageUrl,
  buttonText = "Contactez-nous pour finaliser votre inscription",
  enrolledCount = "+1000 déjà inscrits",
  onButtonClick,
}: TrackHeroProps) {
  const { bgSrc, isRemote } = resolveHeroBackgroundSrc(backgroundImageUrl)

  return (
    <>
      <div
        className="relative w-full min-w-0 overflow-visible"
        data-navbar-hero
      >
        {isRemote ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${bgSrc})` }}
            role="img"
            aria-label="Formation background"
          />
        ) : (
          <Image
            src={bgSrc}
            alt="Formation background"
            fill
            className="h-full w-full object-cover"
            priority
            sizes="100vw"
          />
          
        )}

        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(5, 66, 74, 0.69) 0%, rgba(7, 25, 57, 0.82) 50%)",
          }}
        />

        <div className="relative flex min-h-[min(24rem,78svh)] min-w-0 flex-col justify-center px-4 py-24 sm:min-h-[28rem] sm:py-28 md:min-h-[500px] md:px-8 md:py-32 lg:min-h-[600px] lg:px-16 lg:py-36">
          <div className="w-full min-w-0 max-w-4xl">
            <h1 className="mb-4 max-w-full text-balance break-words text-2xl font-bold leading-tight text-white sm:text-3xl md:mb-6 md:text-4xl lg:text-5xl">
              {title}
            </h1>

            <p className="mb-6 text-base leading-relaxed text-white/90 break-words md:mb-8 md:text-lg lg:text-xl">
              {subtitle}
            </p>

            <div className="mb-8 w-full max-w-3xl">
              <SiteSearchCombobox
                variant="reconversion-hero"
                placeholder="Rechercher un parcours ou un module..."
                ariaLabel="Rechercher un parcours de reconversion"
                containerClassName="max-w-3xl"
              />
            </div>

            <button
              type="button"
              onClick={onButtonClick}
              className="h-18 w-full md:w-auto bg-[#0A566E] hover:bg-[#0A566E]/70 text-white font-semibold px-6 md:px-8 rounded-lg transition-colors duration-300 mb-4 md:mb-6"
            >
              {buttonText}
            </button>

            <p className="text-sm md:text-base text-white/80">{enrolledCount}</p>
          </div>
        </div>
      </div>

      <div data-navbar-hero-sentinel className="h-px w-full" aria-hidden />
    </>
  )
}
