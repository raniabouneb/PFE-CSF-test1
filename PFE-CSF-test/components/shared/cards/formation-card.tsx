import Image from "next/image"
import { DemanderDevisButton } from "../buttons/demander-devis-button"

interface FormationCardProps {
  title: string
  description: string
  imageUrl: string
  showHover?: boolean
  onDevisClick?: () => void
}

export function FormationCard({ title, description, imageUrl, showHover = false, onDevisClick }: FormationCardProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer h-[280px]">
      {/* Background Image */}
      <Image
        src={imageUrl}
        alt={title}
        fill
        className={`object-cover transition-transform duration-500 ${showHover ? "group-hover:scale-105" : ""}`}
      />
      
      {/* Gradient Overlay: white 0% opacity at top, #1B7C80 50% opacity at bottom */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(7, 82, 99, 0.9) 100%)"
        }}
      />
      
      {/* Hover Overlay - Stronger glassmorphism (only if showHover is true) */}
      {showHover && (
        <div className="absolute inset-0 bg-[#1e3a5f]/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      {/* Default State - Glassmorphism Text Block at bottom */}
      <div className={`absolute bottom-4 left-4 right-4 bg-white/20 backdrop-blur-md p-4 rounded-xl border border-white/30 transition-opacity duration-300 ${showHover ? "group-hover:opacity-0" : ""}`}>
        <h3 className="font-bold text-base mb-1 text-white">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-white">
          {description}
        </p>
      </div>
      
      {/* Hover State - Centered Glassmorphism Block with Button (only if showHover is true) */}
      {showHover && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/20 backdrop-blur-md p-5 rounded-2xl border border-white/30 mx-4">
            <h3 className="font-bold text-lg mb-2 text-white drop-shadow-sm">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-white/90 drop-shadow-sm mb-4">
              {description}
            </p>
            <DemanderDevisButton onClick={onDevisClick} />
          </div>
        </div>
      )}
    </div>
  )
}
