const express = require('express');
const { linkifyChat } = require('../lib/linkify');
const errorPage = require('../errorPage');
const router = express.Router();
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Message = require('../models/Message');
const Block = require('../models/Block');
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');

function getChatId(user1, user2) {
    const users = [user1.toLowerCase(), user2.toLowerCase()].sort();
    return `${users[0]}_${users[1]}`;
}

const singleTick = `<span class="msg-tick sent"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>`;
const doubleTick = `<span class="msg-tick seen"><svg viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg></span>`;

const icons = {
    home: `<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    chat: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`,
    profile: `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    feed: `<svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>`,
    send: `<svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:#fff"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
    back: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`,
    group: `<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
    bell: `<svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>`,
    search: `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`
};

function getBottomNav(active) {
    return `<div class="bottom-nav"><a href="/" class="${active === 'home' ? 'active' : ''}">${icons.home}<span>Home</span></a><a href="/post/create" class="${active === 'post' ? 'active' : ''}">${icons.plus}<span>Post</span></a><a href="/chat" class="${active === 'chat' ? 'active' : ''}">${icons.chat}<span>Chat</span></a><a href="/profile" class="${active === 'profile' ? 'active' : ''}">${icons.profile}<span>Profile</span></a></div>`;
}

// ===== CHAT LIST (with search) =====
router.get('/', async (req, res) => {
    try {
        const me = req.session.user;
        const filter = req.query.filter || 'all';

        const acceptedRequests = await FriendRequest.find({
            status: 'accepted',
            $or: [{ from: me }, { to: me }]
        });
        const acceptedUsers = acceptedRequests.map(r => r.from === me ? r.to : r.from);

        // Filter blocked users both directions
        const myBlocks = await Block.find({ blocker: me }).select('blocked');
        const theirBlocks = await Block.find({ blocked: me }).select('blocker');
        const blockedSet = new Set([
            ...myBlocks.map(b => b.blocked),
            ...theirBlocks.map(b => b.blocker)
        ]);
        const visibleUsers = acceptedUsers.filter(u => !blockedSet.has(u));

        let chatItemsHtml = '';
        let hasChats = false;

        // Direct Chats
        if (filter === 'all' || filter === 'unread') {
            for (const otherUsername of visibleUsers) {
                const otherUser = await User.findOne({ username: otherUsername });
                if (!otherUser) continue;

                const chatId = getChatId(me, otherUsername);
                const lastMsg = await Message.findOne({ chat_id: chatId }).sort({ created_at: -1 });
                const unreadCount = await Message.countDocuments({ chat_id: chatId, from: { $ne: me }, read: false });
                const isUnread = unreadCount > 0;

                if (filter === 'unread' && !isUnread) continue;

                hasChats = true;
                const displayName = otherUser.full_name || otherUser.username;
                const initial = displayName.charAt(0).toUpperCase();
                const avatarUrl = otherUser.avatar ? `<img src="${otherUser.avatar}" alt="Avatar">` : initial;

                let lastMsgText = 'No messages yet';
                let lastMsgTime = '';
                if (lastMsg) {
                    lastMsgText = lastMsg.body;
                    lastMsgTime = new Date(lastMsg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                }

                chatItemsHtml += `
                    <a href="/chat/${otherUsername}" class="chat-item${isUnread ? ' unread' : ''}" data-search="${displayName.toLowerCase()} ${otherUsername.toLowerCase()}">
                        <div class="chat-avatar-wrapper">
                            <div class="chat-avatar">${avatarUrl}</div>
                            ${isUnread ? `<span class="unread-dot"></span>` : ''}
                        </div>
                        <div class="chat-info">
                            <div class="chat-name-row">
                                <span class="chat-name">${displayName}</span>
                                <span class="chat-time">${lastMsgTime}</span>
                            </div>
                            <div class="chat-preview${!lastMsg ? ' empty' : ''}">${lastMsgText}</div>
                        </div>
                    </a>
                `;
            }
        }

        // Groups
        if (filter === 'all' || filter === 'groups' || filter === 'unread') {
            const myGroups = await Group.find({ members: me });
            for (const g of myGroups) {
                const lastMsg = await GroupMessage.findOne({ group_id: g._id.toString() }).sort({ created_at: -1 });
                const unreadCount = await GroupMessage.countDocuments({ group_id: g._id.toString(), from: { $ne: me }, read: false });
                const isUnread = unreadCount > 0;

                if (filter === 'unread' && !isUnread) continue;

                hasChats = true;
                const initial = g.name.charAt(0).toUpperCase();
                const avatarUrl = g.avatar ? `<img src="${g.avatar}" alt="Group Avatar">` : initial;

                let lastMsgText = 'Group created. No messages yet.';
                let lastMsgTime = '';
                if (lastMsg) {
                    lastMsgText = `<strong class="sender">${lastMsg.from}</strong>: ${lastMsg.body}`;
                    lastMsgTime = new Date(lastMsg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                }

                chatItemsHtml += `
                    <a href="/group/${g._id}" class="chat-item${isUnread ? ' unread' : ''}" data-search="${g.name.toLowerCase()}">
                        <div class="chat-avatar-wrapper">
                            <div class="chat-avatar">${avatarUrl}</div>
                            ${isUnread ? `<span class="unread-dot"></span>` : ''}
                        </div>
                        <div class="chat-info">
                            <div class="chat-name-row">
                                <span class="chat-name">${g.name}</span>
                                <span class="chat-time">${lastMsgTime}</span>
                            </div>
                            <div class="chat-preview${!lastMsg ? ' empty' : ''}">${lastMsgText}</div>
                        </div>
                    </a>
                `;
            }
        }

        if (!hasChats) {
            let emptyMsg = 'No chats yet.';
            if (filter === 'groups') emptyMsg = 'No group chats found.';
            if (filter === 'unread') emptyMsg = 'No unread messages. All caught up!';
            chatItemsHtml = `<p style="text-align:center; color:#a0aec0; padding: 20px;">${emptyMsg}</p>`;
        }

        const pendingCount = await FriendRequest.countDocuments({ to: me, status: 'pending' });

        res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <title>Chats - EliGet</title>
            </head><body>
            <div class="container">
                <header>
                    <span class="profile-title">Chats</span>
                    <div class="header-actions">
                        <a href="/group/create" class="settings-icon" title="New Group">${icons.group}</a>
                        <a href="/chat/new" class="settings-icon" title="Add Friends">${icons.plus}</a>
                        <a href="/chat/notifications" class="settings-icon" title="Notifications">
                            ${icons.bell}
                            ${pendingCount > 0 ? `<span class="badge">${pendingCount}</span>` : ''}
                        </a>
                    </div>
                </header>

                <div class="chat-search-wrap">
                    <input type="text" class="chat-search-input" id="chatSearch" placeholder="Search chats..." autocomplete="off">
                    <svg class="chat-search-icon" viewBox="0 0 24 24">${icons.search.replace('<svg viewBox="0 0 24 24">', '').replace('</svg>', '')}</svg>
                </div>

                <div class="tab-bar">
                    <a href="/chat?filter=all" class="tab-item ${filter === 'all' ? 'active' : ''}">All</a>
                    <a href="/chat?filter=groups" class="tab-item ${filter === 'groups' ? 'active' : ''}">Groups</a>
                </div>

                <div class="chat-list" id="chatList">${chatItemsHtml}</div>
                <p class="chat-search-empty" id="searchEmpty">No chats match your search.</p>
            </div>
            ${getBottomNav('chat')}

            <script>
                const searchInput = document.getElementById('chatSearch');
                const chatList = document.getElementById('chatList');
                const emptyMsg = document.getElementById('searchEmpty');

                searchInput.addEventListener('input', function() {
                    const query = this.value.toLowerCase().trim();
                    const items = chatList.querySelectorAll('.chat-item');
                    let visibleCount = 0;

                    items.forEach(item => {
                        const searchText = item.getAttribute('data-search') || '';
                        if (query === '' || searchText.includes(query)) {
                            item.style.display = '';
                            visibleCount++;
                        } else {
                            item.style.display = 'none';
                        }
                    });

                    if (visibleCount === 0 && query !== '' && items.length > 0) {
                        emptyMsg.style.display = 'block';
                    } else {
                        emptyMsg.style.display = 'none';
                    }
                });
            </script>
            </body></html>
        `);
    } catch (error) {
        console.error('Chat list error:', error);
        res.status(500).send(errorPage(500, 'Something went wrong', 'An unexpected error occurred. Please try again.', '/', 'Back to home'));
    }
});

// ===== ADD FRIENDS PAGE (live search) =====
router.get('/new', async (req, res) => {
    const searchIconSvg = icons.search;
    res.send(`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <title>Add Friends - EliGet</title>
        </head><body>
        <div class="container">
            <header>
                <a href="/chat" class="header-icon" title="Back">${icons.back}</a>
                <span class="profile-title" style="flex:1;">Add Friends</span>
            </header>

            <div class="chat-search-wrap">
                <svg class="chat-search-icon" viewBox="0 0 24 24">${searchIconSvg.match(/<path[^>]*>/)[0]}</svg>
                <input type="text" id="userSearch" class="chat-search-input" placeholder="Search by username or name..." autocomplete="off" autofocus>
            </div>

            <div class="chat-list" id="resultsBox">
                <p style="text-align:center; color:#a0aec0; padding:24px;">Start typing to search users.</p>
            </div>
        </div>
        ${getBottomNav('chat')}
        <script src="/user-search.js"></script>
        </body></html>
    `);
});

// ===== SEARCH API (JSON) =====
router.get('/api/search', async (req, res) => {
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
            const existingReq = await FriendRequest.findOne({
                $or: [
                    { from: me, to: u.username },
                    { from: u.username, to: me }
                ]
            });
            let status = 'none';
            if (existingReq) {
                if (existingReq.status === 'accepted') status = 'friend';
                else if (existingReq.status === 'pending' && existingReq.from === me) status = 'requested';
                else if (existingReq.status === 'pending' && existingReq.to === me) status = 'respond';
            }
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
        console.error('Search API error:', err);
        res.json({ ok: false, users: [] });
    }
});

// ===== NOTIFICATIONS =====
// ===== SEND FRIEND REQUEST (AJAX) =====
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

router.get('/notifications', async (req, res) => {
    try {
        const me = req.session.user;
        const pendingRequests = await FriendRequest.find({ to: me, status: 'pending' });

        let requestItemsHtml = '';
        for (const request of pendingRequests) {
            const sender = await User.findOne({ username: request.from });
            if (sender) {
                const displayName = sender.full_name || sender.username;
                const initial = displayName.charAt(0).toUpperCase();
                const avatarInner = sender.avatar ? `<img src="${sender.avatar}" alt="">` : initial;
                requestItemsHtml += `
                    <div class="nt-item">
                        <div class="nt-avatar">${avatarInner}</div>
                        <div class="nt-info">
                            <div class="nt-name">${displayName}</div>
                            <div class="nt-username">@${sender.username}</div>
                        </div>
                        <div class="nt-actions">
                            <form action="/chat/accept/${request._id}" method="POST" style="margin:0;">
                                <button type="submit" class="nt-accept">Accept</button>
                            </form>
                            <form action="/chat/reject/${request._id}" method="POST" style="margin:0;">
                                <button type="submit" class="nt-reject">Reject</button>
                            </form>
                        </div>
                    </div>
                `;
            }
        }

        const bodyHtml = pendingRequests.length === 0
            ? `<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>
                <h3>All caught up</h3>
                <p>No new friend requests right now.</p>
                <a href="/chat">Back to chats</a>
            </div>`
            : `<h2 class="nt-section-label">Friend requests</h2>
               <div class="nt-list">${requestItemsHtml}</div>`;

        res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
            <title>Notifications - EliGet</title>
            </head><body>
            <div class="container">
                <header class="feed-header">
                    <a href="/chat" class="header-icon" title="Back">${icons.back}</a>
                    <h1 class="feed-title" style="margin-left:10px;">Notifications</h1>
                </header>
                ${bodyHtml}
            </div>
            ${getBottomNav('chat')}
            </body></html>
        `);
    } catch (error) {
        console.error('Notifications error:', error);
        res.status(500).send(errorPage(500, 'Something went wrong', 'An unexpected error occurred. Please try again.', '/', 'Back to home'));
    }
});

// ===== ACCEPT REQUEST =====
router.post('/accept/:id', async (req, res) => {
    try {
        await FriendRequest.updateOne({ _id: req.params.id }, { status: 'accepted' });
        res.redirect('/chat');
    } catch (error) {
        res.redirect('/chat');
    }
});

// ===== REJECT REQUEST =====
router.post('/reject/:id', async (req, res) => {
    try {
        await FriendRequest.deleteOne({ _id: req.params.id });
        res.redirect('/chat/notifications');
    } catch (error) {
        res.redirect('/chat/notifications');
    }
});

// ===== DIRECT CHAT ROOM =====
router.get('/:withUser', async (req, res) => {
    try {
        const me = req.session.user;
        const withUser = req.params.withUser;
        const chatId = getChatId(me, withUser);

        // Block check
        const blockEither = await Block.findOne({
            $or: [
                { blocker: me, blocked: withUser },
                { blocker: withUser, blocked: me }
            ]
        });
        if (blockEither) return res.redirect('/chat');

        const otherUser = await User.findOne({ username: withUser });
        const displayName = otherUser ? (otherUser.full_name || otherUser.username) : withUser;
        const initial = displayName.charAt(0).toUpperCase();
        const otherAvatarUrl = otherUser && otherUser.avatar ? `<img src="${otherUser.avatar}" alt="Avatar">` : initial;

        await Message.updateMany(
            { chat_id: chatId, from: withUser, read: false },
            { read: true }
        );

        const messages = await Message.find({ chat_id: chatId }).sort({ created_at: 1 });

        let messagesHtml = '';
        if (messages.length === 0) {
            messagesHtml = '<p style="text-align:center; color:#a0aec0; padding: 20px;">No messages yet. Say hi!</p>';
        } else {
            let lastDay = null;
            messages.forEach(m => {
                const isMe = m.from === me;
                const dLabel = (function(dt){
                    const now = new Date();
                    const d = new Date(dt);
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    const diff = Math.floor((today - msgDay) / 86400000);
                    if (diff === 0) return 'Today';
                    if (diff === 1) return 'Yesterday';
                    if (diff < 7) return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
                    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                })(m.created_at);
                if (dLabel !== lastDay) {
                    messagesHtml += '<div class="msg-day-divider"><span>' + dLabel + '</span></div>';
                    lastDay = dLabel;
                }
                if (isMe) {
                    const tick = m.read ? doubleTick : singleTick;
                    messagesHtml += `
                        <div class="msg-row sent">
                            <div class="msg-content">
                                <div class="msg-bubble msg-sent-bubble">${linkifyChat(m.body)}${tick}</div>
                            </div>
                        </div>
                    `;
                } else {
                    messagesHtml += `
                        <div class="msg-row received">
                            <div class="msg-content">
                                <div class="msg-bubble msg-received-bubble">${linkifyChat(m.body)}</div>
                            </div>
                        </div>
                    `;
                }
            });
        }

        res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <title>${displayName} - EliGet</title>
            </head><body>
            <div class="container">
                <header>
                    <a href="/chat" class="header-icon" title="Back">${icons.back}</a>
                    <a href="/profile/${withUser}" class="chat-header-user">
                        <div class="chat-header-avatar">${otherAvatarUrl}</div>
                        <span class="profile-title">${displayName}</span>
                    </a>
                </header>
                <div class="chat-container" id="chatContainer">${messagesHtml}</div>
                <form class="chat-form" action="/chat/${withUser}" method="POST">
                    <input type="text" name="body" required placeholder="Type a message..." autocomplete="off">
                    <button type="submit" title="Send">${icons.send}</button>
                </form>
            </div>
            <script>
                const chatBox = document.getElementById('chatContainer');
                if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
                window.scrollTo(0, document.body.scrollHeight);

                let isTyping = false;
                const inputField = document.querySelector('.chat-form input');
                if (inputField) {
                    inputField.addEventListener('focus', () => { isTyping = true; });
                    inputField.addEventListener('blur', () => { isTyping = false; });
                    inputField.addEventListener('input', () => {
                        isTyping = true;
                        clearTimeout(window._typingTimer);
                        window._typingTimer = setTimeout(() => { isTyping = false; }, 3000);
                    });
                }

                setInterval(() => {
                    if (!isTyping) {
                        fetch(window.location.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                            .then(r => r.text())
                            .then(html => {
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(html, 'text/html');
                                const newBox = doc.getElementById('chatContainer');
                                const oldBox = document.getElementById('chatContainer');
                                if (newBox && oldBox && newBox.innerHTML !== oldBox.innerHTML) {
                                    oldBox.innerHTML = newBox.innerHTML;
                                    oldBox.scrollTop = oldBox.scrollHeight;
                                }
                            })
                            .catch(() => {});
                    }
                }, 5000);
            </script>
            </body></html>
        `);
    } catch (error) {
        console.error('Chat room error:', error);
        res.redirect('/chat');
    }
});

// ===== SEND MESSAGE =====
router.post('/:withUser', async (req, res) => {
    try {
        const me = req.session.user;
        const withUser = req.params.withUser;
        const chatId = getChatId(me, withUser);

        await Message.create({
            chat_id: chatId,
            from: me,
            body: req.body.body,
            read: false
        });

        res.redirect(`/chat/${withUser}`);
    } catch (error) {
        console.error('Message error:', error);
        res.redirect('/chat');
    }
});

module.exports = router;
