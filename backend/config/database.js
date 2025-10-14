require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Configuration pour SQLite en développement
const dbPath = path.join(__dirname, '..', 'database', 'wine_tasting.db');
const db = new sqlite3.Database(dbPath);

// Adapter l'interface pour être compatible avec pg
const pool = {
    query: (text, params = []) => {
        return new Promise((resolve, reject) => {
            if (text.includes('RETURNING')) {
                // Gérer les requêtes RETURNING de PostgreSQL
                const insertSql = text.replace(/RETURNING.*$/, '');
                
                db.run(insertSql, params, function(err) {
                    if (err) {
                        return reject(err);
                    }
                    
                    // Pour SQLite, récupérer l'enregistrement inséré
                    const id = this.lastID;
                    
                    // Déterminer la table à partir de la requête
                    let tableName = 'users'; // par défaut
                    if (insertSql.includes('INSERT INTO tastings')) {
                        tableName = 'tastings';
                    }
                    
                    const selectSql = `SELECT * FROM ${tableName} WHERE id = ?`;
                    
                    db.get(selectSql, [id], (err, row) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve({ rows: row ? [row] : [] });
                    });
                });
            } else if (text.toLowerCase().startsWith('select')) {
                // Requête SELECT
                db.all(text, params, (err, rows) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve({ rows: rows || [] });
                });
            } else {
                // Autres requêtes (UPDATE, DELETE, etc.)
                db.run(text, params, function(err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve({ rows: [], rowCount: this.changes });
                });
            }
        });
    }
};

// Initialiser les tables
const initTables = () => {
    const createUsersTable = `
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
            last_login DATETIME
        )
    `;

    const createTastingsTable = `
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
        )
    `;

    const createPasswordResetsTable = `
        CREATE TABLE IF NOT EXISTS password_resets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            used BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `;

    const createTastingSessionsTable = `
        CREATE TABLE IF NOT EXISTS tasting_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'standard', -- 'standard' ou 'blind'
            status TEXT NOT NULL DEFAULT 'setup', -- 'setup', 'active', 'completed', 'archived'
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    `;

    const createBottlesTable = `
        CREATE TABLE IF NOT EXISTS bottles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            bottle_number INTEGER NOT NULL,
            custom_name TEXT, -- Nom personnalisé (Saumur, Bordeaux, etc.)
            wine_details TEXT, -- JSON avec détails du vin
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES tasting_sessions (id)
        )
    `;

    const createUserSessionsTable = `
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
        )
    `;

    db.serialize(() => {
        db.run(createUsersTable, (err) => {
            if (err) {
                console.error('❌ Erreur création table users:', err);
            } else {
                console.log('✅ Table users créée/vérifiée');
                
                // Ajouter la colonne role si elle n'existe pas
                db.run('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "testeur"', (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.log('📝 Colonne role déjà existante ou erreur:', err.message);
                    } else if (!err) {
                        console.log('✅ Colonne role ajoutée');
                    }
                });

                // Ajouter la colonne needs_password_setup pour les nouveaux participants
                db.run('ALTER TABLE users ADD COLUMN needs_password_setup BOOLEAN DEFAULT 0', (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.log('📝 Colonne needs_password_setup déjà existante ou erreur:', err.message);
                    } else if (!err) {
                        console.log('✅ Colonne needs_password_setup ajoutée');
                    }
                });
                
                // Créer le compte arbitre par défaut
                const bcrypt = require('bcryptjs');
                bcrypt.hash('Arbitre123!', 12, (err, hash) => {
                    if (err) {
                        console.error('❌ Erreur hash mot de passe arbitre:', err);
                        return;
                    }
                    
                    db.run(
                        'INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
                        ['arbitre', 'arbitre@winetasting.app', hash, 'Compte', 'Arbitre', 'arbitre'],
                        function(err) {
                            if (err) {
                                console.log('📝 Compte arbitre existe déjà ou erreur:', err.message);
                            } else if (this.changes > 0) {
                                console.log('🎯 Compte arbitre créé: arbitre@winetasting.app / Arbitre123!');
                            }
                        }
                    );
                });
            }
        });

        db.run(createTastingsTable, (err) => {
            if (err) {
                console.error('❌ Erreur création table tastings:', err);
            } else {
                console.log('✅ Table tastings créée/vérifiée');
                
                // Ajouter la colonne bottle_identifier si elle n'existe pas
                db.run('ALTER TABLE tastings ADD COLUMN bottle_identifier TEXT', (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.log('📝 Colonne bottle_identifier déjà existante ou erreur:', err.message);
                    } else if (!err) {
                        console.log('✅ Colonne bottle_identifier ajoutée');
                    }
                });
            }
        });

        db.run(createPasswordResetsTable, (err) => {
            if (err) {
                console.error('❌ Erreur création table password_resets:', err);
            } else {
                console.log('✅ Table password_resets créée/vérifiée');
            }
        });

        db.run(createTastingSessionsTable, (err) => {
            if (err) {
                console.error('❌ Erreur création table tasting_sessions:', err);
            } else {
                console.log('✅ Table tasting_sessions créée/vérifiée');
            }
        });

        db.run(createBottlesTable, (err) => {
            if (err) {
                console.error('❌ Erreur création table bottles:', err);
            } else {
                console.log('✅ Table bottles créée/vérifiée');
            }
        });

        db.run(createUserSessionsTable, (err) => {
            if (err) {
                console.error('❌ Erreur création table user_sessions:', err);
            } else {
                console.log('✅ Table user_sessions créée/vérifiée');
            }
        });
    });
};

// Initialiser la base de données
console.log('🚀 Initialisation de la base de données SQLite...');
initTables();
console.log('✅ Connecté à la base de données SQLite');

module.exports = pool;