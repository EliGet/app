const express = require('express');
const { linkifyChat } = require('../lib/linkify');
const errorPage = require('../errorPage');
const router = express.Router();
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');

const singleTick = `<span class="msg-tick sent"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>`;
const doubleTick = `<span class="msg-tick seen"><svg viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg></span>`;

const icons = {
    home: `<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    students: `<svg viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    chat: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`,
    profile: `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    back: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`,
    group: `<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
    send: `<svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:#fff"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`
};

function getBottomNav(active) {
    return `<div class="bottom-nav"><a href="/" class="${active === 'home' ? 'active' : ''}">${icons.home}<span>Home</span></a><a href="/post/create" class="${active === 'post' ? 'active' : ''}">${icons.plus}<span>Post</span></a><a href="/chat" class="${active === 'chat' ? 'active' : ''}">${icons.chat}<span>Chat</span></a><a href="/profile" class="${active === 'profile' ? 'active' : ''}">${icons.profile}<span>Profile</span></a></div>`;
}

// ===== CREATE GROUP PAGE =====
router.get('/create', async (req, res) => {
    try {
        const me = req.session.user;

        // Get friends (accepted requests)
        const acceptedRequests = await FriendRequest.find({
            status: 'accepted',
            $or: [{ from: me }, { to: me }]
        });
        const friendUsernames = acceptedRequests.map(r => r.from === me ? r.to : r.from);

        let memberItemsHtml = '';
        let hasFriends = false;

        for (const username of friendUsernames) {
            const u = await User.findOne({ username });
            if (!u) continue;

            hasFriends = true;
            const displayName = u.full_name || u.username;
            const initial = displayName.charAt(0).toUpperCase();
            const avatarUrl = u.avatar ? `<img src="${u.avatar}" alt="Avatar">` : initial;

            memberItemsHtml += `
                <label class="member-item">
                    <input type="checkbox" name="members" value="${u.username}">
                    <div class="member-avatar">${avatarUrl}</div>
                    <div class="member-info">
                        <div class="member-name">${displayName}</div>
                        <div class="member-username">@${u.username}</div>
                    </div>
                </label>
            `;
        }

        if (!hasFriends) {
            memberItemsHtml = '<p style="color:#718096; text-align:center; padding: 20px 0;">You have no friends yet. Accept some chat requests first.</p>';
        }

        const avatarSeeds = ['School', 'Work', 'Friends', 'Family', 'Tech', 'Music', 'Sports', 'Art', 'Travel', 'Food', 'Nature', 'Gaming'];
        let avatarOptionsHtml = '';

        avatarSeeds.forEach((seed, index) => {
            const url = `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}`;
            const isChecked = index === 0 ? 'checked' : '';
            const isSelected = index === 0 ? 'selected' : '';
            avatarOptionsHtml += `
                <label class="avatar-option ${isSelected}" onclick="selectAvatar(this)">
                    <input type="radio" name="avatar_url" value="${url}" ${isChecked} required>
                    <img src="${url}" alt="${seed}">
                    <span>${seed}</span>
                </label>
            `;
        });

        res.send(`
            <html><head><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.svg"></head><body>
            <div class="container">
                <header>
                    <a href="/chat" class="header-icon" title="Back">${icons.back}</a>
                    <span class="profile-title" style="flex:1;">New Group</span>
                </header>
                <div class="form-card">
                    <form action="/group/create" method="POST">
                        <div class="form-group">
                            <label>Group Name</label>
                            <input type="text" name="group_name" required placeholder="e.g., Tech Talk" ${!hasFriends ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label>Choose Avatar</label>
                            <div class="avatar-grid">${avatarOptionsHtml}</div>
                        </div>
                        <div class="form-group">
                            <label>Select Members</label>
                            <div class="member-list">${memberItemsHtml}</div>
                        </div>
                        <button type="submit" class="btn-full" ${!hasFriends ? 'disabled' : ''}>Create Group</button>
                    </form>
                </div>
            </div>
            ${getBottomNav('chat')}
            <script>function selectAvatar(el){document.querySelectorAll('.avatar-option').forEach(o=>o.classList.remove('selected'));el.classList.add('selected');}</script>
            </body></html>
        `);
    } catch (error) {
        console.error('Group create page error:', error);
        res.status(500).send(errorPage(500, 'Something went wrong', 'An unexpected error occurred. Please try again.', '/', 'Back to home'));
    }
});

// ===== CREATE GROUP POST =====
router.post('/create', async (req, res) => {
    try {
        const me = req.session.user;
        let { group_name, members, avatar_url } = req.body;
        if (!members) members = [];
        if (!Array.isArray(members)) members = [members];
        members.push(me);

        const newGroup = new Group({
            name: group_name,
            avatar: avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=Group',
            creator: me,
            members: members
        });
        await newGroup.save();

        res.redirect(`/group/${newGroup._id}`);
    } catch (error) {
        console.error('Group create error:', error);
        res.status(500).send(errorPage(500, 'Something went wrong', 'An unexpected error occurred. Please try again.', '/group/create', 'Back to create group'));
    }
});

// ===== GROUP CHAT ROOM =====
router.get('/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const groupId = req.params.id;

        const group = await Group.findById(groupId);
        if (!group || !group.members.includes(me)) {
            return res.redirect('/chat');
        }

        // Mark received messages as read
        await GroupMessage.updateMany(
            { group_id: groupId, from: { $ne: me }, read: false },
            { read: true }
        );

        const messages = await GroupMessage.find({ group_id: groupId }).sort({ created_at: 1 });

        let messagesHtml = '';
        if (messages.length === 0) {
            messagesHtml = '<p style="text-align:center; color:#a0aec0; padding: 20px;">No messages yet. Start the conversation!</p>';
        } else {
            let lastSender = null;
            let lastDay = null;
            for (const m of messages) {
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
                    lastSender = null;
                }
                const senderUser = await User.findOne({ username: m.from });
                const senderName = senderUser ? (senderUser.full_name || senderUser.username) : m.from;
                const initial = senderName.charAt(0).toUpperCase();
                const avatarUrl = senderUser && senderUser.avatar ? `<img src="${senderUser.avatar}" alt="Avatar">` : initial;

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
                    const showLabel = (m.from !== lastSender);
                    const labelHtml = showLabel ? `<div class="msg-sender-name">${senderName}</div>` : '';
                    messagesHtml += `
                        <div class="msg-row received ${showLabel ? 'has-label' : 'no-label'}">
                            <div class="msg-content">
                                ${labelHtml}
                                <div class="msg-bubble msg-received-bubble">${linkifyChat(m.body)}</div>
                            </div>
                        </div>
                    `;
                }
                lastSender = m.from;
            }
        }

        const groupAvatarUrl = group.avatar ? `<img src="${group.avatar}" alt="Group Avatar" style="width:32px;height:32px;border-radius:50%;margin-right:10px;">` : '';
        const displayTitle = `<span style="display:flex; align-items:center;">${groupAvatarUrl} ${group.name}<span class="group-member-count">${group.members.length} members</span></span>`;

        res.send(`
            <html><head><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.svg"></head><body>
            <div class="container">
                <header>
                    <a href="/chat" class="header-icon" title="Back">${icons.back}</a>
                    <a href="/group/${group._id}/members" class="group-header-link" title="View members">
                        <span class="profile-title" style="flex:1;">${displayTitle}</span>
                    </a>
                </header>
                <div class="chat-container" id="chatContainer">${messagesHtml}</div>
                <form class="chat-form" action="/group/${group._id}" method="POST">
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
        console.error('Group room error:', error);
        res.redirect('/chat');
    }
});

// ===== SEND GROUP MESSAGE =====
// ===== GROUP MEMBERS LIST =====
router.get('/:id/members', async (req, res) => {
    try {
        const me = req.session.user;
        const group = await Group.findById(req.params.id);
        if (!group || !group.members.includes(me)) return res.redirect('/chat');

        const isCreator = group.creator === me;
        const memberData = [];
        for (const un of group.members) {
            const u = await User.findOne({ username: un });
            if (!u) continue;
            const dn = u.full_name || u.username;
            memberData.push({
                username: un,
                displayName: dn,
                initial: dn.charAt(0).toUpperCase(),
                avatar: u.avatar || '',
                isCreator: un === group.creator,
                isMe: un === me
            });
        }

        // Sort: creator first, then alphabetical
        memberData.sort((a, b) => {
            if (a.isCreator) return -1;
            if (b.isCreator) return 1;
            return a.displayName.localeCompare(b.displayName);
        });

        let membersHtml = '';
        for (const m of memberData) {
            const avatarInner = m.avatar ? `<img src="${m.avatar}" alt="">` : m.initial;
            const roleBadge = m.isCreator ? '<span class="gm-role">Creator</span>' : '';
            const meBadge = m.isMe ? '<span class="gm-me">You</span>' : '';

            let removeBtn = '';
            if (isCreator && !m.isMe && !m.isCreator) {
                removeBtn = `
                    <form action="/group/${group._id}/remove-member" method="POST" style="margin:0;" onsubmit="return confirm('Remove ${m.displayName.replace(/'/g, "\\'")} from group?')">
                        <input type="hidden" name="username" value="${m.username}">
                        <button type="submit" class="gm-remove" title="Remove">
                            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
                        </button>
                    </form>
                `;
            }

            membersHtml += `
                <div class="gm-item">
                    <div class="gm-avatar">${avatarInner}</div>
                    <div class="gm-info">
                        <div class="gm-name">${m.displayName} ${roleBadge} ${meBadge}</div>
                        <div class="gm-username">@${m.username}</div>
                    </div>
                    ${removeBtn}
                </div>
            `;
        }

        res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
            <title>${group.name} · Members - EliGet</title>
            </head><body class="st-body">
            <div class="st-wrap">
                <header class="st-topbar">
                    <a href="/group/${group._id}" class="st-back" title="Back">
                        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
                    </a>
                    <span class="st-title">Members</span>
                    <span class="st-spacer"></span>
                </header>

                <section class="st-section">
                    <h2 class="st-section-label">${group.name} · ${group.members.length} ${group.members.length === 1 ? 'member' : 'members'}</h2>
                    <div class="st-card gm-card">
                        ${membersHtml}
                    </div>
                </section>

                <section class="st-section">
                    <a href="/group/${group._id}/add-member" class="gm-add-btn">
                        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                        Add member
                    </a>
                </section>
            </div>
            </body></html>
        `);
    } catch (err) {
        console.error('Group members error:', err);
        res.redirect('/chat');
    }
});

// ===== ADD MEMBER PAGE =====
router.get('/:id/add-member', async (req, res) => {
    try {
        const me = req.session.user;
        const group = await Group.findById(req.params.id);
        if (!group || !group.members.includes(me)) return res.redirect('/chat');

        const FriendRequest = require('../models/FriendRequest');
        const accepted = await FriendRequest.find({
            status: 'accepted',
            $or: [{ from: me }, { to: me }]
        });
        const friendUsernames = accepted.map(r => r.from === me ? r.to : r.from);

        // Filter out already-members
        const candidates = [];
        for (const un of friendUsernames) {
            if (group.members.includes(un)) continue;
            const u = await User.findOne({ username: un });
            if (!u) continue;
            const dn = u.full_name || u.username;
            candidates.push({
                username: un,
                displayName: dn,
                initial: dn.charAt(0).toUpperCase(),
                avatar: u.avatar || ''
            });
        }

        let listHtml = '';
        if (candidates.length === 0) {
            listHtml = `<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                <h3>No friends to add</h3>
                <p>All your friends are already in this group.</p>
            </div>`;
        } else {
            for (const c of candidates) {
                const avatarInner = c.avatar ? `<img src="${c.avatar}" alt="">` : c.initial;
                listHtml += `
                    <label class="gm-item gm-selectable">
                        <input type="checkbox" name="members" value="${c.username}" class="gm-check">
                        <div class="gm-avatar">${avatarInner}</div>
                        <div class="gm-info">
                            <div class="gm-name">${c.displayName}</div>
                            <div class="gm-username">@${c.username}</div>
                        </div>
                    </label>
                `;
            }
        }

        res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
            <title>Add members - EliGet</title>
            </head><body class="st-body">
            <div class="st-wrap">
                <header class="st-topbar">
                    <a href="/group/${group._id}/members" class="st-back" title="Back">
                        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
                    </a>
                    <span class="st-title">Add members</span>
                    <span class="st-spacer"></span>
                </header>

                <section class="st-section">
                    <h2 class="st-section-label">Add to ${group.name}</h2>
                    ${candidates.length > 0 ? `
                        <form action="/group/${group._id}/add-member" method="POST" id="addMemberForm">
                            <div class="st-card gm-card gm-select-list">${listHtml}</div>
                            <button type="submit" class="gm-save-btn" id="gmSaveBtn" disabled>
                                Add <span id="gmCount">0</span> member(s)
                            </button>
                        </form>
                    ` : `<div class="st-card gm-card">${listHtml}</div>`}
                </section>
            </div>
            <script>
                var checks = document.querySelectorAll('.gm-check');
                var btn = document.getElementById('gmSaveBtn');
                var countEl = document.getElementById('gmCount');
                function updateCount() {
                    var n = document.querySelectorAll('.gm-check:checked').length;
                    if (countEl) countEl.textContent = n;
                    if (btn) btn.disabled = n === 0;
                }
                checks.forEach(function(c) { c.addEventListener('change', updateCount); });
            </script>
            </body></html>
        `);
    } catch (err) {
        console.error('Add member page error:', err);
        res.redirect('/chat');
    }
});

// ===== ADD MEMBER POST =====
router.post('/:id/add-member', async (req, res) => {
    try {
        const me = req.session.user;
        const group = await Group.findById(req.params.id);
        if (!group || !group.members.includes(me)) return res.redirect('/chat');

        let toAdd = req.body.members || [];
        if (!Array.isArray(toAdd)) toAdd = [toAdd];

        // Verify each is a friend of me
        const FriendRequest = require('../models/FriendRequest');
        const accepted = await FriendRequest.find({
            status: 'accepted',
            $or: [{ from: me }, { to: me }]
        });
        const friendSet = new Set(accepted.map(r => r.from === me ? r.to : r.from));

        const valid = toAdd.filter(un => friendSet.has(un) && !group.members.includes(un));
        if (valid.length > 0) {
            group.members.push(...valid);
            await group.save();
        }

        res.redirect('/group/' + group._id + '/members');
    } catch (err) {
        console.error('Add member error:', err);
        res.redirect('/chat');
    }
});

// ===== REMOVE MEMBER (creator only) =====
router.post('/:id/remove-member', async (req, res) => {
    try {
        const me = req.session.user;
        const group = await Group.findById(req.params.id);
        if (!group || group.creator !== me) return res.redirect('/chat');

        const target = req.body.username;
        if (!target || target === group.creator) return res.redirect('/group/' + group._id + '/members');

        group.members = group.members.filter(u => u !== target);
        await group.save();

        res.redirect('/group/' + group._id + '/members');
    } catch (err) {
        console.error('Remove member error:', err);
        res.redirect('/chat');
    }
});

router.post('/:id', async (req, res) => {
    try {
        const me = req.session.user;
        const groupId = req.params.id;

        await GroupMessage.create({
            group_id: groupId,
            from: me,
            body: req.body.body,
            read: false
        });

        res.redirect(`/group/${groupId}`);
    } catch (error) {
        console.error('Group message error:', error);
        res.redirect('/chat');
    }
});

module.exports = router;
