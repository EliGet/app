const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// Find the notifications route
const startMarker = "router.get('/notifications', async (req, res) => {";
const endMarker = "// ===== ACCEPT REQUEST =====";
const s = src.indexOf(startMarker);
const e = src.indexOf(endMarker);
if (s === -1 || e === -1) { console.log('ERROR: markers not found'); process.exit(1); }

const newBlock = `router.get('/notifications', async (req, res) => {
    try {
        const me = req.session.user;

        // 1. Friend requests (pending)
        const pendingRequests = await FriendRequest.find({ to: me, status: 'pending' }).sort({ created_at: -1 });

        let friendReqsHtml = '';
        for (const request of pendingRequests) {
            const sender = await User.findOne({ username: request.from });
            if (!sender) continue;
            const displayName = sender.full_name || sender.username;
            const initial = displayName.charAt(0).toUpperCase();
            const avatarInner = sender.avatar ? \`<img src="\${sender.avatar}" alt="">\` : initial;
            friendReqsHtml += \`
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

        // 2. Other notifications (follow, mention)
        const notifications = await Notification.find({ recipient: me })
            .sort({ created_at: -1 })
            .limit(50);

        let notifsHtml = '';
        for (const n of notifications) {
            const actor = await User.findOne({ username: n.actor });
            if (!actor) continue;
            const dn = actor.full_name || actor.username;
            const initial = dn.charAt(0).toUpperCase();
            const av = actor.avatar ? \`<img src="\${actor.avatar}" alt="">\` : initial;

            let text = '';
            let link = '';
            if (n.type === 'follow') {
                text = 'started following you';
                link = \`/profile/\${n.actor}\`;
            } else if (n.type === 'mention') {
                text = 'mentioned you in a post';
                link = n.ref_id ? \`/post/\${n.ref_id}\` : \`/profile/\${n.actor}\`;
            } else if (n.type === 'friend_accepted') {
                text = 'accepted your friend request';
                link = \`/chat/\${n.actor}\`;
            }

            const timeStr = (function(d) {
                const diff = Date.now() - new Date(d).getTime();
                const m = Math.floor(diff / 60000);
                if (m < 1) return 'just now';
                if (m < 60) return m + 'm';
                const h = Math.floor(m / 60);
                if (h < 24) return h + 'h';
                const dd = Math.floor(h / 24);
                if (dd < 7) return dd + 'd';
                return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            })(n.created_at);

            notifsHtml += \`
                <a href="\${link}" class="nt-item nt-item-link\${n.seen ? '' : ' unread'}">
                    <div class="nt-avatar">\${av}</div>
                    <div class="nt-info">
                        <div class="nt-name">\${dn}</div>
                        <div class="nt-username">\${text}</div>
                    </div>
                    <span class="nt-time">\${timeStr}</span>
                </a>
            \`;
        }

        // Mark all as seen
        await Notification.updateMany({ recipient: me, seen: false }, { $set: { seen: true } });

        const hasAnything = pendingRequests.length > 0 || notifications.length > 0;

        let bodyHtml = '';
        if (!hasAnything) {
            bodyHtml = \`<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>
                <h3>All caught up</h3>
                <p>No new notifications right now.</p>
                <a href="/chat">Back to chats</a>
            </div>\`;
        } else {
            if (pendingRequests.length > 0) {
                bodyHtml += \`<h2 class="nt-section-label">Friend requests</h2><div class="nt-list">\${friendReqsHtml}</div>\`;
            }
            if (notifications.length > 0) {
                bodyHtml += \`<h2 class="nt-section-label" style="margin-top:24px;">Activity</h2><div class="nt-list">\${notifsHtml}</div>\`;
            }
        }

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
if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/chat.js', src);
console.log('OK: notifications page rewritten');
