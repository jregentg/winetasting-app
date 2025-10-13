const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const pool = require('../config/database');
const { sendParticipantInvitation } = require('../config/email');

// Générer un token JWT
const generateToken = (userId) => {
    return jwt.sign(
        { userId }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Inscription
const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Erreurs de validation register:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Données invalides: ' + errors.array().map(e => e.msg).join(', '),
                errors: errors.array()
            });
        }

        const { username, email, password, firstName, lastName } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà'
            });
        }

        // Hasher le mot de passe
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Créer l'utilisateur
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name) 
             VALUES (?, ?, ?, ?, ?)`,
            [username, email, passwordHash, firstName, lastName]
        );

        // Pour SQLite, récupérer l'utilisateur créé
        const userResult = await pool.query(
            'SELECT id, username, email, first_name, last_name, created_at, role FROM users WHERE email = ?',
            [email]
        );

        const user = userResult.rows[0];
        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role || 'testeur',
                    createdAt: user.created_at
                },
                token
            }
        });

    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'inscription'
        });
    }
};

// Connexion
const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Chercher l'utilisateur
        const result = await pool.query(
            'SELECT id, username, email, password_hash, first_name, last_name, is_active, role FROM users WHERE email = ?',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Compte désactivé'
            });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Mettre à jour la dernière connexion
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        const token = generateToken(user.id);

        res.json({
            success: true,
            message: 'Connexion réussie',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role || 'testeur'
                },
                token
            }
        });

    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la connexion'
        });
    }
};

// Profil utilisateur
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.created_at, u.role,
                    COUNT(t.id) as total_tastings,
                    AVG(t.final_score) as average_score,
                    MAX(t.final_score) as best_score
             FROM users u
             LEFT JOIN tastings t ON u.id = t.user_id
             WHERE u.id = ?
             GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.created_at, u.role`,
            [userId]
        );

        const profile = result.rows[0];

        res.json({
            success: true,
            data: {
                id: profile.id,
                username: profile.username,
                email: profile.email,
                firstName: profile.first_name,
                lastName: profile.last_name,
                role: profile.role || 'testeur',
                createdAt: profile.created_at,
                statistics: {
                    totalTastings: parseInt(profile.total_tastings) || 0,
                    averageScore: profile.average_score ? parseFloat(profile.average_score).toFixed(1) : null,
                    bestScore: profile.best_score ? parseFloat(profile.best_score).toFixed(1) : null
                }
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération du profil'
        });
    }
};

// Demande de réinitialisation de mot de passe
const requestPasswordReset = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Email invalide',
                errors: errors.array()
            });
        }

        const { email } = req.body;

        // Vérifier si l'utilisateur existe
        const result = await pool.query(
            'SELECT id, username, first_name, last_name FROM users WHERE email = ? AND is_active = 1',
            [email]
        );

        if (result.rows.length === 0) {
            // Pour la sécurité, on renvoie toujours un succès même si l'email n'existe pas
            return res.json({
                success: true,
                message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
            });
        }

        const user = result.rows[0];

        // Générer un token de réinitialisation
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

        // Invalider les anciens tokens
        await pool.query(
            'UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0',
            [user.id]
        );

        // Créer le nouveau token
        await pool.query(
            'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
            [user.id, resetToken, expiresAt.toISOString()]
        );

        // En production, envoyer un email avec le lien
        // Pour le développement, on retourne le token dans la réponse
        console.log(`🔑 Token de réinitialisation pour ${email}: ${resetToken}`);

        res.json({
            success: true,
            message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
            // Seulement en développement
            ...(process.env.NODE_ENV === 'development' && { resetToken, email })
        });

    } catch (error) {
        console.error('Erreur lors de la demande de réinitialisation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la demande de réinitialisation'
        });
    }
};

// Réinitialisation du mot de passe
const resetPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { token, newPassword } = req.body;

        // Vérifier le token
        const result = await pool.query(
            `SELECT pr.id, pr.user_id, pr.expires_at, u.email 
             FROM password_resets pr 
             JOIN users u ON pr.user_id = u.id 
             WHERE pr.token = ? AND pr.used = 0 AND pr.expires_at > datetime('now')`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Token invalide ou expiré'
            });
        }

        const resetData = result.rows[0];

        // Hasher le nouveau mot de passe
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Mettre à jour le mot de passe
        await pool.query(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [passwordHash, resetData.user_id]
        );

        // Marquer le token comme utilisé
        await pool.query(
            'UPDATE password_resets SET used = 1 WHERE id = ?',
            [resetData.id]
        );

        console.log(`🔒 Mot de passe réinitialisé pour ${resetData.email}`);

        res.json({
            success: true,
            message: 'Mot de passe réinitialisé avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la réinitialisation'
        });
    }
};

// Récupérer tous les utilisateurs (pour arbitre)
const getAllUsers = async (req, res) => {
    try {
        console.log('🔍 Recherche des utilisateurs testeurs...');
        
        // Requête simplifiée d'abord
        const simpleResult = await pool.query('SELECT * FROM users WHERE role = ?', ['testeur']);
        console.log('📊 Utilisateurs testeurs trouvés:', simpleResult.rows.length);
        console.log('📊 Données:', simpleResult.rows);
        
        // Utiliser la requête simple qui fonctionne
        console.log('📋 Mapping des utilisateurs...');
        
        try {
            const users = simpleResult.rows.map(user => {
                console.log('🔧 Mapping utilisateur:', user.email);
                return {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    is_active: user.is_active,
                    created_at: user.created_at,
                    needs_password_setup: user.needs_password_setup,
                    stats: {
                        tastingCount: 0,
                        averageScore: null
                    }
                };
            });
            
            console.log('👥 Utilisateurs mappés:', users.length);
            if (users.length > 0) {
                console.log('👥 Premier utilisateur mappé:', users[0]);
            }

            res.json({
                success: true,
                data: users
            });
        } catch (mappingError) {
            console.error('❌ Erreur mapping:', mappingError);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du mapping des utilisateurs'
            });
        }

    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des utilisateurs'
        });
    }
};

// Créer un participant (pour arbitre) - nouveau système
const createUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { firstName, email } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Un utilisateur avec cet email existe déjà'
            });
        }

        // Générer un nom d'utilisateur basé sur l'email
        const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Générer un token temporaire pour la première connexion
        const setupToken = crypto.randomBytes(32).toString('hex');
        
        // Créer l'utilisateur sans mot de passe
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, first_name, last_name, role, needs_password_setup) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id, username, email, first_name, last_name, role, created_at',
            [username, email, setupToken, firstName, null, 'testeur', 1]
        );

        const newUser = result.rows[0];

        // Lien d'activation vers l'index principal avec paramètres de setup
        const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/?token=${setupToken}&email=${encodeURIComponent(email)}`;

        console.log(`🎯 Participant créé: ${email}`);
        console.log(`🔗 Lien d'activation: ${activationLink}`);

        // Envoyer l'email d'invitation
        console.log('📧 Envoi de l\'email d\'invitation...');
        const emailResult = await sendParticipantInvitation(email, firstName, activationLink);
        
        let responseMessage = 'Participant créé avec succès';
        if (emailResult.success) {
            console.log('✅ Email d\'invitation envoyé');
            responseMessage += ' • Email d\'invitation envoyé';
        } else {
            console.error('❌ Échec envoi email:', emailResult.error);
            responseMessage += ' • Erreur envoi email: ' + emailResult.error;
        }

        res.status(201).json({
            success: true,
            message: responseMessage,
            emailSent: emailResult.success,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                firstName: newUser.first_name,
                lastName: newUser.last_name,
                role: newUser.role,
                createdAt: newUser.created_at,
                needsPasswordSetup: true
            },
            activationLink // Temporaire pour les tests
        });

    } catch (error) {
        console.error('Erreur lors de la création du participant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création du participant'
        });
    }
};

// Supprimer un utilisateur (pour arbitre)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID utilisateur invalide'
            });
        }

        // Vérifier que l'utilisateur existe et n'est pas arbitre
        const userResult = await pool.query(
            'SELECT id, role FROM users WHERE id = ?',
            [id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        if (userResult.rows[0].role === 'arbitre') {
            return res.status(403).json({
                success: false,
                message: 'Impossible de supprimer un compte arbitre'
            });
        }

        // Supprimer d'abord les dégustations de l'utilisateur
        await pool.query('DELETE FROM tastings WHERE user_id = ?', [id]);
        
        // Supprimer l'utilisateur
        await pool.query('DELETE FROM users WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Utilisateur supprimé avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la suppression de l\'utilisateur'
        });
    }
};

// Configuration du mot de passe pour les nouveaux participants
const setupPassword = async (req, res) => {
    try {
        const { token, email, password } = req.body;

        if (!token || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Token, email et mot de passe requis'
            });
        }

        // Vérifier que l'utilisateur existe et a besoin de configurer son mot de passe
        const result = await pool.query(
            'SELECT id, password_hash, needs_password_setup FROM users WHERE email = ? AND needs_password_setup = 1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé ou déjà configuré'
            });
        }

        const user = result.rows[0];

        // Vérifier que le token correspond
        if (user.password_hash !== token) {
            return res.status(401).json({
                success: false,
                message: 'Token invalide'
            });
        }

        // Valider le mot de passe
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Le mot de passe doit contenir au moins 8 caractères'
            });
        }

        // Hasher le nouveau mot de passe
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Mettre à jour l'utilisateur
        await pool.query(
            'UPDATE users SET password_hash = ?, needs_password_setup = 0 WHERE id = ?',
            [passwordHash, user.id]
        );

        // Générer un token JWT
        const jwtToken = generateToken(user.id);

        res.json({
            success: true,
            message: 'Mot de passe configuré avec succès',
            token: jwtToken
        });

    } catch (error) {
        console.error('Erreur lors de la configuration du mot de passe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la configuration du mot de passe'
        });
    }
};

// Supprimer toutes les données (arbitre uniquement)
const resetAllData = async (req, res) => {
    try {
        console.log('🗑️ Début de suppression de toutes les données...');
        
        // Supprimer toutes les données dans l'ordre (à cause des contraintes de clés étrangères)
        await pool.query('DELETE FROM user_sessions');
        console.log('✅ Table user_sessions vidée');
        
        await pool.query('DELETE FROM bottles');
        console.log('✅ Table bottles vidée');
        
        await pool.query('DELETE FROM tasting_sessions');
        console.log('✅ Table tasting_sessions vidée');
        
        await pool.query('DELETE FROM tastings');
        console.log('✅ Table tastings vidée');
        
        await pool.query('DELETE FROM password_resets');
        console.log('✅ Table password_resets vidée');
        
        // Supprimer tous les utilisateurs sauf l'arbitre
        await pool.query('DELETE FROM users WHERE role != ?', ['arbitre']);
        console.log('✅ Utilisateurs testeurs supprimés');
        
        // Remettre à zéro les compteurs SQLite
        await pool.query('DELETE FROM sqlite_sequence');
        console.log('✅ Compteurs SQLite remis à zéro');
        
        res.json({
            success: true,
            message: 'Toutes les données ont été supprimées avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur suppression données:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression des données'
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    requestPasswordReset,
    resetPassword,
    getAllUsers,
    createUser,
    deleteUser,
    setupPassword,
    resetAllData
};