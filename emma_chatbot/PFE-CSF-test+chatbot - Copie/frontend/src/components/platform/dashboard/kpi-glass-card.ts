import { cn } from '@/lib/utils';

/** Surface glassmorphism bleue (réf. carte « Financial health »). */
export const KPI_GLASS_CARD_CLASS = cn(
  'flex h-full flex-col rounded-3xl border border-white/35 p-5',
  'bg-gradient-to-b from-[#5A9CB0] to-[#354A85]',
  'shadow-[0_12px_40px_rgba(93,156,236,0.28)]',
  'backdrop-blur-xl backdrop-saturate-150',
);
