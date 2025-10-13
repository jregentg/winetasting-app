const pool = require('../config/database');
const { validationResult } = require('express-validator');

// Créer une nouvelle session de dégustation
const createSession = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { name, type = 'standard' } = req.body;
        const createdBy = req.user.id;

        const result = await pool.query(
            'INSERT INTO tasting_sessions (name, type, created_by) VALUES (?, ?, ?) RETURNING *',
            [name, type, createdBy]
        );

        res.status(201).json({
            success: true,
            message: 'Session créée avec succès',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Erreur création session:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la session'
        });
    }
};

// Récupérer toutes les sessions
const getAllSessions = async (req, res) => {
    try {
        console.log('🔍 Recherche des sessions...');
        
        // Requête simplifiée d'abord
        const simpleResult = await pool.query('SELECT * FROM tasting_sessions ORDER BY created_at DESC');
        console.log('📊 Sessions trouvées:', simpleResult.rows.length);
        console.log('📊 Données:', simpleResult.rows);
        
        // Mapper les données simplement
        const sessions = simpleResult.rows.map(session => ({
            ...session,
            bottle_count: 0,
            participant_count: 0,
            created_by_name: 'Admin'
        }));
        
        console.log('📋 Sessions mappées:', sessions.length);

        res.json({
            success: true,
            data: sessions
        });

    } catch (error) {
        console.error('Erreur récupération sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des sessions'
        });
    }
};

// Récupérer une session spécifique
const getSession = async (req, res) => {
    try {
        const { id } = req.params;

        const sessionResult = await pool.query(
            'SELECT * FROM tasting_sessions WHERE id = ?',
            [id]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session non trouvée'
            });
        }

        // Récupérer les bouteilles de la session
        const bottlesResult = await pool.query(
            'SELECT * FROM bottles WHERE session_id = ? ORDER BY bottle_number',
            [parseInt(id, 10)]
        );

        // Récupérer les participants
        const participantsResult = await pool.query(`
            SELECT us.*, u.username, u.first_name, u.email
            FROM user_sessions us
            JOIN users u ON us.user_id = u.id
            WHERE us.session_id = ?
        `, [parseInt(id, 10)]);

        res.json({
            success: true,
            data: {
                session: sessionResult.rows[0],
                bottles: bottlesResult.rows,
                participants: participantsResult.rows
            }
        });

    } catch (error) {
        console.error('Erreur récupération session:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la session'
        });
    }
};

// Ajouter une bouteille à une session
const addBottleToSession = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { sessionId } = req.params;
        const { bottleNumber, customName, wineDetails } = req.body;

        // Vérifier que la session existe
        const sessionCheck = await pool.query(
            'SELECT id FROM tasting_sessions WHERE id = ?',
            [sessionId]
        );

        if (sessionCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session non trouvée'
            });
        }

        // Vérifier que le numéro de bouteille n'existe pas déjà
        const bottleCheck = await pool.query(
            'SELECT id FROM bottles WHERE session_id = ? AND bottle_number = ?',
            [parseInt(sessionId, 10), bottleNumber]
        );

        if (bottleCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Une bouteille avec ce numéro existe déjà dans cette session'
            });
        }

        const result = await pool.query(
            'INSERT INTO bottles (session_id, bottle_number, custom_name, wine_details) VALUES (?, ?, ?, ?) RETURNING *',
            [sessionId, bottleNumber, customName, wineDetails]
        );

        res.status(201).json({
            success: true,
            message: 'Bouteille ajoutée avec succès',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Erreur ajout bouteille:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout de la bouteille'
        });
    }
};

// Supprimer une bouteille
const removeBottleFromSession = async (req, res) => {
    try {
        const { bottleId } = req.params;

        const result = await pool.query(
            'DELETE FROM bottles WHERE id = ?',
            [bottleId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bouteille non trouvée'
            });
        }

        res.json({
            success: true,
            message: 'Bouteille supprimée avec succès'
        });

    } catch (error) {
        console.error('Erreur suppression bouteille:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la bouteille'
        });
    }
};

// Mettre à jour le statut d'une session
const updateSessionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['setup', 'active', 'completed', 'archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide'
            });
        }

        // Si on active une session, d'abord désactiver toutes les autres sessions actives
        if (status === 'active') {
            console.log('🔄 Désactivation des autres sessions actives...');
            await pool.query(
                'UPDATE tasting_sessions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE status = ? AND id != ?',
                ['setup', 'active', parseInt(id, 10)]
            );
            console.log('✅ Autres sessions désactivées');
        }

        const result = await pool.query(
            'UPDATE tasting_sessions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, parseInt(id, 10)]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session non trouvée'
            });
        }

        console.log(`✅ Session ${id} mise à jour avec statut: ${status}`);

        res.json({
            success: true,
            message: 'Statut de la session mis à jour'
        });

    } catch (error) {
        console.error('Erreur mise à jour session:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la session'
        });
    }
};

// Ajouter un participant à une session
const addParticipantToSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { userId } = req.body;

        // Vérifier que l'utilisateur existe
        const userCheck = await pool.query(
            'SELECT id FROM users WHERE id = ? AND role = ?',
            [userId, 'testeur']
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Participant non trouvé'
            });
        }

        // Vérifier que le participant n'est pas déjà dans la session
        const participantCheck = await pool.query(
            'SELECT id FROM user_sessions WHERE user_id = ? AND session_id = ?',
            [userId, sessionId]
        );

        if (participantCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Le participant est déjà inscrit à cette session'
            });
        }

        const result = await pool.query(
            'INSERT INTO user_sessions (user_id, session_id) VALUES (?, ?) RETURNING *',
            [userId, sessionId]
        );

        res.status(201).json({
            success: true,
            message: 'Participant ajouté à la session',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Erreur ajout participant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout du participant'
        });
    }
};

// Supprimer une session entière
const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Demande de suppression session ID:', id);

        // Vérifier que la session existe
        const sessionCheck = await pool.query(
            'SELECT id FROM tasting_sessions WHERE id = ?',
            [id]
        );

        console.log('🔍 Session check result:', sessionCheck);

        if (sessionCheck.rows.length === 0) {
            console.log('❌ Session non trouvée');
            return res.status(404).json({
                success: false,
                message: 'Session non trouvée'
            });
        }

        // Supprimer d'abord les bouteilles associées
        console.log('🍾 Suppression des bouteilles...');
        const bottlesResult = await pool.query('DELETE FROM bottles WHERE session_id = ?', [parseInt(id, 10)]);
        console.log('🍾 Bouteilles supprimées:', bottlesResult);
        
        // Supprimer les participants associés
        console.log('👥 Suppression des participants...');
        const participantsResult = await pool.query('DELETE FROM user_sessions WHERE session_id = ?', [parseInt(id, 10)]);
        console.log('👥 Participants supprimés:', participantsResult);
        
        // Supprimer la session
        console.log('🗑️ Suppression de la session...');
        const result = await pool.query(
            'DELETE FROM tasting_sessions WHERE id = ?',
            [parseInt(id, 10)]
        );

        console.log('🗑️ Résultat suppression session:', result);
        console.log('🔢 rowCount:', result.rowCount);

        if (result.rowCount === 0) {
            console.log('❌ Aucune session supprimée (rowCount = 0)');
            return res.status(404).json({
                success: false,
                message: 'Session non trouvée'
            });
        }

        console.log('✅ Session supprimée avec succès');
        res.json({
            success: true,
            message: 'Session supprimée avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur suppression session:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la session'
        });
    }
};

// === ROUTES POUR TESTEURS ===

// Récupérer les sessions actives disponibles pour les testeurs
const getAvailableSessions = async (req, res) => {
    try {
        console.log('🔍 Recherche des sessions actives...');
        
        // Utilisation de la requête simple qui fonctionne
        const result = await pool.query('SELECT * FROM tasting_sessions WHERE status = ?', ['active']);
        
        // Ajouter bottle_count pour chaque session (simple pour l'instant)
        const sessions = result.rows.map(session => ({
            ...session,
            bottle_count: 0 // Pour l'instant, on peut calculer cela plus tard si nécessaire
        }));
        
        console.log('📊 Sessions actives trouvées:', sessions.length);
        
        res.json({
            success: true,
            data: sessions
        });

    } catch (error) {
        console.error('Erreur récupération sessions actives:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des sessions actives'
        });
    }
};

// Rejoindre une session de dégustation
const joinSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        
        console.log('👤 Tentative d\'adhésion - User:', userId, 'Session:', sessionId);
        
        // Vérifier que la session existe et est active
        const sessionCheck = await pool.query(
            'SELECT id, status FROM tasting_sessions WHERE id = ? AND status = ?',
            [sessionId, 'active']
        );

        if (sessionCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session non trouvée ou non active'
            });
        }

        // Vérifier si l'utilisateur est déjà dans la session
        const participantCheck = await pool.query(
            'SELECT id, status, current_bottle FROM user_sessions WHERE user_id = ? AND session_id = ?',
            [userId, sessionId]
        );

        if (participantCheck.rows.length > 0) {
            // L'utilisateur est déjà dans la session
            const userSession = participantCheck.rows[0];
            console.log('📋 Utilisateur déjà inscrit, status:', userSession.status);
            
            return res.json({
                success: true,
                message: 'Session rejointe',
                data: {
                    userSession,
                    alreadyJoined: true
                }
            });
        }

        // Ajouter l'utilisateur à la session
        const result = await pool.query(
            'INSERT INTO user_sessions (user_id, session_id, status, current_bottle) VALUES (?, ?, ?, ?) RETURNING *',
            [userId, sessionId, 'waiting', 1]
        );

        console.log('✅ Utilisateur ajouté à la session');
        
        res.json({
            success: true,
            message: 'Session rejointe avec succès',
            data: {
                userSession: result.rows[0],
                alreadyJoined: false
            }
        });

    } catch (error) {
        console.error('Erreur adhésion session:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'adhésion à la session'
        });
    }
};

// Récupérer les détails d'une session pour un testeur
const getSessionForTaster = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        
        console.log('📋 Récupération session pour testeur - User:', userId, 'Session:', sessionId);
        
        // Récupérer les détails de la session
        const sessionResult = await pool.query(
            'SELECT * FROM tasting_sessions WHERE id = ?',
            [sessionId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session non trouvée'
            });
        }

        // Récupérer les bouteilles de la session triées par numéro
        const bottlesResult = await pool.query(
            'SELECT * FROM bottles WHERE session_id = ? ORDER BY bottle_number',
            [parseInt(sessionId, 10)]
        );

        // Récupérer le statut de l'utilisateur dans la session
        const userSessionResult = await pool.query(
            'SELECT * FROM user_sessions WHERE user_id = ? AND session_id = ?',
            [parseInt(userId, 10), parseInt(sessionId, 10)]
        );

        if (userSessionResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'êtes pas inscrit à cette session'
            });
        }

        res.json({
            success: true,
            data: {
                session: sessionResult.rows[0],
                bottles: bottlesResult.rows,
                userSession: userSessionResult.rows[0]
            }
        });

    } catch (error) {
        console.error('Erreur récupération session testeur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la session'
        });
    }
};

module.exports = {
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
};