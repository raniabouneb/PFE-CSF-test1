/** Badges formations — palette CSF (bleu marine, teal, sage #5ab396). */

export type FormationBadgeVariant =
  | 'neutral'
  | 'ponctual'
  | 'success'
  | 'warning'
  | 'progress';

export const FORMATION_BADGE_STYLES: Record<FormationBadgeVariant, string> = {
  /** Parcours / reconversion */
  neutral:
    'bg-[#0D3570]/12 text-[#0B264F] ring-1 ring-[#0D3570]/20',
  /** Formation ponctuelle (type d’offre) */
  ponctual:
    'bg-[#0A566E]/14 text-[#053d54] ring-1 ring-[#0A566E]/35',
  /** Progression élevée */
  success:
    'bg-[#5ab396]/30 text-[#053d54] ring-1 ring-[#5ab396]/40',
  /** Module en cours */
  warning:
    'bg-[#115C73]/18 text-[#0A566E] ring-1 ring-[#115C73]/28',
  /** Progression < 50 % */
  progress:
    'bg-[#1F6CA3]/15 text-[#0D3570] ring-1 ring-[#1F6CA3]/25',
};

/** Remappe les anciennes classes API (violet / jaune / vert Material) vers la charte. */
export function resolveFormationBadgeClassName(
  label: string,
  apiClassName?: string,
): string {
  const lower = label.toLowerCase();
  const legacy = apiClassName ?? '';

  if (lower.includes('ponctuel')) {
    return FORMATION_BADGE_STYLES.ponctual;
  }

  if (lower.includes('progression') || (/\d+\s*%/.test(label) && lower.includes('%'))) {
    const match = label.match(/(\d+)/);
    const pct = match ? Number.parseInt(match[1], 10) : 0;
    return pct >= 50 ? FORMATION_BADGE_STYLES.success : FORMATION_BADGE_STYLES.progress;
  }

  if (
    legacy.includes('4caf50') ||
    legacy.includes('1b5e20') ||
    lower.includes('prêt') ||
    lower.includes('pret')
  ) {
    return FORMATION_BADGE_STYLES.success;
  }

  if (
    legacy.includes('ffeb3b') ||
    legacy.includes('5d4e00') ||
    lower.includes('cours') ||
    lower.includes('module')
  ) {
    return FORMATION_BADGE_STYLES.warning;
  }

  if (legacy.includes('e1bee7') || legacy.includes('4a148c')) {
    return FORMATION_BADGE_STYLES.neutral;
  }

  return FORMATION_BADGE_STYLES.neutral;
}
