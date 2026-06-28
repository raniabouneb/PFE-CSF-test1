import Image from "next/image"

interface ConseilCardProps {
  title: string
  description: string
  iconUrl: string
}

export function ConseilCard({ title, description, iconUrl }: ConseilCardProps) {
  return (
    <div
      className="rounded-2xl p-4 md:p-6"
      style={{ background: "rgba(37, 146, 148, 0.15)" }}
    >
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden mb-3 md:mb-4 relative">
        <Image src={iconUrl} alt="" fill className="h-full w-full object-cover" sizes="40px" />
      </div>
      <h3 className="mb-2 text-balance break-words text-base font-bold text-[#0D2A61] md:text-[22px]">{title}</h3>
      <p className="text-xs leading-relaxed text-[#0A285E] break-words md:text-[17px]">{description}</p>
    </div>
  )
}