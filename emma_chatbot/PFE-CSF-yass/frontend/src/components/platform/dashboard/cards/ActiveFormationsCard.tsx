'use client';

import { ArrowRight } from 'lucide-react';

interface Badge {
  label: string;
  className: string;
}

interface Formation {
  id: string;
  title: string;
  badges: Badge[];
  progressLabel: string;
  progress: number;
}

interface ActiveFormationsCardProps {
  formations?: Formation[];
}

const defaultFormations: Formation[] = [
  {
    id: '1',
    title: 'Devenir Data Analyst - Pack Complet',
    badges: [
      { label: 'Reconversion Métier', className: 'bg-[#e1bee7] text-[#4a148c]' },
      { label: 'Module 2/5 en cours', className: 'bg-[#ffeb3b] text-[#5d4e00]' },
    ],
    progressLabel: 'Progression globale',
    progress: 45,
  },
  {
    id: '2',
    title: 'Management Agile & Scrum (Module unique)',
    badges: [
      { label: 'Formation Ponctuelle', className: 'bg-[#ffeb3b] text-[#5d4e00]' },
      { label: 'Prêt pour test', className: 'bg-[#4caf50]/20 text-[#1b5e20]' },
    ],
    progressLabel: 'Progression globale',
    progress: 90,
  },
];

export default function ActiveFormationsCard({ formations = defaultFormations }: ActiveFormationsCardProps) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#1a2a3a]">Mes Formations Actives</h3>
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium text-[#1a3d5d] transition hover:underline"
        >
          Voir tout
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="space-y-8">
        {formations.map((formation) => (
          <div key={formation.id} className="border-b border-[#f3f4f6] pb-8 last:border-0 last:pb-0">
            <div className="mb-3 flex flex-wrap gap-2">
              {formation.badges.map((b) => (
                <span key={b.label} className={`rounded-md px-2 py-0.5 text-xs font-semibold ${b.className}`}>
                  {b.label}
                </span>
              ))}
            </div>
            <h4 className="text-sm font-semibold leading-snug text-[#1a2a3a]">{formation.title}</h4>

            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground">{formation.progressLabel}</span>
                <span className="font-semibold tabular-nums text-[#1a2a3a]">{formation.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
                <div
                  className="h-full rounded-full bg-[#008080]"
                  style={{ width: `${formation.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
