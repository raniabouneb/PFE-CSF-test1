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
    <div className="bg-gradient-to-r from-[#335FA1] to-[#3584AB] rounded-3xl px-8 md:px-12 lg:px-16 py-8 md:py-10 w-full">
      <div className="flex items-center justify-between gap-0">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center flex-1 px-4"
            style={{
              borderRight: index !== stats.length - 1 ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
            }}
          >
            <p className="text-[18px] font-bold text-white text-center whitespace-nowrap mb-2">
              {stat.label}
            </p>
            <p className="text-[14px] font-normal text-white/80 text-center whitespace-nowrap">
              {stat.value}
            </p>
            {stat.description && (
              <p className="text-[12px] text-white/70 text-center whitespace-nowrap mt-1">
                {stat.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

