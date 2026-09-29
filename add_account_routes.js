const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

const marker = "app.post('/settings/update-name'";
const idx = src.indexOf(marker);
if (idx === -1) { console.log('ERROR: marker not found'); process.exit(1); }

const newRoutes = `// ===== SWITCH ACCOUNT =====
app.post('/settings/switch', isAuthenticated, async (req, res) => {
    const target = req.body.username;
    if (!target || !req.session.accounts || !req.session.accounts.includes(target)) {
        return res.redirect('/settings?status=invalid');
    }
    req.session.user = target;
    res.redirect('/');
});

// ===== REMOVE ACCOUNT FROM SESSION =====
app.post('/settings/remove-account', isAuthenticated, async (req, res) => {
    const target = req.body.username;
    if (!target || target === req.session.user) {
        return res.redirect('/settings?status=invalid');
    }
    if (req.session.accounts) {
        req.session.accounts = req.session.accounts.filter(u => u !== target);
    }
    res.redirect('/settings?status=removed');
});

`;

src = src.slice(0, idx) + newRoutes + src.slice(idx);
fs.writeFileSync('server.js', src);
console.log('OK: switch + remove routes added');
