"use client"

import Image from "next/image"
import { PlusDetailsButton } from "@/components/website/buttons/plus-details-button"

interface AmbitionCardProps {
  title: string
  imageUrl: string
  buttonText?: string
  onButtonClick?: () => void
}

export function AmbitionCard({
  title,
  imageUrl,
  buttonText = "Bénéficier de l'expertise CSF",
  onButtonClick,
}: AmbitionCardProps) {
  return (
    <div className="relative h-full min-h-[min(28rem,85svh)] w-full min-w-0 overflow-hidden rounded-2xl shadow-lg md:min-h-[500px]">
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="h-full w-full object-cover"
        sizes="(max-width: 768px) 100vw, 40vw"
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(30, 132, 141, 0.3) 0%, rgb(4, 23, 56) 100%)",
        }}
      />
      <div className="absolute bottom-4 left-4 right-4 bg-white/20 backdrop-blur-md p-4 rounded-xl border border-white/30">
        <h3 className="mb-3 text-balance break-words text-base font-bold text-white drop-shadow-sm md:text-xl">
          {title}
        </h3>
        <PlusDetailsButton text={buttonText} onClick={onButtonClick} />
      </div>
    </div>
  )
}