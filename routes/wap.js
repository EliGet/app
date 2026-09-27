const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Post = require('../models/Post');

function generateRecoveryCodes() {
    const codes = [];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 3; i++) {
        let code = 'ELI-';
        for (let j = 0; j < 8; j++) {
            if (j === 4) code += '-';
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        codes.push(code);
    }
    return codes;
}

function wapPage(title, body) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.0//EN" "http://www.wapforum.org/DTD/xhtml-mobile10.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>${title}</title>
</head>
<body>
<h3>${title}</h3>
${body}
<hr/>
<p><small>EliGet</small></p>
</body>
</html>`;
}

// ===== HOME MENU =====
router.get('/', (req, res) => {
    const isLoggedIn = req.session.user ? true : false;
    const username = req.session.user || '';

    let menu = '';
    if (isLoggedIn) {
        menu = `
            <p>Welcome, ${username}</p>
            <p><a href="/wap/feed">1. Feed</a></p>
            <p><a href="/wap/post">2. New Post</a></p>
            <p><a href="/wap/chat">3. Chat</a></p>
            <p><a href="/wap/profile">4. Profile</a></p>
            <p><a href="/wap/logout">5. Logout</a></p>
        `;
    } else {
        menu = `
            <p>Text-only network</p>
            <p><a href="/wap/login">1. Login</a></p>
            <p><a href="/wap/signup">2. Signup</a></p>
            <p><a href="/wap/feed">3. Feed (read only)</a></p>
        `;
    }

    res.send(wapPage('EliGet', menu));
});

// ===== LOGIN =====
router.get('/login', (req, res) => {
    const body = `
        <form action="/wap/login" method="POST">
            <p>Username:<br/><input type="text" name="username" size="12" maxlength="20"/></p>
            <p>Password:<br/><input type="password" name="password" size="12" maxlength="30"/></p>
            <p><input type="submit" value="Login"/></p>
        </form>
        <p><a href="/wap/signup">Signup</a></p>
        <p><a href="/wap">Back to Home</a></p>
    `;
    res.send(wapPage('Login', body));
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.send(wapPage('Error', `<p>User not found.</p><p><a href="/wap/login">Try again</a></p>`));
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.send(wapPage('Error', `<p>Wrong password.</p><p><a href="/wap/login">Try again</a></p>`));
        }

        req.session.user = username;
        res.redirect('/wap');
    } catch (err) {
        res.send(wapPage('Error', `<p>Something went wrong.</p><p><a href="/wap/login">Try again</a></p>`));
    }
});

// ===== SIGNUP =====
router.get('/signup', (req, res) => {
    const body = `
        <form action="/wap/signup" method="POST">
            <p>Full Name:<br/><input type="text" name="full_name" size="15" maxlength="30"/></p>
            <p>Username:<br/><input type="text" name="username" size="12" maxlength="20"/></p>
            <p>Password:<br/><input type="password" name="password" size="12" maxlength="30"/></p>
            <p><input type="submit" value="Signup"/></p>
        </form>
        <p><a href="/wap/login">Already have account? Login</a></p>
        <p><a href="/wap">Back to Home</a></p>
    `;
    res.send(wapPage('Create Account', body));
});

router.post('/signup', async (req, res) => {
    try {
        const { full_name, username, password } = req.body;

        if (username.includes(' ')) {
            return res.send(wapPage('Error', `<p>No spaces in username.</p><p><a href="/wap/signup">Try again</a></p>`));
        }

        const existing = await User.findOne({ username });
        if (existing) {
            return res.send(wapPage('Error', `<p>Username taken.</p><p><a href="/wap/signup">Try again</a></p>`));
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const rawCodes = generateRecoveryCodes();
        const hashedCodes = rawCodes.map(code => ({
            hash: bcrypt.hashSync(code, 10),
            used: false
        }));

        const newUser = new User({
            full_name: full_name,
            username: username,
            password_hash: hashedPassword,
            recovery_codes: hashedCodes
        });
        await newUser.save();

        let codesHtml = '';
        rawCodes.forEach(c => {
            codesHtml += `<p><b>${c}</b></p>`;
        });

        res.send(wapPage('Account Created', `
            <p>Write down these 3 codes:</p>
            ${codesHtml}
            <p>Needed if you forget password.</p>
            <p><a href="/wap/login">Login now</a></p>
        `));
    } catch (err) {
        res.send(wapPage('Error', `<p>Something went wrong.</p><p><a href="/wap/signup">Try again</a></p>`));
    }
});

// ===== LOGOUT =====
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/wap');
});

// ===== FEED =====
router.get('/feed', async (req, res) => {
    try {
        const posts = await Post.find().sort({ created_at: -1 }).limit(10);

        let html = '';
        if (posts.length === 0) {
            html = '<p>No posts yet.</p>';
        } else {
            posts.forEach((p, i) => {
                let body = p.body;
                if (body.length > 100) body = body.substring(0, 100) + '...';
                html += `<p>${i + 1}. <b>${p.author}</b><br/>${body}</p>`;
            });
        }

        html += `<p><a href="/wap">Home</a></p>`;

        res.send(wapPage('Feed', html));
    } catch (err) {
        res.send(wapPage('Error', `<p>Something went wrong.</p><p><a href="/wap">Home</a></p>`));
    }
});

// ===== PROFILE =====
router.get('/profile', async (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');

    try {
        const user = await User.findOne({ username: req.session.user });
        if (!user) return res.redirect('/wap/logout');

        const posts = await Post.find({ author: req.session.user }).sort({ created_at: -1 }).limit(5);

        let postsHtml = '';
        if (posts.length === 0) {
            postsHtml = '<p>You have no posts yet.</p>';
        } else {
            posts.forEach((p, i) => {
                let body = p.body;
                if (body.length > 80) body = body.substring(0, 80) + '...';
                postsHtml += `<p>${i + 1}. ${body}</p>`;
            });
        }

        const html = `
            <p>Name: <b>${user.full_name}</b></p>
            <p>Username: @${user.username}</p>
            <hr/>
            <p><b>My Posts:</b></p>
            ${postsHtml}
            <hr/>
            <p><a href="/wap">Home</a></p>
            <p><a href="/wap/logout">Logout</a></p>
        `;

        res.send(wapPage('My Profile', html));
    } catch (err) {
        res.send(wapPage('Error', `<p>Something went wrong.</p><p><a href="/wap">Home</a></p>`));
    }
});

module.exports = router;

// ===== NEW POST =====
router.get('/post', (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');
    const body = `
        <form action="/wap/post" method="POST">
            <p>Your thoughts (max 300):<br/>
            <textarea name="body" rows="5" cols="20" maxlength="300"></textarea></p>
            <p><input type="submit" value="Post"/></p>
        </form>
        <p><a href="/wap">Back to Home</a></p>
    `;
    res.send(wapPage('New Post', body));
});

router.post('/post', async (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');
    try {
        const newPost = new Post({
            author: req.session.user,
            body: req.body.body,
            mood: 'none',
            image: 'none'
        });
        await newPost.save();
        res.redirect('/wap/feed');
    } catch (err) {
        res.send(wapPage('Error', `<p>Failed to post.</p><p><a href="/wap/post">Try again</a></p>`));
    }
});

// ===== CHAT LIST =====
router.get('/chat', async (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');
    try {
        const me = req.session.user;
        const FriendRequest = require('../models/FriendRequest');

        const accepted = await FriendRequest.find({
            status: 'accepted',
            $or: [{ from: me }, { to: me }]
        });

        let html = '';
        if (accepted.length === 0) {
            html = '<p>No chats yet. Add friends first.</p>';
        } else {
            accepted.forEach((r, i) => {
                const other = r.from === me ? r.to : r.from;
                html += `<p>${i + 1}. <a href="/wap/chat/${other}">${other}</a></p>`;
            });
        }

        html += `<p><a href="/wap/add-friends">Add Friends</a></p>`;
        html += `<p><a href="/wap">Home</a></p>`;

        res.send(wapPage('Chats', html));
    } catch (err) {
        res.send(wapPage('Error', `<p>Something went wrong.</p><p><a href="/wap">Home</a></p>`));
    }
});

// ===== ADD FRIENDS =====
router.get('/add-friends', async (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');
    try {
        const me = req.session.user;
        const FriendRequest = require('../models/FriendRequest');
        const allUsers = await User.find({ username: { $ne: me } }).limit(20);

        let html = '';
        if (allUsers.length === 0) {
            html = '<p>No other users.</p>';
        } else {
            for (const u of allUsers) {
                const existing = await FriendRequest.findOne({
                    $or: [
                        { from: me, to: u.username },
                        { from: u.username, to: me }
                    ]
                });

                if (existing && existing.status === 'accepted') continue;
                if (existing && existing.status === 'pending' && existing.from === me) {
                    html += `<p>${u.full_name} - <b>Requested</b></p>`;
                } else {
                    html += `<p>${u.full_name} (@${u.username}) - <a href="/wap/request/${u.username}">Request</a></p>`;
                }
            }
        }

        html += `<p><a href="/wap/chat">Back</a></p>`;
        res.send(wapPage('Add Friends', html));
    } catch (err) {
        res.send(wapPage('Error', `<p>Something went wrong.</p>`));
    }
});

// ===== SEND FRIEND REQUEST =====
router.get('/request/:target', async (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');
    try {
        const FriendRequest = require('../models/FriendRequest');
        const me = req.session.user;
        const target = req.params.target;

        const existing = await FriendRequest.findOne({
            $or: [
                { from: me, to: target },
                { from: target, to: me }
            ]
        });

        if (!existing) {
            await FriendRequest.create({ from: me, to: target, status: 'pending' });
        }
        res.redirect('/wap/add-friends');
    } catch (err) {
        res.redirect('/wap/add-friends');
    }
});

// ===== NOTIFICATIONS (Friend Requests) =====
router.get('/notifications', async (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');
    try {
        const me = req.session.user;
        const FriendRequest = require('../models/FriendRequest');
        const pending = await FriendRequest.find({ to: me, status: 'pending' });

        let html = '';
        if (pending.length === 0) {
            html = '<p>No new notifications.</p>';
        } else {
            for (const r of pending) {
                html += `<p>${r.from} wants to chat. <a href="/wap/accept/${r._id}">Accept</a></p>`;
            }
        }

        html += `<p><a href="/wap">Home</a></p>`;
        res.send(wapPage('Notifications', html));
    } catch (err) {
        res.send(wapPage('Error', '<p>Error loading notifications.</p>'));
    }
});

// ===== ACCEPT REQUEST =====
router.get('/accept/:id', async (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');
    try {
        const FriendRequest = require('../models/FriendRequest');
        await FriendRequest.updateOne({ _id: req.params.id }, { status: 'accepted' });
        res.redirect('/wap/chat');
    } catch (err) {
        res.redirect('/wap');
    }
});

// ===== CHAT ROOM =====
router.get('/chat/:withUser', async (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');
    try {
        const me = req.session.user;
        const withUser = req.params.withUser;
        const Message = require('../models/Message');

        function getChatId(u1, u2) {
            const users = [u1.toLowerCase(), u2.toLowerCase()].sort();
            return `${users[0]}_${users[1]}`;
        }

        const chatId = getChatId(me, withUser);

        // Mark as read
        await Message.updateMany({ chat_id: chatId, from: withUser, read: false }, { read: true });

        const messages = await Message.find({ chat_id: chatId }).sort({ created_at: 1 }).limit(30);

        let html = '';
        if (messages.length === 0) {
            html = '<p>No messages yet.</p>';
        } else {
            messages.forEach(m => {
                const sender = m.from === me ? 'You' : m.from;
                html += `<p><b>${sender}:</b> ${m.body}</p>`;
            });
        }

        html += `
            <hr/>
            <form action="/wap/chat/${withUser}" method="POST">
                <p><input type="text" name="body" size="15" maxlength="200" required/></p>
                <p><input type="submit" value="Send"/></p>
            </form>
            <p><a href="/wap/chat/${withUser}">Refresh</a></p>
            <p><a href="/wap/chat">Back to Chats</a></p>
        `;

        res.send(wapPage('Chat: ' + withUser, html));
    } catch (err) {
        res.send(wapPage('Error', `<p>Error loading chat.</p><p><a href="/wap/chat">Back</a></p>`));
    }
});

// ===== SEND MESSAGE =====
router.post('/chat/:withUser', async (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');
    try {
        const me = req.session.user;
        const withUser = req.params.withUser;
        const Message = require('../models/Message');

        function getChatId(u1, u2) {
            const users = [u1.toLowerCase(), u2.toLowerCase()].sort();
            return `${users[0]}_${users[1]}`;
        }

        await Message.create({
            chat_id: getChatId(me, withUser),
            from: me,
            body: req.body.body,
            read: false
        });

        res.redirect(`/wap/chat/${withUser}`);
    } catch (err) {
        res.redirect(`/wap/chat/${withUser}`);
    }
});
