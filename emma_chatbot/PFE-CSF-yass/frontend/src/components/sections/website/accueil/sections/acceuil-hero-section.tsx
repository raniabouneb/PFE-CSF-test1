import Image from "next/image"
import {
  DEFAULT_HOME_HERO_BG,
  resolveHeroBackgroundSrc,
} from "@/lib/hero-background"

type Props = {
  /** Depuis PostgreSQL `home_page_hero.background_image` (GET partners-data). */
  backgroundImageUrl?: string | null
}

/** Même style que les cartes stats du hero `/certifications` (`certifications-page-content.tsx`). */
const heroStatCard =
  "rounded-2xl border-2 border-white/30 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/10 lg:p-8"

/**
 * Hero carte arrondie : fond depuis la BD (fallback local), overlay sombre,
 * titre avec initiales vertes surdimensionnées, sous-texte blanc, deux cartes glass en bas.
 */
export function AcceuilHeroSection({ backgroundImageUrl }: Props) {
  const { bgSrc } = resolveHeroBackgroundSrc(backgroundImageUrl, DEFAULT_HOME_HERO_BG)

  return (
    <section
      id="accueil"
      className="relative flex min-h-[calc(100svh-5.5rem)] w-full flex-col bg-white scroll-mt-2 pt-[5.5rem]"
      data-nav-bg="#ffffff"
      data-nav-tone="light"
    >
      {/* Navbar `variant="hero"` (fixed) : décalage vertical + zone hero pour le passage barre transparente → blanche */}
      <div className="box-border mx-4 mb-4 mt-0 flex min-h-0 flex-1 flex-col sm:mx-6 sm:mb-6 lg:mx-8 lg:mb-8">
        <div
          className="relative min-h-0 flex-1 overflow-hidden rounded-[22px] md:rounded-[28px]"
          data-navbar-hero
        >
          <Image
            src={bgSrc}
            alt="Équipe en atelier de formation dans un bureau moderne : animateur et participante au tableau, collaborateurs au premier plan."
            fill
            priority
            className="h-full w-full object-cover object-center"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 92vw, 1216px"
          />

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#053d54]/85 via-[#052841]/85 to-[#040f40]/90"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50"
            aria-hidden
          />

          <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-end">
            <div className="px-6 pb-8 pt-12 mt-50 sm:px-10 sm:pb-10 md:px-12 md:pb-12 lg:px-16 lg:pb-14">
              <div className="mx-auto w-full min-w-0 max-w-7xl">
                <h1
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-semibold tracking-tight text-white"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  <span className="inline-flex items-baseline">
                    <span className="text-[2.65rem] leading-[0.95] text-[#5ab396] sm:text-[3.15rem] md:text-[3.75rem] lg:text-[4.35rem]">
                      C
                    </span>
                    <span className="text-[1.65rem] leading-none sm:text-[2.1rem] md:text-[2.55rem] lg:text-[3rem]">
                      onseil
                    </span>
                  </span>
                  <span className="select-none text-[1.35rem] text-white/95 sm:text-[2.65rem]" aria-hidden>
                    .
                  </span>
                  <span className="inline-flex items-baseline">
                    <span className="text-[2.65rem] leading-[0.95] text-[#5ab396] sm:text-[3.15rem] md:text-[3.75rem] lg:text-[4.35rem]">
                      S
                    </span>
                    <span className="text-[1.65rem] leading-none sm:text-[2.1rem] md:text-[2.55rem] lg:text-[3rem]">
                      olution
                    </span>
                  </span>
                  <span className="select-none text-[1.35rem] text-white/95 sm:text-[2.65rem]" aria-hidden>
                    .
                  </span>
                  <span className="inline-flex items-baseline">
                    <span className="text-[2.65rem] leading-[0.95] text-[#5ab396] sm:text-[3.15rem] md:text-[3.75rem] lg:text-[4.35rem]">
                      F
                    </span>
                    <span className="text-[1.65rem] leading-none sm:text-[2.1rem] md:text-[2.55rem] lg:text-[3rem]">
                      ormation
                    </span>
                  </span>
                </h1>

                <p className="mt-6 max-w-3xl font-sans text-base leading-relaxed text-white/95 break-words md:mt-4 md:text-lg">
                  Conseil stratégique, solution sur mesure et formation d&apos;experts : CSF réunit trois pôles
                  d&apos;excellence pour une prise en charge intégrale de vos défis technologiques.
                </p>

                <div className="mt-4 flex min-w-0 flex-wrap gap-4 sm:mt-8 lg:gap-6">
                  <div
                    className={`${heroStatCard} h-[140px] w-full min-w-[10rem] max-w-[15rem] shrink-0 sm:w-[250px] lg:w-[280px]`}
                  >
                    <div
                      className="mb-2 text-left text-3xl font-bold text-white lg:text-4xl"
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                    >
                      <span>40</span>
                      <span>+</span>
                    </div>
                    <div className="text-left text-xs leading-relaxed text-white/70 lg:text-sm">
                      Partenaires D&apos;affaires
                    </div>
                  </div>
                  <div
                    className={`${heroStatCard} h-[140px] min-h-[140px] min-w-0 max-w-full flex-1 basis-[min(100%,18rem)] sm:max-w-[32rem]`}
                  >
                    <div
                      className="mb-2 text-left text-3xl font-bold leading-tight text-white lg:text-4xl"
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                    >
                      Le Leader
                    </div>
                    <div className="text-left text-xs leading-relaxed text-white/70 lg:text-sm">
                      de la reconversion de carrière professionnelle
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}