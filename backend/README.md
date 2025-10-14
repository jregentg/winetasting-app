# Wine Tasting App - Backend Multi-utilisateurs

Backend Node.js/Express pour l'application Wine Tasting permettant la gestion multi-utilisateurs et la centralisation des dégustations.

## 🚀 Fonctionnalités

- **Authentification sécurisée** avec JWT
- **Gestion multi-utilisateurs** avec profils personnalisés
- **API REST complète** pour les dégustations
- **Base de données PostgreSQL** avec UUID et audit
- **Sécurité renforcée** (rate limiting, CORS, helmet)
- **Statistiques avancées** utilisateur et globales

## 📋 Prérequis

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 12

## 🛠️ Installation

1. **Cloner le projet**
```bash
cd /mnt/c/Users/jacqu/WineTastingApp/backend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de la base de données**
```bash
# Créer la base de données PostgreSQL
createdb wine_tasting_db

# Créer l'utilisateur (optionnel)
createuser wine_tasting_user --pwprompt
```

4. **Configuration environnement**
```bash
cp .env.example .env
# Éditer .env avec vos paramètres
```

5. **Initialiser la base de données**
```bash
# Exécuter le schéma SQL
psql -d wine_tasting_db -f database/schema.sql
```

6. **Démarrer le serveur**
```bash
# Développement
npm run dev

# Production
npm start
```

## 🔧 Configuration (.env)

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wine_tasting_db
DB_USER=wine_tasting_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key
JWT_EXPIRES_IN=7d

# Serveur
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:5500
```

## 📡 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/auth/profile` - Profil utilisateur (protégé)

### Dégustations
- `POST /api/tastings` - Créer une dégustation (protégé)
- `GET /api/tastings` - Liste des dégustations utilisateur (protégé)
- `GET /api/tastings/:id` - Détails d'une dégustation (protégé)
- `DELETE /api/tastings/:id` - Supprimer une dégustation (protégé)
- `GET /api/tastings/statistics` - Statistiques utilisateur (protégé)
- `GET /api/tastings/global-statistics` - Statistiques globales (protégé)

### Santé
- `GET /api/health` - Statut de l'API
- `GET /` - Informations de l'API

## 🗄️ Structure de la base de données

### Tables principales
- **users** - Comptes utilisateurs avec authentification
- **tastings** - Dégustations avec notes et métadonnées
- **tasting_answers** - Réponses détaillées aux questions
- **user_sessions** - Gestion des sessions (optionnel)

### Vues
- **user_statistics** - Statistiques par utilisateur
- **global_statistics** - Statistiques globales

## 🔒 Sécurité

- **Rate limiting** : 100 req/15min général, 5 req/15min auth
- **CORS** configurable par domaine
- **Helmet** pour les headers de sécurité
- **Validation** des données avec express-validator
- **Hachage** des mots de passe avec bcryptjs
- **JWT** pour l'authentification sans état

## 📊 Fonctionnalités avancées

### Système de notation
- Conversion automatique échelle 5 points → 20 points
- Calcul précis : `(rating / 5.0) * 4.0` par question
- Prévention des scores impossibles (>20)

### Statistiques
- Moyennes, meilleurs/pires scores
- Distribution par qualité (excellent, bon, moyen, faible)
- Historique et tendances
- Statistiques globales pour administration

### Gestion des erreurs
- Codes de réponse HTTP appropriés
- Messages d'erreur descriptifs
- Logging des erreurs pour debug
- Gestion gracieuse des pannes

## 🧪 Tests

```bash
# Exécuter les tests
npm test

# Tests en mode watch
npm run test:watch

# Couverture de code
npm run test:coverage
```

## 📦 Scripts npm

- `npm start` - Démarrer en production
- `npm run dev` - Démarrer avec nodemon (hot reload)
- `npm run migrate` - Migrations base de données
- `npm test` - Exécuter les tests

## 🚀 Déploiement

### Environnement de production
1. Configurer `NODE_ENV=production`
2. Utiliser HTTPS avec certificats SSL
3. Configurer un reverse proxy (nginx)
4. Surveiller les logs et performances
5. Sauvegardes automatiques PostgreSQL

### Variables d'environnement production
```env
NODE_ENV=production
DB_SSL=true
JWT_SECRET=complex_production_secret
CORS_ORIGIN=https://yourdomain.com
```

## 🤝 Intégration Frontend

L'API est conçue pour fonctionner avec le frontend web multi-utilisateurs. Fichier `api.js` fourni pour faciliter l'intégration.

### Authentification frontend
```javascript
// Connexion
const response = await api.login(email, password);

// Utilisation token automatique
const tastings = await api.getTastings();
```

## 📝 Logs

Les logs sont gérés avec Winston :
- `logs/combined.log` - Tous les logs
- `logs/error.log` - Erreurs uniquement
- Console en développement

## 🔍 Monitoring

### Santé de l'API
```bash
curl http://localhost:3000/api/health
```

### Métriques importantes
- Temps de réponse des API
- Taux d'erreur
- Connexions base de données
- Utilisation mémoire

## 🆘 Dépannage

### Problèmes courants

1. **Erreur de connexion base de données**
   - Vérifier PostgreSQL démarré
   - Contrôler paramètres .env
   - Tester connexion : `psql -h localhost -U wine_tasting_user wine_tasting_db`

2. **Erreur JWT**
   - Vérifier JWT_SECRET dans .env
   - Contrôler expiration token

3. **Erreur CORS**
   - Vérifier CORS_ORIGIN dans .env
   - Ajouter domaine frontend autorisé

## 📄 Licence

MIT License - Voir fichier LICENSE pour détails

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Ouvrir une Pull Request