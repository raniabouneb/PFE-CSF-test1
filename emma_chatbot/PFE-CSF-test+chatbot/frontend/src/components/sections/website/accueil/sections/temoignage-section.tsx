import { TestimonialCard } from "@/components/website/cards/testimonial-card"
import { testimonials } from "@/lib/data/testimonials"

export function TemoignageSection() {
  return (
    <section
      id="temoignage"
      className="scroll-mt-24 bg-white py-10 md:py-20"
      data-nav-bg="#ffffff"
      data-nav-tone="light"
    >
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-balance break-words text-2xl font-bold text-[#1F6CA3] sm:text-3xl md:text-4xl">
            Retours d&apos;expérience de nos clients
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <TestimonialCard
              key={t.id}
              avatar={t.avatar}
              name={t.name}
              role={[t.role, t.company].filter(Boolean).join(", ")}
              testimonial={t.content}
              rating={t.rating}
            />
          ))}
        </div>
      </div>
    </section>
  )
}