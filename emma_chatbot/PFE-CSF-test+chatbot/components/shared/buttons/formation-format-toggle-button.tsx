"use client"

import { ArrowRight } from "lucide-react"

interface FormationFormatToggleButtonProps {
  text?: string
  onClick?: () => void
}

export function FormationFormatToggleButton({
  text = "Découvrir nos formations",
  onClick,
}: FormationFormatToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white px-4 py-2 text-sm font-medium text-[#1e3a5f] transition-all hover:bg-white/90"
    >
      {text}
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1e4b8e]">
        <ArrowRight className="h-3 w-3 text-white" />
      </span>
    </button>
  )
}
