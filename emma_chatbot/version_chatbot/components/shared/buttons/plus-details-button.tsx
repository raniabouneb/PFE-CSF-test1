import { ArrowRight } from "lucide-react"

interface PlusDetailsButtonProps {
  text?: string
  onClick?: () => void
  className?: string
}

export function PlusDetailsButton({ 
  text = "Plus de détails", 
  onClick,
  className = ""
}: PlusDetailsButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`inline-flex items-center gap-2 bg-[#e8f4fc] text-[#335FA1] px-6 py-3 rounded-full font-medium hover:bg-[#d0e8f7] transition-colors ${className}`}
    >
      {text}
      <span className="bg-[#335FA1] text-white p-1 rounded-full">
        <ArrowRight className="w-4 h-4" />
      </span>
    </button>
  )
}
