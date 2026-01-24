const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, 'www');

// Define what to copy
const ASSETS_TO_COPY = [
    'index.html',
    'sw.js',
    'css',
    'js',
    'functions' // Including functions in case there are any shared utils, though usually server-side
];

// Helper to copy recursive
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else if (exists) {
        fs.copyFileSync(src, dest);
    }
}

// 1. Clean / Create www
if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUILD_DIR);

// 2. Copy Assets
console.log('Building mobile assets to ./www ...');
ASSETS_TO_COPY.forEach(item => {
    const srcPath = path.join(__dirname, item);
    const destPath = path.join(BUILD_DIR, item);

    if (fs.existsSync(srcPath)) {
        console.log(`Copying ${item}...`);
        copyRecursiveSync(srcPath, destPath);
    } else {
        console.warn(`Warning: Asset ${item} not found.`);
    }
});

console.log('Build complete. Ready for Capacitor sync.');
