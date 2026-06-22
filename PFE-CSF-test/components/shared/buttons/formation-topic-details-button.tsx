"use client"

interface FormationTopicDetailsButtonProps {
  text?: string
}

export function FormationTopicDetailsButton({ text = "Plus de détails" }: FormationTopicDetailsButtonProps) {
  return (
    <span className="mt-auto w-full rounded-full bg-[#1F6CA3] py-2.5 text-center text-sm font-medium text-white transition-colors group-hover:bg-[#1F6CA3]/80 pointer-events-none">
      {text}
    </span>
  )
}
