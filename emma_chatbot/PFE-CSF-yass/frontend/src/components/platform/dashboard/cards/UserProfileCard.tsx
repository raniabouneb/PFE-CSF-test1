'use client';

interface UserProfileCardProps {
  name?: string;
  email?: string;
  points?: number;
  attendance?: number;
}

export default function UserProfileCard({
  name = 'Thomas Martin',
  email = 'thomas.martin@caf-formation.fr',
  points = 90,
  attendance = 76,
}: UserProfileCardProps) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div
          className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#1a3d5d] to-[#2c5282] text-2xl font-bold text-white shadow-inner ring-4 ring-[#1a3d5d]/10"
          aria-hidden
        >
          TM
        </div>
        <h3 className="text-base font-semibold text-[#1a2a3a]">{name}</h3>
        <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">{email}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 divide-x divide-[#e5e7eb] rounded-lg bg-[#f9fafb] py-4 text-center">
        <div>
          <p className="text-xl font-bold tabular-nums text-[#008080]">{points}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Points collectés</p>
        </div>
        <div>
          <p className="text-xl font-bold tabular-nums text-[#1a3d5d]">{attendance}%</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Présence moyenne</p>
        </div>
      </div>
    </div>
  );
}
