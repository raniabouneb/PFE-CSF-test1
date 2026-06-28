import AdminShell from "@/components/layout/platform/admin-shell"
import { AdminCatalogueBoard } from "@/components/platform/admin/catalogue/admin-catalogue-board"

export default async function AdminCataloguePage() {
  return (
    <AdminShell activeSubTab="catalogue">
      <AdminCatalogueBoard />
    </AdminShell>
  )
}
