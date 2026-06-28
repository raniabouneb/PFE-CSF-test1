"use client"

import { ArrowRight, ChevronDown } from "lucide-react"

interface FormationFormatToggleButtonProps {
  text?: string
  onClick?: () => void
  /** Section dépliée : flèche vers le bas ; sinon vers la droite. */
  expanded?: boolean
}

export function FormationFormatToggleButton({
  text = "Découvrir nos formations",
  onClick,
  expanded = false,
}: FormationFormatToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white px-4 py-2 text-sm font-medium text-[#1e3a5f] transition-all hover:bg-white/90"
    >
      {text}
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1e4b8e]">
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-white transition-transform duration-200" aria-hidden />
        ) : (
          <ArrowRight className="h-3 w-3 text-white transition-transform duration-200" aria-hidden />
        )}
      </span>
    </button>
  )
}
