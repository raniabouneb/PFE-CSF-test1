"use client"

import Image from "next/image"
import { PONCTUELLE_SEARCH_PLACEHOLDER } from "@/lib/constants/ponctuelle-page-copy"
import { resolveHeroBackgroundSrc } from "@/lib/hero-background"
import { SiteSearchCombobox } from "@/components/website/search/site-search-combobox"

interface PonctuellesHeroProps {
  title?: string
  subtitle?: string
  buttonText?: string
  /** Chemin `/public` ou URL https */
  backgroundImageUrl?: string | null
  searchPlaceholder?: string
  /** Recherche côtale modules (ex. `PonctuelleFormationDetail` filtre la liste en dessous). */
  searchValue?: string
  onSearchChange?: (value: string) => void
  onButtonClick?: () => void
}

export function PonctuellesHero({
  title = "Expertise en Système Embarqué",
  subtitle = "Découvrez nos modules spécialisés, conçus pour une montée en compétences immédiate et ciblée.",
  buttonText = "Contactez-nous pour finaliser votre inscription",
  backgroundImageUrl,
  searchPlaceholder = PONCTUELLE_SEARCH_PLACEHOLDER,
  searchValue = "",
  onSearchChange,
  onButtonClick,
}: PonctuellesHeroProps) {
  const { bgSrc, isRemote } = resolveHeroBackgroundSrc(backgroundImageUrl)

  return (
    <section className="relative overflow-visible" data-navbar-hero>
      {isRemote ? (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgSrc})` }}
          role="img"
          aria-hidden
        />
      ) : (
        <Image
          src={bgSrc}
          alt="Formation background"
          fill
          className="z-0 h-full w-full object-cover"
          priority
          sizes="100vw"
        />
      )}

        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(5, 66, 74, 0.7) 0%, rgba(7, 25, 57, 0.9) 50%)",
          }}
        />

      <div className="relative z-10 w-full min-w-0 max-w-8xl px-4 py-10 md:px-8 md:py-20 lg:px-16">
        <div className="mx-auto w-full min-w-0 max-w-8xl">
          <div className="grid grid-cols-1 items-center gap-8 md:gap-12 lg:grid-cols-2">
            <div className="w-full min-w-0 max-w-3xl text-white">
              <h1 className="mb-6 mt-12 text-balance break-words text-3xl font-bold sm:mt-16 sm:text-4xl md:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mb-8 text-base leading-relaxed text-blue-50 break-words md:text-xl">{subtitle}</p>

              <div className="relative mb-8 w-full max-w-3xl">
                {onSearchChange ? (
                  <SiteSearchCombobox
                    variant="ponctuelle-hero"
                    placeholder={searchPlaceholder}
                    query={searchValue}
                    onQueryChange={onSearchChange}
                    containerClassName="max-w-3xl"
                  />
                ) : (
                  <SiteSearchCombobox variant="ponctuelle-hero" placeholder={searchPlaceholder} />
                )}
              </div>

              <button
                type="button"
                onClick={onButtonClick}
                className="h-18 w-full md:w-auto bg-[#0A566E] hover:bg-[#0A566E]/70 text-white font-semibold px-6 md:px-8 rounded-lg transition-colors duration-300 mb-4 md:mb-6"
              >
                {buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
