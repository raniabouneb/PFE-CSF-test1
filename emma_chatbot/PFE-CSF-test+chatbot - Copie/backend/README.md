# API FastAPI (CSF)

## Lancer

Depuis la racine du repo **`PFE-CSF-test`** (pas `PFE-CSF-test\PFE-CSF-test`) :

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Si tu es déjà dans `...\PFE-CSF-test`, utilise seulement `cd backend` (pas `cd PFE-CSF-test\backend`).

Tester : [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

## Variables `.env`

- **`DATABASE_URL`** : identique au frontend (même projet Supabase / PostgreSQL). Si le backend pointe vers une autre instance que celle où vous avez inséré les données, `GET /api/v1/formation/topic-cards` renverra `null` ou des listes vides alors que Prisma « voit » des lignes.
- **`AUTH_SECRET`** : comme le frontend.
- **`GOOGLE_REDIRECT_URI`** : doit être **identique** à l’URI de callback Next (ex. `http://localhost:3008/api/auth/google/callback`).

### Cartes `/formation` (`formation_topic_card`)

Le module `app/domains/catalog/formation_topic_cards.py` lit `public.formation_topic_card` (et agrège les slugs via `reconversion_topic` / `ponctuelle_formation` si besoin). Ne pas le retirer : c’est le lien titre / image / `href` depuis la BD.

Test local :

```powershell
curl.exe -s http://127.0.0.1:8000/api/v1/formation/topic-cards
```

Réponse attendue : JSON `{"reconversion":[...],"ponctuelle":[...]}` avec `title`, `image`, `href` par carte, ou `null` si aucune ligne exploitable.

## API contenu public (`/api/v1`)

Tout le contenu métier lu par le site passe par ces routes (Next n’utilise plus Prisma pour ces données).

| Méthode | Chemin | Description |
|--------|--------|-------------|
| GET | `/api/v1/home/partners-data` | Collaborations + logos partenaires (accueil) |
| GET | `/api/v1/formation/topic-cards` | Cartes thématiques reconversion / ponctuelle (`null` si vide) |
| GET | `/api/v1/reconversion/topics/{slug}/page-data` | Page détail reconversion (hero, stats, packs, hors pack) |
| GET | `/api/v1/reconversion/topics/{slug}/hors-pack-modules` | Seulement modules hors pack (fallback statique) |
| GET | `/api/v1/ponctuelle/formations` | Liste formations à la carte |
| GET | `/api/v1/ponctuelle/formations/{slug}` | Détail formation ponctuelle |
| GET | `/api/v1/certifications/page` | Hero + cartes certifications |

## Auth

| Méthode | Chemin | Description |
|--------|--------|--------------|
| GET | `/health` | Santé du service |
| POST | `/auth/register` | Inscription |
| POST | `/auth/login` | Connexion |
| GET | `/auth/me` | Profil (header `Authorization: Bearer <jwt>`) |
| POST | `/auth/google/exchange` | Échange code OAuth (appelé par le proxy Next) |
