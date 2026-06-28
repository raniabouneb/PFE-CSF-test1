# Contexte projet pour V0

## Stack
- **Next.js 16** (App Router), **TypeScript**, **Tailwind CSS**
- Icônes : **lucide-react**
- Alias d’import : `@/` → racine du projet

## Style / design
- **Charte CSF** : bleu principal `#335FA1`, vert `#33A182`, bleu foncé titres `#1e3a5f`, gris texte `#5a6a7a`, fonds sections `#f8fafc` ou blanc
- **Sections** : `py-16 px-4 md:px-8 lg:px-16`, contenu `max-w-6xl mx-auto`
- **Titres de section** : `text-3xl md:text-4xl font-bold text-[#1e3a5f]`, centrés
- **Boutons** : souvent pill (`rounded-full`), bleu clair `#e8f4fc` ou bleu `#3b82f6`
- **Cartes** : `rounded-2xl`, `shadow-sm` ou `shadow-lg`, bordures `#e2e8f0`, effet glass (backdrop-blur) sur certaines

## Arborescence
```
app/
  layout.tsx
  page.tsx          ← page d’accueil (Navbar + Hero + sections)
  globals.css
  CONTEXTE-V0.md
components/
  navbar.tsx
  hero.tsx
  pole-conseil-section.tsx   (id="consulting")
  pole-solution-section.tsx  (id="solution")
  pole-formation-section.tsx (id="formation")
  cards/           (conseil-card, ambitions-card, reconversion-card, formation-card, certification-card)
  buttons/         (plus-details-button, demander-devis-button, lancer-projet-button)
public/
  images/
  fonts/
```

## À compléter (placeholders dans page.tsx)
- Section **Partenaires** : `id="partenaires"`
- Section **Témoignage** : `id="temoignage"`
- Section **Contact** : `id="contact"`

Rester cohérent avec ces couleurs, espacements et structure pour que les nouveaux blocs s’intègrent au reste de la page.
