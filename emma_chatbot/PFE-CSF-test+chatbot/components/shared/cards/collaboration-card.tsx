 "use client"
 
 import Image from "next/image"
 
 interface CollaborationCardProps {
   image: string
   title: string
   description: string
 }
 
 export function CollaborationCard({ image, title, description }: CollaborationCardProps) {
   return (
    <div className="relative h-72 rounded-2xl overflow-hidden group cursor-pointer shadow-md">
       <Image
         src={image}
         alt={title}
         fill
         className="object-cover group-hover:scale-105 transition-transform duration-300"
       />
 
       <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
 
      <div className="absolute inset-0 flex flex-col justify-end p-6">
         <h3 className="text-white font-bold text-lg mb-3 line-clamp-2">{title}</h3>
         <p className="text-white/90 text-sm line-clamp-3">{description}</p>
       </div>
     </div>
   )
 }
