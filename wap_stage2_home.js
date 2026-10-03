const fs = require('fs');
let src = fs.readFileSync('routes/wap.js', 'utf8');
const before = src;

// Find home route and clean menu
const oldHome = `router.get('/', async (req, res) => {
    const isLoggedIn = req.session.user ? true : false;
    const username = req.session.user || '';

    let menu = '';
    if (isLoggedIn) {
        // Count unread requests
        let notifBadge = '';
        try {
            const FriendRequest = require('../models/FriendRequest');
            const count = await FriendRequest.countDocuments({ to: username, status: 'pending' });
            if (count > 0) notifBadge = \` (\${count})\`;
        } catch (e) {}

        menu = \`
            <p><b>1.</b> <a href="/wap/feed">Feed</a></p>
            <p><b>2.</b> <a href="/wap/post">New Post</a></p>
            <p><b>3.</b> <a href="/wap/chat">Chat</a></p>
            <p><b>4.</b> <a href="/wap/notifications">Notifications\${notifBadge}</a></p>
            <p><b>5.</b> <a href="/wap/profile">Profile</a></p>
            <p><b>6.</b> <a href="/wap/logout">Logout</a></p>
        \`;
    } else {
        menu = \`
            <p>Text-only network.<br/>No algorithms. No videos.<br/>Just pure thoughts.</p>
            <p><b>1.</b> <a href="/wap/login">Login</a></p>
            <p><b>2.</b> <a href="/wap/signup">Create Account</a></p>
            <p><b>3.</b> <a href="/wap/feed">Browse Feed (read only)</a></p>
        \`;
    }

    res.send(wapPage('EliGet', menu, { user: req.session.user }));
});`;

const newHome = `router.get('/', async (req, res) => {
    const isLoggedIn = req.session.user ? true : false;
    const username = req.session.user || '';

    let menu = '';
    if (isLoggedIn) {
        let notifBadge = '';
        try {
            const Notification = require('../models/Notification');
            const count = await Notification.countDocuments({ recipient: username, seen: false });
            if (count > 0) notifBadge = \` (\${count} new)\`;
        } catch (e) {}

        menu = \`
            <p>1. <a href="/wap/feed">Feed</a></p>
            <p>2. <a href="/wap/post">Write a post</a></p>
            <p>3. <a href="/wap/chat">Messages</a></p>
            <p>4. <a href="/wap/notifications">Notifications\${notifBadge}</a></p>
            <p>5. <a href="/wap/profile">Profile</a></p>
            <p>6. <a href="/wap/logout">Logout</a></p>
        \`;
    } else {
        menu = \`
            <p>Text-only network.<br/>
            No algorithms. No videos.<br/>
            Just pure thoughts.</p>
            <p>1. <a href="/wap/login">Login</a></p>
            <p>2. <a href="/wap/signup">Create Account</a></p>
            <p>3. <a href="/wap/feed">Browse Feed</a></p>
        \`;
    }

    res.send(wapPage('EliGet', menu, { user: req.session.user }));
});`;

if (src.includes(oldHome)) {
    src = src.replace(oldHome, function() { return newHome; });
    console.log('OK: WAP home menu cleaner');
} else {
    console.log('WARN: home route pattern not found');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('routes/wap.js', src);
console.log('DONE');
