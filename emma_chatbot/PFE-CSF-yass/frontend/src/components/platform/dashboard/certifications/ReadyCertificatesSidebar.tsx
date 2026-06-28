import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import PrintCertificateButton from '@/components/platform/dashboard/buttons/PrintCertificateButton';
import ViewCertificateButton from '@/components/platform/dashboard/buttons/ViewCertificateButton';
import { READY_CERTIFICATES } from '@/lib/dashboard/certifications-page-data';

export default function ReadyCertificatesSidebar() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 md:p-7">
      <div className="mb-5 flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold leading-snug text-[#1a2a3a] md:text-[15px]">
          Certificats prêts à visualiser et imprimer
        </h3>
        <Link href="#" className="shrink-0 text-xs font-semibold text-[#0f766e] hover:underline">
          Tout afficher
        </Link>
      </div>

      <ul className="flex flex-1 flex-col gap-4">
        {READY_CERTIFICATES.map((item) => (
          <li
            key={item.id}
            className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 shadow-sm"
          >
            <div className="relative h-[150px] w-[200px] shrink-0 rounded-xl sm:h-[100px] sm:w-[180px]">
              <Image
                src="/images/certif.jpg"
                alt={`Certificat ${item.title}`}
                fill
                className="object-cover object-center"
                sizes="190px"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-[#1a2a3a]">{item.title}</h4>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200/80">
                    <Check size={11} strokeWidth={3} className="text-emerald-600" aria-hidden />
                    Prêt
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <ViewCertificateButton />
                <PrintCertificateButton />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
