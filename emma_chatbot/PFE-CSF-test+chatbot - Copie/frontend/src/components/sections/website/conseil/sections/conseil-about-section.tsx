import Image from "next/image"
import { Check } from "lucide-react"

const strengths = [
  "Résolution de problèmes complexes",
  "Service de confiance garanti",
  "Experts reconnus dans leur domaine",
]

export function ConseilAboutSection() {
  return (
    <section className="bg-white px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">

          {/* ── Left : overlapping photos ── */}
          <div className="relative h-[380px] sm:h-[460px]">
            {/* Dot-grid decoration */}
            <div
              className="pointer-events-none absolute bottom-2 left-2 h-36 w-36 opacity-25"
              style={{
                backgroundImage: "radial-gradient(circle, #176591 1.5px, transparent 1.5px)",
                backgroundSize: "14px 14px",
              }}
              aria-hidden
            />

            {/* Main (top-right) photo */}
            <div className="absolute right-0 top-0 h-[66%] w-[70%] overflow-hidden rounded-2xl shadow-xl">
              <Image
                src="/images/hero-2.jpg"
                alt="Consultants CSF en réunion"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 380px"
              />
            </div>

            {/* Secondary (bottom-left) photo */}
            <div className="absolute bottom-0 left-0 h-[54%] w-[58%] overflow-hidden rounded-2xl border-4 border-white shadow-xl">
              <Image
                src="/images/conseil-ambitions.jpg"
                alt="Accompagnement stratégique"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 35vw, 300px"
              />
            </div>

            {/* Play-button badge 
            <button
              aria-label="Découvrir CSF en vidéo"
              className="absolute left-[46%] top-[42%] z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#1a7fcf] shadow-lg ring-4 ring-white transition-colors duration-200 hover:bg-[#1568b0]"
            >
              <svg
                className="ml-1 h-5 w-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>*/}
          </div>

          {/* ── Right : text content ── */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.26em] text-[#176591] sm:text-sm">
              Qui sommes-nous
            </p>

            <h2 className="mb-6 text-3xl font-bold leading-tight text-[#1a3a5c] sm:text-4xl">
              Nous nous spécialisons dans{" "}
              <span className="text-[#176591]">l&apos;accompagnement stratégique</span> de nos clients
            </h2>

            <p className="mb-8 text-base leading-relaxed text-gray-500">
              Accélérez votre transformation avec des experts de haut niveau. Nous vous connectons
              à une équipe pluridisciplinaire alliant conseil stratégique, maîtrise technologique
              et développement humain pour relever tous vos défis avec succès.
            </p>

            {/* Identity bar */}
            <div className="mb-8 flex items-center gap-4 border-t border-gray-100 pt-6">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
                <Image
                  src="/images/logo-csf.png"
                  alt="CSF"
                  fill
                  className="object-contain"
                  sizes="48px"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a3a5c]">Équipe CSF</p>
                <p className="text-xs text-gray-400">Conseil Solution Formation</p>
              </div>
            </div>

            {/* Strengths list */}
            <ul className="space-y-3">
              {strengths.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-600 sm:text-base">
                  <Check className="h-5 w-5 flex-shrink-0 text-[#176591]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>
  )
}
