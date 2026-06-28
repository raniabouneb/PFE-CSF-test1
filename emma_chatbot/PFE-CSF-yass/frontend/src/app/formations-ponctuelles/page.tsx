import { redirect } from "next/navigation"

/** Ancienne liste provisoire : on renvoie vers la page Formation (section ponctuelle ouverte). */
export default function FormationsPonctuellesIndexPage() {
  redirect("/formation?open=ponctuelle")
}
