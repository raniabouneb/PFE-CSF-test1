import Image from "next/image"

interface ConseilCardProps {
  title: string
  description: string
  iconUrl: string
}

export function ConseilCard({ title, description, iconUrl }: ConseilCardProps) {
  return (
    <div className="rounded-2xl p-4 md:p-6  "
    style={{
      background: "rgba(37, 148, 133, 0.1)"
    }}>
      {/* Icon */}
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden mb-3 md:mb-4 relative">
        <Image
          src={iconUrl}
          alt=""
          fill
          className="object-cover"
        />
      </div>
      
      {/* Title */}
      <h3 className="font-bold text-base md:text-lg text-[#335FA1] mb-2">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-xs md:text-sm leading-relaxed text-[#5a6a7a]">
        {description}
      </p>
    </div>
  )
}
