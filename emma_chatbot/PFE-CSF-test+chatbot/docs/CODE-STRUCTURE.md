# Structure du code CSF

## `app/` — Routes Next.js uniquement

Fichiers courts : import de la **vue** depuis `components/pages/...`.

| Route | Fichier |
|-------|---------|
| `/` | `app/page.tsx` |
| `/formation` | `app/formation/page.tsx` |
| `/formations-ponctuelles` | `app/formations-ponctuelles/page.tsx` |
| `/formation/reconversion/...` | `app/formation/reconversion/*/page.tsx` |

---

## `components/layout/`

Chrome du site (réutilisé sur presque toutes les pages).

- `navbar.tsx`
- `footer.tsx`

---

## `components/shared/`

Blocs **réutilisables** sur plusieurs pages (pas liés à une seule route).

| Dossier / fichier | Rôle |
|-------------------|------|
| `ui/` | Composants shadcn / primitifs (inchangé) |
| `buttons/` | Boutons CTA partagés (devis, détails, etc.) |
| `cards/` | Cartes marketing (bento accueil, témoignages, modules liste…) |
| `sections/` | Sections `Partenaires`, `Témoignages` |
| `carousel/` | Carrousel collaborations |
| `site-hero.tsx` | Hero principal de l’**accueil** |
| `partner-logos-marquee.tsx` | Bandeau logos partenaires |
| `theme-provider.tsx` | Thème (next-themes) |

---

## `components/pages/` — Une entrée par **page** du site

Chaque sous-dossier correspond à une route (ou un groupe de routes). Les fichiers **spécifiques** à cette page restent **dedans** (souvent dans un sous-dossier `landing/` ou à la racine du dossier page).

### `pages/home/`

- `home-page.tsx` — composition accueil
- `pole-conseil-section.tsx`, `pole-solution-section.tsx`, `pole-formation-section.tsx`

### `pages/formation/`

Page **« Pôle Formation : Apprendre, Certifier… »** + formats accordéon.

- `formation-page.tsx`
- `landing/` — uniquement cette page :
  - `landing-hero.tsx`
  - `formats-section.tsx` (état `?open=…`)
  - `parcours-form.tsx`

### `pages/formations-ponctuelles/`

- `formations-ponctuelles-page.tsx`
- `ponctuelles-hero.tsx`

### `pages/reconversion/`

Parcours détaillé **CSF-RCP système embarqué** + placeholders autres tracks.

- `reconversion-embarque-page.tsx`, `reconversion-placeholder-page.tsx`
- `track-hero.tsx`, `track-stats.tsx`
- `reconversion-tabs.tsx`, `mini-packs-section.tsx`, `modules-hors-pack-section.tsx`
- `program-card.tsx`, `register-button.tsx`, `catalog-button.tsx`

> **`ModuleCard`** est dans `shared/cards/` car utilisé à la fois ici et sur les formations ponctuelles.

---

## `lib/`

- `formation-routes.ts` — URLs `?open=…`, liens reconversion / ponctuelles
- `data/` — données statiques (partenaires, témoignages, modules embarqués…)
- `utils.ts`

---

## Nommage (éviter les doublons)

- **`FormationCard`** (`shared/cards/`) = carte **bento accueil** (image pleine hauteur + hover devis).
- **`FormationFormatCard`** (`shared/cards/`) = carte bleue des formats (reconversion / ponctuelle / sur-mesure).
- **`FormationTopicCard`** (`shared/cards/`) = carte **thème** à l’intérieur des formats (image + lien).
- **`SiteHero`** = hero **accueil** ; **`LandingHero`** = hero **page /formation** ; **`PonctuellesHero`** = hero **formations ponctuelles** ; **`TrackHero`** = hero **parcours reconversion embarqué**.

---

## Dossier `_import/`

Archive / import binôme — **hors build** courant ; ne pas mélanger avec le code actif.
