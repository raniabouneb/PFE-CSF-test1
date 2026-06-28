'use client'

import { LEARNER_GLASS_SURFACE_CLASS } from '@/lib/dashboard/learner-glass'
import { cn } from '@/lib/utils'

interface UserProfileCardProps {
  name?: string
  email?: string
  /** Photo de profil (URL ou chemin `/...`). Sinon initiales sur fond dégradé. */
  avatarSrc?: string | null
  avatarAlt?: string
  /** Sous-titre sous le nom (ex. fonction). Si absent, l'e-mail est affiché. */
  roleLabel?: string | null
  variant?: 'default' | 'glass'
}

export default function UserProfileCard({
  name = 'Apprenant CSF',
  email = '',
  avatarSrc = null,
  avatarAlt,
  roleLabel = null,
  variant = 'default',
}: UserProfileCardProps) {
  const glass = variant === 'glass'
  const subtitle = roleLabel?.trim() || email

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'

  const shell = cn(
    'flex flex-col',
    glass
      ? cn('min-h-[220px] p-5 sm:p-6', LEARNER_GLASS_SURFACE_CLASS)
      : 'min-h-[220px] rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm',
  )

  return (
    <div className={shell}>
      <div className="flex flex-col items-center pb-2 pt-1">
        <div className="relative mx-auto h-[clamp(7.5rem,28vw,8.75rem)] w-[clamp(7.5rem,28vw,8.75rem)] overflow-hidden rounded-full bg-gradient-to-br from-[#1a3d5d] to-[#2c5282] ring-4 ring-white/20 shadow-lg">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={avatarAlt ?? `Photo de ${name}`}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[clamp(1.25rem,4vw,1.65rem)] font-bold text-white">
              {initials}
            </span>
          )}
        </div>

        <h4 className="mt-5 text-center text-lg font-bold leading-snug tracking-tight text-[#0f172a]">
          {name}
        </h4>
        <p className="mt-1 max-w-[16rem] text-center text-sm text-[#64748b]">{subtitle}</p>
      </div>
    </div>
  )
}
