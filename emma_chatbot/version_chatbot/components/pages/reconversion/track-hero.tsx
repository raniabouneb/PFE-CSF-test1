import Image from "next/image"

interface TrackHeroProps {
  title: string
  subtitle: string
  buttonText?: string
  enrolledCount?: string
  onButtonClick?: () => void
}

export function TrackHero({
  title,
  subtitle,
  buttonText = "Contactez-nous pour finaliser votre inscription",
  enrolledCount = "+1000 déjà inscrits",
  onButtonClick,
}: TrackHeroProps) {
  return (
    <>
      <div
        className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden"
        data-navbar-hero
      >
        <Image
          src="/images/reconversion-hero.png"
          alt="Formation background"
          fill
          className="object-cover"
          priority
        />

        <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(77, 127, 135, 0.35) 0%, rgba(12, 58, 75, 0.63) 40%, rgba(22, 61, 96, 0.92) 100%)',
          }} />

        <div className="relative h-full flex flex-col justify-center px-4 md:px-8 lg:px-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight">
              {title}
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-white/90 mb-6 md:mb-8 leading-relaxed">
              {subtitle}
            </p>

            <button
              type="button"
              onClick={onButtonClick}
              className="h-18 w-full md:w-auto bg-[#3576AB] hover:bg-[#335FA1] text-white font-semibold px-6 md:px-8 rounded-lg transition-colors duration-300 mb-4 md:mb-6"
            >
              {buttonText}
            </button>

            <p className="text-sm md:text-base text-white/80">{enrolledCount}</p>
          </div>
        </div>
      </div>

      {/* (optionnel) marker pour debug */}
      <div data-navbar-hero-sentinel className="h-px w-full" aria-hidden />
    </>
  )
}
