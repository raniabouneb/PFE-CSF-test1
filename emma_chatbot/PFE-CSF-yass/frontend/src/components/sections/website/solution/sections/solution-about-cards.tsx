import Image from "next/image"
import { Cpu, Gauge, Puzzle } from "lucide-react"

const pillars = [
  {
    slug: "embarques",
    caption: "Des solutions fiables pour vos enjeux industriels et connectés.",
    imageUrl: "/images/iot-accueil3.webp",
    icon: Cpu,
  },
  {
    slug: "supervision",
    caption: "Données et supervision pour une prise de décision éclairée.",
    imageUrl: "/images/data-accueil.webp",
    icon: Gauge,
  },
  {
    slug: "mesure",
    caption: "Ingénierie sur mesure, alignée sur vos processus et contraintes.",
    imageUrl: "/images/100-accueil.jpg",
    icon: Puzzle,
  },
]

export function SolutionAboutCards() {
  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-2 pt-4 sm:px-8 lg:px-14">
      <div className="relative z-[2] grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-7 lg:gap-9">
        {pillars.map((item) => {
          const Icon = item.icon
          return (
            <article
              key={item.slug}
              className="flex flex-col overflow-visible rounded-2xl bg-white shadow-[0_24px_55px_-30px_rgba(15,23,42,0.4)] ring-1 ring-slate-200/80"
            >
              <div className="relative aspect-[16/11] w-full overflow-hidden rounded-t-2xl bg-slate-100">
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  className="object-cover transition duration-500 hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
                <div className="absolute bottom-0 right-5 z-10 flex h-16 w-16 translate-y-1/2 items-center justify-center rounded-lg bg-[#1F6CA3] text-white shadow-lg ring-4 ring-white sm:right-6 sm:h-[4.5rem] sm:w-[4.5rem]">
                  <Icon className="size-7 sm:size-8" strokeWidth={2} aria-hidden />
                </div>
              </div>

              <div className="flex flex-1 flex-col bg-white px-6 pb-8 pt-12 text-center sm:px-7 sm:pb-9 sm:pt-14">
                <p className="text-base font-bold leading-snug text-slate-900 sm:text-lg">{item.caption}</p>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
