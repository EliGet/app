const fs = require('fs');
let src = fs.readFileSync('routes/auth.js', 'utf8');
const before = src;

const startMarker = "router.get('/recover', (req, res) => {";
const endMarker = "// ===== VERIFY RECOVERY CODE (AJAX) =====";
const s = src.indexOf(startMarker);
const e = src.indexOf(endMarker);
if (s === -1 || e === -1) { console.log('ERROR: markers not found'); process.exit(1); }

const newBlock = `router.get('/recover', (req, res) => {
    res.send(\`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
        <title>Reset Password - EliGet</title>
        </head><body class="au-body">
        <div class="au-wrap">

            <header class="au-topbar">
                <a href="/auth/login" class="au-back" title="Back">\${icons.back}</a>
                <span class="au-brand">EliGet</span>
                <span class="au-spacer"></span>
            </header>

            <div class="au-card">
                <div class="au-head">
                    <h1 class="au-title" id="au-head-title">Reset password</h1>
                    <p class="au-sub" id="au-head-sub">Enter your username and a recovery code.</p>
                </div>

                <div class="au-error" id="au-error" style="display:none;"></div>

                <!-- Step 1: verify -->
                <div id="step-verify">
                    <div class="au-field">
                        <label for="au-username">Username</label>
                        <input id="au-username" type="text" placeholder="your username" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false">
                    </div>
                    <div class="au-field">
                        <label for="au-code">Recovery code</label>
                        <input id="au-code" type="text" placeholder="ELI-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" style="letter-spacing: 0.8px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">
                    </div>
                    <button type="button" id="au-next" class="au-submit">
                        Continue
                        <svg class="au-arrow" viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                </div>

                <!-- Step 2: reset -->
                <div id="step-reset" style="display:none;">
                    <div class="au-verified">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#16a34a"/></svg>
                        Verified
                    </div>
                    <div class="au-field">
                        <label for="au-newpass">New password</label>
                        <input id="au-newpass" type="password" placeholder="At least 6 characters" autocomplete="new-password" minlength="6">
                    </div>
                    <button type="button" id="au-update" class="au-submit">
                        Update password
                        <svg class="au-arrow" viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                </div>

                <div class="au-switch">
                    Remember password? <a href="/auth/login">Login</a>
                </div>
            </div>

        </div>
        <script>
            var errBox = document.getElementById('au-error');
            function showErr(msg) {
                errBox.textContent = msg;
                errBox.style.display = 'block';
            }
            function hideErr() { errBox.style.display = 'none'; }

            function verifyCode() {
                var username = document.getElementById('au-username').value.trim();
                var code = document.getElementById('au-code').value.trim();
                hideErr();
                if (!username || !code) { showErr('Please fill both fields.'); return; }

                var btn = document.getElementById('au-next');
                btn.disabled = true;
                btn.innerHTML = 'Verifying\\u2026';

                fetch('/auth/recover/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ username: username, code: code })
                })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    if (data.success) {
                        document.getElementById('step-verify').style.display = 'none';
                        document.getElementById('step-reset').style.display = 'block';
                        document.getElementById('au-head-title').textContent = 'Set a new password';
                        document.getElementById('au-head-sub').textContent = 'Choose something you will remember.';
                        document.getElementById('au-newpass').focus();
                    } else {
                        showErr('Username or code is incorrect.');
                        btn.disabled = false;
                        btn.innerHTML = 'Continue <svg class="au-arrow" viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                    }
                })
                .catch(function() {
                    showErr('Verification failed. Try again.');
                    btn.disabled = false;
                    btn.innerHTML = 'Continue';
                });
            }

            function updatePassword() {
                var pw = document.getElementById('au-newpass').value;
                hideErr();
                if (!pw || pw.length < 6) { showErr('Password must be at least 6 characters.'); return; }

                var btn = document.getElementById('au-update');
                btn.disabled = true;
                btn.innerHTML = 'Updating\\u2026';

                fetch('/auth/recover/reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ new_password: pw })
                })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    if (data.success) {
                        document.getElementById('au-head-title').textContent = 'Password updated';
                        document.getElementById('au-head-sub').textContent = 'Redirecting to login\\u2026';
                        document.getElementById('step-reset').style.display = 'none';
                        setTimeout(function() { window.location.href = '/auth/login'; }, 1400);
                    } else {
                        showErr('Update failed. Try again.');
                        btn.disabled = false;
                        btn.innerHTML = 'Update password';
                    }
                })
                .catch(function() {
                    showErr('Update failed. Try again.');
                    btn.disabled = false;
                    btn.innerHTML = 'Update password';
                });
            }

            document.getElementById('au-next').addEventListener('click', verifyCode);
            document.getElementById('au-update').addEventListener('click', updatePassword);
            document.getElementById('au-code').addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); verifyCode(); }
            });
            document.getElementById('au-newpass').addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); updatePassword(); }
            });
        </script>
        </body></html>
    \`);
});

`;

src = src.slice(0, s) + newBlock + src.slice(e);
if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/auth.js', src);
console.log('OK: /recover route replaced');
