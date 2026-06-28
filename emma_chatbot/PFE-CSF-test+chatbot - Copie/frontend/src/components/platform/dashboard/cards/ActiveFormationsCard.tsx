'use client';

import { ArrowRight } from 'lucide-react';

import { FORMATIONS_GLASS_CARD_CLASS } from '@/components/platform/dashboard/formations-glass-card';
import {
  FORMATION_BADGE_STYLES,
  resolveFormationBadgeClassName,
} from '@/components/platform/dashboard/formation-badge-styles';

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
  /** Sans carte verre externe (colonne déjà en verre). */
  embedded?: boolean;
}

const defaultFormations: Formation[] = [
  {
    id: '1',
    title: 'Devenir Data Analyst - Pack Complet',
    badges: [
      { label: 'Reconversion Métier', className: FORMATION_BADGE_STYLES.neutral },
      { label: 'Module 2/5 en cours', className: FORMATION_BADGE_STYLES.warning },
    ],
    progressLabel: 'Progression globale',
    progress: 45,
  },
  {
    id: '2',
    title: 'Management Agile & Scrum (Module unique)',
    badges: [
      { label: 'Formation Ponctuelle', className: FORMATION_BADGE_STYLES.ponctual },
      { label: 'Prêt pour test', className: FORMATION_BADGE_STYLES.success },
    ],
    progressLabel: 'Progression globale',
    progress: 90,
  },
];

export default function ActiveFormationsCard({
  formations = defaultFormations,
  embedded = false,
}: ActiveFormationsCardProps) {
  return (
    <div
      className={embedded ? 'border-t border-white/35 pt-6' : FORMATIONS_GLASS_CARD_CLASS}
    >
      <div className="mb-6 flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-semibold uppercase tracking-wider text-[#64748b]">
          Mes formations actives
        </h3>
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium text-[#0B264F] transition hover:underline"
        >
          Voir tout
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="space-y-8">
        {formations.map((formation) => (
          <div key={formation.id} className="border-b border-white/35 pb-8 last:border-0 last:pb-0">
            <div className="mb-3 flex flex-wrap gap-2">
              {formation.badges.map((b) => (
                <span
                  key={b.label}
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold ${resolveFormationBadgeClassName(b.label, b.className)}`}
                >
                  {b.label}
                </span>
              ))}
            </div>
            <h4 className="text-sm font-semibold leading-snug text-[#0B264F]">{formation.title}</h4>

            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-[#64748b]">{formation.progressLabel}</span>
                <span className="font-semibold tabular-nums text-[#0B264F]">{formation.progress}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/90">
                <div
                  className="h-full rounded-full bg-gradient-to-b from-[#115C73] to-[#0B264F] transition-all duration-500"
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
