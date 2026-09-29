const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

const marker = '// ===== START SERVER =====';
const idx = src.indexOf(marker);
if (idx === -1) { console.log('ERROR: marker not found'); process.exit(1); }

// Check if already injected
if (src.includes('// ===== 404 HANDLER =====')) {
    console.log('WARN: already injected');
    process.exit(0);
}

const errorBlock = `// ===== 404 HANDLER =====
app.use((req, res) => {
    const errorPage = require('./errorPage');
    res.status(404).send(errorPage(
        404,
        'Page not found',
        'The page you are looking for does not exist or has been moved.',
        '/',
        'Back to home'
    ));
});

// ===== 500 ERROR HANDLER =====
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    const errorPage = require('./errorPage');
    res.status(500).send(errorPage(
        500,
        'Something went wrong',
        'An unexpected error occurred. Please try again.',
        '/',
        'Back to home'
    ));
});

`;

src = src.slice(0, idx) + errorBlock + src.slice(idx);
fs.writeFileSync('server.js', src);
console.log('OK: 404 + 500 handlers added');
