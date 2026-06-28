 export interface Testimonial {
   id: number
   name: string
   role?: string
   company?: string
   avatar: string
   content: string
   rating: number
 }
 
 export const testimonials: Testimonial[] = [
   {
     id: 1,
     name: "Michael Roberts",
     role: "Project Manager",
     company: "TechCorp",
     avatar: "/avatars/michael-roberts.jpg",
     content: "The support I received was excellent. They truly cared about my needs and exceeded my expectations.",
     rating: 5,
   },
   {
     id: 2,
     name: "Emily Johnson",
     role: "CEO",
     company: "InnovateCo",
     avatar: "/avatars/emily-johnson.jpg",
     content: "Their service was outstanding. They ensured I was comfortable and informed every step of the way.",
     rating: 5,
   },
   {
     id: 3,
     name: "Olivia Harris",
     role: "Operations Director",
     company: "GlobalTech",
     avatar: "/avatars/olivia-harris.jpg",
     content: "They were attentive and thorough. Their professionalism and kindness made the entire process seamless.",
     rating: 5,
   },
   {
     id: 4,
     name: "Sophia Martinez",
     role: "Business Analyst",
     company: "DataWorks",
     avatar: "/avatars/sophia-martinez.jpg",
     content: "I felt valued and cared for. Their team made every effort to provide exceptional support and service.",
     rating: 5,
   },
   {
     id: 5,
     name: "James Anderson",
     role: "Engineering Manager",
     company: "SystemsPlus",
     avatar: "/avatars/james-anderson.jpg",
     content: "My experience was remarkable. They delivered exactly what they promised with care and dedication.",
     rating: 5,
   },
   {
     id: 6,
     name: "Daniel Thompson",
     role: "Strategic Advisor",
     company: "VisionLabs",
     avatar: "/avatars/daniel-thompson.jpg",
     content: "Their team was exceptional. They listened to my concerns and made sure all my needs were addressed.",
     rating: 5,
   },
 ]
