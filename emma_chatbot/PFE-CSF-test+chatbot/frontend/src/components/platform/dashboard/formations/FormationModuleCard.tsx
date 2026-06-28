'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FORMATION_BADGE_STYLES } from '@/components/platform/dashboard/formation-badge-styles';

export interface FormationModuleCardProps {
  title: string;
  statusLabel: string;
  variant: 'completed' | 'in_progress';
  progress?: number;
  locked?: boolean;
  thumbClassName?: string;
  imageSrc?: string;
  href?: string;
}

export default function FormationModuleCard({
  title,
  statusLabel,
  variant,
  progress,
  locked = false,
  thumbClassName = 'bg-gradient-to-br from-[#115C73]/35 to-[#0B264F]/50',
  imageSrc,
  href,
}: FormationModuleCardProps) {
  const isClickable = Boolean(href) && !locked;
  const statusStyles = locked
    ? 'bg-white/30 text-[#64748b] ring-1 ring-white/40'
    : variant === 'completed'
      ? FORMATION_BADGE_STYLES.success
      : FORMATION_BADGE_STYLES.warning;
  const accessTagStyles = locked
    ? 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80'
    : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80';

  const shellClass =
    'overflow-hidden rounded-xl border border-white/40 bg-white/25 shadow-[0_4px_20px_rgba(148,163,184,0.12)] backdrop-blur-sm transition hover:border-white/55 hover:bg-white/35 hover:shadow-[0_8px_28px_rgba(148,163,184,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B264F]';

  const thumb = imageSrc ? (
    <div className="relative h-28 w-full bg-white/20">
      <Image
        src={imageSrc}
        alt=""
        fill
        className="object-cover object-center"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
    </div>
  ) : (
    <div className={`relative h-28 w-full ${thumbClassName}`} aria-hidden />
  );

  const body = (
    <>
      {thumb}
      <div className="p-3">
        <p className="text-sm font-semibold leading-snug text-[#0B264F]">{title}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${statusStyles}`}>
            {variant === 'completed'
              ? statusLabel
              : `${statusLabel}${progress != null ? ` ${progress}%` : ''}`}
          </span>
          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${accessTagStyles}`}>
            {locked ? 'Verrouillé' : 'Déverrouillé'}
          </span>
        </div>
      </div>
    </>
  );

  if (isClickable) {
    return (
      <Link href={href!} className={`block ${shellClass}`} aria-label={`Ouvrir le module ${title}`}>
        {body}
      </Link>
    );
  }

  return <div className={shellClass}>{body}</div>;
}
