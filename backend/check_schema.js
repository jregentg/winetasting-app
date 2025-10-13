const pool = require('./config/database');

async function checkSchema() {
    try {
        console.log('🔍 Vérification du schéma de la base de données...');
        
        // Vérifier la structure de la table tastings
        const tastingsSchema = await pool.query("PRAGMA table_info(tastings)");
        console.log('\n📋 Structure de la table tastings:');
        tastingsSchema.rows.forEach(column => {
            console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? '(PK)' : ''}`);
        });
        
        // Vérifier quelques dégustations existantes
        const existingTastings = await pool.query('SELECT * FROM tastings LIMIT 3');
        console.log(`\n📊 Dégustations existantes (${existingTastings.rows.length}):`);
        existingTastings.rows.forEach((tasting, index) => {
            console.log(`${index + 1}. ID: ${tasting.id}`);
            console.log(`   - User ID: ${tasting.user_id}`);
            console.log(`   - Wine Name: ${tasting.wine_name || 'Non défini'}`);
            console.log(`   - Final Score: ${tasting.final_score}`);
            console.log(`   - Date: ${tasting.tasting_date || tasting.created_at}`);
            console.log('');
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

checkSchema();