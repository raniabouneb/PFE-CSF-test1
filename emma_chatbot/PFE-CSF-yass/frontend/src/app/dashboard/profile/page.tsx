import { getCurrentUser } from "@/lib/auth/current-user"
import ProfilePageClient from "./profile-page-client"

export default async function DashboardProfilePage() {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }
  return <ProfilePageClient initialUser={user} />
}
