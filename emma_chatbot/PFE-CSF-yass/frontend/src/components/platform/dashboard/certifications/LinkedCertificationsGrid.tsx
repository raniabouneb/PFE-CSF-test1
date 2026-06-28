import Image from 'next/image';
import { Lock } from 'lucide-react';
import type { LinkedCertCard } from '@/lib/dashboard/certifications-page-data';
import {
  LINKED_CERTIFICATIONS,
  LINKED_CERTIFICATIONS_SECTION_INTRO,
} from '@/lib/dashboard/certifications-page-data';

function PassCertButton({ card }: { card: LinkedCertCard }) {
  const isLocked = card.status === 'locked';
  if (isLocked) {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-xl border border-[#1e4a72]/20 bg-[#B7D6E8]/50 py-2.5 text-sm font-semibold text-[#1e4a72]/55"
      >
        Passer la certification
      </button>
    );
  }
  return (
    <button
      type="button"
      className="w-full rounded-xl bg-[#1e4a72] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0D3570]"
    >
      Passer la certification
    </button>
  );
}

function StatusBanner({ card }: { card: LinkedCertCard }) {
  if (card.status === 'unlocked') {
    return (
      <span className="mb-2 inline-flex w-full justify-center rounded-xl bg-[#16A34A] py-2.5 text-sm font-bold text-white shadow-sm">
        Débloquée
      </span>
    );
  }
  if (card.status === 'available') {
    return (
      <span className="mb-2 inline-flex w-full justify-center rounded-xl bg-[#E6F6F2] py-2.5 text-sm font-bold text-[#0f766e] ring-1 ring-[#E6F6F2]">
        Disponible
      </span>
    );
  }
  return (
    <span className="mb-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-100 py-2.5 text-sm font-bold text-orange-900 ring-1 ring-orange-200/80">
      <Lock size={16} aria-hidden />
      À débloquer
    </span>
  );
}

interface LinkedCertificationsGridProps {
  cards?: LinkedCertCard[];
}

export default function LinkedCertificationsGrid({ cards = LINKED_CERTIFICATIONS }: LinkedCertificationsGridProps) {
  return (
    <div>
      <h3 className="text-lg font-bold text-[#1a2a3a] md:text-xl">Certifications liées aux formations</h3>
      <p className="mt-2 max-w-6xl text-sm leading-relaxed text-muted-foreground">
        {LINKED_CERTIFICATIONS_SECTION_INTRO}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.id}
            className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md"
          >
            <div className="relative aspect-[320/200]  mr-3 ml-3 mt-3 w-[300px] overflow-hidden border-b border-gray-100 bg-gray-100">
              <Image
                src="/images/certif.jpg"
                alt={`Aperçu certificat — ${card.title}`}
                fill
                className="object-cover object-center"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              />
            </div>
            <div className="flex flex-1 flex-col p-5 pt-4">
              <span className="mb-2 inline-flex w-fit rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200/80">
                {card.category}
              </span>
              <h4 className="text-base font-bold text-[#1a2a3a]">{card.title}</h4>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
              <div className="mt-4 space-y-2">
                <StatusBanner card={card} />
                <PassCertButton card={card} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
