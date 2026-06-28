"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"
import { clsx } from "clsx"

export type FilterPillButtonProps = {
  /** État actif (ex. filtre sélectionné) : fond bleu CSF, texte blanc */
  active: boolean
  children: ReactNode
  className?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "className" | "children">

/**
 * Bouton pilule pour barres de filtres (page certifications, etc.).
 * Inactif : fond blanc, bordure bleue, texte bleu.
 * Actif : fond #1F6CA3, texte blanc.
 */
export function FilterPillButton({
  active,
  children,
  className,
  ...props
}: FilterPillButtonProps) {
  return (
    <button
      type="button"
      className={clsx(filterPillButtonClassNames(active), className)}
      {...props}
    >
      {children}
    </button>
  )
}

/** Classes Tailwind réutilisables si vous avez besoin du même style hors `<button>` */
export function filterPillButtonClassNames(active: boolean): string {
  return clsx(
    "inline-flex w-fit max-w-full shrink-0 items-center justify-center select-none whitespace-nowrap rounded-full px-4 py-2 text-[17px] font-medium transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0C2B59]/15 active:scale-[0.98]",
    active
      ? "bg-[#0D2A61] text-white shadow-[0_16px_40px_-24px_rgba(31,108,163,0.95)] ring-1 ring-[#0D2A61]/85 hover:brightness-[1.03]"
      : "border border[#0D2A61] bg-white text-[#0D2A61] hover:border-[#0D2A61]/40 hover:bg-white/40 hover:shadow-[0_16px_40px_-30px_rgba(15,23,42,0.45)]",
  )
}
