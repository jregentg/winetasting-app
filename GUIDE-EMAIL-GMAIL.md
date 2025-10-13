# 📧 Configuration Email Gmail - Wine Tasting App

## 🔐 Étapes obligatoires pour Gmail

### 1. **Activer l'authentification à 2 facteurs**
1. Aller sur https://myaccount.google.com/security
2. Activer "Validation en 2 étapes" si pas déjà fait
3. Suivre les instructions de Google

### 2. **Créer un mot de passe d'application**
1. Aller sur https://myaccount.google.com/apppasswords
2. Cliquer sur "Générer un mot de passe d'application"
3. Choisir "Autre (nom personnalisé)"
4. Entrer "Wine Tasting App"
5. **Copier le mot de passe généré** (16 caractères sans espaces)

### 3. **Configurer le fichier .env**
```env
# Configuration Email - Activation des vrais emails
SEND_REAL_EMAILS=true

# Configuration SMTP Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre.email@gmail.com
SMTP_PASS=mot_de_passe_application_16_caracteres
```

## 🚨 **Important**
- ❌ **NE PAS** utiliser votre mot de passe Gmail normal
- ✅ **UTILISER** uniquement le mot de passe d'application
- ✅ Le mot de passe d'application ressemble à : `abcd efgh ijkl mnop`
- ✅ Dans le .env, supprimer les espaces : `abcdefghijklmnop`

## 🧪 **Test de fonctionnement**

### Mode Simulation (développement)
```env
SEND_REAL_EMAILS=false
```
- Emails simulés
- Liens d'activation affichés dans les logs du serveur

### Mode Production (vrais emails)
```env
SEND_REAL_EMAILS=true
```
- Emails envoyés via Gmail
- Participants reçoivent l'invitation par email

## 🔄 **Redémarrage requis**
Après modification du .env :
```bash
# Arrêter le serveur (Ctrl+C)
# Redémarrer avec :
npm run dev
```

## 🛡️ **Sécurité**
- Mot de passe d'application spécifique à l'app
- Peut être révoqué sans affecter le compte Gmail
- Plus sécurisé que le mot de passe principal