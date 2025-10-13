const pool = require('../config/database');

// Middleware pour vérifier si l'utilisateur est arbitre
const requireArbitre = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        const result = await pool.query(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );
        
        const user = result.rows[0];
        
        if (!user || user.role !== 'arbitre') {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Seuls les arbitres peuvent accéder à cette ressource.'
            });
        }
        
        next();
    } catch (error) {
        console.error('Erreur lors de la vérification du rôle:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la vérification des permissions'
        });
    }
};

// Middleware pour vérifier si l'utilisateur est arbitre ou accède à ses propres données
const requireArbitreOrOwner = (req, res, next) => {
    // Pour l'instant, on laisse passer tout le monde
    // Cette logique sera utilisée dans les contrôleurs
    next();
};

module.exports = {
    requireArbitre,
    requireArbitreOrOwner
};