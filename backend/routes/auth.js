const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile, requestPasswordReset, resetPassword, getAllUsers, createUser, deleteUser, setupPassword, resetAllData } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { requireArbitre } = require('../middleware/roleAuth');

const router = express.Router();

// Validation pour l'inscription
const registerValidation = [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 50 caractères')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'),
    body('email')
        .isEmail()
        .withMessage('Email invalide')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
    body('firstName')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Le prénom ne peut pas dépasser 100 caractères'),
    body('lastName')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Le nom ne peut pas dépasser 100 caractères')
];

// Validation pour la connexion
const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Email invalide')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Mot de passe requis')
];

// Validation pour demande de réinitialisation
const resetRequestValidation = [
    body('email')
        .isEmail()
        .withMessage('Email invalide')
        .normalizeEmail()
];

// Validation pour réinitialisation
const resetPasswordValidation = [
    body('token')
        .notEmpty()
        .withMessage('Token requis'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile', auth, getProfile);
router.post('/forgot-password', resetRequestValidation, requestPasswordReset);
router.post('/reset-password', resetPasswordValidation, resetPassword);

// Configuration mot de passe pour nouveaux participants
router.post('/setup-password', [
    body('token').notEmpty().withMessage('Token requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 8 }).withMessage('Mot de passe trop court')
], setupPassword);

// Routes administrateur uniquement
router.get('/admin/users', auth, requireArbitre, getAllUsers);
router.post('/admin/users', auth, requireArbitre, [
    body('firstName').notEmpty().withMessage('Prénom requis'),
    body('email').isEmail().withMessage('Email invalide')
], createUser);
router.delete('/admin/users/:id', auth, requireArbitre, deleteUser);

// Route pour supprimer toutes les données
router.delete('/admin/reset-all-data', auth, requireArbitre, resetAllData);

module.exports = router;