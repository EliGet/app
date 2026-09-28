const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');

const startMarker = "// ===== ADD FRIENDS PAGE =====\nrouter.get('/new', async (req, res) => {";
const endMarker = "// ===== NOTIFICATIONS";

const start = src.indexOf(startMarker);
const end = src.indexOf(endMarker);
if (start === -1) { console.log('ERROR: start marker not found'); process.exit(1); }
if (end === -1) { console.log('ERROR: end marker not found'); process.exit(1); }

const newBlock = `// ===== ADD FRIENDS PAGE (live search) =====
router.get('/new', async (req, res) => {
    const searchIconSvg = icons.search;
    res.send(\`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <title>Add Friends - EliGet</title>
        </head><body>
        <div class="container">
            <header>
                <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                <span class="profile-title" style="flex:1;">Add Friends</span>
            </header>

            <div class="chat-search-wrap">
                <svg class="chat-search-icon" viewBox="0 0 24 24">\${searchIconSvg.match(/<path[^>]*>/)[0]}</svg>
                <input type="text" id="userSearch" class="chat-search-input" placeholder="Search by username or name..." autocomplete="off" autofocus>
            </div>

            <div class="chat-list" id="resultsBox">
                <p style="text-align:center; color:#a0aec0; padding:24px;">Start typing to search users.</p>
            </div>
        </div>
        \${getBottomNav('chat')}
        <script>
            var input = document.getElementById('userSearch');
            var box = document.getElementById('resultsBox');
            var timer = null;
            var lastQuery = '';

            function escapeHtml(s) {
                return String(s).replace(/[&<>"']/g, function(c) {
                    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
                });
            }

            function renderUsers(users, query) {
                if (!users.length) {
                    box.innerHTML = '<p style="text-align:center; color:#a0aec0; padding:24px;">No user found for "' + escapeHtml(query) + '".</p>';
                    return;
                }
                var html = '';
                users.forEach(function(u) {
                    var avatar = u.avatar
                        ? '<img src="' + escapeHtml(u.avatar) + '" alt="Avatar">'
                        : escapeHtml(u.initial);
                    var btn = '';
                    if (u.status === 'requested') {
                        btn = '<button type="button" class="request-btn-requested" disabled>Requested</button>';
                    } else if (u.status === 'respond') {
                        btn = '<a href="/chat/notifications" class="request-btn request-btn-accept" style="text-decoration:none;display:inline-block;">Respond</a>';
                    } else if (u.status === 'friend') {
                        btn = '<a href="/chat/' + encodeURIComponent(u.username) + '" class="request-btn request-btn-accept" style="text-decoration:none;display:inline-block;">Chat</a>';
                    } else {
                        btn = '<button type="button" class="request-btn request-btn-accept" onclick="sendRequest(this, \\'' + escapeHtml(u.username) + '\\')">Request</button>';
                    }
                    html += '<div class="chat-item">'
                        + '<div class="chat-avatar">' + avatar + '</div>'
                        + '<div class="chat-info">'
                        + '<div class="chat-name">' + escapeHtml(u.displayName) + '</div>'
                        + '<div class="chat-preview">@' + escapeHtml(u.username) + '</div>'
                        + '</div>'
                        + btn
                        + '</div>';
                });
                box.innerHTML = html;
            }

            function doSearch(q) {
                if (q === lastQuery) return;
                lastQuery = q;
                if (q.length < 1) {
                    box.innerHTML = '<p style="text-align:center; color:#a0aec0; padding:24px;">Start typing to search users.</p>';
                    return;
                }
                box.innerHTML = '<p style="text-align:center; color:#a0aec0; padding:24px;">Searching...</p>';
                fetch('/chat/api/search?q=' + encodeURIComponent(q), { credentials: 'same-origin' })
                    .then(function(r) { return r.json(); })
                    .then(function(data) {
                        if (lastQuery !== q) return;
                        renderUsers(data.users || [], q);
                    })
                    .catch(function() {
                        box.innerHTML = '<p style="text-align:center; color:#e53e3e; padding:24px;">Search failed. Try again.</p>';
                    });
            }

            input.addEventListener('input', function() {
                clearTimeout(timer);
                var q = input.value.trim();
                timer = setTimeout(function() { doSearch(q); }, 280);
            });

            function sendRequest(btn, username) {
                btn.disabled = true;
                btn.textContent = 'Sending...';
                fetch('/chat/api/request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ to: username })
                })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    if (data.ok) {
                        btn.textContent = 'Requested';
                        btn.className = 'request-btn-requested';
                    } else {
                        btn.textContent = 'Failed';
                        btn.disabled = false;
                    }
                })
                .catch(function() {
                    btn.textContent = 'Failed';
                    btn.disabled = false;
                });
            }
        </script>
        </body></html>
    \`);
});

// ===== SEARCH API (JSON) =====
router.get('/api/search', async (req, res) => {
    try {
        const me = req.session.user;
        const q = (req.query.q || '').trim();
        if (!q) return res.json({ ok: true, users: [] });

        const users = await User.find({
            username: { $ne: me },
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { full_name: { $regex: q, $options: 'i' } }
            ]
        }).limit(20);

        const result = [];
        for (const u of users) {
            const existingReq = await FriendRequest.findOne({
                $or: [
                    { from: me, to: u.username },
                    { from: u.username, to: me }
                ]
            });
            let status = 'none';
            if (existingReq) {
                if (existingReq.status === 'accepted') status = 'friend';
                else if (existingReq.status === 'pending' && existingReq.from === me) status = 'requested';
                else if (existingReq.status === 'pending' && existingReq.to === me) status = 'respond';
            }
            const displayName = u.full_name || u.username;
            result.push({
                username: u.username,
                displayName: displayName,
                initial: displayName.charAt(0).toUpperCase(),
                avatar: u.avatar || '',
                status: status
            });
        }
        res.json({ ok: true, users: result });
    } catch (err) {
        console.error('Search API error:', err);
        res.json({ ok: false, users: [] });
    }
});

`;

src = src.slice(0, start) + newBlock + src.slice(end);
fs.writeFileSync('routes/chat.js', src);
console.log('OK: Add Friends page rewritten with live search + API');
