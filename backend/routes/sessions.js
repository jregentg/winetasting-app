const express = require('express');
const { body } = require('express-validator');
const {
    createSession,
    getAllSessions,
    getSession,
    addBottleToSession,
    removeBottleFromSession,
    updateSessionStatus,
    addParticipantToSession,
    deleteSession,
    // Routes pour testeurs
    getAvailableSessions,
    joinSession,
    getSessionForTaster
} = require('../controllers/sessionController');
const auth = require('../middleware/auth');
const { requireArbitre } = require('../middleware/roleAuth');

const router = express.Router();

// Validation pour création de session
const sessionValidation = [
    body('name')
        .notEmpty()
        .withMessage('Nom de session requis')
        .isLength({ max: 200 })
        .withMessage('Le nom ne peut pas dépasser 200 caractères'),
    body('type')
        .optional()
        .isIn(['standard', 'blind'])
        .withMessage('Type invalide')
];

// Validation pour ajout de bouteille
const bottleValidation = [
    body('bottleNumber')
        .isInt({ min: 1 })
        .withMessage('Numéro de bouteille invalide'),
    body('customName')
        .notEmpty()
        .withMessage('Nom personnalisé requis')
        .isLength({ max: 100 })
        .withMessage('Le nom ne peut pas dépasser 100 caractères'),
    body('wineDetails')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Les détails ne peuvent pas dépasser 1000 caractères')
];

// Routes pour testeurs (doivent être avant les routes avec paramètres génériques)
router.get('/available', auth, getAvailableSessions);
router.post('/:sessionId/join', auth, joinSession);
router.get('/:sessionId/taster', auth, getSessionForTaster);

// Routes pour arbitre uniquement
router.post('/', auth, requireArbitre, sessionValidation, createSession);
router.get('/admin/all', auth, requireArbitre, getAllSessions);
router.get('/:id', auth, requireArbitre, getSession);
router.post('/:sessionId/bottles', auth, requireArbitre, bottleValidation, addBottleToSession);
router.delete('/bottles/:bottleId', auth, requireArbitre, removeBottleFromSession);
router.patch('/:id/status', auth, requireArbitre, updateSessionStatus);
router.post('/:sessionId/participants', auth, requireArbitre, addParticipantToSession);
router.delete('/:id', auth, requireArbitre, deleteSession);

module.exports = router;