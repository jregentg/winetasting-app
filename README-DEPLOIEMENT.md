# 🚀 Guide de Déploiement - Wine Tasting App

## 📱 Accès Multi-Appareils (PC + Smartphone)

### 🔧 Configuration Réseau
- **IP Local**: `192.168.1.16`
- **Backend API**: Port `3000`
- **Frontend Web**: Port `8080`

### 🚀 Démarrage Rapide

#### Option 1: Script Automatique (Windows)
```bash
double-clic sur start-servers.bat
```

#### Option 2: Manuel
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd web-version
python -m http.server 8080 --bind 0.0.0.0
```

### 🌐 URLs d'Accès

#### 💻 Depuis votre PC:
- **Application Web**: http://localhost:8080
- **API Backend**: http://localhost:3000/api/health

#### 📱 Depuis votre Smartphone:
- **Application Web**: http://192.168.1.16:8080
- **API Backend**: http://192.168.1.16:3000/api/health

### 🔐 Sécurité
- Configuration CORS activée pour les deux appareils
- Accès limité au réseau local (192.168.1.x)
- Données sensibles protégées par .gitignore

### 🛠️ Dépannage

#### Smartphone ne peut pas accéder:
1. **Vérifier que PC et smartphone sont sur le même réseau WiFi**
2. **Désactiver temporairement le pare-feu Windows**:
   ```
   Panneau de configuration > Système et sécurité > Pare-feu Windows
   ```
3. **Tester la connectivité**:
   - Depuis le smartphone, aller sur: http://192.168.1.16:8080
   - Si ça ne fonctionne pas, essayer: http://[VOTRE_IP]:8080

#### Trouver votre IP locale:
```bash
# Dans PowerShell/CMD Windows:
ipconfig | findstr IPv4
```

### 📊 Test de Fonctionnement

1. **Backend**: Aller sur http://192.168.1.16:3000/api/health
   - Doit retourner: `{"success": true, "message": "API Wine Tasting fonctionnelle"}`

2. **Frontend**: Aller sur http://192.168.1.16:8080
   - Doit afficher la page d'accueil Wine Tasting App

### 🎯 Comptes de Test

#### Compte Arbitre (pré-créé):
- **Email**: arbitre@winetasting.app  
- **Mot de passe**: Arbitre123!

#### Créer des Participants:
- Se connecter avec le compte arbitre
- Aller dans "Gestion Participants"
- Ajouter des participants avec leur email
- Les participants recevront un lien d'activation

### 🔄 Arrêt des Serveurs
- Fermer les fenêtres de commande
- Ou appuyer `Ctrl+C` dans chaque terminal