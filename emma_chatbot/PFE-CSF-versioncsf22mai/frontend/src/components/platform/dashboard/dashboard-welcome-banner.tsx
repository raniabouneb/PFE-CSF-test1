import Image from 'next/image';

export interface DashboardWelcomeBannerProps {
  name?: string | null;
}

export default function DashboardWelcomeBanner({ name }: DashboardWelcomeBannerProps) {
  const displayName = name?.trim() || 'Apprenant';

  return (
    <section className="relative h-[180px] overflow-hidden rounded-[20px] bg-gradient-to-r from-[#053d54] via-[#052841] to-[#040f40]">
      <Image
        src="/images/welcome.png"
        alt=""
        fill
        priority
        className="object-cover object-center opacity-30"
        sizes="(max-width: 1485px) 100vw, 1485px"
      />

      <div
        className="absolute inset-0 bg-gradient-to-r from-[#053d54]/50 via-[#052841]/45 to-[#040f40]/85"
        aria-hidden
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 90% 20%, rgba(90,179,150,0.12) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-6 pt-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#5ab396]">
          Espace Apprenant
        </p>
        <h1
          className="text-[1.5rem] font-bold text-white"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Bienvenue, {displayName} 
        </h1>
        <p className="mt-1 text-sm text-white/70">
          Suivez votre progression et vos prochaines séances.
        </p>
      </div>
    </section>
  );
}
