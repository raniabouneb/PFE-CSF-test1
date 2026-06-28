interface MetricBoxProps {
  label: string;
  value: string;
  hint: string;
}

function MetricBox({ label, value, hint }: MetricBoxProps) {
  return (
    <div className="flex h-full min-h-[140px] flex-col rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-inner">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-[#1a2a3a]">{value}</p>
      <p className="mt-auto pt-2 text-xs leading-snug text-muted-foreground">{hint}</p>
    </div>
  );
}

const DONUT_SIZE = 100;
const DONUT_STROKE = 10;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function SuccessRateDonutBox({
  label,
  percent,
  hint,
}: {
  label: string;
  percent: number;
  hint: string;
}) {
  const dashOffset = DONUT_CIRCUMFERENCE - (percent / 100) * DONUT_CIRCUMFERENCE;

  return (
    <div className="flex h-full min-h-[140px] flex-col rounded-xl border border-gray-100 bg-gray-50 p-4 ">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-1 flex-col items-center justify-center gap-2">
        <div className="relative flex h-[100px] w-[100px] shrink-0 items-center justify-center">
          <svg
            width={DONUT_SIZE}
            height={DONUT_SIZE}
            viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
            className="-rotate-90"
            aria-hidden
          >
            <circle
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={DONUT_RADIUS}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={DONUT_STROKE}
            />
            <circle
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={DONUT_RADIUS}
              fill="none"
              stroke="#0d9488"
              strokeWidth={DONUT_STROKE}
              strokeLinecap="round"
              strokeDasharray={DONUT_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-500"
            />
          </svg>
          <span className="pointer-events-none absolute text-xl font-bold tabular-nums text-[#1a2a3a]">
            {percent}%
          </span>
        </div>
      </div>
      <p className="mt-auto text-center text-xs leading-snug text-muted-foreground">{hint}</p>
    </div>
  );
}

export default function CertificationsSummaryCard() {
  return (
    <div className="rounded-xl  bg-white p-6  md:p-8">
      <h2 className="text-lg font-bold text-[#1a2a3a] md:text-xl">Certifications, impressions et passages</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Synthèse de vos attestations, documents prêts à imprimer et parcours en attente.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <MetricBox label="Prêtes à imprimer" value="3" hint="PDF disponibles" />
        <MetricBox label="Débloquées" value="5" hint="Passage autorisé" />
        <SuccessRateDonutBox label="Réussite globale" percent={72} hint="8 réussites sur 11 tests" />
        <MetricBox label="Bloquées" value="4" hint="Finir le module lié" />
      </div>
    </div>
  );
}
