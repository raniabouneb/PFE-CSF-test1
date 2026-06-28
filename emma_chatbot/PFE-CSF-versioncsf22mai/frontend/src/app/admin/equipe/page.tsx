import { redirect } from "next/navigation"
import { TeamManagementBoard } from "@/components/platform/admin/equipe/TeamManagementBoard"
import { getCurrentUser } from "@/lib/auth/current-user"
import { isAssistantOnly } from "@/lib/auth/roles"

export default async function AdminEquipePage() {
  const user = await getCurrentUser()
  if (isAssistantOnly(user?.role)) {
    redirect("/admin")
  }

  return <TeamManagementBoard />
}
