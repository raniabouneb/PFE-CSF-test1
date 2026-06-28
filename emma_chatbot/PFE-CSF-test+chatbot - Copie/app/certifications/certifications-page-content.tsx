"use client"

import Image from "next/image"
import Link from "next/link"
import { NavbarTransparent } from "@/components/layout/navbar-transparent"
import { Plus, Search, Cpu, Globe, BarChart3 } from "lucide-react"
import { useState } from "react"
import { CertificationCard } from "@/app/certifications/certification-p-card"

export function CertificationsPageContent() {
  const [searchQuery, setSearchQuery] = useState("")

  const certifications = [
    {
      icon: <Cpu className="w-8 h-8" />,
      category: "Embedded Systems",
      title: "Expert en Systèmes",
      subtitle: "Embarqués STM32",
      description:
        "Maîtrisez la programmation bare-metal, les périphériques HAL, RTOS et le débogage avancé sur microcontrôleurs STM32.",
      skills: ["C/C++", "RTOS", "HAL", "GPIO", "UART"],
      duration: "12 semaines",
      level: "Avancé" as const,
    },
    {
      icon: <Globe className="w-8 h-8" />,
      category: "Web Development",
      title: "Full Stack",
      subtitle: "Web Moderne",
      description:
        "Apprenez à construire des applications web complètes avec les technologies les plus modernes et les meilleures pratiques.",
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker"],
      duration: "16 semaines",
      level: "Avancé" as const,
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      category: "Management",
      title: "Gestion de Projet",
      subtitle: "Agile & DevOps",
      description:
        "Maîtrisez les méthodologies Agile et les principes DevOps pour une gestion de projet efficace et moderne.",
      skills: ["Scrum", "Kanban", "CI/CD", "Git", "Agile"],
      duration: "8 semaines",
      level: "Intermédiaire" as const,
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      category: "Embedded Systems",
      title: "IoT & Connectivité",
      subtitle: "ESP32 et Protocoles",
      description: "Créez des projets IoT connectés avec ESP32, maîtrisez les protocoles MQTT, BLE et WiFi.",
      skills: ["C++", "MQTT", "BLE", "WiFi", "Arduino"],
      duration: "10 semaines",
      level: "Intermédiaire" as const,
    },
    {
      icon: <Globe className="w-8 h-8" />,
      category: "Web Development",
      title: "Frontend Expert",
      subtitle: "Next.js & Performance",
      description:
        "Devenez expert en développement frontend avec Next.js, optimisation des performances et design responsive.",
      skills: ["Next.js", "React", "Tailwind CSS", "Performance", "SEO"],
      duration: "12 semaines",
      level: "Avancé" as const,
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      category: "Management",
      title: "Leadership Tech",
      subtitle: "Gestion d'Équipes",
      description:
        "Développez vos compétences en leadership et en gestion d'équipes techniques pour une carrière managériale.",
      skills: ["Leadership", "Communication", "Stratégie", "RH", "Coaching"],
      duration: "6 semaines",
      level: "Débutant" as const,
    },
  ]

  const handleDetailsClick = (title: string) => {
    console.log(`Voir les détails de: ${title}`)
  }

  const handleEnrollClick = (title: string) => {
    console.log(`S'inscrire à: ${title}`)
  }

  return (
    <main className="min-h-[650px] bg-gradient-to-br from-slate-900 via-[#2B5E94] to-slate-800">
      <NavbarTransparent />

      <section data-navbar-hero className="relative min-h-[650px] flex items-center pt-32 px-4 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <Image src="/images/certif.jpg" alt="Background" fill className="object-cover" priority />
        </div>

        <div className="relative z-10 w-full max-w-3xl ">
          <h1 className="text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
            Certifications
            <br />
            <span className="text-[#50A3CC]">Professionnelles</span>
          </h1>

          <p className="text-lg text-white/80 mb-10 leading-relaxed">
            Valorisez votre expertise avec des certifications reconnues par l&apos;industrie. Formez-vous à votre rythme
            et obtenez des accréditations vérifiables qui font la différence dans votre carrière.
          </p>

          <div className="mb-8 max-w-[800px]  ">
            <div className="relative">
              <input
                type="search"
                placeholder="Rechercher un module..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[70px] px-4 py-3 pl-8 pr-12 rounded-full bg-white/20 text-white placeholder-blue-100 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <Search className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 text-white/60 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-nowrap mb-10 gap-4 lg:gap-6 overflow-x-auto lg:overflow-visible">
            <div className="flex-shrink-0 w-[200px] lg:w-[230px] p-6 lg:p-8 rounded-2xl border-2 border-white/30 bg-white/5 backdrop-blur-sm hover:border-white/50 transition-all hover:bg-white/10">
              <div className="text-3xl lg:text-4xl font-bold text-center text-white mb-2">24+</div>
              <div className="text-white/70 text-xs text-center font-medium uppercase tracking-widest">Certifications</div>
            </div>
            <div className="flex-shrink-0 w-[200px] lg:w-[230px] p-6 lg:p-8 rounded-2xl border-2 border-white/30 bg-white/5 backdrop-blur-sm hover:border-white/50 transition-all hover:bg-white/10">
              <div className="text-3xl lg:text-4xl text-center font-bold text-white mb-2">4 800+</div>
              <div className="text-white/70 text-xs text-center font-medium uppercase tracking-widest">Certifiés</div>
            </div>
            <div className="flex-shrink-0 w-[200px] lg:w-[230px] p-6 lg:p-8 rounded-2xl border-2 border-white/30 bg-white/5 backdrop-blur-sm hover:border-white/50 transition-all hover:bg-white/10">
              <div className="text-3xl lg:text-4xl text-center font-bold text-white mb-2">96%</div>
              <div className="text-white/70 text-xs text-center font-medium uppercase tracking-widest">Taux de Réussite</div>
            </div>
            <div className="flex-shrink-0 w-[200px] lg:w-[230px] p-6 lg:p-8 rounded-2xl border-2 border-white/30 bg-white/5 backdrop-blur-sm hover:border-white/50 transition-all hover:bg-white/10">
              <div className="text-3xl lg:text-4xl text-center font-bold text-white mb-2">48h</div>
              <div className="text-white/70 text-xs text-center font-medium uppercase tracking-widest">Support Réactif</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-[#1F6CA3]">Nos Certifications</h2>
          <p className="text-xl text-slate-600 mb-16">
            Explorez notre catalogue complet de certifications professionnelles reconnues
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {certifications.map((cert, index) => (
              <CertificationCard
                key={index}
                icon={cert.icon}
                category={cert.category}
                title={cert.title}
                subtitle={cert.subtitle}
                description={cert.description}
                skills={cert.skills}
                duration={cert.duration}
                level={cert.level}
                onDetailsClick={() => handleDetailsClick(cert.title)}
                onEnrollClick={() => handleEnrollClick(cert.title)}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
