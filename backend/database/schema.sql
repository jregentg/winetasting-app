-- Base de données Wine Tasting Multi-utilisateurs
-- Création des tables pour gérer les utilisateurs et dégustations

-- Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Table des dégustations
CREATE TABLE tastings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bottle_count INTEGER NOT NULL DEFAULT 1,
    final_score DECIMAL(4,2) NOT NULL CHECK (final_score >= 0 AND final_score <= 20),
    answered_questions INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 5,
    tasting_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    wine_name VARCHAR(255),
    wine_vintage INTEGER,
    wine_region VARCHAR(255),
    wine_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des réponses aux questions
CREATE TABLE tasting_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tasting_id UUID NOT NULL REFERENCES tastings(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('rating', 'choice')),
    answer_value INTEGER NOT NULL CHECK (answer_value >= 1 AND answer_value <= 5),
    answer_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des sessions (optionnel pour gérer les sessions utilisateur)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address INET
);

-- Index pour optimiser les performances
CREATE INDEX idx_tastings_user_id ON tastings(user_id);
CREATE INDEX idx_tastings_date ON tastings(tasting_date DESC);
CREATE INDEX idx_tasting_answers_tasting_id ON tasting_answers(tasting_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour la table users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vues utiles pour les statistiques
CREATE VIEW user_statistics AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    COUNT(t.id) as total_tastings,
    AVG(t.final_score) as average_score,
    MAX(t.final_score) as best_score,
    MIN(t.final_score) as worst_score,
    MAX(t.tasting_date) as last_tasting_date,
    u.created_at as registration_date
FROM users u
LEFT JOIN tastings t ON u.id = t.user_id
GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.created_at;

-- Vue pour les statistiques globales
CREATE VIEW global_statistics AS
SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(t.id) as total_tastings,
    AVG(t.final_score) as global_average_score,
    MAX(t.final_score) as highest_score,
    COUNT(DISTINCT DATE(t.tasting_date)) as active_days
FROM users u
LEFT JOIN tastings t ON u.id = t.user_id
WHERE u.is_active = true;