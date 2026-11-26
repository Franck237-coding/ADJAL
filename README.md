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

- JDK 17 ou plus récent
- Maven (ou le Maven intégré à IntelliJ)
- MySQL ou MariaDB (XAMPP convient)
- Node.js 20 ou plus récent et pnpm
- Expo Go sur le téléphone, ou un émulateur Android

## Installation et lancement

### 1. Base de données

Créez une base vide nommée `adjal_vf`. Les tables sont créées automatiquement par Flyway au premier démarrage du backend.

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Renseignez dans `.env` le port et les identifiants de la base, ainsi que le compte administrateur initial (`INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`…).

Pour l'envoi d'e-mails (réinitialisation du mot de passe), copiez `smtp.properties.example` en `smtp.properties` et remplissez vos identifiants SMTP.

```bash
mvn spring-boot:run
```

L'API démarre sur `http://localhost:8099/api`. La documentation interactive est disponible sur `http://localhost:8099/swagger-ui.html`.

### 3. Back-office

```bash
cd frontend
pnpm install
pnpm dev:admin
```

Ouvrez l'adresse affichée par Vite et connectez-vous avec le compte administrateur initial.

### 4. Application mobile

```bash
cd frontend
pnpm dev:mobile        # sur le même ordinateur (émulateur)
pnpm dev:mobile:lan    # sur un téléphone du même réseau Wi-Fi
```

Pour un téléphone physique, définissez `EXPO_PUBLIC_API_URL` dans `frontend/mobile/.env` avec l'adresse de l'ordinateur sur le réseau, par exemple `http://IP_DU_PC:8099/api`. Le script `pnpm --filter @adjal/mobile run setup:env` peut créer ce fichier.

## Fichiers à ne pas publier

Les fichiers suivants contiennent des secrets ou sont générés, et sont exclus du dépôt par les `.gitignore` :

- `backend/.env`, `backend/smtp.properties`, `frontend/mobile/.env`
- `backend/target/` (compilation) et `backend/uploads/` (images envoyées)
- `node_modules/`, `dist/`, `.expo/`

## Auteurs

- [Franck237-coding](https://github.com/Franck237-coding)
- [RositaE6mi](https://github.com/RositaE6mi)
