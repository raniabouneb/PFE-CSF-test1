# Page de Gestion des Apprenants

## Vue d'ensemble

La page de Gestion des Apprenants permet aux administrateurs de gérer les groupes d'apprenants, suivre leur progression, gérer les présences et accéder aux profils détaillés.

## Structure de la page

### 1. Hero Section
- Même design que le tableau de bord avec gradient bleu
- Navigation par onglets : Dashboard, Gestion des Apprenants, Formations, Certifications, Rapports
- Barre de recherche pour apprenants et groupes

### 2. Filtres
- **Formation** : Dropdown avec toutes les formations disponibles
- **Date de début** : Sélecteur de date pour filtrer par période
- **Bouton Réinitialiser** : Reset tous les filtres

### 3. Statistiques rapides
- Nombre de groupes actifs
- Total d'apprenants
- Progression moyenne globale
- Nombre de groupes actifs

### 4. Grid des groupes
Chaque carte de groupe affiche :
- **Nom du groupe** et formation associée
- **Statut** : En cours, Terminée, Suspendue
- **Nombre d'apprenants**
- **Date de début**
- **Barre de progression moyenne** avec couleur dynamique
- **Actions** : "Voir profils" et "Gérer le groupe"

## Niveau 2 : Détails du Groupe

### Navigation par onglets
1. **Sessions & Présences** : Liste des sessions passées et à venir
2. **Tableau de Présence** : Grille interactive pour marquer les présences
3. **Actions & Export** : Gestion des comptes et export des données

### Sessions & Présences
- **Sessions Passées** : Affichage avec statut "Terminée" et nombre de présents
- **Sessions À Venir** : Affichage avec statut "Planifiée"

### Tableau de Présence
- Grille avec dates des séances en colonnes
- Noms des apprenants en lignes
- Cases à cocher pour marquer les présences
- Sauvegarde automatique des modifications

### Actions & Export
- **Export Excel/CSV** : Bouton pour extraire les données
- **Actions par apprenant** :
  - Création de compte
  - Gestion des accès (Grant Access)
  - Attribution manuelle de Points Offre

## Profils Détaillés des Apprenants

### Navigation par onglets
1. **Profil** : Informations personnelles et statistiques
2. **CV & Compétences** : Expérience, formation, compétences
3. **Historique** : Chronologie des actions et événements
4. **Notes** : Observations et commentaires des formateurs

### Informations affichées
- **Données personnelles** : Email, téléphone, adresse
- **Statistiques** : Points collectés, taux de présence
- **Progression** : Barre de progression avec module actuel
- **CV complet** : Expérience, formation académique, compétences
- **Historique détaillé** : Évaluations, présences, attribution de points
- **Notes pédagogiques** : Commentaires avec types (Positif, Attention, Info)

## Fonctionnalités techniques

### Filtrage et recherche
- Filtrage en temps réel par formation et date
- Recherche globale dans le hero
- Réinitialisation des filtres

### Interactions
- **Noms cliquables** : Accès direct aux profils détaillés
- **Modals responsives** : Affichage optimal sur tous les écrans
- **Navigation fluide** : Onglets avec état actif visible

### Gestion des données
- **Données mockées** : Structure prête pour l'intégration API
- **État local** : Gestion des présences avec React state
- **Export** : Préparation pour génération Excel/CSV

## Composants créés

### Pages
- `/admin/apprenants/page.tsx` : Page principale
- `/admin/page.tsx` : Dashboard admin
- `/admin/layout.tsx` : Layout avec authentification

### Composants
- `AdminHero` : Hero section avec navigation admin
- `GroupsGrid` : Grille des cartes de groupes
- `GroupFilters` : Composant de filtrage
- `GroupDetailsModal` : Modal de détails du groupe (niveau 2)
- `StudentProfileModal` : Modal de profil détaillé de l'apprenant

### Fonctionnalités
- **Authentification** : Vérification du rôle admin/assistant
- **Responsive design** : Adaptation mobile et desktop
- **Accessibilité** : Labels ARIA et navigation clavier
- **Design cohérent** : Respect du design system existant

## Intégration future

### API
- Endpoints pour récupérer les groupes et apprenants
- Gestion des présences en base de données
- Export des données vers Excel/CSV
- CRUD des notes pédagogiques

### Permissions
- Rôles différenciés (admin vs assistant)
- Permissions granulaires par action
- Audit trail des modifications

### Notifications
- Alertes pour absences répétées
- Notifications de nouveaux commentaires
- Rappels d'évaluations à venir