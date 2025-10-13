const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tastingRoutes = require('./routes/tastings');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de sécurité
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// Configuration CORS
const corsOptions = {
    origin: true,
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite à 100 requêtes par IP par fenêtre
    message: {
        success: false,
        message: 'Trop de requêtes, veuillez réessayer plus tard'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 50 : 5, // 50 en dev, 5 en prod
    message: {
        success: false,
        message: 'Trop de tentatives de connexion, veuillez réessayer plus tard'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging détaillé des requêtes en développement
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`🌍 ${new Date().toISOString()} - ${req.method} ${req.path}`);
        console.log(`📋 Headers:`, req.headers);
        console.log(`📦 Body:`, req.body);
        console.log(`🎯 Query:`, req.query);
        console.log('---');
        next();
    });
}

// Routes
const sessionRoutes = require('./routes/sessions');
app.use('/api/auth', authRoutes);
app.use('/api/tastings', tastingRoutes);
app.use('/api/sessions', sessionRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API Wine Tasting fonctionnelle',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Test CORS
app.get('/api/test-cors', (req, res) => {
    res.json({
        success: true,
        message: 'CORS fonctionne !',
        origin: req.headers.origin,
        userAgent: req.headers['user-agent']
    });
});

app.post('/api/test-cors', (req, res) => {
    res.json({
        success: true,
        message: 'POST CORS fonctionne !',
        body: req.body,
        origin: req.headers.origin
    });
});

// Route racine
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API Wine Tasting - Backend multi-utilisateurs',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            tastings: '/api/tastings',
            health: '/api/health'
        }
    });
});

// Middleware de gestion des erreurs 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée',
        path: req.originalUrl
    });
});

// Middleware de gestion des erreurs globales
app.use((error, req, res, next) => {
    console.error('Erreur serveur:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Erreur serveur interne' 
            : error.message || 'Erreur serveur interne',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Gestion gracieuse de l'arrêt du serveur
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM reçu, arrêt gracieux du serveur...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT reçu, arrêt gracieux du serveur...');
    process.exit(0);
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur Wine Tasting démarré sur le port ${PORT}`);
    console.log(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 API disponible sur: http://0.0.0.0:${PORT}`);
    console.log(`📱 Accès smartphone: http://192.168.1.16:${PORT}`);
    console.log(`❤️  Santé du serveur: http://localhost:${PORT}/api/health`);
});

module.exports = app;
