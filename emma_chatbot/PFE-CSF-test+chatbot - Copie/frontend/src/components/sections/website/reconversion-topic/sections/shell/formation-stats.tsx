interface StatItem {
  label: string
  value: string
  description?: string
}

interface FormationStatsProps {
  stats: StatItem[]
}

export function FormationStats({ stats }: FormationStatsProps) {
  return (
    <div className="w-full rounded-3xl bg-gradient-to-r from-[#0C2B59] to-[#0A566E] px-8 py-8 md:px-12 md:py-10 lg:px-16">
      <div className="flex items-center justify-between gap-0">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex flex-1 flex-col items-center justify-center px-4"
            style={{
              borderRight: index !== stats.length - 1 ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
            }}
          >
            <p className="mb-2 text-center text-[22px] font-bold text-white whitespace-nowrap">
              {stat.label}
            </p>
            <p className="text-center text-[18px] font-normal whitespace-nowrap text-white/80">
              {stat.value}
            </p>
            {stat.description ? (
              <p className="mt-1 text-center text-[12px] whitespace-nowrap text-white/70">{stat.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
