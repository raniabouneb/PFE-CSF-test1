"use client"

import DashboardHero from "@/components/platform/dashboard/dashboard-hero"
import MesFormationsIntroCard from "@/components/platform/dashboard/formations/MesFormationsIntroCard"
import FormationCourseCard from "@/components/platform/dashboard/formations/FormationCourseCard"
import PresenceAssiduiteCard from "@/components/platform/dashboard/formations/PresenceAssiduiteCard"
import CertificationsLieesFormationsCard from "@/components/platform/dashboard/formations/CertificationsLieesFormationsCard"

const RECONVERSION_COURSE = {
  groupLabel: 'Reconversion Métier',
  title: 'Devenir Data Analyst — Pack complet',
  subtitle: '8 modules certifiés · module actuel : Analyse prédictive avec Python',
  badges: [
    { label: 'Reconversion métier', variant: 'neutral' as const },
    { label: 'Présence 86%', variant: 'success' as const },
    { label: 'En cours', variant: 'warning' as const },
  ],
  stats: [
    { label: 'Présences', value: '18 séances' },
    { label: 'Absences', value: '3 séances' },
    { label: 'Évaluations', value: '2 tests passés' },
  ],
  progressPercent: 60,
  modules: [
    {
      id: 'm1',
      title: '1. Fondations Data & SQL',
      statusLabel: 'Terminé 100%',
      variant: 'completed' as const,
      imageSrc: '/iot.png',
    },
    {
      id: 'm2',
      title: '2. Python & analyse exploratoire',
      statusLabel: 'En cours',
      variant: 'in_progress' as const,
      progress: 62,
      imageSrc: '/iot.png',
    },
    {
      id: 'm3',
      title: '3. Machine Learning appliqué',
      statusLabel: 'En cours',
      variant: 'in_progress' as const,
      progress: 12,
      imageSrc: '/iot.png',
    },
  ],
};

/** Formation ponctuelle = un seul module : uniquement la barre stats (pas de grille de modules). */
const PONCTUELLE_COURSE = {
  groupLabel: 'Formation ponctuelle',
  title: 'Langage C pour les systèmes embarqués',
  subtitle: 'Parcours condensé sur une session',
  badges: [
    { label: 'Formation ponctuelle', variant: 'success' as const },
    { label: 'Présence 100%', variant: 'success' as const },
    { label: 'En cours', variant: 'warning' as const },
  ],
  stats: [
    { label: 'Présences', value: '1 séance' },
    { label: 'Absences', value: '0 séance' },
    { label: 'Évaluations', value: '2 tests passés' },
  ],
  progressPercent: 40,
  modules: [],
};

export default function FormationsPage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <DashboardHero activeSubTab="formations" />

      <main className="relative mx-auto max-w-[1485px] px-4 pb-16 pt-2 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-4">
          <div className="lg:col-span-8">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md md:p-8">
              <MesFormationsIntroCard />
              <div className="space-y-10">
                <FormationCourseCard {...RECONVERSION_COURSE} />
                <FormationCourseCard {...PONCTUELLE_COURSE} />
              </div>
            </div>
          </div>

          <aside className=" space-y-6 lg:col-span-4">
            <PresenceAssiduiteCard />
            <CertificationsLieesFormationsCard />
          </aside>
        </div>
      </main>
    </div>
  );
}
