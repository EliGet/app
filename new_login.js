const fs = require('fs');
let src = fs.readFileSync('routes/auth.js', 'utf8');
const before = src;

// ===== GET /login replace =====
const getStart = "router.get('/login', (req, res) => {";
const getEnd = "// ===== LOGIN POST =====";
const gs = src.indexOf(getStart);
const ge = src.indexOf(getEnd);
if (gs === -1 || ge === -1) { console.log('ERROR: GET /login block not found'); process.exit(1); }

const newGet = `router.get('/login', (req, res) => {
    const errorMsg = req.query.error || '';
    const usernameVal = (req.query.u || '').replace(/"/g, '&quot;');
    const errorHtml = errorMsg ? \`<div class="au-error">\${errorMsg}</div>\` : '';

    res.send(\`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
        <title>Login - EliGet</title>
        </head><body class="au-body">
        <div class="au-wrap">

            <header class="au-topbar">
                <a href="/" class="au-back" title="Back">\${icons.back}</a>
                <span class="au-brand">EliGet</span>
                <span class="au-spacer"></span>
            </header>

            <div class="au-card">
                <div class="au-head">
                    <h1 class="au-title">Welcome back</h1>
                    <p class="au-sub">Text-only. No algorithms. Just thoughts.</p>
                </div>

                \${errorHtml}

                <form action="/auth/login" method="POST" class="au-form">
                    <div class="au-field">
                        <label for="au-user">Username</label>
                        <input id="au-user" type="text" name="username" value="\${usernameVal}" required placeholder="username" autocomplete="username" autofocus autocapitalize="off" autocorrect="off">
                    </div>
                    <div class="au-field">
                        <label for="au-pass">Password</label>
                        <input id="au-pass" type="password" name="password" required placeholder="\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022" autocomplete="current-password">
                    </div>

                    <a href="/auth/recover" class="au-forgot">Forgot password?</a>

                    <button type="submit" class="au-submit">
                        Login
                        <svg class="au-arrow" viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                </form>

                <div class="au-switch">
                    New here? <a href="/auth/signup">Create an account</a>
                </div>
            </div>

        </div>
        </body></html>
    \`);
});

`;

src = src.slice(0, gs) + newGet + src.slice(ge);
console.log('OK: GET /login replaced');

// ===== POST /login error handling fix =====
const oldPostStart = `router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.send('User not found. <a href="/auth/login">Try again</a>');

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.send('Incorrect password. <a href="/auth/login">Try again</a>');

        req.session.user = username;
        res.redirect('/');`;

const newPostStart = `router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const u = encodeURIComponent(username || '');

        if (!username || !password) {
            return res.redirect('/auth/login?error=' + encodeURIComponent('Please fill in all fields.'));
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.redirect('/auth/login?error=' + encodeURIComponent('No account found with that username.') + '&u=' + u);
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.redirect('/auth/login?error=' + encodeURIComponent('Incorrect password. Try again.') + '&u=' + u);
        }

        req.session.user = username;
        res.redirect('/');`;

if (!src.includes(oldPostStart)) { console.log('ERROR: POST /login block not found'); process.exit(1); }
src = src.replace(oldPostStart, newPostStart);
console.log('OK: POST /login error handling fixed');

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/auth.js', src);
console.log('DONE');
