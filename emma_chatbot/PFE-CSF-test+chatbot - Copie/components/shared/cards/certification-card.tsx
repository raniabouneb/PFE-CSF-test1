import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PlusDetailsButton } from "../buttons/plus-details-button"
import { LancerProjetButton } from "../buttons/lancer-projet-button"

interface CertificationCardProps {
  /** Si défini, toute la carte est cliquable et mène vers cette URL (évite bouton dans un lien). */
  href?: string
  title: string
  description: string
  highlightedText: string
  suffixText?: string
  buttonText?: string
  buttonVariant?: "details" | "projet"
  onButtonClick?: () => void
}

function DetailsCtaVisual({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-2 bg-[#e8f4fc] text-[#1e3a5f] px-6 py-3 rounded-full font-medium">
      {text}
      <span className="bg-[#3b82f6] text-white p-1 rounded-full">
        <ArrowRight className="w-4 h-4" />
      </span>
    </span>
  )
}

export function CertificationCard({
  href,
  title,
  description,
  highlightedText,
  suffixText = "sans suivre de formation si vous possédez déjà les acquis.",
  buttonText = "Plus de détails",
  buttonVariant = "details",
  onButtonClick,
}: CertificationCardProps) {
  const inner = (
    <>
      <p className="text-[#5a6a7a] mb-4">
        <span className="text-[#335FA1] font-semibold">{title}</span> {description}{" "}
        <span className="text-[#1e3a5f] font-semibold">{highlightedText}</span> {suffixText}
      </p>
      {buttonVariant === "details" ? (
        href ? (
          <DetailsCtaVisual text={buttonText} />
        ) : (
          <PlusDetailsButton text={buttonText} onClick={onButtonClick} />
        )
      ) : (
        <LancerProjetButton text={buttonText} onClick={onButtonClick} />
      )}
    </>
  )

  const shellClass =
    "md:col-span-2 bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-[#e2e8f0] transition-opacity hover:opacity-95"

  if (href) {
    return (
      <Link href={href} className={`${shellClass} block no-underline text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2`}>
        {inner}
      </Link>
    )
  }

  return <div className={shellClass}>{inner}</div>
}
