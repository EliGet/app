const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

if (src.includes("router.post('/api/request'")) {
    console.log('WARN: route already exists');
    process.exit(0);
}

// Insert before /notifications route
const marker = "router.get('/notifications'";
const idx = src.indexOf(marker);
if (idx === -1) { console.log('ERROR: notifications marker not found'); process.exit(1); }

const newRoute = `// ===== SEND FRIEND REQUEST (AJAX) =====
router.post('/api/request', async (req, res) => {
    try {
        const me = req.session.user;
        if (!me) return res.json({ ok: false, reason: 'auth' });

        const to = (req.body && req.body.to) ? String(req.body.to).trim() : '';
        if (!to || to === me) return res.json({ ok: false, reason: 'invalid' });

        const targetUser = await User.findOne({ username: to });
        if (!targetUser) return res.json({ ok: false, reason: 'notfound' });

        const existing = await FriendRequest.findOne({
            $or: [
                { from: me, to: to },
                { from: to, to: me }
            ]
        });

        if (existing) {
            if (existing.status === 'accepted') {
                return res.json({ ok: true, status: 'friend' });
            }
            if (existing.status === 'pending') {
                return res.json({ ok: true, status: existing.from === me ? 'requested' : 'respond' });
            }
        }

        await FriendRequest.create({ from: me, to: to, status: 'pending' });
        res.json({ ok: true, status: 'requested' });
    } catch (err) {
        console.error('Friend request error:', err);
        res.json({ ok: false, reason: 'error' });
    }
});

`;

src = src.slice(0, idx) + newRoute + src.slice(idx);
fs.writeFileSync('routes/chat.js', src);
console.log('OK: /api/request restored');
