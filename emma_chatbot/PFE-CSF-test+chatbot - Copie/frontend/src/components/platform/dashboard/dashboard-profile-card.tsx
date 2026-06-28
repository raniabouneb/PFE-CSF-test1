'use client'

export interface DashboardProfileCardProps {
  name?: string | null
  email?: string | null
  avatarSrc?: string | null
}

export default function DashboardProfileCard({
  name,
  email,
  avatarSrc = null,
}: DashboardProfileCardProps) {
  const displayName = name?.trim() || 'Apprenant'
  const displayEmail = email?.trim() || ''
  const photo = avatarSrc?.trim() || null

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-[#1a3d5d] to-[#2c5282] ring-4 ring-white/20 shadow-lg">
        {photo ? (
          <img
            src={photo}
            alt={`Photo de ${displayName}`}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
            {initials}
          </span>
        )}
      </div>

      <p className="text-center text-[16px] font-bold text-[#1e3a5f]">{displayName}</p>
      {displayEmail ? (
        <p className="max-w-full truncate -mt-2 text-center text-[14px] text-[#64748b]">
          {displayEmail}
        </p>
      ) : null}
    </div>
  )
}
