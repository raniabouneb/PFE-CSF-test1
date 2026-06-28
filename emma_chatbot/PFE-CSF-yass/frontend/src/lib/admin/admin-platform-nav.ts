/**
 * Navigation secondaire de l’espace admin (onglets sous le bandeau bleu).
 * Même principe visuel que `lib/dashboard/platform-nav.ts` côté apprenant.
 */
export type AdminSubTabId =
  | "dashboard"
  | "apprenants"
  | "catalogue"
  | "planning"
  | "validation"

export const ADMIN_SUB_TAB_ITEMS: { id: AdminSubTabId; label: string; href: string }[] = [
  { id: "dashboard", label: "Tableau de bord", href: "/admin" },
  { id: "apprenants", label: "Gestion des apprenants", href: "/admin/apprenants" },
  { id: "catalogue", label: "Catalogue de formation", href: "/admin/catalogue" },
  { id: "planning", label: "Planning et séances", href: "/admin/planning" },
  { id: "validation", label: "Centre de Validation & Documents", href: "/admin/validation" },
]
