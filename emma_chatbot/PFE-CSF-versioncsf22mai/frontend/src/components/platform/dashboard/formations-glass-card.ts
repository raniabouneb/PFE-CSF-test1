import { cn } from '@/lib/utils';

/** Surface verre lavande (carte formations inscrites / actives). */
export const FORMATIONS_GLASS_CARD_CLASS = cn(
  'rounded-3xl border border-white/40 p-5 md:p-6',
  'bg-white/20 shadow-[0_8px_32px_rgba(148,163,184,0.18)]',
  'backdrop-blur-xl backdrop-saturate-150',
);

/** Colonne dashboard (même fond verre, espacement interne). */
export const DASHBOARD_COLUMN_GLASS_CLASS = cn(
  FORMATIONS_GLASS_CARD_CLASS,
  'flex flex-col gap-6',
);
