import Image from "next/image"
import { PlusDetailsButton } from "../buttons/plus-details-button"

interface AmbitionsCardProps {
  title: string
  imageUrl: string
  buttonText?: string
  onButtonClick?: () => void
}

export function AmbitionsCard({ 
  title, 
  imageUrl, 
  buttonText = "En savoir plus",
  onButtonClick 
}: AmbitionsCardProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg h-full min-h-[400px]">
      {/* Background Image */}
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="object-cover"
      />
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(27, 124, 128, 0.5) 100%)"
        }}
      />
      
      {/* Glassmorphism Text Block at bottom with padding on all sides */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/20 backdrop-blur-md p-4 rounded-xl border border-white/30">
        <h3 className="font-bold text-base md:text-xl text-white drop-shadow-sm mb-3">
          {title}
        </h3>
        <PlusDetailsButton text={buttonText} onClick={onButtonClick} />
      </div>
    </div>
  )
}
