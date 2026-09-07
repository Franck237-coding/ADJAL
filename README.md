# A DJAL

Archive complète de l'application avec deux dossiers indépendants :

- `backend/` : API Spring Boot de référence, configurée pour MariaDB ;
- `frontend/` : workspace Expo mobile, back-office React et contrat API.

## Démarrage du backend

```bash
cd backend
cp .env.example .env
# Renseigner les paramètres MariaDB et le secret de session dans l'environnement
bash scripts/start-mariadb.sh
mvn spring-boot:run
```

## Démarrage du frontend

```bash
cd frontend
pnpm install
pnpm --filter @adjal/admin run dev
pnpm --filter @adjal/mobile run dev
```

Pour un téléphone physique, définir `EXPO_PUBLIC_API_URL` vers l'adresse LAN de l'ordinateur, par exemple `http://IP_DU_PC:8099/api`.
