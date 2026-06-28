import { ArrowRight } from "lucide-react"

interface DemanderDevisButtonProps {
  text?: string
  onClick?: () => void
  className?: string
}

export function DemanderDevisButton({ 
  text = "Découvrir plus", 
  onClick,
  className = ""
}: DemanderDevisButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`inline-flex items-center gap-2 bg-white/90 text-[#1e3a5f] px-5 py-2.5 rounded-full font-medium hover:bg-white transition-colors shadow-sm ${className}`}
    >
      {text}
      <span className="bg-[#335FA1] text-white p-1 rounded-full">
        <ArrowRight className="w-4 h-4" />
      </span>
    </button>
  )
}
