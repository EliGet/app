const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');

const startMarker = "app.get('/settings', isAuthenticated, async (req, res) => {";
const endMarker = "app.post('/settings/update-name'";
const s = src.indexOf(startMarker);
const e = src.indexOf(endMarker);
if (s === -1 || e === -1) { console.log('ERROR: markers not found'); process.exit(1); }

const newBlock = `app.get('/settings', isAuthenticated, async (req, res) => {
    const user = await User.findOne({ username: req.session.user });
    const currentFullName = user.full_name || user.username;
    const showToast = req.query.status === 'saved';
    const esc = (str) => String(str).replace(/"/g, '&quot;');

    res.send(\`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
        <title>Settings - EliGet</title>
        </head><body class="st-body">
        \${showToast ? \`<div class="toast">\${icons.check} Saved successfully!</div>\` : ''}
        <div class="st-wrap">

            <header class="st-topbar">
                <a href="/profile" class="st-back" title="Back">
                    <svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
                </a>
                <span class="st-title">Settings</span>
                <span class="st-spacer"></span>
            </header>

            <section class="st-section">
                <h2 class="st-section-label">Profile</h2>
                <div class="st-card">
                    <div class="st-row">
                        <div class="st-row-content">
                            <div class="st-row-title">Display name</div>
                            <div class="st-row-desc">This is how others see you on EliGet</div>
                        </div>
                    </div>
                    <form action="/settings/update-name" method="POST" class="st-form">
                        <div class="st-input-row">
                            <input type="text" name="full_name" value="\${esc(currentFullName)}" required placeholder="Your name" maxlength="50">
                            <button type="submit" class="st-save-btn">Save</button>
                        </div>
                    </form>
                </div>
            </section>

            <section class="st-section">
                <h2 class="st-section-label">Account</h2>
                <div class="st-card">
                    <button type="button" class="st-action-row" onclick="openModal('stLogoutModal')">
                        <div class="st-row-icon">
                            <svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                        </div>
                        <div class="st-row-content">
                            <div class="st-row-title">Log out</div>
                            <div class="st-row-desc">Sign out of your EliGet account</div>
                        </div>
                        <svg class="st-chev" viewBox="0 0 24 24" width="18" height="18"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" fill="currentColor"/></svg>
                    </button>
                </div>
            </section>

            <section class="st-section st-danger-section">
                <h2 class="st-section-label st-danger-label">Danger zone</h2>
                <div class="st-card st-danger-card">
                    <div class="st-row">
                        <div class="st-row-content">
                            <div class="st-row-title st-danger-title">Delete account</div>
                            <div class="st-row-desc">Permanently delete your account, posts, and all data. This cannot be undone.</div>
                        </div>
                    </div>
                    <button type="button" class="st-danger-btn" onclick="openModal('stDeleteModal')">Delete my account</button>
                </div>
            </section>

            <div class="st-footer">
                <span class="st-footer-brand">EliGet<span class="st-footer-dot"></span></span>
                <span class="st-footer-version">Text-only network</span>
            </div>

        </div>

        <div class="modal-overlay" id="stLogoutModal">
            <div class="modal-box">
                <h3 class="modal-title">Log out?</h3>
                <p class="modal-desc">You can always log back in.</p>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal('stLogoutModal')">Cancel</button>
                    <a href="/auth/logout" class="btn-primary">Log out</a>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="stDeleteModal">
            <div class="modal-box">
                <h3 class="modal-title modal-title-danger">Delete account?</h3>
                <p class="modal-desc">This will permanently delete your account and all data. Type <strong>Delete me</strong> below to confirm.</p>
                <input type="text" id="stDeleteInput" placeholder="Delete me" oninput="stCheckDelete()" autocomplete="off">
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal('stDeleteModal')">Cancel</button>
                    <form action="/settings/delete" method="POST" style="flex:1;margin:0;">
                        <button type="submit" id="stConfirmDelete" class="btn-primary btn-danger" style="width:100%;" disabled>Delete</button>
                    </form>
                </div>
            </div>
        </div>

        <script>
            function openModal(id) {
                document.getElementById(id).classList.add('active');
                if (id === 'stDeleteModal') {
                    var inp = document.getElementById('stDeleteInput');
                    inp.value = '';
                    document.getElementById('stConfirmDelete').disabled = true;
                    setTimeout(function() { inp.focus(); }, 100);
                }
            }
            function closeModal(id) {
                document.getElementById(id).classList.remove('active');
            }
            function stCheckDelete() {
                var v = document.getElementById('stDeleteInput').value;
                document.getElementById('stConfirmDelete').disabled = (v.toLowerCase() !== 'delete me');
            }
            document.querySelectorAll('.modal-overlay').forEach(function(el) {
                el.addEventListener('click', function(e) {
                    if (e.target === el) el.classList.remove('active');
                });
            });
        </script>
        </body></html>
    \`);
});

`;

src = src.slice(0, s) + newBlock + src.slice(e);
fs.writeFileSync('server.js', src);
console.log('OK: Settings route replaced');
