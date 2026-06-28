import Image from "next/image"
import { CircleDot } from "lucide-react"

const points = [
  "Développement de plateformes web modernes et sécurisées.",
  "Intégration de solutions adaptées à vos besoins métiers.",
  "Accompagnement technique et maintenance continue pour assurer la performance de vos applications.",
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
          Des solutions digitales sur mesure pour faire évoluer votre entreprise
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
          Nous accompagnons les entreprises dans la conception et le développement de solutions
          performantes, adaptées à leurs objectifs métier et à leur croissance numérique. Grâce à une
          approche flexible et orientée résultats, nous mettons à disposition des équipes techniques
          qualifiées pour garantir des projets fiables, évolutifs et livrés dans les délais.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-slate-700 sm:text-[15px]">
            {points.map((line) => (
              <li key={line} className="flex min-w-0 items-start gap-3">
                <CircleDot className="mt-1 size-4 shrink-0 text-[#0b3d7a]" />
                <span className="min-w-0 leading-relaxed">{line}</span>
              </li>
            ))}
          </ul>

        </div>
      </div>
    </div>
  )
}
