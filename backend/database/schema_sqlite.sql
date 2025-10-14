-- Base de données Wine Tasting Multi-utilisateurs
-- Version SQLite compatible avec le backend existant

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'testeur',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    needs_password_setup BOOLEAN DEFAULT 0
);

-- Table des dégustations
CREATE TABLE IF NOT EXISTS tastings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    wine_name TEXT NOT NULL,
    wine_type TEXT,
    vintage INTEGER,
    region TEXT,
    producer TEXT,
    appearance_score INTEGER,
    aroma_score INTEGER,
    taste_score INTEGER,
    finish_score INTEGER,
    final_score REAL,
    notes TEXT,
    tasting_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Table des réinitialisations de mots de passe
CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Table des sessions de dégustation
CREATE TABLE IF NOT EXISTS tasting_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'standard', -- 'standard' ou 'blind'
    status TEXT NOT NULL DEFAULT 'setup', -- 'setup', 'active', 'completed', 'archived'
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Table des bouteilles
CREATE TABLE IF NOT EXISTS bottles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    bottle_number INTEGER NOT NULL,
    custom_name TEXT, -- Nom personnalisé (Saumur, Bordeaux, etc.)
    wine_details TEXT, -- JSON avec détails du vin
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES tasting_sessions (id)
);

-- Table des sessions utilisateur (participants aux sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    can_restart BOOLEAN DEFAULT 1,
    current_bottle INTEGER DEFAULT 1,
    status TEXT DEFAULT 'waiting', -- 'waiting', 'in_progress', 'completed'
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, session_id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (session_id) REFERENCES tasting_sessions (id)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_tastings_user_id ON tastings(user_id);
CREATE INDEX IF NOT EXISTS idx_tastings_date ON tastings(tasting_date DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_bottles_session ON bottles(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session ON user_sessions(session_id);