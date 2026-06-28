'use client';

import Image from 'next/image';
import Link from 'next/link';

export interface FormationModuleCardProps {
  title: string;
  statusLabel: string;
  variant: 'completed' | 'in_progress';
  progress?: number;
  thumbClassName?: string;
  /** Si défini, affiche cette image à la place du dégradé */
  imageSrc?: string;
  /** Si défini, la carte est cliquable et mène au détail du module */
  href?: string;
}

export default function FormationModuleCard({
  title,
  statusLabel,
  variant,
  progress,
  thumbClassName = 'bg-gradient-to-br from-[#0d9488]/30 to-[#1e40af]/40',
  imageSrc,
  href,
}: FormationModuleCardProps) {
  const statusStyles =
    variant === 'completed'
      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
      : 'bg-orange-50 text-orange-800 ring-1 ring-orange-200/80';

  const shellClass =
    'overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-[#1a3d5d]/35 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a3d5d]';

  const thumb = imageSrc ? (
    <div className="relative h-28 w-full bg-gray-100">
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
        <p className="text-sm font-semibold leading-snug text-[#1a2a3a]">{title}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${statusStyles}`}>
            {variant === 'completed'
              ? statusLabel
              : `${statusLabel}${progress != null ? ` ${progress}%` : ''}`}
          </span>
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`block ${shellClass}`}>
        {body}
      </Link>
    );
  }

  return <div className={shellClass}>{body}</div>;
}
