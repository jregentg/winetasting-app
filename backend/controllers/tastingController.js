const { validationResult } = require('express-validator');
const pool = require('../config/database');

// Créer une nouvelle dégustation
const createTasting = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { bottleCount, finalScore, answeredQuestions, answers, bottleIdentifier, wineName, wineVintage, wineRegion, wineType, notes } = req.body;
        const userId = req.user.id;

        console.log('🍷 Création dégustation:', { userId, bottleCount, finalScore, answeredQuestions, bottleIdentifier });

        // Simplifier pour les données essentielles disponibles
        const tastingResult = await pool.query(
            `INSERT INTO tastings (user_id, bottle_identifier, wine_name, wine_type, vintage, region, appearance_score, aroma_score, taste_score, finish_score, final_score, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             RETURNING id, tasting_date`,
            [
                userId, 
                bottleIdentifier || null,
                wineName || 'Vin dégusté', 
                wineType || 'Rouge', 
                wineVintage || new Date().getFullYear(), 
                wineRegion || 'Non spécifiée',
                answers?.find(a => a.questionId === 'visual')?.value || 3,
                answers?.find(a => a.questionId === 'first-nose')?.value || 3,
                answers?.find(a => a.questionId === 'mouthfeel')?.value || 3,
                answers?.find(a => a.questionId === 'finish')?.value || 3,
                finalScore,
                notes || 'Dégustation réalisée via l\'application'
            ]
        );

        const tasting = tastingResult.rows[0];
        console.log('✅ Dégustation créée:', tasting);

        res.status(201).json({
            success: true,
            message: 'Dégustation enregistrée avec succès',
            data: {
                id: tasting.id,
                tastingDate: tasting.tasting_date,
                finalScore: parseFloat(finalScore),
                answeredQuestions: answeredQuestions
            }
        });

    } catch (error) {
        console.error('❌ Erreur lors de la création de la dégustation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'enregistrement de la dégustation'
        });
    }
};

// Récupérer les dégustations de l'utilisateur
const getUserTastings = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Compter le total
        const countResult = await pool.query(
            'SELECT COUNT(*) as count FROM tastings WHERE user_id = ?',
            [userId]
        );
        const total = parseInt(countResult.rows[0]?.count || 0);

        // Récupérer les dégustations
        const result = await pool.query(
            `SELECT id, bottle_identifier, wine_name, wine_type, vintage, region, final_score, notes, tasting_date, created_at
             FROM tastings 
             WHERE user_id = ? 
             ORDER BY tasting_date DESC 
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        res.json({
            success: true,
            data: {
                tastings: result.rows.map(tasting => ({
                    id: tasting.id,
                    bottleIdentifier: tasting.bottle_identifier,
                    finalScore: parseFloat(tasting.final_score),
                    tastingDate: tasting.tasting_date || tasting.created_at,
                    wine: {
                        name: tasting.wine_name,
                        vintage: tasting.vintage,
                        region: tasting.region,
                        type: tasting.wine_type
                    },
                    notes: tasting.notes
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des dégustations:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des dégustations'
        });
    }
};

// Récupérer une dégustation spécifique avec ses réponses
const getTastingById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Récupérer la dégustation
        const tastingResult = await pool.query(
            `SELECT id, bottle_count, final_score, answered_questions, total_questions, 
                    tasting_date, wine_name, wine_vintage, wine_region, wine_type, notes
             FROM tastings 
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        if (tastingResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dégustation non trouvée'
            });
        }

        const tasting = tastingResult.rows[0];

        // Récupérer les réponses
        const answersResult = await pool.query(
            `SELECT question_id, question_type, answer_value, answer_text, created_at
             FROM tasting_answers 
             WHERE tasting_id = ? 
             ORDER BY created_at`,
            [id]
        );

        res.json({
            success: true,
            data: {
                id: tasting.id,
                bottleCount: tasting.bottle_count,
                finalScore: parseFloat(tasting.final_score),
                answeredQuestions: tasting.answered_questions,
                totalQuestions: tasting.total_questions,
                tastingDate: tasting.tasting_date,
                wine: {
                    name: tasting.wine_name,
                    vintage: tasting.wine_vintage,
                    region: tasting.wine_region,
                    type: tasting.wine_type
                },
                notes: tasting.notes,
                answers: answersResult.rows.map(answer => ({
                    questionId: answer.question_id,
                    type: answer.question_type,
                    value: answer.answer_value,
                    text: answer.answer_text,
                    createdAt: answer.created_at
                }))
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de la dégustation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération de la dégustation'
        });
    }
};

// Supprimer une dégustation
const deleteTasting = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            'DELETE FROM tastings WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dégustation non trouvée'
            });
        }

        res.json({
            success: true,
            message: 'Dégustation supprimée avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la suppression de la dégustation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la suppression de la dégustation'
        });
    }
};

// Statistiques des dégustations de l'utilisateur
const getUserStatistics = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT 
                COUNT(*) as total_tastings,
                AVG(final_score) as average_score,
                MAX(final_score) as best_score,
                MIN(final_score) as worst_score,
                COUNT(CASE WHEN final_score >= 16 THEN 1 END) as excellent_tastings,
                COUNT(CASE WHEN final_score >= 14 AND final_score < 16 THEN 1 END) as good_tastings,
                COUNT(CASE WHEN final_score >= 12 AND final_score < 14 THEN 1 END) as average_tastings,
                COUNT(CASE WHEN final_score < 12 THEN 1 END) as poor_tastings,
                MAX(tasting_date) as last_tasting_date,
                COUNT(DISTINCT DATE(tasting_date)) as active_days
             FROM tastings 
             WHERE user_id = ?`,
            [userId]
        );

        const stats = result.rows[0];

        res.json({
            success: true,
            data: {
                totalTastings: parseInt(stats.total_tastings),
                averageScore: stats.average_score ? parseFloat(stats.average_score).toFixed(1) : null,
                bestScore: stats.best_score ? parseFloat(stats.best_score).toFixed(1) : null,
                worstScore: stats.worst_score ? parseFloat(stats.worst_score).toFixed(1) : null,
                distribution: {
                    excellent: parseInt(stats.excellent_tastings), // 16-20
                    good: parseInt(stats.good_tastings), // 14-16
                    average: parseInt(stats.average_tastings), // 12-14
                    poor: parseInt(stats.poor_tastings) // <12
                },
                lastTastingDate: stats.last_tasting_date,
                activeDays: parseInt(stats.active_days)
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des statistiques'
        });
    }
};

// Statistiques globales (pour admin)
const getGlobalStatistics = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(DISTINCT u.id) as total_users,
                COUNT(t.id) as total_tastings,
                AVG(t.final_score) as global_average_score,
                MAX(t.final_score) as highest_score,
                COUNT(DISTINCT DATE(t.tasting_date)) as active_days,
                COUNT(CASE WHEN t.tasting_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as tastings_last_30_days,
                COUNT(CASE WHEN u.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_last_30_days
            FROM users u
            LEFT JOIN tastings t ON u.id = t.user_id
            WHERE u.is_active = true
        `);

        const stats = result.rows[0];

        res.json({
            success: true,
            data: {
                totalUsers: parseInt(stats.total_users),
                totalTastings: parseInt(stats.total_tastings),
                globalAverageScore: stats.global_average_score ? parseFloat(stats.global_average_score).toFixed(1) : null,
                highestScore: stats.highest_score ? parseFloat(stats.highest_score).toFixed(1) : null,
                activeDays: parseInt(stats.active_days),
                recentActivity: {
                    tastingsLast30Days: parseInt(stats.tastings_last_30_days),
                    newUsersLast30Days: parseInt(stats.new_users_last_30_days)
                }
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques globales:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des statistiques globales'
        });
    }
};

// Récupérer TOUTES les dégustations (pour arbitre uniquement)
const getAllTastings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        // Compter le total
        const countResult = await pool.query('SELECT COUNT(*) as count FROM tastings');
        const total = parseInt(countResult.rows[0]?.count || 0);

        // Récupérer toutes les dégustations avec infos utilisateur
        const result = await pool.query(
            `SELECT t.id, t.wine_name, t.wine_type, t.vintage, t.region, t.final_score, 
                    t.notes, t.tasting_date, t.created_at,
                    u.username, u.first_name, u.last_name, u.email
             FROM tastings t
             JOIN users u ON t.user_id = u.id
             ORDER BY t.tasting_date DESC 
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: {
                tastings: result.rows.map(tasting => ({
                    id: tasting.id,
                    finalScore: parseFloat(tasting.final_score),
                    tastingDate: tasting.tasting_date || tasting.created_at,
                    wine: {
                        name: tasting.wine_name,
                        vintage: tasting.vintage,
                        region: tasting.region,
                        type: tasting.wine_type
                    },
                    notes: tasting.notes,
                    user: {
                        username: tasting.username,
                        firstName: tasting.first_name,
                        lastName: tasting.last_name,
                        email: tasting.email
                    }
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération de toutes les dégustations:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des dégustations'
        });
    }
};

// Statistiques globales détaillées (pour arbitre)
const getDetailedGlobalStatistics = async (req, res) => {
    try {
        // Statistiques générales
        let statsResult;
        try {
            statsResult = await pool.query(`
                SELECT 
                    COUNT(*) as totalTastings,
                    COUNT(DISTINCT user_id) as totalUsers,
                    AVG(final_score) as averageScore,
                    MIN(final_score) as minScore,
                    MAX(final_score) as maxScore
                FROM tastings
            `);
            console.log('📊 statsResult:', statsResult);
            console.log('📊 statsResult.rows:', statsResult?.rows);
        } catch (sqlError) {
            console.error('❌ Erreur SQL stats:', sqlError);
            statsResult = { rows: [{}] }; // Fallback
        }

        // Top utilisateurs
        const topUsersResult = await pool.query(`
            SELECT 
                u.username, u.first_name, u.last_name,
                COUNT(t.id) as tastingCount,
                AVG(t.final_score) as averageScore,
                MAX(t.final_score) as bestScore
            FROM users u
            LEFT JOIN tastings t ON u.id = t.user_id
            WHERE u.role = 'testeur'
            GROUP BY u.id, u.username, u.first_name, u.last_name
            HAVING tastingCount > 0
            ORDER BY averageScore DESC
            LIMIT 10
        `);

        const stats = statsResult?.rows?.[0];
        console.log('📊 Debug stats:', stats);
        
        // Valeurs par défaut si pas de stats
        const safeStats = {
            totalTastings: stats?.totalTastings || stats?.['COUNT(*)'] || 0,
            totalUsers: stats?.totalUsers || stats?.['COUNT(DISTINCT user_id)'] || 0,
            averageScore: stats?.averageScore || stats?.['AVG(final_score)'] || 0,
            minScore: stats?.minScore || stats?.['MIN(final_score)'] || 0,
            maxScore: stats?.maxScore || stats?.['MAX(final_score)'] || 0
        };
        
        res.json({
            success: true,
            data: {
                global: {
                    totalTastings: parseInt(safeStats.totalTastings),
                    totalUsers: parseInt(safeStats.totalUsers),
                    averageScore: safeStats.averageScore ? parseFloat(safeStats.averageScore).toFixed(1) : null,
                    minScore: safeStats.minScore ? parseFloat(safeStats.minScore) : null,
                    maxScore: safeStats.maxScore ? parseFloat(safeStats.maxScore) : null
                },
                topUsers: topUsersResult.rows.map(user => ({
                    username: user.username,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    tastingCount: parseInt(user.tastingCount),
                    averageScore: parseFloat(user.averageScore).toFixed(1),
                    bestScore: parseFloat(user.bestScore).toFixed(1)
                }))
            }
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des statistiques détaillées:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des statistiques'
        });
    }
};

// Classement des bouteilles par notes
const getBottleRankings = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Debug: vérifier les données existantes + chemin DB
        const path = require('path');
        const dbPath = path.join(__dirname, '..', 'database', 'wine_tasting.db');
        console.log('🔍 Debug - Chemin base de données:', dbPath);
        
        const debugAll = await pool.query(`SELECT id, user_id, bottle_identifier, wine_name FROM tastings WHERE user_id = ?`, [userId]);
        console.log('🔍 Debug - TOUTES les dégustations pour user', userId, ':', debugAll.rows);
        
        const debugResult = await pool.query(`
            SELECT id, user_id, bottle_identifier, wine_name, final_score 
            FROM tastings 
            WHERE user_id = ? AND bottle_identifier IS NOT NULL AND bottle_identifier != ''
        `, [userId]);
        console.log('🔍 Debug - Bouteilles avec bottle_identifier NOT NULL pour user', userId, ':', debugResult.rows);
        
        const debugResultNull = await pool.query(`
            SELECT id, user_id, bottle_identifier, wine_name, final_score 
            FROM tastings 
            WHERE user_id = ? AND bottle_identifier IN ('Bouteille Test', 'Bouteille Premium', '1')
        `, [userId]);
        console.log('🔍 Debug - Bouteilles avec bottle_identifier spécifiques pour user', userId, ':', debugResultNull.rows);

        // Récupérer le classement des bouteilles pour cet utilisateur
        console.log('🔍 Récupération classement pour user:', userId, 'limit:', limit, 'offset:', offset);
        
        const result = await pool.query(`
            SELECT 
                bottle_identifier,
                wine_name,
                wine_type,
                vintage,
                region,
                COUNT(*) as tastingCount,
                AVG(final_score) as averageScore,
                MAX(final_score) as bestScore,
                MIN(final_score) as worstScore,
                MAX(tasting_date) as lastTastingDate
            FROM tastings 
            WHERE user_id = ? AND bottle_identifier IS NOT NULL AND bottle_identifier != 'null' AND bottle_identifier != ''
            GROUP BY bottle_identifier, wine_name, wine_type, vintage, region
            ORDER BY averageScore DESC, tastingCount DESC
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);
        
        console.log('🔍 Résultats principale requête:', result);

        // Compter le total pour la pagination
        const countResult = await pool.query(`
            SELECT COUNT(DISTINCT bottle_identifier) as count 
            FROM tastings 
            WHERE user_id = ? AND bottle_identifier IS NOT NULL AND bottle_identifier != 'null' AND bottle_identifier != ''
        `, [userId]);

        console.log('Debug countResult:', countResult);
        console.log('Debug countResult.rows:', countResult.rows);
        console.log('Debug countResult.rows[0]:', countResult.rows[0]);

        const total = parseInt(countResult.rows[0]?.count || 0);

        res.json({
            success: true,
            data: {
                rankings: result.rows.map((bottle, index) => ({
                    rank: offset + index + 1,
                    bottleIdentifier: bottle.bottle_identifier,
                    wine: {
                        name: bottle.wine_name || 'Vin non spécifié',
                        type: bottle.wine_type || 'Non spécifié',
                        vintage: bottle.vintage,
                        region: bottle.region || 'Non spécifiée'
                    },
                    statistics: {
                        tastingCount: parseInt(bottle.tastingCount),
                        averageScore: parseFloat(bottle.averageScore).toFixed(1),
                        bestScore: parseFloat(bottle.bestScore).toFixed(1),
                        worstScore: parseFloat(bottle.worstScore).toFixed(1)
                    },
                    lastTastingDate: bottle.lastTastingDate
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération du classement des bouteilles:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération du classement'
        });
    }
};

// Classement global des bouteilles (pour arbitre)
const getGlobalBottleRankings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Récupérer le classement global des bouteilles
        const result = await pool.query(`
            SELECT 
                t.bottle_identifier,
                t.wine_name,
                t.wine_type,
                t.vintage,
                t.region,
                COUNT(*) as tastingCount,
                AVG(t.final_score) as averageScore,
                MAX(t.final_score) as bestScore,
                MIN(t.final_score) as worstScore,
                MAX(t.tasting_date) as lastTastingDate,
                COUNT(DISTINCT t.user_id) as userCount
            FROM tastings t
            WHERE t.bottle_identifier IS NOT NULL
            GROUP BY t.bottle_identifier, t.wine_name, t.wine_type, t.vintage, t.region
            ORDER BY averageScore DESC, tastingCount DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        // Compter le total pour la pagination
        const countResult = await pool.query(`
            SELECT COUNT(DISTINCT bottle_identifier) as count 
            FROM tastings 
            WHERE bottle_identifier IS NOT NULL
        `);

        const total = parseInt(countResult.rows[0]?.count || 0);

        res.json({
            success: true,
            data: {
                rankings: result.rows.map((bottle, index) => ({
                    rank: offset + index + 1,
                    bottleIdentifier: bottle.bottle_identifier,
                    wine: {
                        name: bottle.wine_name || 'Vin non spécifié',
                        type: bottle.wine_type || 'Non spécifié',
                        vintage: bottle.vintage,
                        region: bottle.region || 'Non spécifiée'
                    },
                    statistics: {
                        tastingCount: parseInt(bottle.tastingCount),
                        averageScore: parseFloat(bottle.averageScore).toFixed(1),
                        bestScore: parseFloat(bottle.bestScore).toFixed(1),
                        worstScore: parseFloat(bottle.worstScore).toFixed(1),
                        userCount: parseInt(bottle.userCount)
                    },
                    lastTastingDate: bottle.lastTastingDate
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération du classement global des bouteilles:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération du classement global'
        });
    }
};

module.exports = {
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
};// Force reload
