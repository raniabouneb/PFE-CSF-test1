# PFE CSF — Frontend (Next.js) + Backend (FastAPI)

## Structure

- **`frontend/`** — application Next.js (UI, proxy `/api/auth/*` → FastAPI, dashboard, etc.).
- **`backend/`** — API FastAPI (auth, formations, certifications, etc.).

La base PostgreSQL est **partagée** (même `DATABASE_URL` / Supabase côté frontend et backend selon config).

## Prérequis

- Node.js (npm)
- Python 3.11+ avec `pip`
- PostgreSQL accessible (ou Supabase)

## Configuration

1. **Frontend** — copier `frontend/.env.example` vers `frontend/.env` et remplir `DATABASE_URL`, `AUTH_SECRET`, `BACKEND_URL`, etc.
2. **Backend** — copier `backend/.env.example` vers `backend/.env` avec les **mêmes** secrets compatibles JWT / OAuth si utilisé.

## Lancer en local (exemple)

**API (port 8010 dans ce dépôt — voir `backend/run_dev.ps1`)**

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8010
```

**Next.js**

```powershell
cd frontend
npm install
npm run dev
```

Aligner `BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL` dans `frontend/.env` sur le même port que l’API.

## Branche Git

Le travail actuel est sur la branche **`aziz`**. Remote : `https://github.com/AzizBenY/PFE-CSF`

```powershell
git fetch origin
git push -u origin aziz
```

Si l’historique local et GitHub ont divergé, synchroniser en explicitant la stratégie (merge, rebase ou `push --force-with-lease` après accord d’équipe).
