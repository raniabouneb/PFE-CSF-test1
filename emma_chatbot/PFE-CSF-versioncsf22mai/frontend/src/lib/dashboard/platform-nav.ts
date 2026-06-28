/**
 * Navigation secondaire du tableau de bord (onglets sous le bandeau bleu).
 * La barre principale du site utilise `components/layout/website/navbar.tsx`.
 */
export type MainNavId =
  | "accueil"
  | "conseil"
  | "solution"
  | "formation"
  | "certification"
  | "partenaire"

export type SubTabId = "dashboard" | "formations" | "certifications" | "profile"

/** Conservé pour alignement avec l’ancien bundle ; la barre principale est celle du site. */
export const MAIN_NAV_ITEMS: { id: MainNavId; label: string; href: string }[] = [
  { id: "accueil", label: "Accueil", href: "/" },
  { id: "conseil", label: "Conseil", href: "/conseil" },
  { id: "solution", label: "Solution", href: "/solution" },
  { id: "formation", label: "Formation", href: "/formation" },
  { id: "certification", label: "Certification", href: "/certifications" },
  { id: "partenaire", label: "Partenaire", href: "/#partenaires" },
]

export const SUB_TAB_ITEMS: { id: SubTabId; label: string; href: string }[] = [
  { id: "dashboard", label: "Tableau de bord", href: "/dashboard" },
  { id: "formations", label: "Mes Formations", href: "/dashboard/formations" },
  { id: "certifications", label: "Mes Certifications", href: "/dashboard/certifications" },
  { id: "profile", label: "Mon profil", href: "/dashboard/profile" },
]
