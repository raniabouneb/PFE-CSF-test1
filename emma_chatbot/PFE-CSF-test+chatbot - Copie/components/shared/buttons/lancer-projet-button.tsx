import { ArrowRight } from "lucide-react"

interface LancerProjetButtonProps {
  text?: string
  onClick?: () => void
}

export function LancerProjetButton({ text = "Lancer votre projet", onClick }: LancerProjetButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="inline-flex items-center gap-2 bg-[#e8f4fc] text-[#335FA1] px-6 py-3 rounded-full font-medium hover:bg-[#d0e8f7] transition-colors"
    >
      {text}
      <span className="bg-[#335FA1] text-white p-1 rounded-full">
        <ArrowRight className="w-4 h-4" />
      </span>
    </button>
  )
}
