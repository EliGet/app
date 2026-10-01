const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');

const startMarker = "router.get('/notifications', async (req, res) => {";
const endMarker = "// ===== ACCEPT REQUEST =====";
const s = src.indexOf(startMarker);
const e = src.indexOf(endMarker);
if (s === -1 || e === -1) { console.log('ERROR: markers not found'); process.exit(1); }

const newBlock = `router.get('/notifications', async (req, res) => {
    try {
        const me = req.session.user;
        const pendingRequests = await FriendRequest.find({ to: me, status: 'pending' });

        let requestItemsHtml = '';
        for (const request of pendingRequests) {
            const sender = await User.findOne({ username: request.from });
            if (sender) {
                const displayName = sender.full_name || sender.username;
                const initial = displayName.charAt(0).toUpperCase();
                const avatarInner = sender.avatar ? \`<img src="\${sender.avatar}" alt="">\` : initial;
                requestItemsHtml += \`
                    <div class="nt-item">
                        <div class="nt-avatar">\${avatarInner}</div>
                        <div class="nt-info">
                            <div class="nt-name">\${displayName}</div>
                            <div class="nt-username">@\${sender.username}</div>
                        </div>
                        <div class="nt-actions">
                            <form action="/chat/accept/\${request._id}" method="POST" style="margin:0;">
                                <button type="submit" class="nt-accept">Accept</button>
                            </form>
                            <form action="/chat/reject/\${request._id}" method="POST" style="margin:0;">
                                <button type="submit" class="nt-reject">Reject</button>
                            </form>
                        </div>
                    </div>
                \`;
            }
        }

        const bodyHtml = pendingRequests.length === 0
            ? \`<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>
                <h3>All caught up</h3>
                <p>No new friend requests right now.</p>
                <a href="/chat">Back to chats</a>
            </div>\`
            : \`<h2 class="nt-section-label">Friend requests</h2>
               <div class="nt-list">\${requestItemsHtml}</div>\`;

        res.send(\`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
            <title>Notifications - EliGet</title>
            </head><body>
            <div class="container">
                <header class="feed-header">
                    <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                    <h1 class="feed-title" style="margin-left:10px;">Notifications</h1>
                </header>
                \${bodyHtml}
            </div>
            \${getBottomNav('chat')}
            </body></html>
        \`);
    } catch (error) {
        console.error('Notifications error:', error);
        res.status(500).send(errorPage(500, 'Something went wrong', 'An unexpected error occurred. Please try again.', '/', 'Back to home'));
    }
});

`;

src = src.slice(0, s) + newBlock + src.slice(e);
fs.writeFileSync('routes/chat.js', src);
console.log('OK: notifications route replaced');
