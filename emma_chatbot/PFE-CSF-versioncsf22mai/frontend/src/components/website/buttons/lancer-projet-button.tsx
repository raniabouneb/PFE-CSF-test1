"use client"

import { ArrowRight } from "lucide-react"

interface LancerProjetButtonProps {
  text?: string
  onClick?: () => void
}

export function LancerProjetButton({ text = "Lancer votre projet", onClick }: LancerProjetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-sm text-[#0D2A61] px-6 py-3 rounded-full font-medium hover:bg-white/70 transition-colors"
    >
      {text}
      <span className="bg-[#0D2A61] text-white p-1 rounded-full">
        <ArrowRight className="w-4 h-4" />
      </span>
    </button>
  )
}