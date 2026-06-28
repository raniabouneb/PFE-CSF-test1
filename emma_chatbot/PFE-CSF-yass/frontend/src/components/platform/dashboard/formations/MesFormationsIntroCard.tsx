'use client';

interface MesFormationsIntroCardProps {
  title?: string;
  badgeText?: string;
  description?: string;
}

export default function MesFormationsIntroCard({
  title = 'Mes Formations',
  badgeText = '6 formations inscrites',
  description = 'Retrouvez l’ensemble de vos parcours, suivez votre progression module par module et accédez aux ressources associées.',
}: MesFormationsIntroCardProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-[#1a2a3a]">{title}</h2>
          <span className="rounded-full bg-[#ccfbf1] px-3 py-1 text-xs font-semibold text-[#0f766e] ring-1 ring-teal-200/60">
            {badgeText}
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
