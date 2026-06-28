import type { ReactNode } from "react"

interface RegisterButtonProps {
  onClick?: () => void
  children?: ReactNode
  variant?: "primary" | "secondary"
  className?: string
}

export function RegisterButton({
  onClick,
  children = "S'inscrire",
  variant = "primary",
  className = "",
}: RegisterButtonProps) {
  const baseClasses =
    "px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity text-sm md:text-base"

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
    </button>
  )
}
