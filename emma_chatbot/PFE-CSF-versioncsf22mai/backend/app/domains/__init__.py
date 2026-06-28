"""
Domaines métier (vertical slices).

Chaque sous-dossier regroupe les **routes HTTP** (`router.py`) et la **logique** du même périmètre :

- `home` — accueil (`/api/v1/home/partners-data`)
- `certifications` — page certifications + sync backfill
- `catalog` — catalogue partagé (recherche, cartes thématiques, ponctuelles, hors pack)
- `formation` — hub `/api/v1/formation` (recherche + topic-cards)
- `ponctuelle` — formations à la carte
- `reconversion` — parcours reconversion
- `chat` — assistant / conversations
- `auth` — authentification (monté à la racine dans `main.py`)

`core`, `persistence`, `constants` restent transverses à `app/`.
"""
