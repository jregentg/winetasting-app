const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token d\'accès requis' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Vérifier si l'utilisateur existe toujours
        const userResult = await pool.query(
            'SELECT id, username, email, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Utilisateur non trouvé' 
            });
        }

        const user = userResult.rows[0];
        
        if (!user.is_active) {
            return res.status(401).json({ 
                success: false, 
                message: 'Compte utilisateur désactivé' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token invalide' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expiré' 
            });
        }

        console.error('Erreur d\'authentification:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur lors de l\'authentification' 
        });
    }
};

module.exports = auth;