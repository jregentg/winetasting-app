# Wine Tasting App - Application Multi-utilisateurs

Application complète de dégustation de vin avec frontend web Typeform-style et backend Node.js multi-utilisateurs.

## 🍷 Aperçu

Cette application permet aux utilisateurs de :
- **Créer un compte** et se connecter de manière sécurisée
- **Effectuer des dégustations** avec 5 questions spécialisées
- **Consulter l'historique** de toutes leurs dégustations
- **Visualiser des statistiques** personnelles et globales
- **Partager l'expérience** avec d'autres utilisateurs

## 📁 Structure du projet

```
WineTastingApp/
├── backend/                    # API Node.js/Express
│   ├── config/                 # Configuration base de données
│   ├── controllers/            # Logique métier
│   ├── middleware/             # Authentification et sécurité
│   ├── routes/                 # Routes API
│   ├── database/               # Schéma SQL
│   └── server.js              # Point d'entrée serveur
├── web-version/               # Frontend web
│   ├── index.html             # Interface Typeform-style
│   └── api.js                 # Client API JavaScript
├── app/                       # Version Android (conservée)
└── README.md                  # Ce fichier
```

## 🚀 Démarrage rapide

### 1. Backend (API)

```bash
cd backend
npm install
cp .env.example .env
# Configurer la base de données dans .env
createdb wine_tasting_db
psql -d wine_tasting_db -f database/schema.sql
npm run dev
```

Le backend démarre sur http://localhost:3000

### 2. Frontend web

Ouvrir `web-version/index.html` dans un navigateur ou servir via un serveur web local :

```bash
cd web-version
python -m http.server 8000
# Ou avec Node.js
npx serve .
```

L'application web sera accessible sur http://localhost:8000

## ✨ Fonctionnalités

### 🔐 Authentification sécurisée
- Inscription avec validation des données
- Connexion avec JWT persistant
- Profils utilisateur personnalisés
- Déconnexion sécurisée

### 🍷 Système de dégustation avancé
- **Configuration flexible** : 1-10 bouteilles
- **5 questions spécialisées** :
  - 👁️ Aspect visuel (notation 1-5)
  - 👃 Premier nez (choix descriptifs)
  - 🌪️ Deuxième nez (évolution aromatique)
  - 👅 Attaque en bouche (notation 1-5)
  - ⏱️ Finale (persistance aromatique)

### 📊 Calcul de score précis
- Conversion automatique vers échelle 20 points
- Formule : `(note/5) × 4` par question
- Prévention des scores impossibles
- Descriptions qualitatives automatiques

### 📈 Statistiques complètes
- **Personnelles** : moyenne, meilleur score, nombre de dégustations
- **Historique détaillé** avec dates et scores
- **Distribution qualitative** (excellent, bon, moyen, faible)
- **Tendances temporelles**

### 🎨 Interface moderne
- **Design Typeform** : une question par page
- **Responsive mobile** : optimisé tous écrans
- **Animations fluides** : transitions CSS3
- **Barre de progression** : suivi visuel
- **Thème vin** : couleurs et iconographie

## 🔧 Configuration

### Backend (.env)
```env
# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wine_tasting_db
DB_USER=wine_tasting_user
DB_PASSWORD=your_secure_password

# Sécurité JWT
JWT_SECRET=your_very_secure_jwt_secret_key
JWT_EXPIRES_IN=7d

# Serveur
PORT=3000
NODE_ENV=development

# CORS (domaines autorisés)
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:5500,http://localhost:8000
```

### Frontend (api.js)
```javascript
// URL de base modifiable
this.baseURL = 'http://localhost:3000/api';
```

## 🛡️ Sécurité

### Backend
- **Rate limiting** : protection contre spam
- **CORS** : domaines autorisés uniquement
- **Helmet** : headers de sécurité HTTP
- **Validation** : données entrantes contrôlées
- **Hachage** : mots de passe avec bcryptjs
- **JWT** : tokens sécurisés avec expiration

### Frontend
- **Validation côté client** : UX améliorée
- **Gestion d'erreurs** : messages utilisateur clairs
- **Token automatique** : gestion transparente
- **Timeout** : prévention blocages

## 📡 API Endpoints

### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/profile` - Profil utilisateur

### Dégustations
- `POST /api/tastings` - Sauvegarder dégustation
- `GET /api/tastings` - Historique utilisateur
- `GET /api/tastings/:id` - Détails dégustation
- `DELETE /api/tastings/:id` - Supprimer dégustation
- `GET /api/tastings/statistics` - Stats utilisateur
- `GET /api/tastings/global-statistics` - Stats globales

### Santé
- `GET /api/health` - Status API
- `GET /` - Informations API

## 🗄️ Base de données

### PostgreSQL avec UUID
- **users** : comptes utilisateurs
- **tastings** : dégustations avec métadonnées
- **tasting_answers** : réponses détaillées
- **user_sessions** : gestion sessions

### Index optimisés
- Recherche par utilisateur
- Tri par date
- Jointures performantes

## 🎯 Avantages vs version locale

| Fonctionnalité | Version locale | Version multi-utilisateurs |
|---|---|---|
| **Données** | Stockage local | Base centralisée PostgreSQL |
| **Utilisateurs** | Un seul | Illimités avec profils |
| **Synchronisation** | Aucune | Temps réel |
| **Statistiques** | Limitées | Globales + personnelles |
| **Sécurité** | Locale | JWT + chiffrement |
| **Évolutivité** | Limitée | Horizontale |
| **Collaboration** | Impossible | Communauté |

## 🚀 Déploiement

### Environnement de production

1. **Backend**
   ```bash
   # Variables production
   NODE_ENV=production
   DB_SSL=true
   
   # Démarrage
   npm start
   ```

2. **Base de données**
   - PostgreSQL avec SSL
   - Sauvegardes automatiques
   - Monitoring performances

3. **Frontend**
   - Serveur web (nginx/Apache)
   - HTTPS obligatoire
   - CDN pour assets statiques

4. **Sécurité**
   - Certificats SSL/TLS
   - Firewall configuré
   - Logs centralisés

## 🧪 Tests

```bash
# Backend
cd backend
npm test
npm run test:coverage

# Frontend
# Tests manuels avec différents navigateurs
# Tests responsiveness mobile/desktop
```

## 📱 Compatibilité

### Navigateurs supportés
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Appareils
- Desktop : Windows, macOS, Linux
- Mobile : iOS Safari, Android Chrome
- Tablettes : responsive design

## 🔄 Migration depuis version locale

Pour migrer les données existantes :

1. **Exporter** données locales (localStorage)
2. **Créer compte** dans nouvelle version
3. **Importer** via API (script fourni)
4. **Vérifier** cohérence données

## 🤝 Contribution

1. **Fork** le projet
2. **Créer** branche feature
3. **Développer** avec tests
4. **Documenter** changements
5. **Pull Request** avec description

## 📝 Licence

MIT License - Utilisation libre avec attribution

## 🆘 Support

### Documentation
- Backend : `/backend/README.md`
- API : `/api/health` pour diagnostics
- Logs : `/backend/logs/`

### Dépannage
1. **Vérifier** services (PostgreSQL, Node.js)
2. **Contrôler** configuration .env
3. **Consulter** logs d'erreur
4. **Tester** endpoints API

### Contact
Pour questions techniques ou bugs, créer une issue GitHub.

---

🍷 **Wine Tasting App** - Transformez vos dégustations en expérience collaborative !