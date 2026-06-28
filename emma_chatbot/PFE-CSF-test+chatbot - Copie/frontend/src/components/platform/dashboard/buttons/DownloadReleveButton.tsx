'use client';

import { cn } from '@/lib/utils';

interface DownloadReleveButtonProps {
  onClick?: () => void;
  variant?: 'default' | 'glass';
}

export default function DownloadReleveButton({
  onClick,
  variant = 'default',
}: DownloadReleveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg py-2.5 text-sm font-medium transition',
        variant === 'glass'
          ? 'border border-white/55 bg-white/35 text-[#0f172a] shadow-sm ring-1 ring-white/55 backdrop-blur-sm hover:bg-white/45'
          : 'border border-gray-300 bg-white text-[#1a2a3a] shadow-sm hover:bg-gray-50',
      )}
    >
      Télécharger le relevé
    </button>
  );
}
