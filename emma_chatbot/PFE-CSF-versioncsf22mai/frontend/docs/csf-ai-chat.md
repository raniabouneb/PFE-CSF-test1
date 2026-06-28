# Widget Chat CSF + service IA

## Comportement

- **Replié** : bulle fixe en bas à gauche (« Chat CSF »).
- **Ouvert** : panneau depuis la gauche (~40–50 % largeur sur desktop), feuille en bas sur mobile ; fermeture par bouton, clic sur le fond ou **Échap**.
- **Session** : `session_id` stocké dans `sessionStorage` pour la continuité de conversation.
- Aucune clé API dans le navigateur si vous utilisez le proxy ci-dessous.

## Variables d’environnement (frontend)

Fichier `.env.local` à la racine du frontend :

| Variable | Rôle |
|----------|------|
| `CSF_AI_SERVICE_URL` | URL du service FastAPI `ai-service` (ex. `http://127.0.0.1:8001`). Utilisée **uniquement** par la route API `POST /api/csf-chat` (serveur Next). |
| `NEXT_PUBLIC_CSF_AI_URL` | Optionnel. Si défini, le widget appelle directement `{URL}/chat` (le service Python doit autoriser CORS). Sinon, appel à `/api/csf-chat`. |

## Démarrage local

1. Terminal 1 — service IA :

   ```bash
   cd ai-service
   pip install -r requirements.txt
   python main.py
   ```

2. Terminal 2 — Next :

   ```bash
   cd frontend
   # .env.local doit contenir CSF_AI_SERVICE_URL=http://127.0.0.1:8001
   npm run dev
   ```

3. Ouvrir le site : le widget est global (voir `AppProviders`).
