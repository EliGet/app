const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// ===== 1. Bell count — remove friend request count =====
const bellOld = `        const pendingFriendCount = await FriendRequest.countDocuments({ to: me, status: 'pending' });
        const unseenNotifCount = await Notification.countDocuments({ recipient: me, seen: false });
        const pendingCount = pendingFriendCount + unseenNotifCount;`;

const bellNew = `        const unseenNotifCount = await Notification.countDocuments({ recipient: me, seen: false });
        const pendingCount = unseenNotifCount;`;

if (src.includes(bellOld)) {
    src = src.replace(bellOld, function() { return bellNew; });
    console.log('OK: bell count = follow notif only');
} else {
    console.log('WARN: bell count pattern not found');
}

// ===== 2. /chat/new GET — rewrite as "Find people" =====
const findStart = "router.get('/new', async (req, res) => {";
const findEnd = "// ===== NOTIFICATIONS =====";
const fs1 = src.indexOf(findStart);
const fe1 = src.indexOf(findEnd);
if (fs1 === -1 || fe1 === -1) { console.log('ERROR: /new route markers not found'); process.exit(1); }

const newFindRoute = `router.get('/new', async (req, res) => {
    const searchIconSvg = icons.search;
    res.send(\`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <title>Find People - EliGet</title>
        </head><body>
        <div class="container">
            <header class="feed-header">
                <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                <h1 class="feed-title" style="margin-left:10px;">Find people</h1>
            </header>

            <div class="chat-search-wrap">
                <svg class="chat-search-icon" viewBox="0 0 24 24">\${searchIconSvg.match(/<path[^>]*>/)[0]}</svg>
                <input type="text" id="userSearch" class="chat-search-input" placeholder="Search by username or name..." autocomplete="off" autofocus>
            </div>

            <p class="fp-hint">Mutual follow = chat unlocked. Follow first, and if they follow back, you can chat.</p>

            <div class="chat-list" id="resultsBox">
                <p style="text-align:center; color:#a0aec0; padding:24px;">Start typing to search people.</p>
            </div>
        </div>
        \${getBottomNav('chat')}
        <script src="/find-people.js"></script>
        </body></html>
    \`);
});

// ===== USER SEARCH API (for Find People) =====
router.get('/api/search-users', async (req, res) => {
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
            const iFollow = await Follow.findOne({ follower: me, following: u.username });
            const theyFollow = await Follow.findOne({ follower: u.username, following: me });
            let status = 'none';
            if (iFollow && theyFollow) status = 'mutual';
            else if (iFollow) status = 'following';
            else if (theyFollow) status = 'follows-me';

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
        console.error('Search users error:', err);
        res.json({ ok: false, users: [] });
    }
});

`;

src = src.slice(0, fs1) + newFindRoute + src.slice(fe1);
console.log('OK: /new route rewritten as Find People');

// ===== 3. Remove old /api/search (previous) — check and remove =====
const oldApiSearch = "router.get('/api/search', async (req, res) => {";
if (src.includes(oldApiSearch)) {
    // Find the whole route block and delete
    const idx = src.indexOf(oldApiSearch);
    const nextRoute = src.indexOf('\n// ===== ', idx + 10);
    if (nextRoute !== -1) {
        src = src.slice(0, idx) + src.slice(nextRoute + 1);
        console.log('OK: old /api/search removed');
    }
}

// ===== 4. Notifications page — remove FRIEND REQUESTS section =====
const notifStart = "router.get('/notifications', async (req, res) => {";
const notifEnd = "// ===== ACCEPT REQUEST =====";
const ns = src.indexOf(notifStart);
const ne = src.indexOf(notifEnd);
if (ns === -1 || ne === -1) { console.log('WARN: notifications route markers not found'); }
else {
    const newNotif = `router.get('/notifications', async (req, res) => {
    try {
        const me = req.session.user;

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
                text = 'accepted your follow';
                link = \`/profile/\${n.actor}\`;
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
                <a href="\${link}" class="nt-item nt-item-link">
                    <div class="nt-avatar">\${av}</div>
                    <div class="nt-info">
                        <div class="nt-name">\${dn}</div>
                        <div class="nt-username">\${text}</div>
                    </div>
                    <span class="nt-time">\${timeStr}</span>
                </a>
            \`;
        }

        // Delete follow + friend_accepted notifications after view
        await Notification.deleteMany({
            recipient: me,
            type: { $in: ['follow', 'friend_accepted'] }
        });

        let bodyHtml = '';
        if (notifications.length === 0) {
            bodyHtml = \`<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>
                <h3>All caught up</h3>
                <p>No new notifications right now.</p>
                <a href="/chat">Back to chats</a>
            </div>\`;
        } else {
            bodyHtml = \`<h2 class="nt-section-label">Activity</h2><div class="nt-list">\${notifsHtml}</div>\`;
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

    src = src.slice(0, ns) + newNotif + src.slice(ne);
    console.log('OK: notifications page simplified');
}

// ===== 5. Remove accept/reject routes (no longer needed) =====
const acceptStart = "// ===== ACCEPT REQUEST =====";
const acceptEnd = "// ===== TYPING SIGNAL (POST) =====";
const as1 = src.indexOf(acceptStart);
const ae1 = src.indexOf(acceptEnd);
if (as1 !== -1 && ae1 !== -1 && as1 < ae1) {
    src = src.slice(0, as1) + src.slice(ae1);
    console.log('OK: accept/reject routes removed');
}

// ===== 6. Remove api/request route (friend request API) =====
const reqApiStart = "// ===== SEND FRIEND REQUEST (AJAX) =====";
const reqApiEnd = "// ===== TYPING SIGNAL";
const ras = src.indexOf(reqApiStart);
const rae = src.indexOf(reqApiEnd);
if (ras !== -1 && rae !== -1 && ras < rae) {
    src = src.slice(0, ras) + src.slice(rae);
    console.log('OK: /api/request route removed');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE');
