 "use client"
 
import { useRef } from "react"
 import { ChevronLeft, ChevronRight } from "lucide-react"
import { CollaborationCard } from "@/components/shared/cards/collaboration-card"
 
 interface Collaboration {
   id: number
   image: string
   title: string
   description: string
 }
 
 interface CollaborationsCarouselProps {
   collaborations: Collaboration[]
 }
 
 export function CollaborationsCarousel({ collaborations }: CollaborationsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
 
  const scrollByAmount = () => {
    const track = trackRef.current
    if (!track) return 420
    return Math.max(320, Math.round(track.clientWidth * 0.72))
   }
 
  const handleNext = () => {
    const track = trackRef.current
    if (!track) return

    const maxScrollLeft = track.scrollWidth - track.clientWidth
    const isAtEnd = track.scrollLeft >= maxScrollLeft - 8

    if (isAtEnd) {
      track.scrollTo({ left: 0, behavior: "smooth" })
      return
    }

    track.scrollBy({ left: scrollByAmount(), behavior: "smooth" })
  }

  const handlePrev = () => {
    const track = trackRef.current
    if (!track) return

    const maxScrollLeft = track.scrollWidth - track.clientWidth
    const isAtStart = track.scrollLeft <= 8

    if (isAtStart) {
      track.scrollTo({ left: maxScrollLeft, behavior: "smooth" })
      return
    }

    track.scrollBy({ left: -scrollByAmount(), behavior: "smooth" })
  }
 
  if (collaborations.length === 0) {
    return null
  }
 
   return (
     <div className="relative w-full mb-16">
      <div className="relative">
        <button
          onClick={handlePrev}
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 rounded-full w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 items-center justify-center hover:bg-white/30 transition-colors"
          aria-label="Previous collaboration"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={handleNext}
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 rounded-full w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 items-center justify-center hover:bg-white/30 transition-colors"
          aria-label="Next collaboration"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>

        <div
          ref={trackRef}
          className="overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none]"
        >
          <div className="flex items-center gap-6 pr-2 min-w-max [&::-webkit-scrollbar]:hidden">
            {collaborations.map((card) => (
              <div key={card.id} className="w-[360px] md:w-[420px] flex-shrink-0 snap-start">
                <CollaborationCard image={card.image} title={card.title} description={card.description} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
   )
 }
