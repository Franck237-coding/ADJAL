# backend-adjal

API Spring Boot indépendante d’A DJAL.

- Build : `mvn clean verify`
- Démarrage : `mvn spring-boot:run`
- API : préfixe `/api`
- Documentation : Swagger UI
- Configuration : `src/main/resources/application.properties`

Le backend utilise MariaDB/MySQL. Les valeurs locales sont définies directement
dans `src/main/resources/application.properties` :

- hôte : `localhost` ;
- port MariaDB : `3306` par défaut (modifiable avec `DB_PORT`) ;
- base : `adjal` ;
- utilisateur : `root` ;
- mot de passe : vide.

Le mot de passe de `root` est volontairement vide pour le développement local.
Flyway gère le schéma de la base ; il ne faut donc pas remplacer
`spring.jpa.hibernate.ddl-auto=validate` par `update`.

## Administrateur initial

Après l’exécution des migrations Flyway, le backend crée automatiquement un
administrateur si l’adresse réservée n’existe pas encore :

- email : `admin@adjal.cm` ;
- mot de passe : variable d’environnement obligatoire `INITIAL_ADMIN_PASSWORD` ;
- rôle : `admin`.

Le mot de passe n’a aucune valeur de secours dans le dépôt. Il doit être fourni
via `INITIAL_ADMIN_PASSWORD`. Si l’adresse existe déjà comme administrateur, elle
est conservée telle quelle. Si elle appartient à un compte non administrateur,
le démarrage s’arrête explicitement afin d’éviter une élévation silencieuse de
privilèges.

## Organisation MVC

- `controller/` : routes HTTP et WebSocket ;
- `dto/request/` et `dto/response/` : contrats d’entrée et de sortie ;
- `entity/` : modèles métier ;
- `repository/` : accès MySQL et requêtes ;
- `service/` : logique applicative ;
- `mapper/` : conversion entre modèles métier et réponses HTTP ;
- `security/`, `config/` et `exception/` : composants transversaux.

## API séparées par domaine

Toutes les routes sont préfixées par `/api` et chaque domaine possède son
contrôleur et son service dédiés :

- utilisateurs : `/auth/**`, `/account/**` et l’alias `/users/**` ;
- catalogue produits : `/products/**` et `/catalog/products` ;
- commandes : `/orders/**` et `/checkout` ;
- conversations : `/conversations/**` ;
- avis : `/reviews/**` et `/products/{id}/reviews` ;
- paiements de démonstration : `/payments/**` ;
- informations de marché : `/market/prices` et `/market/alerts` ;
- notifications : `/notifications/**` ;
- administration : `/admin/**`.

Les migrations Flyway V1 et V2 créent respectivement le socle marketplace puis
les tables des avis, paiements, historique de statuts, prix/alertes de marché,
notifications, coordonnées et images produits. Le paiement est volontairement
un flux de démonstration prêt à être relié ultérieurement à Mobile Money.

### Routes principales ajoutées

- `GET /api/catalog/products?q=&category=&city=&minPrice=&maxPrice=`
- `GET /api/products/{id}`, `PATCH /api/products/{id}`, `DELETE /api/products/{id}`
- `GET /api/orders/{id}/history`
- `DELETE /api/account` avec confirmation du mot de passe
- `DELETE /api/admin/users/{id}` et `PATCH /api/admin/users/{id}/role`
- `GET/POST /api/reviews`, `GET /api/products/{id}/reviews`
- `GET/POST /api/payments`, `PATCH /api/admin/payments/{id}/status`
- `GET /api/market/prices`, `GET /api/market/alerts`
- `GET /api/notifications`, `PATCH /api/notifications/{id}/read`
