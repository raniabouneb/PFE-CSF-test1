import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ModuleHeaderCardProps {
  badges: string[];
  title: string;
  levelLabel: string;
  description: string;
  backHref?: string;
}

export default function ModuleHeaderCard({
  badges,
  title,
  levelLabel,
  description,
  backHref = "/dashboard/formations",
}: ModuleHeaderCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md md:p-8">
      <Link
        href={backHref}
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#0f766e] transition hover:text-[#0d5c56]"
      >
        <ArrowLeft size={18} aria-hidden />
        Retour aux formations
      </Link>

      <div className="flex flex-wrap gap-2">
        {badges.map((b, i) => (
          <span
            key={`${b}-${i}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
              i === 0
                ? 'bg-sky-100 text-sky-900 ring-sky-200/80'
                : 'bg-orange-50 text-orange-900 ring-orange-200/80'
            }`}
          >
            {b}
          </span>
        ))}
      </div>

      <h2 className="mt-4 text-xl font-bold text-[#1a2a3a] md:text-2xl">
        {title}
        <span className="text-lg font-semibold text-muted-foreground"> ({levelLabel})</span>
      </h2>

      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
