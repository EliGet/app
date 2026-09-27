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

function escapeXml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function wapPage(title, body, options = {}) {
    const autoRefresh = options.refresh
        ? `<meta http-equiv="refresh" content="${options.refresh}"/>`
        : '';
    const user = options.user || '';
    const userParam = user ? '?u=' + encodeURIComponent(user) : '';
    const backUrl = options.back ? (options.back + userParam) : '';
    const backLink = backUrl
        ? `<p><small><a href="${backUrl}">Back</a> | <a href="/wap${userParam}">Home</a></small></p>`
        : '';
    // Auto-append ?u= to all /wap links in body if user is set
    let processedBody = body;
    if (user) {
        // Append ?u= to href="/wap/..." links that don't have ?u=
        processedBody = body.replace(/href="(\/wap[^"]*?)"/g, (match, url) => {
            if (url.includes('?')) {
                return `href="${url}&u=${encodeURIComponent(user)}"`;
            } else {
                return `href="${url}?u=${encodeURIComponent(user)}"`;
            }
        });
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.0//EN" "http://www.wapforum.org/DTD/xhtml-mobile10.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
${autoRefresh}
<title>${escapeXml(title)}</title>
</head>
<body>
<h3>${escapeXml(title)}</h3>
${processedBody}
<hr/>
${backLink}
<p><small>EliGet - Text-only network</small></p>
</body>
</html>`;
}

// ===== HOME MENU =====
router.get('/', async (req, res) => {
    const isLoggedIn = req.session.user ? true : false;
    const username = req.session.user || '';

    let menu = '';
    if (isLoggedIn) {
        // Count unread requests
        let notifBadge = '';
        try {
            const FriendRequest = require('../models/FriendRequest');
            const count = await FriendRequest.countDocuments({ to: username, status: 'pending' });
            if (count > 0) notifBadge = ` (${count})`;
        } catch (e) {}

        menu = `
            <p>Welcome, <b>${escapeXml(username)}</b></p>
            <p><a href="/wap/feed">1. Feed</a></p>
            <p><a href="/wap/post">2. New Post</a></p>
            <p><a href="/wap/chat">3. Chat</a></p>
            <p><a href="/wap/notifications">4. Notifications${notifBadge}</a></p>
            <p><a href="/wap/profile">5. Profile</a></p>
            <p><a href="/wap/logout">6. Logout</a></p>
        `;
    } else {
        menu = `
            <p>Text-only, anti-addiction network</p>
            <p><a href="/wap/login">1. Login</a></p>
            <p><a href="/wap/signup">2. Signup</a></p>
            <p><a href="/wap/feed">3. Feed (read only)</a></p>
        `;
    }

    res.send(wapPage('EliGet', menu, { user: req.session.user }));
});

// ===== LOGIN =====
router.get('/login', (req, res) => {
    const body = `
        <form action="/wap/login${userParam}" method="POST">
            <p>Username:<br/><input type="text" name="username" size="12" maxlength="20"/></p>
            <p>Password:<br/><input type="password" name="password" size="12" maxlength="30"/></p>
            <p><input type="submit" value="Login"/></p>
        </form>
        <p><a href="/wap/signup">Signup</a></p>
    `;
    res.send(wapPage('Login', body, { back: '/wap' , user: req.session.user }));
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
        <form action="/wap/signup${userParam}" method="POST">
            <p>Full Name:<br/><input type="text" name="full_name" size="15" maxlength="30"/></p>
            <p>Username:<br/><input type="text" name="username" size="12" maxlength="20"/></p>
            <p>Password:<br/><input type="password" name="password" size="12" maxlength="30"/></p>
            <p><input type="submit" value="Signup"/></p>
        </form>
        <p><a href="/wap/login">Already have account? Login</a></p>
    `;
    res.send(wapPage('Create Account', body, { back: '/wap' , user: req.session.user }));
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

// ===== FEED (with pagination) =====
router.get('/feed', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = 5;
        const skip = (page - 1) * perPage;

        const totalPosts = await Post.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);
        const posts = await Post.find().sort({ created_at: -1 }).skip(skip).limit(perPage);

        let html = '';
        if (posts.length === 0) {
            html = '<p>No posts yet.</p>';
        } else {
            for (let i = 0; i < posts.length; i++) {
                const p = posts[i];
                const author = await User.findOne({ username: p.author });
                const displayName = author ? (author.full_name || author.username) : p.author;

                let body = p.body;
                let readMore = '';
                if (body.length > 120) {
                    body = body.substring(0, 120) + '...';
                    readMore = ` <a href="/wap/post/${p._id}">Read more</a>`;
                }

                html += `<p>${skip + i + 1}. <b>${escapeXml(displayName)}</b><br/>${escapeXml(body)}${readMore}</p>`;
            }

            // Pagination
            html += '<hr/>';
            if (page > 1) {
                html += `<a href="/wap/feed?page=${page - 1}">Previous</a> `;
            }
            html += `[Page ${page} of ${totalPages}] `;
            if (page < totalPages) {
                html += `<a href="/wap/feed?page=${page + 1}">Next</a>`;
            }
        }

        res.send(wapPage('Feed', html, { back: '/wap' , user: req.session.user }));
    } catch (err) {
        res.send(wapPage('Error', `<p>Something went wrong.</p><p><a href="/wap">Home</a></p>`));
    }
});

// ===== SINGLE POST VIEW =====
router.get('/post/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.send(wapPage('Error', `<p>Post not found.</p><p><a href="/wap/feed">Back to Feed</a></p>`));
        }

        const author = await User.findOne({ username: post.author });
        const displayName = author ? (author.full_name || author.username) : post.author;

        const html = `
            <p><b>${escapeXml(displayName)}</b></p>
            <hr/>
            <p>${escapeXml(post.body)}</p>
        `;

        res.send(wapPage('Post', html, { back: '/wap/feed' , user: req.session.user }));
    } catch (err) {
        res.send(wapPage('Error', `<p>Something went wrong.</p><p><a href="/wap/feed">Back to Feed</a></p>`));
    }
});

// ===== NEW POST =====
router.get('/post', (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');
    const body = `
        <form action="/wap/post${userParam}" method="POST">
            <p>Your thoughts (max 300):<br/>
            <textarea name="body" rows="5" cols="20" maxlength="300"></textarea></p>
            <p><input type="submit" value="Post"/></p>
        </form>
    `;
    res.send(wapPage('New Post', body, { back: '/wap' , user: req.session.user }));
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

// ===== CHAT LIST (with last message preview) =====
router.get('/chat', async (req, res) => {
    if (!req.session.user) return res.redirect('/wap/login');
    try {
        const me = req.session.user;
        const FriendRequest = require('../models/FriendRequest');
        const Message = require('../models/Message');

        const accepted = await FriendRequest.find({
            status: 'accepted',
            $or: [{ from: me }, { to: me }]
        });

        let html = '';
        if (accepted.length === 0) {
            html = '<p>No chats yet.</p>';
        } else {
            for (let i = 0; i < accepted.length; i++) {
                const r = accepted[i];
                const other = r.from === me ? r.to : r.from;

                function getChatId(u1, u2) {
                    const users = [u1.toLowerCase(), u2.toLowerCase()].sort();
                    return `${users[0]}_${users[1]}`;
                }

                const lastMsg = await Message.findOne({ chat_id: getChatId(me, other) }).sort({ created_at: -1 });
                const unread = await Message.countDocuments({ chat_id: getChatId(me, other), from: other, read: false });

                let preview = 'No messages yet';
                if (lastMsg) {
                    preview = lastMsg.body.length > 30 ? lastMsg.body.substring(0, 30) + '...' : lastMsg.body;
                }

                const newBadge = unread > 0 ? ' <b>*NEW*</b>' : '';
                html += `<p>${i + 1}. <a href="/wap/chat/${other}"><b>${escapeXml(other)}</b></a>${newBadge}<br/><small>${escapeXml(preview)}</small></p>`;
            }
        }

        html += `<p><a href="/wap/add-friends">Add Friends</a></p>`;

        res.send(wapPage('Chats', html, { back: '/wap' , user: req.session.user }));
    } catch (err) {
        console.error('Chat list error:', err);
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
        let hasAny = false;

        for (const u of allUsers) {
            const existing = await FriendRequest.findOne({
                $or: [
                    { from: me, to: u.username },
                    { from: u.username, to: me }
                ]
            });

            if (existing && existing.status === 'accepted') continue;

            hasAny = true;

            if (existing && existing.status === 'pending' && existing.from === me) {
                html += `<p>${escapeXml(u.full_name)} - <b>Requested</b></p>`;
            } else if (existing && existing.status === 'pending' && existing.to === me) {
                html += `<p>${escapeXml(u.full_name)} - <a href="/wap/notifications">Respond</a></p>`;
            } else {
                html += `<p>${escapeXml(u.full_name)} (@${escapeXml(u.username)})<br/><a href="/wap/request/${u.username}">Send Request</a></p>`;
            }
        }

        if (!hasAny) {
            html = '<p>No other users available right now.</p>';
        }

        html += `<p><a href="/wap/chat">Back to Chats</a></p>`;
        res.send(wapPage('Add Friends', html, { back: '/wap/chat' , user: req.session.user }));
    } catch (err) {
        console.error('Add friends error:', err);
        res.send(wapPage('Error', `<p>Something went wrong.</p><p><a href="/wap">Home</a></p>`));
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

// ===== NOTIFICATIONS =====
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
                html += `<p><b>${escapeXml(r.from)}</b> wants to chat.</p>
                         <p><a href="/wap/accept/${r._id}">[Accept]</a></p>`;
            }
        }

        res.send(wapPage('Notifications', html, { back: '/wap' , user: req.session.user }));
    } catch (err) {
        res.send(wapPage('Error', '<p>Error loading notifications.</p><p><a href="/wap">Home</a></p>'));
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

// ===== CHAT ROOM (with auto-refresh + quick reply) =====
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

        // Mark received as read
        await Message.updateMany({ chat_id: chatId, from: withUser, read: false }, { read: true });

        const messages = await Message.find({ chat_id: chatId }).sort({ created_at: 1 }).limit(30);

        let html = '';
        if (messages.length === 0) {
            html = '<p>No messages yet. Say hi!</p>';
        } else {
            messages.forEach(m => {
                const sender = m.from === me ? 'You' : m.from;
                html += `<p><b>${escapeXml(sender)}:</b> ${escapeXml(m.body)}</p>`;
            });
        }

        html += `
            <hr/>
            <form action="/wap/chat/${escapeXml(withUser)}" method="POST">
                <p><input type="text" name="body" size="15" maxlength="200" required/></p>
                <p><input type="submit" value="Send"/></p>
            </form>
            <hr/>
            <p><b>Quick Reply:</b></p>
            <form action="/wap/chat/${escapeXml(withUser)}" method="POST" style="display:inline;">
                <input type="hidden" name="body" value="Hi"/>
                <input type="submit" value="Hi"/>
            </form>
            <form action="/wap/chat/${escapeXml(withUser)}" method="POST" style="display:inline;">
                <input type="hidden" name="body" value="Ok"/>
                <input type="submit" value="Ok"/>
            </form>
            <form action="/wap/chat/${escapeXml(withUser)}" method="POST" style="display:inline;">
                <input type="hidden" name="body" value="Yes"/>
                <input type="submit" value="Yes"/>
            </form>
            <form action="/wap/chat/${escapeXml(withUser)}" method="POST" style="display:inline;">
                <input type="hidden" name="body" value="No"/>
                <input type="submit" value="No"/>
            </form>
            <form action="/wap/chat/${escapeXml(withUser)}" method="POST" style="display:inline;">
                <input type="hidden" name="body" value="Thanks"/>
                <input type="submit" value="Thanks"/>
            </form>
        `;

        res.send(wapPage('Chat: ' + withUser, html, {
            back: '/wap/chat',
            refresh: 30  // Auto-refresh every 30 seconds
        }));
    } catch (err) {
        console.error('Chat room error:', err);
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
                postsHtml += `<p>${i + 1}. ${escapeXml(body)}</p>`;
            });
        }

        const html = `
            <p>Name: <b>${escapeXml(user.full_name)}</b></p>
            <p>Username: @${escapeXml(user.username)}</p>
            <hr/>
            <p><b>My Posts:</b></p>
            ${postsHtml}
            <hr/>
            <p><a href="/wap/logout">Logout</a></p>
        `;

        res.send(wapPage('My Profile', html, { back: '/wap' , user: req.session.user }));
    } catch (err) {
        res.send(wapPage('Error', `<p>Something went wrong.</p><p><a href="/wap">Home</a></p>`));
    }
});

module.exports = router;
