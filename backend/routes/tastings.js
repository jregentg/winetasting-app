const express = require('express');
const { body, param, query } = require('express-validator');
const { 
    createTasting, 
    getUserTastings, 
    getTastingById, 
    deleteTasting, 
    getUserStatistics,
    getGlobalStatistics,
    getAllTastings,
    getDetailedGlobalStatistics,
    getBottleRankings,
    getGlobalBottleRankings
} = require('../controllers/tastingController');
const auth = require('../middleware/auth');
const { requireArbitre } = require('../middleware/roleAuth');

const router = express.Router();

// Validation pour créer une dégustation
const createTastingValidation = [
    body('bottleCount')
        .isInt({ min: 1, max: 10 })
        .withMessage('Le nombre de bouteilles doit être entre 1 et 10'),
    body('finalScore')
        .isFloat({ min: 0, max: 20 })
        .withMessage('La note finale doit être entre 0 et 20'),
    body('answeredQuestions')
        .isInt({ min: 0, max: 5 })
        .withMessage('Le nombre de questions répondues doit être entre 0 et 5'),
    body('answers')
        .optional()
        .isArray()
        .withMessage('Les réponses doivent être un tableau'),
    body('wineName')
        .optional()
        .isLength({ max: 255 })
        .withMessage('Le nom du vin ne peut pas dépasser 255 caractères'),
    body('wineVintage')
        .optional()
        .isInt({ min: 1800, max: new Date().getFullYear() })
        .withMessage('L\'année du vin doit être valide'),
    body('wineRegion')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La région ne peut pas dépasser 255 caractères'),
    body('wineType')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Le type de vin ne peut pas dépasser 50 caractères'),
    body('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Les notes ne peuvent pas dépasser 1000 caractères')
];

// Validation pour les paramètres ID
const idValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID invalide')
];

// Validation pour la pagination
const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Le numéro de page doit être un entier positif'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('La limite doit être entre 1 et 100')
];

// Routes protégées (authentification requise)
router.use(auth);

// CRUD dégustations
router.post('/', createTastingValidation, createTasting);
router.get('/', paginationValidation, getUserTastings);
router.get('/statistics', getUserStatistics);
router.get('/global-statistics', getGlobalStatistics);
router.get('/rankings', paginationValidation, getBottleRankings);
router.get('/:id', idValidation, getTastingById);
router.delete('/:id', idValidation, deleteTasting);

// Routes pour arbitre uniquement
router.get('/admin/all', requireArbitre, paginationValidation, getAllTastings);
router.get('/admin/detailed-statistics', requireArbitre, getDetailedGlobalStatistics);
router.get('/admin/rankings', requireArbitre, paginationValidation, getGlobalBottleRankings);

module.exports = router;