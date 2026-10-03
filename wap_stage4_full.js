const fs = require('fs');
let src = fs.readFileSync('routes/wap.js', 'utf8');
const before = src;

// ===== 1. CHAT LIST rewrite =====
const chatStart = "// ===== CHAT LIST (with last message preview) =====";
const chatEnd = "// ===== ADD FRIENDS =====";
const cs = src.indexOf(chatStart);
const ce = src.indexOf(chatEnd);
if (cs !== -1 && ce !== -1) {
    const newChat = `// ===== CHAT LIST (mutual follows) =====
router.get('/chat', async (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');
    try {
        const me = req.session.user;
        const Follow = require('../models/Follow');
        const Message = require('../models/Message');

        // Get mutual follows
        const iFollow = await Follow.find({ follower: me }).select('following');
        const myFollowing = iFollow.map(f => f.following);
        let mutualUsers = [];
        if (myFollowing.length > 0) {
            const mutual = await Follow.find({
                following: me,
                follower: { $in: myFollowing }
            }).select('follower');
            mutualUsers = mutual.map(f => f.follower);
        }

        let html = '';
        if (mutualUsers.length === 0) {
            html = '<p>No conversations yet.<br/><small>Follow someone mutual to unlock chat.</small></p>';
            html += '<hr/><p><a href="/wap/add-friends">Find people to follow</a></p>';
        } else {
            for (const other of mutualUsers) {
                const users = [me.toLowerCase(), other.toLowerCase()].sort();
                const chatId = users[0] + '_' + users[1];
                const lastMsg = await Message.findOne({ chat_id: chatId }).sort({ created_at: -1 });
                const unread = await Message.countDocuments({ chat_id: chatId, from: other, read: false });

                let preview = 'No messages yet';
                if (lastMsg) {
                    preview = lastMsg.body.length > 40 ? lastMsg.body.substring(0, 40) + '...' : lastMsg.body;
                }

                const otherUser = await User.findOne({ username: other });
                const dn = otherUser ? (otherUser.full_name || otherUser.username) : other;

                const badge = unread > 0 ? ' <b>(' + unread + ' new)</b>' : '';
                html += '<p><a href="/wap/chat/' + encodeURIComponent(other) + '"><b>' + escapeXml(dn) + '</b></a>' + badge;
                html += '<br/><small>' + escapeXml(preview) + '</small></p>';
            }
            html += '<hr/><p><a href="/wap/add-friends">Find more people</a></p>';
        }

        res.send(wapPage('Chats', html, { back: '/wap', user: req.session.user }));
    } catch (err) {
        console.error('Chat list error:', err);
        res.send(wapPage('Error', '<p>Something went wrong.</p><p><a href="/wap">Home</a></p>'));
    }
});

`;
    src = src.slice(0, cs) + newChat + src.slice(ce);
    console.log('OK: chat list rewritten');
} else {
    console.log('WARN: chat list markers not found');
}

// ===== 2. ADD FRIENDS rewrite =====
const afStart = "// ===== ADD FRIENDS =====";
const afEnd = "// ===== SEND FRIEND REQUEST =====";
const as1 = src.indexOf(afStart);
const ae1 = src.indexOf(afEnd);
if (as1 !== -1 && ae1 !== -1) {
    const newAF = `// ===== FIND PEOPLE (Follow-based) =====
router.get('/add-friends', async (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');
    try {
        const me = req.session.user;
        const Follow = require('../models/Follow');
        const Block = require('../models/Block');

        const allUsers = await User.find({ username: { $ne: me } }).limit(20);

        // My blocks
        const myBlocks = await Block.find({ blocker: me }).select('blocked');
        const theirBlocks = await Block.find({ blocked: me }).select('blocker');
        const blockedSet = new Set([
            ...myBlocks.map(b => b.blocked),
            ...theirBlocks.map(b => b.blocker)
        ]);

        let html = '';
        let hasAny = false;

        for (const u of allUsers) {
            if (blockedSet.has(u.username)) continue;

            const iFollow = await Follow.findOne({ follower: me, following: u.username });
            const theyFollow = await Follow.findOne({ follower: u.username, following: me });

            hasAny = true;
            const dn = u.full_name || u.username;

            if (iFollow && theyFollow) {
                html += '<p><b>' + escapeXml(dn) + '</b> <small>@' + escapeXml(u.username) + '</small><br/>';
                html += '<a href="/wap/chat/' + encodeURIComponent(u.username) + '">Message</a> · Mutual</p>';
            } else if (iFollow) {
                html += '<p><b>' + escapeXml(dn) + '</b> <small>@' + escapeXml(u.username) + '</small><br/>';
                html += '<small>Following</small></p>';
            } else {
                html += '<p><b>' + escapeXml(dn) + '</b> <small>@' + escapeXml(u.username) + '</small><br/>';
                html += '<a href="/wap/follow/' + encodeURIComponent(u.username) + '">Follow</a></p>';
            }
        }

        if (!hasAny) {
            html = '<p>No one to show yet.<br/><small>Check back later.</small></p>';
        }

        html += '<hr/><p><a href="/wap/chat">Back to Chats</a></p>';
        res.send(wapPage('Find people', html, { back: '/wap/chat', user: req.session.user }));
    } catch (err) {
        console.error('Find people error:', err);
        res.send(wapPage('Error', '<p>Something went wrong.</p><p><a href="/wap">Home</a></p>'));
    }
});

// ===== FOLLOW ACTION =====
router.get('/follow/:target', async (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');
    try {
        const Follow = require('../models/Follow');
        const Notification = require('../models/Notification');
        const me = req.session.user;
        const target = req.params.target;

        if (target === me) return res.redirect('/wap/add-friends');

        const existing = await Follow.findOne({ follower: me, following: target });
        if (!existing) {
            await Follow.create({ follower: me, following: target });
            try {
                await Notification.create({
                    recipient: target,
                    actor: me,
                    type: 'follow',
                    ref_id: ''
                });
            } catch (e) {}
        }
        res.redirect('/wap/add-friends');
    } catch (err) {
        res.redirect('/wap/add-friends');
    }
});

`;
    src = src.slice(0, as1) + newAF + src.slice(ae1);
    console.log('OK: add-friends rewritten');
} else {
    console.log('WARN: add-friends markers not found');
}

// ===== 3. Remove /request route (old) =====
const reqStart = "// ===== SEND FRIEND REQUEST =====";
const reqEnd = "// ===== NOTIFICATIONS =====";
const rs = src.indexOf(reqStart);
const re = src.indexOf(reqEnd);
if (rs !== -1 && re !== -1) {
    src = src.slice(0, rs) + src.slice(re);
    console.log('OK: request route removed');
}

// ===== 4. Notifications rewrite =====
const notifStart = "// ===== NOTIFICATIONS =====";
const notifEnd = "// ===== ACCEPT REQUEST =====";
const ns = src.indexOf(notifStart);
const ne = src.indexOf(notifEnd);
if (ns !== -1 && ne !== -1) {
    const newNotif = `// ===== NOTIFICATIONS =====
router.get('/notifications', async (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');
    try {
        const me = req.session.user;
        const Notification = require('../models/Notification');

        const notifs = await Notification.find({ recipient: me })
            .sort({ created_at: -1 })
            .limit(30);

        let html = '';
        if (notifs.length === 0) {
            html = '<p>All caught up.<br/><small>No new notifications.</small></p>';
        } else {
            for (const n of notifs) {
                let text = '';
                if (n.type === 'follow') text = 'started following you';
                else if (n.type === 'mention') text = 'mentioned you';
                else if (n.type === 'friend_accepted') text = 'followed you back';
                html += '<p><b>' + escapeXml(n.actor) + '</b> ' + text + '</p>';
            }
            // Delete after view
            await Notification.deleteMany({
                recipient: me,
                type: { $in: ['follow', 'friend_accepted'] }
            });
        }

        res.send(wapPage('Notifications', html, { back: '/wap', user: req.session.user }));
    } catch (err) {
        res.send(wapPage('Error', '<p>Error loading notifications.</p><p><a href="/wap">Home</a></p>'));
    }
});

`;
    src = src.slice(0, ns) + newNotif + src.slice(ne);
    console.log('OK: notifications rewritten');
} else {
    console.log('WARN: notifications markers not found');
}

// ===== 5. Remove accept/reject old routes =====
const accStart = "// ===== ACCEPT REQUEST =====";
const accEnd = "// ===== CHAT ROOM =====";
const acc1 = src.indexOf(accStart);
let acc2 = src.indexOf(accEnd);
if (acc2 === -1) {
    // fallback: look for chat room GET
    acc2 = src.indexOf("router.get('/chat/:withUser'");
}
if (acc1 !== -1 && acc2 !== -1 && acc1 < acc2) {
    src = src.slice(0, acc1) + src.slice(acc2);
    console.log('OK: accept/reject removed');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('routes/wap.js', src);
console.log('DONE');
