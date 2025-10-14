const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || './database/wine_tasting.db';
const schemaPath = path.join(__dirname, 'schema_sqlite.sql');

console.log('Starting database migration...');

// Créer le répertoire database s'il n'existe pas
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created directory: ${dbDir}`);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Lire et exécuter le schéma SQL
if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error executing schema:', err.message);
            process.exit(1);
        }
        console.log('Database schema created successfully');
        
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
                process.exit(1);
            }
            console.log('Database migration completed');
        });
    });
} else {
    console.error(`Schema file not found: ${schemaPath}`);
    process.exit(1);
}