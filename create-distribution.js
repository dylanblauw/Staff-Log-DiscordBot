const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Maak distributie map
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Files om te includeren in distributie
const includeFiles = [
    'index.js',
    'database.js',
    'setup.js',
    'package.json',
    'README.md',
    'INSTALLATION.md',
    '.env.example',
    'commands/'
];

// Files om uit te sluiten
const excludeFiles = [
    '.env',
    'node_modules/',
    '.git/',
    'dist/',
    '.gitignore'
];

console.log('🏗️  Creating distribution package...\n');

// Maak ZIP bestand
const output = fs.createWriteStream(path.join(distDir, 'Staff-Log-Bot-v1.0.0.zip'));
const archive = archiver('zip', {
    zlib: { level: 9 } // Maximale compressie
});

output.on('close', function() {
    console.log(`✅ Distribution package created: ${archive.pointer()} bytes`);
    console.log(`📦 Location: ${path.join(distDir, 'Staff-Log-Bot-v1.0.0.zip')}`);
    console.log('\n🌐 Upload this file to your website for download!');
});

archive.on('error', function(err) {
    throw err;
});

archive.pipe(output);

// Voeg bestanden toe aan ZIP
includeFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
            archive.directory(filePath, file);
            console.log(`📁 Added directory: ${file}`);
        } else {
            archive.file(filePath, { name: file });
            console.log(`📄 Added file: ${file}`);
        }
    }
});

// Voeg installatie instructies toe
archive.append(`# Staff Log Discord Bot v1.0.0

## Snelle Installatie:
1. Extract deze ZIP
2. Open terminal in de map
3. Run: npm install
4. Kopieer .env.example naar .env
5. Vul je bot token in
6. Run: npm start

Voor volledige instructies, zie INSTALLATION.md

© 2025 Rootline Studio
`, { name: 'LEES_MIJ_EERST.txt' });

archive.finalize();