# Employee Attendance Tracker

Ce projet est une application web de suivi de présence des employés, permettant la gestion des pointages, des rapports journaliers, des heures supplémentaires, des erreurs et de l'administration des utilisateurs.

## Fonctionnalités principales

- **Authentification** : Connexion et inscription sécurisées via NextAuth.
- **Pointage** : Check-in/check-out quotidien, gestion des retards et des heures supplémentaires.
- **Rapports journaliers** : Saisie et consultation des rapports de travail.
- **Gestion des erreurs** : Système de déclaration et de suivi des erreurs pour employés et administrateurs.
- **Statistiques** : Tableaux de bord pour visualiser la présence, les retards, les absences, les classements et les heures supplémentaires.
- **Gestion des fichiers** : Upload de pièces jointes (Cloudinary), nettoyage et suivi de l’espace de stockage.
- **Administration** : Gestion des employés, export des données, statistiques avancées.

## Structure du projet

- `app/` : Pages Next.js (dashboard, admin, login, register, API routes, etc.)
- `components/` : Composants UI réutilisables (formulaires, tableaux, toasts, etc.)
- `models/` : Modèles Mongoose (Employee, Attendance, Error)
- `lib/` : Fonctions utilitaires (auth, db, cloudinary, uploads)
- `hooks/` : Hooks React personnalisés
- `public/` : Fichiers statiques
- `styles/` : Fichiers CSS globaux et Tailwind

## Installation

1. **Cloner le dépôt**

   ```sh
   git clone <repo-url>
   cd attendance-tracker-main
   ```

2. **Installer les dépendances**

   ```sh
   pnpm install
   ```

3. **Configurer les variables d'environnement**

   Crée un fichier `.env.local` à la racine avec les variables nécessaires :

   ```
   MONGODB_URI=...
   NEXTAUTH_SECRET=...
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

4. **Lancer le projet en développement**

   ```sh
   pnpm dev
   ```

5. **Accéder à l’application**
   - Frontend : [https://attendance-tracker-rouge.vercel.app/admin](http://localhost:3000)

## Scripts utiles

- `pnpm dev` : Démarre le serveur Next.js en mode développement
- `pnpm build` : Build l’application pour la production
- `pnpm start` : Démarre l’application en production

## Technologies utilisées

- Next.js (App Router)
- React
- TypeScript
- MongoDB & Mongoose
- NextAuth.js
- Tailwind CSS
- Cloudinary (stockage fichiers)
- Shadcn/ui (composants UI)

## Organisation du code

- API : Toutes les routes API sont dans `app/api/`
- Modèles de données : [models/Attendance.ts](models/Attendance.ts), [models/Employee.ts](models/Employee.ts), [models/Error.ts](models/Error.ts)
- Authentification : [lib/auth.ts](lib/auth.ts), [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts)
- Upload fichiers : [lib/cloudinary.ts](lib/cloudinary.ts), [app/api/upload/route.ts](app/api/upload/route.ts)
- Statistiques : [app/api/admin/attendance-stats/route.ts](app/api/admin/attendance-stats/route.ts), [components/admin/attendance-stats.tsx](components/admin/attendance-stats.tsx)

## Contribution

Les PRs sont les bienvenues ! Merci de créer une issue avant toute modification majeure.

---

© 2024 Employee Attendance Tracker
