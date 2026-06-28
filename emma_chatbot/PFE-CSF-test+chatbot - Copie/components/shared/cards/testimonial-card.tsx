 import Image from "next/image"
 import { Star } from "lucide-react"
 
 interface TestimonialCardProps {
   avatar: string
   name: string
   role?: string
   testimonial: string
   rating: number
 }
 
 export function TestimonialCard({ avatar, name, role, testimonial, rating }: TestimonialCardProps) {
   return (
    <div className="bg-[#E9F4F3] rounded-2xl p-6 flex flex-col gap-3">
       <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#1e3a5f]/10">
           <Image src={avatar} alt={name} fill className="object-cover" />
         </div>
         <div>
          <h4 className="font-semibold text-[#1e3a5f]">{name}</h4>
          {role && <p className="text-xs text-[#5a6a7a]">{role}</p>}
         </div>
       </div>
 
      <p className="text-[#5a6a7a] text-sm leading-relaxed">{testimonial}</p>
 
       <div className="flex gap-1">
         {Array.from({ length: 5 }).map((_, i) => (
           <Star
             key={i}
             size={16}
            className={i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
           />
         ))}
       </div>
     </div>
   )
 }
