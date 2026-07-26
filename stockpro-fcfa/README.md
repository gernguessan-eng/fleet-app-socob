# StockPro — Gestion de stock (FCFA)

Application de gestion de stock : articles, catégories, fournisseurs, entrées,
sorties, inventaires physiques et tableaux de bord analytiques. Les montants
sont exprimés en **Franc CFA (FCFA)**.

## Fonctionnalités principales

- **Articles** : fiches articles (code, référence, désignation, catégorie,
  stock min/max, prix d'achat/vente en FCFA...), avec création, modification
  et suppression manuelles.
- **Entrées de stock** : saisie manuelle des réceptions (fournisseur, n° de
  bon de livraison, prix unitaire, quantité...).
- **Sorties de stock** : saisie manuelle des sorties (motif, destination,
  quantité...), avec alerte si le stock disponible est dépassé.
- **Fournisseurs & catégories** : gestion manuelle complète (CRUD).
- **Inventaires physiques** : création de campagnes d'inventaire, **saisie
  manuelle du stock compté directement dans l'application** (avec calcul
  automatique de l'écart), impression de la fiche, puis **validation** qui
  applique les écarts au stock réel et journalise chaque ajustement comme un
  mouvement traçable (type "Inventaire").
- **Tableau de bord & analyses** : KPI, graphiques de tendances, valorisation
  du stock, top articles/fournisseurs, alertes de stock bas.
- **Comptes utilisateurs** : chaque personne se connecte avec sa propre
  adresse e-mail et son propre mot de passe. Le tout premier compte créé
  devient automatiquement administrateur ; ensuite, seul un administrateur
  peut créer de nouveaux comptes (page "Utilisateurs", accessible via
  l'icône 👤 à côté du bouton de déconnexion) — l'inscription publique se
  ferme automatiquement après le premier compte, pour empêcher n'importe
  qui possédant le lien de créer son propre accès.
- **Suivi RISE Presence** : chaque connexion/déconnexion est signalée au
  tableau de bord partagé "RISE Presence" utilisé par le reste de la suite
  d'applications (FleetGest, AtelierGest...), avec `application: "StockPro"`.
  Ce projet Firebase est commun à toute la suite et sa configuration est
  donc fixe dans le code (`src/lib/riseFirebase.ts`), pas une variable
  d'environnement par client. Le signalement échoue silencieusement (sans
  bloquer la connexion) si Firebase est injoignable.

## Stack technique

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [PostgreSQL](https://www.postgresql.org/) via [Drizzle ORM](https://orm.drizzle.team/)
- Tailwind CSS 4
- Recharts (graphiques)

## 1. Installation en local

### Prérequis

- Node.js **20.9+**
- Une base PostgreSQL accessible (locale via Docker, ou distante type
  [Neon](https://neon.tech) — offre gratuite adaptée à ce projet)

### Étapes

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# puis renseignez DATABASE_URL et AUTH_SECRET dans .env.local

# 3. Créer les tables dans la base (à partir du schéma Drizzle)
npm run db:push

# 4. Lancer le serveur de développement
npm run dev
```

L'application est alors disponible sur http://localhost:3000. Au premier
lancement, un bouton "Initialiser la base de données" permet de charger des
données de démonstration (facultatif — vous pouvez aussi saisir vos propres
données directement).

## 2. Déploiement sur Vercel via GitHub

### Étape 1 — Pousser le projet sur GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<votre-compte>/<votre-repo>.git
git push -u origin main
```

### Étape 2 — Créer une base PostgreSQL de production

Vercel n'héberge pas de base de données par défaut : il faut une base
PostgreSQL accessible depuis Internet. Options recommandées (offres
gratuites disponibles) :

- [Neon](https://neon.tech) (recommandé, conçu pour le serverless)
- [Supabase](https://supabase.com)
- [Vercel Postgres / Neon via Marketplace Vercel](https://vercel.com/marketplace)

Récupérez l'**URL de connexion "pooled"** (souvent avec `?sslmode=require`
dans l'URL) — c'est celle-ci qu'il faut utiliser pour un déploiement
serverless comme Vercel.

### Étape 3 — Importer le projet sur Vercel

1. Sur [vercel.com](https://vercel.com), cliquez sur **Add New → Project**.
2. Importez le dépôt GitHub que vous venez de créer.
3. Vercel détecte automatiquement Next.js (aucune configuration de build à
   changer).
4. Dans **Environment Variables**, ajoutez :
   - `DATABASE_URL` = l'URL de connexion récupérée à l'étape 2
   - `AUTH_SECRET` = une longue chaîne aléatoire (générez-en une différente
     pour chaque client, par exemple avec un générateur de mot de passe en
     ligne réglé sur 40+ caractères) — elle sert uniquement en coulisse pour
     sécuriser les connexions, personne n'a besoin de la retenir
5. Cliquez sur **Deploy**.
6. Une fois le site en ligne, ouvrez-le : le tout premier écran vous invite
   à créer le compte administrateur (adresse e-mail + mot de passe).

> ⚠️ **Usage commercial** : l'offre gratuite "Hobby" de Vercel est réservée à
> un usage personnel/non commercial selon ses conditions d'utilisation.
> Héberger l'activité d'entreprises clientes correspond à un usage
> commercial — il est donc recommandé de passer à l'offre **Vercel Pro**
> (facturée à l'équipe, pas par site) si vous déployez ce projet pour de
> vrais clients.

### Étape 4 — Créer les tables sur la base de production

Depuis votre machine locale, en pointant temporairement vers la base de
production :

```bash
DATABASE_URL="<url-de-production>" npm run db:push
```

(Vous pouvez aussi mettre cette URL dans un fichier `.env.local` temporaire
puis lancer `npm run db:push`.)

### Étape 5 — Déploiements suivants

Chaque `git push` sur la branche `main` déclenche automatiquement un nouveau
déploiement sur Vercel. Si vous modifiez le schéma de données
(`src/db/schema.ts`), pensez à relancer `npm run db:push` contre la base de
production après le déploiement.

## 3. Ajouter un nouveau client (site séparé)

Ce projet est conçu pour qu'un client = un site + une base de données
séparés (isolation complète des données entre clients). Pour ajouter un
nouveau client, répétez cette recette :

1. **GitHub** : allez sur [github.com/new/import](https://github.com/new/import),
   collez l'URL de votre dépôt existant (ex :
   `https://github.com/<votre-compte>/<votre-repo>`), donnez un nouveau nom
   (ex : `gestion-stock-client2`), puis validez. GitHub crée une copie
   indépendante du projet, sans avoir besoin d'installer quoi que ce soit.
2. **Neon** : créez un nouveau projet (bouton "New Project"), donnez-lui le
   nom du client, puis exécutez le script SQL de création des tables dans
   son "SQL Editor" (le même script que pour le premier client — voir
   `drizzle/0000_lowly_elektra.sql` si présent, ou redemandez-le).
3. **Vercel** : importez le nouveau dépôt GitHub, ajoutez les variables
   `DATABASE_URL` (celle du nouveau projet Neon) et `AUTH_SECRET` (une
   nouvelle chaîne aléatoire différente pour ce client), puis déployez.
4. À la première ouverture du nouveau site, créez le compte administrateur
   de ce client (adresse e-mail + mot de passe), puis créez ses éventuels
   comptes employés depuis la page "Utilisateurs" de l'application.

Chaque client obtient ainsi sa propre adresse, sa propre base de données et
ses propres comptes, sans aucun risque de mélange de données entre clients.

## Scripts disponibles

| Commande            | Description                                   |
| -------------------- | ---------------------------------------------- |
| `npm run dev`         | Lance le serveur de développement              |
| `npm run build`       | Build de production                            |
| `npm run start`       | Démarre le build de production en local        |
| `npm run lint`        | Vérifie le code avec ESLint                    |
| `npm run typecheck`   | Vérifie les types TypeScript                   |
| `npm run db:push`     | Synchronise le schéma Drizzle avec la base      |
| `npm run db:studio`   | Ouvre Drizzle Studio (explorateur de données)   |

## Structure du projet

```
src/
├── app/                # Pages (App Router) et routes API
│   ├── api/             # Endpoints REST (articles, mouvements, inventaires...)
│   ├── articles/        # Page Articles
│   ├── entrees/         # Page Entrées de stock
│   ├── sorties/         # Page Sorties de stock
│   ├── inventaire/      # Page Inventaires (saisie manuelle du comptage)
│   ├── mouvements/      # Historique des mouvements
│   └── analyses/        # Tableaux de bord analytiques
├── components/          # Composants React (formulaires, tableaux, graphiques)
├── db/                  # Schéma Drizzle + connexion PostgreSQL
└── lib/                 # Fonctions utilitaires (formatage dates/devises FCFA)
```
