# Frontend A DJAL

Projet frontend autonome contenant les deux clients de la marketplace :

- `admin/` : back-office React/Vite ;
- `mobile/` : application Expo pour acheteurs et agriculteurs ;
- `api-contract/` : contrat OpenAPI et clients TypeScript générés.

## Installation

Depuis ce dossier :

```bash
pnpm install
pnpm run codegen
pnpm run typecheck
```

## Administration web

Le backend Spring doit être lancé séparément. En local, l’origine utilisée par
défaut est `http://localhost:8099`. Pour utiliser une autre adresse, configurez
l’origine de l’API sans le suffixe `/api` :

```bash
VITE_API_BASE_URL=http://localhost:8099 pnpm run dev:admin
```

## Application mobile

Pour l’aperçu local :

```bash
EXPO_PUBLIC_API_URL=http://localhost:8099/api pnpm run dev:mobile
```

Pour tester sur des téléphones du même réseau Wi-Fi, remplacez `localhost` par
l’adresse IP locale de l’ordinateur et utilisez le mode LAN :

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.25:8099/api pnpm run dev:mobile:go
```

Le téléphone et l’ordinateur doivent être sur le même Wi-Fi. Scannez le QR
code affiché par Expo Go après le démarrage ; n’utilisez pas `dev:mobile` pour
un téléphone physique, car ce script limite Metro à `localhost`.

## Validation et build

```bash
pnpm run typecheck
pnpm run build
```

Le frontend ne se connecte jamais directement à MySQL. Toutes les données
passent par l’API Spring sous `/api`.

## Compte administrateur initial

Le backend Spring crée automatiquement le compte réservé suivant au premier
démarrage, si celui-ci n’existe pas déjà :

- email : `admin@adjal.cm` ;
- mot de passe : `admin123` ;
- rôle : `admin`.

Le back-office web reste séparé de l’application mobile, mais les deux
applications utilisent la même API Spring et la même base MySQL.
