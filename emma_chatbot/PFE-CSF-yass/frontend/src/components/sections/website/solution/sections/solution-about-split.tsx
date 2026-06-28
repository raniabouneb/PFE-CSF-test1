import Image from "next/image"
import { CircleDot } from "lucide-react"

const points = [
  "Support technique continu 24/7 selon vos besoins.",
  "Consultants et ingénieurs expérimentés.",
  "Équipe projet réactive pour accélérer vos livraisons.",
]

export function SolutionAboutSplit() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-8 lg:px-14">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div className="relative">
          <div className="relative overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_20px_60px_-36px_rgba(15,23,42,0.45)]">
            <Image
              src="/images/consulting.jpg"
              alt=""
              width={920}
              height={620}
              className="h-auto w-full object-cover"
            />
          </div>

          <div className="absolute -bottom-7 left-1/2 w-[78%] -translate-x-1/2 rounded-2xl border border-white/20 bg-[#071939] px-6 py-5 text-center text-white shadow-xl">
            <p className="text-5xl font-bold leading-none">20+</p>
            <p className="mt-2 text-sm font-medium text-white/90">Années d&apos;expérience</p>
          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.35)] sm:p-10">
          <span className="inline-flex items-center rounded-md bg-[#0b3d7a] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Notre expertise
          </span>

          <h2 className="mt-4 text-balance text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            Renforcer vos équipes d&apos;ingénierie pour des projets IT en croissance
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            Nous aidons les entreprises à accélérer leurs initiatives numériques avec un accompagnement technique solide
            et des équipes flexibles, orientées résultat.
          </p>

          <ul className="mt-6 space-y-2.5 text-sm text-slate-700 sm:text-[15px]">
            {points.map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <CircleDot className="mt-0.5 size-4 text-[#0b3d7a]" />
                <span>{line}</span>
              </li>
            ))}
          </ul>

        </div>
      </div>
    </div>
  )
}
