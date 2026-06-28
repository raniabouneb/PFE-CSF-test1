import type { ReactNode } from "react"
import { Send } from "lucide-react"

interface CatalogButtonProps {
  onClick?: () => void
  children?: ReactNode
  variant?: "primary" | "secondary"
  showIcon?: boolean
  className?: string
}

export function CatalogButton({
  onClick,
  children = "Demander le catalogue",
  variant = "secondary",
  showIcon = true,
  className = "",
}: CatalogButtonProps) {
  const baseClasses =
    "px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity text-sm md:text-base flex items-center gap-2"

  const variantClasses = {
    primary: "bg-[#335FA1] text-white",
    secondary: "bg-[#335FA1] text-white",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
      {showIcon && <Send className="w-4 h-4" />}
    </button>
  )
}
