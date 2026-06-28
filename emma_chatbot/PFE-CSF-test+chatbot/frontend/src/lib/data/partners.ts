 export interface Partner {
   id: number
   name: string
   logo: string
   description?: string
 }
 
 export interface Collaboration {
   id: number
   title: string
   description: string
   image: string
   partnersIds?: number[]
   /** Affichée sur la carte « Actualités » si présente (API ou données statiques). */
   date?: string
 }
 
 export const partners: Partner[] = [
   { id: 1, name: "TELNET", logo: "/partner-logos/telnet.png" },
   { id: 2, name: "Sofiatech", logo: "/partner-logos/sofiatech.png" },
   { id: 3, name: "Sofrecom", logo: "/partner-logos/sofrecom.png" },
   { id: 4, name: "FOCUS", logo: "/partner-logos/focus.png" },
   { id: 5, name: "Faurecia", logo: "/partner-logos/faurecia.png" },
   { id: 6, name: "Altran", logo: "/partner-logos/altran.png" },
  { id: 7, name: "FST", logo: "/partner-logos/fst.png" },
 ]
 
 export const collaborations: Collaboration[] = [
   {
     id: 1,
     title: "collaboration entre CSF, Capgemini Engineering Tunisia et GIZ Tunisie",
     description:
       "une formation spécialisée en architecture et programmation des microcontroleurs STM32 a été organisée afin de renforcer les compétences des ingénieurs en systèmes embarqués.",
     image: "/collaborations/collaboration-1.jpg",
     partnersIds: [5, 6],
   },
   {
     id: 2,
     title: "collaboration entre CSF, Capgemini Engineering Tunisia et GIZ Tunisie",
     description:
       "une formation spécialisée en architecture et programmation des microcontroleurs STM32 a été organisée afin de renforcer les compétences des ingénieurs en systèmes embarqués.",
     image: "/collaborations/collaboration-1.jpg",
     partnersIds: [5, 6],
   },
   {
     id: 3,
     title: "collaboration entre CSF, Capgemini Engineering Tunisia et GIZ Tunisie",
     description:
       "une formation spécialisée en architecture et programmation des microcontroleurs STM32 a été organisée afin de renforcer les compétences des ingénieurs en systèmes embarqués.",
     image: "/collaborations/collaboration-1.jpg",
     partnersIds: [5, 6],
   },
 ]
 
 export const stats = {
   projectsCompleted: 180,
   partnersCount: 25,
   yearsOfExperience: 15,
 }
