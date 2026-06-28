"use client"

import { FormationFormatToggleButton } from "@/components/website/buttons/formation-format-toggle-button"

interface FormationFormatCardProps {
  title: string
  description: string
  onToggle: () => void
  /** Bloc détails visible sous la carte */
  expanded?: boolean
}

export function FormationFormatCard({ title, description, onToggle, expanded = false }: FormationFormatCardProps) {
  return (
    <div className="group relative min-w-0 overflow-hidden rounded-3xl border border-white/25 bg-white/10 px-4 py-5 backdrop-blur-lg sm:px-8 sm:py-6 md:px-10 md:py-7">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "linear-gradient(to bottom, rgba(20, 47, 146, 0.82) 0%, rgba(5, 31, 71, 0.92) 55%,rgb(3, 20, 55) 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 120% 120% at 35% 15%, rgba(11, 110, 107, 0.7) 0%, transparent 62%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "linear-gradient(to bottom, rgba(5, 72, 81, 0.6) 0%, rgba(3, 27, 67, 0.71) 55%, rgba(3, 29, 73, 0.89) 100%)",
        }}
      />
      <div className="absolute inset-0 opacity-100 [mask-image:radial-gradient(circle_at_20%_0%,black,transparent_55%)] bg-white/10" />
      <div className="relative z-10">
        <h3 className="mb-2 mt-2 text-balance break-words text-2xl font-bold tracking-tight text-white/80 sm:mt-3 sm:text-3xl">
          {title}
        </h3>
        <p className="mb-5 text-base leading-relaxed text-white/80 break-words sm:text-lg">
          {description}
        </p>
        <FormationFormatToggleButton onClick={onToggle} expanded={expanded} />
      </div>
    </div>
  )
}
