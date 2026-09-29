const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');

const startMarker = "app.get('/settings', isAuthenticated, async (req, res) => {";
const endMarker = "// ===== SWITCH ACCOUNT =====";
const s = src.indexOf(startMarker);
const e = src.indexOf(endMarker);
if (s === -1 || e === -1) { console.log('ERROR: markers not found'); process.exit(1); }

const newBlock = `app.get('/settings', isAuthenticated, async (req, res) => {
    const user = await User.findOne({ username: req.session.user });
    const currentFullName = user.full_name || user.username;
    const showToast = req.query.status === 'saved';
    const esc = (str) => String(str).replace(/"/g, '&quot;');

    // Build accounts list from session
    const accountUsernames = req.session.accounts && req.session.accounts.length ? req.session.accounts : [req.session.user];
    const accountsData = [];
    for (const un of accountUsernames) {
        const acc = await User.findOne({ username: un });
        if (!acc) continue;
        const dn = acc.full_name || acc.username;
        accountsData.push({
            username: un,
            displayName: dn,
            initial: dn.charAt(0).toUpperCase(),
            avatar: acc.avatar || '',
            isActive: un === req.session.user
        });
    }

    let accountsHtml = '';
    for (const a of accountsData) {
        const avatarInner = a.avatar ? \`<img src="\${a.avatar}" alt="">\` : a.initial;
        if (a.isActive) {
            accountsHtml += \`
                <div class="st-account st-account-active">
                    <div class="st-account-avatar">\${avatarInner}</div>
                    <div class="st-account-info">
                        <div class="st-account-name">\${a.displayName}</div>
                        <div class="st-account-username">@\${a.username} · Active</div>
                    </div>
                    <span class="st-account-check">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#16a34a"/></svg>
                    </span>
                </div>
            \`;
        } else {
            accountsHtml += \`
                <div class="st-account">
                    <div class="st-account-avatar">\${avatarInner}</div>
                    <div class="st-account-info">
                        <div class="st-account-name">\${a.displayName}</div>
                        <div class="st-account-username">@\${a.username}</div>
                    </div>
                    <div class="st-account-actions">
                        <form action="/settings/switch" method="POST" style="margin:0;">
                            <input type="hidden" name="username" value="\${a.username}">
                            <button type="submit" class="st-account-switch">Switch</button>
                        </form>
                        <form action="/settings/remove-account" method="POST" style="margin:0;">
                            <input type="hidden" name="username" value="\${a.username}">
                            <button type="submit" class="st-account-remove" title="Remove" aria-label="Remove">
                                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
                            </button>
                        </form>
                    </div>
                </div>
            \`;
        }
    }

    const canAddMore = accountsData.length < 2;

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
                <h2 class="st-section-label">Accounts</h2>
                <div class="st-card st-accounts-card">
                    \${accountsHtml}
                    \${canAddMore ? \`
                        <a href="/auth/login?add=1" class="st-add-account">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                            Add another account
                        </a>
                    \` : \`
                        <div class="st-accounts-note">You can have up to 2 accounts.</div>
                    \`}
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
                            <div class="st-row-desc">Sign out of all accounts</div>
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
                            <div class="st-row-desc">Permanently delete @\${req.session.user}, its posts, and all data. This cannot be undone.</div>
                        </div>
                    </div>
                    <button type="button" class="st-danger-btn" onclick="openModal('stDeleteModal')">Delete @\${req.session.user}</button>
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
                <p class="modal-desc">You'll be signed out of all \${accountsData.length} account(s).</p>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal('stLogoutModal')">Cancel</button>
                    <a href="/auth/logout" class="btn-primary">Log out</a>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="stDeleteModal">
            <div class="modal-box">
                <h3 class="modal-title modal-title-danger">Delete account?</h3>
                <p class="modal-desc">This will permanently delete <strong>@\${req.session.user}</strong> and all data. Type <strong>Delete me</strong> below to confirm.</p>
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
console.log('OK: Settings route replaced with accounts section');
