"use client"

import { ArrowRight } from "lucide-react"

interface PlusDetailsButtonProps {
  text?: string
  onClick?: () => void
  className?: string
}

export function PlusDetailsButton({
  text = "Plus de détails",
  onClick,
  className = "",
}: PlusDetailsButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 bg-white/60 text-[#0D2A61] px-6 py-3 rounded-full font-medium hover:bg-white/40 transition-colors ${className}`}
    >
      {text}
      <span className="bg-[#0D2A61] text-white p-1 rounded-full">
        <ArrowRight className="w-4 h-4" />
      </span>
    </button>
  )
}