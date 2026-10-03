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

    // Auto-append ?u= to all /wap links in body if user is set
    let processedBody = body;
    if (user) {
        processedBody = body.replace(/href="(\/wap[^"]*?)"/g, (match, url) => {
            if (url.includes('?')) {
                return `href="${url}&u=${encodeURIComponent(user)}"`;
            } else {
                return `href="${url}?u=${encodeURIComponent(user)}"`;
            }
        });
    }

    // Top nav bar: Back + Home (classic WAP style)
    const topNav = backUrl
        ? `<p><a href="${backUrl}">&lt;&lt; Back</a> | <a href="/wap${userParam}">Home</a></p>`
        : '<p><b>EliGet</b></p>';

    const userLine = user
        ? `<p><small>You: <b>${escapeXml(user)}</b></small></p>`
        : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.0//EN" "http://www.wapforum.org/DTD/xhtml-mobile10.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
${autoRefresh}
<title>${escapeXml(title)} - EliGet</title>
</head>
<body>
${topNav}
<h1>${escapeXml(title)}</h1>
<hr/>
${processedBody}
<hr/>
${userLine}
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
        let notifBadge = '';
        try {
            const Notification = require('../models/Notification');
            const count = await Notification.countDocuments({ recipient: username, seen: false });
            if (count > 0) notifBadge = ` (${count} new)`;
        } catch (e) {}

        menu = `
            <p>1. <a href="/wap/feed">Feed</a></p>
            <p>2. <a href="/wap/post">Write a post</a></p>
            <p>3. <a href="/wap/chat">Messages</a></p>
            <p>4. <a href="/wap/notifications">Notifications${notifBadge}</a></p>
            <p>5. <a href="/wap/profile">Profile</a></p>
            <p>6. <a href="/wap/logout">Logout</a></p>
        `;
    } else {
        menu = `
            <p>Text-only network.<br/>
            No algorithms. No videos.<br/>
            Just pure thoughts.</p>
            <p>1. <a href="/wap/login">Login</a></p>
            <p>2. <a href="/wap/signup">Create Account</a></p>
            <p>3. <a href="/wap/feed">Browse Feed</a></p>
        `;
    }

    res.send(wapPage('EliGet', menu, { user: req.session.user }));
});

// ===== LOGIN =====
router.get('/login', (req, res) => {
    const err = req.query.err ? `<p><b>Error:</b> ${escapeXml(req.query.err)}</p><hr/>` : '';
    const body = `
        ${err}
        <form action="/wap/login" method="POST">
            <p>Username<br/><input type="text" name="username" size="14" maxlength="20"/></p>
            <p>Password<br/><input type="password" name="password" size="14" maxlength="30"/></p>
            <p><input type="submit" value="Login"/></p>
        </form>
        <hr/>
        <p><a href="/wap/signup">Create new account</a></p>
    `;
    res.send(wapPage('Login', body, { back: '/wap', user: req.session.user }));
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
    const err = req.query.err ? `<p><b>Error:</b> ${escapeXml(req.query.err)}</p><hr/>` : '';
    const body = `
        ${err}
        <form action="/wap/signup" method="POST">
            <p>Full name<br/><input type="text" name="full_name" size="16" maxlength="50"/></p>
            <p>Username<br/><input type="text" name="username" size="14" maxlength="20"/></p>
            <p><small>Letters, numbers, underscore. 3-20 chars.</small></p>
            <p>Password<br/><input type="password" name="password" size="14" maxlength="30"/></p>
            <p><small>At least 6 characters.</small></p>
            <p><input type="submit" value="Create Account"/></p>
        </form>
        <hr/>
        <p><a href="/wap/login">Already have an account? Login</a></p>
    `;
    res.send(wapPage('Create Account', body, { back: '/wap', user: req.session.user }));
});

router.post('/signup', async (req, res) => {
    try {
        const { full_name, username, password } = req.body;

        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username || '')) {
            return res.redirect('/wap/signup?err=' + encodeURIComponent('Username: 3-20 letters, numbers, underscore.'));
        }
        if (!password || password.length < 6) {
            return res.redirect('/wap/signup?err=' + encodeURIComponent('Password needs 6+ characters.'));
        }

        const existing = await User.findOne({ username });
        if (existing) {
            return res.redirect('/wap/signup?err=' + encodeURIComponent('Username already taken.'));
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
            html = '<p>No posts yet.<br/><small>Be the first to write something.</small></p>';
        } else {
            for (let i = 0; i < posts.length; i++) {
                const p = posts[i];
                const author = await User.findOne({ username: p.author });
                const displayName = author ? (author.full_name || author.username) : p.author;

                // Time ago
                const diff = Date.now() - new Date(p.created_at).getTime();
                const min = Math.floor(diff / 60000);
                let timeStr;
                if (min < 1) timeStr = 'now';
                else if (min < 60) timeStr = min + 'm';
                else if (min < 1440) timeStr = Math.floor(min / 60) + 'h';
                else timeStr = Math.floor(min / 1440) + 'd';

                let body = p.body;
                let readMore = '';
                if (body.length > 150) {
                    body = body.substring(0, 150) + '...';
                    readMore = ` <a href="/wap/post/${p._id}">more</a>`;
                }

                html += `<p><b>${escapeXml(displayName)}</b> <small>· ${timeStr}</small><br/>${escapeXml(body)}${readMore}</p>`;
            }

            html += '<hr/>';
            if (page > 1) {
                html += `<a href="/wap/feed?page=${page - 1}">&lt;&lt; Newer</a> | `;
            }
            html += `<small>Page ${page}/${totalPages}</small>`;
            if (page < totalPages) {
                html += ` | <a href="/wap/feed?page=${page + 1}">Older &gt;&gt;</a>`;
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

        const diff = Date.now() - new Date(post.created_at).getTime();
        const min = Math.floor(diff / 60000);
        let timeStr;
        if (min < 1) timeStr = 'just now';
        else if (min < 60) timeStr = min + 'm ago';
        else if (min < 1440) timeStr = Math.floor(min / 60) + 'h ago';
        else if (min < 10080) timeStr = Math.floor(min / 1440) + 'd ago';
        else timeStr = new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

        const html = `
            <p><b>${escapeXml(displayName)}</b><br/>
            <small>${timeStr}</small></p>
            <hr/>
            <p>${escapeXml(post.body).replace(/\n/g, '<br/>')}</p>
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
        <p><small>Max 300 characters.</small></p>
        <form action="/wap/post" method="POST">
            <p><textarea name="body" rows="6" cols="20" maxlength="300"></textarea></p>
            <p><input type="submit" value="Publish"/></p>
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

// ===== CHAT LIST (mutual follows) =====
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

// ===== FIND PEOPLE (Follow-based) =====
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

// ===== NOTIFICATIONS =====
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
            postsHtml = '<p><small>No posts yet.</small></p>';
        } else {
            posts.forEach((p) => {
                let body = p.body;
                if (body.length > 100) body = body.substring(0, 100) + '...';
                postsHtml += `<p>${escapeXml(body)}</p>`;
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
