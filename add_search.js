const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');

const startMarker = "// ===== ADD FRIENDS PAGE =====\nrouter.get('/new', async (req, res) => {";
const endMarker = "// ===== NOTIFICATIONS";

const start = src.indexOf(startMarker);
const end = src.indexOf(endMarker);
if (start === -1) { console.log('ERROR: start marker not found'); process.exit(1); }
if (end === -1) { console.log('ERROR: end marker not found'); process.exit(1); }
if (end <= start) { console.log('ERROR: end before start'); process.exit(1); }

const newBlock = `// ===== ADD FRIENDS PAGE =====
router.get('/new', async (req, res) => {
    try {
        const me = req.session.user;
        const q = (req.query.q || '').trim().toLowerCase();

        // Search by username or full_name (partial, case-insensitive)
        let query = { username: { $ne: me } };
        if (q) {
            query = {
                username: { $ne: me },
                $or: [
                    { username: { $regex: q, $options: 'i' } },
                    { full_name: { $regex: q, $options: 'i' } }
                ]
            };
        }

        const allUsers = await User.find(query).limit(q ? 20 : 10);

        let userItemsHtml = '';
        let hasUsers = false;

        for (const u of allUsers) {
            const existingReq = await FriendRequest.findOne({
                $or: [
                    { from: me, to: u.username },
                    { from: u.username, to: me }
                ]
            });

            if (existingReq && existingReq.status === 'accepted') continue;

            hasUsers = true;
            const displayName = u.full_name || u.username;
            const initial = displayName.charAt(0).toUpperCase();
            const avatarUrl = u.avatar ? \`<img src="\${u.avatar}" alt="Avatar">\` : initial;

            let btnHtml;
            if (existingReq && existingReq.status === 'pending' && existingReq.from === me) {
                btnHtml = \`<button type="button" class="request-btn-requested" disabled>Requested</button>\`;
            } else if (existingReq && existingReq.status === 'pending' && existingReq.to === me) {
                btnHtml = \`<a href="/chat/notifications" class="request-btn request-btn-accept" style="text-decoration:none; display:inline-block;">Respond</a>\`;
            } else {
                btnHtml = \`<button type="button" class="request-btn request-btn-accept" onclick="sendRequest(this, '\${u.username}')">Request</button>\`;
            }

            userItemsHtml += \`
                <div class="chat-item">
                    <div class="chat-avatar">\${avatarUrl}</div>
                    <div class="chat-info">
                        <div class="chat-name">\${displayName}</div>
                        <div class="chat-preview">@\${u.username}</div>
                    </div>
                    \${btnHtml}
                </div>
            \`;
        }

        let emptyMsg = '';
        if (!hasUsers) {
            if (q) {
                emptyMsg = \`<p style="text-align:center; color:#a0aec0; padding:24px;">No user found for "\${q}".</p>\`;
            } else {
                emptyMsg = '<p style="text-align:center; color:#a0aec0; padding:24px;">No new users to add right now.</p>';
            }
        }

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

                <form method="GET" action="/chat/new" class="chat-search-wrap">
                    <svg class="chat-search-icon" viewBox="0 0 24 24">\${searchIconSvg.match(/<path[^>]*>/)[0]}</svg>
                    <input type="text" name="q" value="\${q ? q.replace(/"/g, '&quot;') : ''}" class="chat-search-input" placeholder="Search by username or name..." autocomplete="off" autofocus>
                </form>

                <div class="chat-list">\${userItemsHtml || emptyMsg}</div>
            </div>
            \${getBottomNav('chat')}
            <script>
                function sendRequest(btn, username) {
                    btn.disabled = true;
                    btn.textContent = 'Sending...';
                    fetch('/chat/api/request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ to: username })
                    })
                    .then(r => r.json())
                    .then(data => {
                        if (data.ok) {
                            btn.textContent = 'Requested';
                            btn.className = 'request-btn-requested';
                        } else {
                            btn.textContent = 'Failed';
                            btn.disabled = false;
                        }
                    })
                    .catch(() => {
                        btn.textContent = 'Failed';
                        btn.disabled = false;
                    });
                }
            </script>
            </body></html>
        \`);
    } catch (error) {
        console.error('Add friends error:', error);
        res.send('Something went wrong.');
    }
});

`;

src = src.slice(0, start) + newBlock + src.slice(end);
fs.writeFileSync('routes/chat.js', src);
console.log('OK: Add Friends page rewritten with search');
