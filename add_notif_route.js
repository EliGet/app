const fs = require('fs');

// ===== server.js — notification routes =====
let srv = fs.readFileSync('server.js', 'utf8');
const before = srv;

const marker404 = '// ===== 404 HANDLER =====';
if (!srv.includes('// ===== NOTIFICATION SEEN =====')) {
    const idx = srv.indexOf(marker404);
    if (idx === -1) { console.log('ERROR: 404 marker not found'); process.exit(1); }

    const notifRoutes = `// ===== NOTIFICATION SEEN (mark all as seen) =====
app.post('/notifications/seen', isAuthenticated, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.session.user, seen: false },
            { $set: { seen: true } }
        );
        res.json({ ok: true });
    } catch (err) {
        console.error('Mark seen error:', err);
        res.json({ ok: false });
    }
});

`;

    srv = srv.slice(0, idx) + notifRoutes + srv.slice(idx);
    console.log('OK: /notifications/seen added');
}

if (srv === before) { console.log('WARN server.js: nothing changed'); }
fs.writeFileSync('server.js', srv);

// ===== routes/chat.js — bell count + notifications page =====
let cht = fs.readFileSync('routes/chat.js', 'utf8');
const beforeC = cht;

// require Notification
if (!cht.includes("require('../models/Notification')")) {
    const m = cht.match(/const Block = require\('\.\.\/models\/Block'\);/);
    if (m) {
        cht = cht.replace(m[0], m[0] + "\nconst Notification = require('../models/Notification');");
        console.log('OK: chat.js Notification required');
    }
}

// Update bell count — pendingCount → pendingCount + unseenNotifCount
const oldBell = `        const pendingCount = await FriendRequest.countDocuments({ to: me, status: 'pending' });`;
const newBell = `        const pendingFriendCount = await FriendRequest.countDocuments({ to: me, status: 'pending' });
        const unseenNotifCount = await Notification.countDocuments({ recipient: me, seen: false });
        const pendingCount = pendingFriendCount + unseenNotifCount;`;

if (cht.includes(oldBell)) {
    cht = cht.replace(oldBell, function() { return newBell; });
    console.log('OK: bell count updated');
} else {
    console.log('WARN: bell count pattern not found');
}

if (cht === beforeC) { console.log('WARN chat.js: nothing changed'); }
fs.writeFileSync('routes/chat.js', cht);
console.log('DONE');
