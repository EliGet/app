const fs = require('fs');
let src = fs.readFileSync('routes/auth.js', 'utf8');
const before = src;

const getStart = "router.get('/signup', (req, res) => {";
const getEnd = "// ===== SIGNUP POST =====";
const gs = src.indexOf(getStart);
const ge = src.indexOf(getEnd);
if (gs === -1 || ge === -1) { console.log('ERROR: GET /signup block not found'); process.exit(1); }

const newGet = `router.get('/signup', (req, res) => {
    const errorMsg = req.query.error || '';
    const fnameVal = (req.query.f || '').replace(/"/g, '&quot;');
    const unameVal = (req.query.u || '').replace(/"/g, '&quot;');
    const errorHtml = errorMsg ? \`<div class="au-error">\${errorMsg}</div>\` : '';

    res.send(\`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
        <title>Create Account - EliGet</title>
        </head><body class="au-body">
        <div class="au-wrap">

            <header class="au-topbar">
                <a href="/auth/login" class="au-back" title="Back">\${icons.back}</a>
                <span class="au-brand">EliGet</span>
                <span class="au-spacer"></span>
            </header>

            <div class="au-card">
                <div class="au-head">
                    <h1 class="au-title">Create account</h1>
                    <p class="au-sub">Pick a username. Start sharing thoughts.</p>
                </div>

                \${errorHtml}

                <form action="/auth/signup" method="POST" class="au-form" id="signupForm">
                    <div class="au-field">
                        <label for="au-fname">Full name</label>
                        <input id="au-fname" type="text" name="full_name" value="\${fnameVal}" required placeholder="Abdullah Mohim" autocomplete="name" maxlength="50">
                    </div>

                    <div class="au-field">
                        <label for="au-uname">Username</label>
                        <div class="au-input-wrap">
                            <input id="au-uname" type="text" name="username" value="\${unameVal}" required placeholder="mohim" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="20" data-availability="idle">
                            <span class="au-status" id="au-uname-status"></span>
                        </div>
                        <p class="au-hint" id="au-uname-hint">Letters, numbers, underscore. 3-20 characters.</p>
                    </div>

                    <div class="au-field">
                        <label for="au-pass">Password</label>
                        <input id="au-pass" type="password" name="password" required placeholder="At least 6 characters" autocomplete="new-password" minlength="6">
                    </div>

                    <button type="submit" class="au-submit" id="au-submit">
                        Create account
                        <svg class="au-arrow" viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                </form>

                <div class="au-switch">
                    Already have an account? <a href="/auth/login">Login</a>
                </div>
            </div>

        </div>
        <script src="/signup.js"></script>
        </body></html>
    \`);
});

// ===== USERNAME AVAILABILITY API =====
router.get('/api/check-username', async (req, res) => {
    try {
        const u = (req.query.u || '').trim();
        if (!u) return res.json({ ok: false, reason: 'empty' });
        if (u.length < 3) return res.json({ ok: false, reason: 'short' });
        if (u.length > 20) return res.json({ ok: false, reason: 'long' });
        if (!/^[a-zA-Z0-9_]+$/.test(u)) return res.json({ ok: false, reason: 'invalid' });

        const existing = await User.findOne({ username: { $regex: '^' + u + '$', $options: 'i' } });
        if (existing) return res.json({ ok: false, reason: 'taken' });
        return res.json({ ok: true, reason: 'available' });
    } catch (err) {
        console.error('Username check error:', err);
        res.json({ ok: false, reason: 'error' });
    }
});

`;

src = src.slice(0, gs) + newGet + src.slice(ge);
console.log('OK: GET /signup replaced + API added');

// ===== POST /signup validation fix (replacer function!) =====
const oldPost = `        if (username.includes(' ')) {
            return res.send('Username cannot contain spaces. <a href="/auth/signup">Try again</a>');
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.send('Sorry, this username is already taken. <a href="/auth/signup">Try again</a>');
        }`;

const newPost = `        const fq = encodeURIComponent(full_name || '');
        const uq = encodeURIComponent(username || '');

        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username || '')) {
            return res.redirect('/auth/signup?error=' + encodeURIComponent('Username must be 3-20 chars: letters, numbers, underscore.') + '&f=' + fq + '&u=' + uq);
        }
        if (!password || password.length < 6) {
            return res.redirect('/auth/signup?error=' + encodeURIComponent('Password must be at least 6 characters.') + '&f=' + fq + '&u=' + uq);
        }

        const existingUser = await User.findOne({ username: { $regex: '^' + username + '$', $options: 'i' } });
        if (existingUser) {
            return res.redirect('/auth/signup?error=' + encodeURIComponent('That username is already taken.') + '&f=' + fq + '&u=' + uq);
        }`;

if (!src.includes(oldPost)) { console.log('ERROR: POST /signup validation block not found'); process.exit(1); }
// *** FIX: replacer function দিয়ে replace — $ special chars escape হবে ***
src = src.replace(oldPost, function() { return newPost; });
console.log('OK: POST /signup error handling fixed');

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/auth.js', src);
console.log('DONE');
