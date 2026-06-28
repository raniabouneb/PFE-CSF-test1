"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface DemanderDevisButtonProps {
  text?: string
  onClick?: () => void
  /** Si défini, le bouton devient un lien (navigation uniquement depuis ce contrôle). */
  href?: string
  className?: string
}

const buttonClass =
  "inline-flex items-center gap-2 bg-white/90 text-[#1e3a5f] px-5 py-2.5 rounded-full font-medium hover:bg-white transition-colors shadow-sm"

export function DemanderDevisButton({
  text = "Découvrir plus",
  onClick,
  href,
  className = "",
}: DemanderDevisButtonProps) {
  const cls = `${buttonClass} ${className}`.trim()
  const label = (
    <>
      {text}
      <span className="bg-[#335FA1] text-white p-1 rounded-full">
        <ArrowRight className="w-4 h-4" />
      </span>
    </>
  )
  if (href) {
    return (
      <Link href={href} className={cls}>
        {label}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {label}
    </button>
  )
}