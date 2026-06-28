# Remettre les dashboards à zéro

## Ce que vous voulez

Effacer **toutes** les données de parcours (séances, présences, groupes…) pour que **chaque apprenant** voit un dashboard vide, puis tester **manuellement** depuis l’admin.

**Aucun scénario automatique** — seulement la suppression.

## Marche à suivre (2 minutes)

1. Ouvrir **Supabase** → **SQL Editor**
2. Ouvrir le fichier `RESET_TOUT_A_ZERO.sql` dans ce dossier
3. **Copier tout** → coller → **Run**
4. Vérifier que le tableau en bas affiche **0** pour chaque ligne
5. Dans le navigateur : **Ctrl+F5** sur http://localhost:3000/dashboard

## Résultat attendu

| Écran | Après reset |
|--------|-------------|
| Formations inscrites | 0 |
| Engagement | 0 %, 0 H / 0 H |
| Certifications | 0/0 |
| Mes formations | vide |
| Calendrier séances | vide |

Les **comptes de connexion** (`users`) restent : vous pouvez toujours vous connecter.

## Recréer des données

Uniquement via l’**interface admin** (groupes, séances, présences), comme en production.

## Fichiers optionnels (ne pas utiliser pour un reset simple)

- `02_seed_dashboard_client_demo.sql` — scénario prérempli pour démo client (à ignorer si vous testez à la main)
- `scripts/run_dashboard_demo.py` — automatisation (reset + seed)

## Dépannage

- Toujours des chiffres après reset → vider le cache (Ctrl+F5) ou se déconnecter/reconnecter
- Erreur SQL « relation does not exist » → une table manque dans votre base ; indiquez le nom de la table
