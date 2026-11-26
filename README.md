# A DJAL

Plateforme de mise en relation entre **agriculteurs** et **acheteurs** : les agriculteurs publient leurs produits, les acheteurs les trouvent, passent commande, paient et échangent avec le vendeur. Un back-office permet aux administrateurs de modérer la plateforme.

Projet réalisé dans le cadre d'un mémoire de Master 2.

## Fonctionnalités

**Acheteurs et agriculteurs (application mobile)**
- Inscription, connexion, déconnexion et réinitialisation du mot de passe par e-mail
- Profil, centres d'intérêt et préférences de notification
- Catalogue de produits par catégorie, avec photos et localisation du vendeur
- Publication et gestion de ses produits (agriculteurs)
- Commandes, suivi de l'historique des statuts et paiements
- Messagerie en temps réel entre acheteur et vendeur (WebSocket)
- Avis et notes sur les produits
- Prix du marché par produit et par ville, avec alertes
- Recommandations de produits selon les interactions de l'utilisateur
- Notifications et signalement d'un agriculteur

**Administrateurs (back-office web)**
- Tableau de bord
- Gestion des utilisateurs (rôle, statut du compte)
- Gestion des catégories et modération des produits
- Suivi des commandes et des paiements
- Traitement des signalements

## Technologies

| Partie | Technologies |
|---|---|
| Backend | Java 17, Spring Boot 3.4 (Web, Security, Data JPA, Validation, WebSocket, Mail), Flyway, MySQL / MariaDB, Springdoc OpenAPI |
| Back-office | React 19, Vite, TypeScript, Tailwind CSS, TanStack Query |
| Mobile | React Native, Expo, Expo Router, TypeScript, TanStack Query |
| Contrat API | OpenAPI, client généré avec Orval |

## Structure du projet

```text
ADJAL/
├── backend/                  API Spring Boot
│   ├── src/main/java/cm/adjal/api/
│   │   ├── controller/       points d'entrée REST
│   │   ├── service/          logique métier
│   │   ├── repository/       accès aux données
│   │   ├── entity/           entités
│   │   ├── dto/              objets de requête et de réponse
│   │   ├── security/         authentification par jeton
│   │   └── config/           sécurité, WebSocket, administrateur initial
│   └── src/main/resources/db/migration/   scripts Flyway (V1 à V4)
├── frontend/                 workspace pnpm
│   ├── admin/                back-office React
│   ├── mobile/               application Expo
│   └── api-contract/         contrat OpenAPI et client généré
└── prototype/                premier prototype mobile (juillet-août 2026), conservé pour l'historique
```

Le dossier `prototype/` contient la première maquette fonctionnelle de l'application (Expo, `artifacts/a-dial`), réalisée avant la version finale. Il n'est pas nécessaire pour lancer le projet.

## Prérequis

À installer une seule fois :

- **XAMPP** (pour MySQL) : https://www.apachefriends.org
- **JDK 17** ou plus récent
- **IntelliJ IDEA** (recommandé pour lancer le backend) ou **Maven**
- **Node.js 20** ou plus récent : https://nodejs.org
- **pnpm** : `npm install -g pnpm`
- **Expo Go** sur le téléphone (Play Store / App Store), ou un émulateur Android

## Lancer l'application

Il faut lancer les éléments **dans cet ordre** : la base de données, le backend, puis le back-office et/ou l'application mobile. Le backend, le back-office et l'application mobile tournent chacun dans **leur propre terminal**, qu'il faut laisser ouvert.

### 1. Démarrer la base de données (XAMPP)

1. Ouvrez le **XAMPP Control Panel** et cliquez sur **Start** à côté de **MySQL** (port `3306`).
2. **La première fois seulement** : démarrez aussi **Apache**, ouvrez http://localhost/phpmyadmin et créez une base vide nommée **`adjal_vf`**.

Les tables sont créées automatiquement par Flyway au premier démarrage du backend : il n'y a aucun script SQL à importer.

### 2. Lancer le backend (terminal 1)

Le backend utilise par défaut la configuration standard de XAMPP : `localhost:3306`, base `adjal_vf`, utilisateur `root`, **sans mot de passe**. Avec XAMPP, il n'y a donc rien à configurer.

**Avec IntelliJ IDEA (recommandé)** : *File ▸ Open*, choisissez le dossier `backend`, attendez que Maven charge les dépendances, puis lancez la classe `AdjalApiApplication` (bouton ▶).

**Avec Maven en ligne de commande** :

```bash
cd backend
mvn spring-boot:run
```

Le backend est prêt quand la console affiche `Started AdjalApiApplication`. L'API répond alors sur http://localhost:8099/api, et la documentation interactive est sur http://localhost:8099/swagger-ui.html.

Au premier démarrage, un **compte administrateur** est créé automatiquement avec l'e-mail `admin@adjal.cm`. Son mot de passe est la valeur par défaut de `adjal.initial-admin.password` dans `src/main/resources/application.properties` : changez-la avant toute mise en ligne.

> **Configuration différente de XAMPP ?** Spring Boot ne lit pas le fichier `.env` automatiquement. Définissez les variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `INITIAL_ADMIN_PASSWORD`…, voir `backend/.env.example`) comme variables d'environnement, par exemple dans IntelliJ : *Run ▸ Edit Configurations ▸ Environment variables*.

> **Envoi d'e-mails (facultatif)** : pour la réinitialisation du mot de passe, copiez `backend/smtp.properties.example` en `backend/smtp.properties` et remplissez vos identifiants SMTP. Sans ce fichier, le reste de l'application fonctionne.

### 3. Installer les dépendances du frontend (une seule fois)

```bash
cd frontend
pnpm install
```

### 4. Lancer le back-office administrateur (terminal 2)

```bash
cd frontend
pnpm dev:admin
```

Ouvrez http://localhost:5173 et connectez-vous avec le compte administrateur. Le back-office envoie ses appels `/api` au backend sur le port `8099` : le backend doit être lancé.

### 5. Lancer l'application mobile avec Expo (terminal 3)

**Sur un émulateur Android, sur le même ordinateur :**

```bash
cd frontend
pnpm dev:mobile
```

Puis appuyez sur `a` dans le terminal pour ouvrir l'application dans l'émulateur.

**Sur un vrai téléphone** (le téléphone et l'ordinateur doivent être sur le **même réseau Wi-Fi**) :

```bash
cd frontend
pnpm --filter @adjal/mobile run setup:env   # écrit l'adresse IP du PC dans frontend/mobile/.env
pnpm dev:mobile:lan
```

Scannez ensuite le QR code affiché avec **Expo Go** (Android) ou l'appareil photo (iPhone). Si l'adresse IP de l'ordinateur change (autre réseau Wi-Fi), relancez `setup:env`.

### En résumé

| Étape | Où | Commande / action |
|---|---|---|
| Base de données | XAMPP | **Start** sur MySQL |
| Backend | terminal 1, dossier `backend` | lancer `AdjalApiApplication` (IntelliJ) ou `mvn spring-boot:run` |
| Back-office | terminal 2, dossier `frontend` | `pnpm dev:admin` → http://localhost:5173 |
| Mobile | terminal 3, dossier `frontend` | `pnpm dev:mobile` (émulateur) ou `pnpm dev:mobile:lan` (téléphone) |

## Fichiers à ne pas publier

Les fichiers suivants contiennent des secrets ou sont générés, et sont exclus du dépôt par les `.gitignore` :

- `backend/.env`, `backend/smtp.properties`, `frontend/mobile/.env`
- `backend/target/` (compilation) et `backend/uploads/` (images envoyées)
- `node_modules/`, `dist/`, `.expo/`

## Auteurs

- [Franck237-coding](https://github.com/Franck237-coding)
- [RositaE6mi](https://github.com/RositaE6mi)
