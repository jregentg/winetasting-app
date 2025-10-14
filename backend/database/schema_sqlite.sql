-- Base de données Wine Tasting Multi-utilisateurs
-- Version SQLite
-- Création des tables pour gérer les utilisateurs et dégustations

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1
);

-- Table des dégustations
CREATE TABLE IF NOT EXISTS tastings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    bottle_count INTEGER NOT NULL DEFAULT 1,
    final_score REAL NOT NULL CHECK (final_score >= 0 AND final_score <= 20),
    answered_questions INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 5,
    tasting_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    wine_name TEXT,
    wine_vintage INTEGER,
    wine_region TEXT,
    wine_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des réponses aux questions
CREATE TABLE IF NOT EXISTS tasting_answers (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tasting_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('rating', 'choice')),
    answer_value INTEGER NOT NULL CHECK (answer_value >= 1 AND answer_value <= 5),
    answer_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tasting_id) REFERENCES tastings(id) ON DELETE CASCADE
);

-- Table des sessions (optionnel pour gérer les sessions utilisateur)
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_tastings_user_id ON tastings(user_id);
CREATE INDEX IF NOT EXISTS idx_tastings_date ON tastings(tasting_date DESC);
CREATE INDEX IF NOT EXISTS idx_tasting_answers_tasting_id ON tasting_answers(tasting_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
    AFTER UPDATE ON users 
    FOR EACH ROW 
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Vues utiles pour les statistiques
CREATE VIEW IF NOT EXISTS user_statistics AS
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
CREATE VIEW IF NOT EXISTS global_statistics AS
SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(t.id) as total_tastings,
    AVG(t.final_score) as global_average_score,
    MAX(t.final_score) as highest_score,
    COUNT(DISTINCT DATE(t.tasting_date)) as active_days
FROM users u
LEFT JOIN tastings t ON u.id = t.user_id
WHERE u.is_active = 1;