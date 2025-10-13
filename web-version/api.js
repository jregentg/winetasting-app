// API Client pour Wine Tasting App
class WineTastingAPI {
    constructor() {
        // Configuration automatique de l'URL pour développement et production
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            this.baseURL = 'http://localhost:3000/api';
        } else if (hostname === '192.168.1.16') {
            this.baseURL = 'http://192.168.1.16:3000/api';
        } else if (hostname === 'winetasting.uno' || hostname.includes('onrender.com')) {
            // Production Render.com
            this.baseURL = 'https://winetasting-app.onrender.com/api';
        } else {
            // Fallback vers l'IP réseau local
            this.baseURL = `http://${hostname}:3000/api`;
        }
        this.token = localStorage.getItem('wine_tasting_token');
    }

    // Configuration des headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Gestion des erreurs
    async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                this.logout();
                throw new Error('Session expirée, veuillez vous reconnecter');
            }
            throw new Error(data.message || 'Erreur serveur');
        }
        
        return data;
    }

    // Authentification
    async register(userData) {
        try {
            console.log('🔧 API register - URL:', `${this.baseURL}/auth/register`);
            console.log('🔧 API register - Headers:', this.getHeaders());
            console.log('🔧 API register - Body:', JSON.stringify(userData));
            
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(userData)
            });
            
            console.log('🔧 API register - Response status:', response.status);
            console.log('🔧 API register - Response headers:', [...response.headers.entries()]);
            
            const data = await this.handleResponse(response);
            
            if (data.success && data.data.token) {
                this.token = data.data.token;
                localStorage.setItem('wine_tasting_token', this.token);
                localStorage.setItem('wine_tasting_user', JSON.stringify(data.data.user));
            }
            
            return data;
        } catch (error) {
            console.error('❌ Erreur API register:', error);
            throw error;
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ email, password })
            });
            
            const data = await this.handleResponse(response);
            
            if (data.success && data.data.token) {
                this.token = data.data.token;
                localStorage.setItem('wine_tasting_token', this.token);
                localStorage.setItem('wine_tasting_user', JSON.stringify(data.data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            throw error;
        }
    }

    async getProfile() {
        try {
            const response = await fetch(`${this.baseURL}/auth/profile`, {
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la récupération du profil:', error);
            throw error;
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('wine_tasting_token');
        localStorage.removeItem('wine_tasting_user');
    }

    // Dégustations
    async createTasting(tastingData) {
        try {
            const response = await fetch(`${this.baseURL}/tastings`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(tastingData)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la création de la dégustation:', error);
            throw error;
        }
    }

    async getTastings(page = 1, limit = 20) {
        try {
            const response = await fetch(`${this.baseURL}/tastings?page=${page}&limit=${limit}`, {
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la récupération des dégustations:', error);
            throw error;
        }
    }

    async getTasting(id) {
        try {
            const response = await fetch(`${this.baseURL}/tastings/${id}`, {
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la récupération de la dégustation:', error);
            throw error;
        }
    }

    async deleteTasting(id) {
        try {
            const response = await fetch(`${this.baseURL}/tastings/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la suppression de la dégustation:', error);
            throw error;
        }
    }

    async getStatistics() {
        try {
            const response = await fetch(`${this.baseURL}/tastings/statistics`, {
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            throw error;
        }
    }

    async getGlobalStatistics() {
        try {
            const response = await fetch(`${this.baseURL}/tastings/global-statistics`, {
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques globales:', error);
            throw error;
        }
    }

    // Fonctions pour arbitre uniquement
    async getAllTastings(page = 1, limit = 50) {
        try {
            const response = await fetch(`${this.baseURL}/tastings/admin/all?page=${page}&limit=${limit}`, {
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la récupération de toutes les dégustations:', error);
            throw error;
        }
    }

    async getDetailedGlobalStatistics() {
        try {
            const response = await fetch(`${this.baseURL}/tastings/admin/detailed-statistics`, {
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques détaillées:', error);
            throw error;
        }
    }

    // Classement des bouteilles
    async getBottleRankings(page = 1, limit = 20) {
        try {
            const response = await fetch(`${this.baseURL}/tastings/rankings?page=${page}&limit=${limit}`, {
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la récupération du classement des bouteilles:', error);
            throw error;
        }
    }

    async getGlobalBottleRankings(page = 1, limit = 20) {
        try {
            const response = await fetch(`${this.baseURL}/tastings/admin/rankings?page=${page}&limit=${limit}`, {
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la récupération du classement global des bouteilles:', error);
            throw error;
        }
    }

    // === SESSIONS POUR TESTEURS ===

    // Récupérer les sessions actives disponibles pour les testeurs
    async getAvailableSessions() {
        try {
            const response = await fetch(`${this.baseURL}/sessions/available`, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la récupération des sessions disponibles:', error);
            throw error;
        }
    }

    // Rejoindre une session de dégustation
    async joinSession(sessionId) {
        try {
            const response = await fetch(`${this.baseURL}/sessions/${sessionId}/join`, {
                method: 'POST',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de l\'adhésion à la session:', error);
            throw error;
        }
    }

    // Récupérer les détails d'une session pour un testeur
    async getSessionForTaster(sessionId) {
        try {
            const response = await fetch(`${this.baseURL}/sessions/${sessionId}/taster`, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la récupération de la session:', error);
            throw error;
        }
    }

    // Réinitialisation de mot de passe
    async requestPasswordReset(email) {
        try {
            const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ email })
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la demande de réinitialisation:', error);
            throw error;
        }
    }

    async resetPassword(token, newPassword) {
        try {
            const response = await fetch(`${this.baseURL}/auth/reset-password`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ token, newPassword })
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la réinitialisation du mot de passe:', error);
            throw error;
        }
    }

    // Vérification de l'état de connexion
    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('wine_tasting_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            return null;
        }
    }

    isArbitre() {
        const user = this.getCurrentUser();
        return user && user.role === 'arbitre';
    }

    // Test de connexion API
    async testConnection() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '')}/api/health`);
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Erreur de connexion à l\'API:', error);
            return false;
        }
    }

    // === ADMINISTRATION UTILISATEURS ===

    // Récupérer tous les utilisateurs (arbitre uniquement)
    async getAllUsers() {
        try {
            const response = await fetch(`${this.baseURL}/auth/admin/users`, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            throw error;
        }
    }

    // Créer un utilisateur (arbitre uniquement)
    async createUser(userData) {
        try {
            const response = await fetch(`${this.baseURL}/auth/admin/users`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(userData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            throw error;
        }
    }

    // Supprimer un utilisateur (arbitre uniquement)
    async deleteUser(userId) {
        try {
            const response = await fetch(`${this.baseURL}/auth/admin/users/${userId}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur:', error);
            throw error;
        }
    }

    // === GESTION DES SESSIONS ===

    // Créer une session de dégustation (arbitre uniquement)
    async createSession(sessionData) {
        try {
            const response = await fetch(`${this.baseURL}/sessions`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(sessionData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la création de la session:', error);
            throw error;
        }
    }

    // Récupérer toutes les sessions (arbitre uniquement)
    async getAllSessions() {
        try {
            const response = await fetch(`${this.baseURL}/sessions/admin/all`, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la récupération des sessions:', error);
            throw error;
        }
    }

    // Récupérer une session spécifique (arbitre uniquement)
    async getSession(sessionId) {
        try {
            // Ajouter un timestamp pour éviter le cache
            const cacheBuster = Date.now();
            const response = await fetch(`${this.baseURL}/sessions/${sessionId}?t=${cacheBuster}`, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la récupération de la session:', error);
            throw error;
        }
    }

    // Ajouter une bouteille à une session (arbitre uniquement)
    async addBottleToSession(sessionId, bottleData) {
        try {
            const response = await fetch(`${this.baseURL}/sessions/${sessionId}/bottles`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(bottleData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de l\'ajout de la bouteille:', error);
            throw error;
        }
    }

    // Supprimer une bouteille (arbitre uniquement)
    async removeBottleFromSession(bottleId) {
        try {
            const response = await fetch(`${this.baseURL}/sessions/bottles/${bottleId}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la suppression de la bouteille:', error);
            throw error;
        }
    }

    // Mettre à jour le statut d'une session (arbitre uniquement)
    async updateSessionStatus(sessionId, status) {
        try {
            const response = await fetch(`${this.baseURL}/sessions/${sessionId}/status`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({ status })
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
            throw error;
        }
    }

    // Supprimer une session entière (arbitre uniquement)
    async deleteSession(sessionId) {
        try {
            console.log('🔧 API deleteSession - sessionId:', sessionId);
            console.log('🔧 API deleteSession - URL:', `${this.baseURL}/sessions/${sessionId}`);
            console.log('🔧 API deleteSession - Headers:', this.getHeaders());
            
            const response = await fetch(`${this.baseURL}/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            
            console.log('🔧 API deleteSession - Response status:', response.status);
            console.log('🔧 API deleteSession - Response headers:', [...response.headers.entries()]);
            
            const data = await this.handleResponse(response);
            console.log('🔧 API deleteSession - Response data:', data);
            
            return data;
        } catch (error) {
            console.error('❌ Erreur lors de la suppression de la session:', error);
            throw error;
        }
    }

    // Ajouter un participant à une session (arbitre uniquement)
    async addParticipantToSession(sessionId, userId) {
        try {
            const response = await fetch(`${this.baseURL}/sessions/${sessionId}/participants`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ userId })
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de l\'ajout du participant:', error);
            throw error;
        }
    }

    // === SUPPRESSION DES DONNÉES ===

    // Supprimer toutes les données (arbitre uniquement)
    async resetAllData() {
        try {
            const response = await fetch(`${this.baseURL}/auth/admin/reset-all-data`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur lors de la suppression des données:', error);
            throw error;
        }
    }
}

// Instance globale de l'API
const api = new WineTastingAPI();