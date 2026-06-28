"use client"

import { FormationFormatToggleButton } from "@/components/shared/buttons/formation-format-toggle-button"

interface FormationFormatCardProps {
  title: string
  description: string
  onToggle: () => void
}

export function FormationFormatCard({ title, description, onToggle }: FormationFormatCardProps) {
  return (
    <div className="relative rounded-3xl px-10 py-4 pb-8 overflow-hidden shadow-lg">
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(to bottom, rgba(111, 151, 214, 0.85) 45%,  rgba(51,95, 161, 1) 100%)",
      }}
    />
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 120% 120% at 40% 20%, rgba(50, 201, 68, 0.18) 0%, transparent 65%)",
      }}
    />
      <div className="relative z-10">
        <h3 className="text-xl font-bold mb-2 mt-4 text-white">{title}</h3>
        <p className="text-white text-sm mb-4 leading-relaxed">{description}</p>
      <FormationFormatToggleButton onClick={onToggle} />
      </div>
    </div>
  )
}
