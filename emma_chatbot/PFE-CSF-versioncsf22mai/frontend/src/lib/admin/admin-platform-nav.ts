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
  | "equipe"

/** Onglet actif à partir de l’URL (navigation client fluide). */
export function adminSubTabFromPathname(pathname: string): AdminSubTabId {
  if (pathname.startsWith("/admin/apprenants")) return "apprenants"
  if (pathname.startsWith("/admin/catalogue")) return "catalogue"
  if (pathname.startsWith("/admin/planning")) return "planning"
  if (pathname.startsWith("/admin/validation")) return "validation"
  if (pathname.startsWith("/admin/equipe")) return "equipe"
  return "dashboard"
}

export const ADMIN_SUB_TAB_ITEMS: { id: AdminSubTabId; label: string; href: string }[] = [
  { id: "dashboard", label: "Tableau de bord", href: "/admin" },
  { id: "apprenants", label: "Gestion des apprenants", href: "/admin/apprenants" },
  { id: "catalogue", label: "Catalogue de formation", href: "/admin/catalogue" },
  { id: "planning", label: "Planning et séances", href: "/admin/planning" },
  { id: "validation", label: "Centre de Validation & Documents", href: "/admin/validation" },
  { id: "equipe", label: "Équipe", href: "/admin/equipe" },
]
