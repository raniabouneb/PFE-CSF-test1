import { TestimonialCard } from "@/components/shared/cards/testimonial-card"
 import { testimonials } from "@/lib/data/testimonials"
 
 export function TemoignagesSection() {
   return (
    <section id="temoignage" className="py-16 bg-white scroll-mt-24">
       <div className="max-w-6xl mx-auto px-4">
         <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#1F6CA3] mb-3 text-pretty">Retours d'expérience de nos clients</h2>
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
