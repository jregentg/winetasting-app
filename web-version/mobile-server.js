const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Modifier dynamiquement l'API URL pour mobile
app.get('/api.js', (req, res) => {
    const apiFile = fs.readFileSync(path.join(__dirname, 'api.js'), 'utf8');
    
    // Détecter si c'est un accès mobile (via IP)
    const isMobile = req.headers.host.includes('192.168.1.16');
    
    let modifiedContent = apiFile;
    if (isMobile) {
        modifiedContent = apiFile.replace(
            "this.baseURL = 'http://localhost:3000/api';",
            "this.baseURL = 'http://192.168.1.16:3000/api';"
        );
    }
    
    res.setHeader('Content-Type', 'application/javascript');
    res.send(modifiedContent);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Frontend accessible sur: http://0.0.0.0:${PORT}`);
    console.log(`📱 Smartphone: http://192.168.1.16:${PORT}`);
});