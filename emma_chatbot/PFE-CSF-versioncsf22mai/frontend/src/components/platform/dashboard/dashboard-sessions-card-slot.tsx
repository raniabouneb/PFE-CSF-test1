'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const DashboardSessionsCard = dynamic(
  () => import('./dashboard-sessions-card'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[200px] items-center justify-center border-t border-white/35 pt-6">
        <Loader2 className="h-6 w-6 animate-spin text-[#94a3b8]" aria-hidden />
      </div>
    ),
  },
)

export default function DashboardSessionsCardSlot() {
  return <DashboardSessionsCard />
}
