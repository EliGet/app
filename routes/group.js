const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');

const singleTick = `<span class="msg-tick sent"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>`;
const doubleTick = `<span class="msg-tick seen"><svg viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg></span>`;

const icons = {
    home: `<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    chat: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`,
    profile: `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    back: `<svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>`,
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
                    <span class="profile-title">New Group</span>
                    <a href="/chat" class="header-icon" title="Back">${icons.back}</a>
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
        res.send('Something went wrong.');
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
        res.send('Something went wrong. <a href="/group/create">Try again</a>');
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
            for (const m of messages) {
                const isMe = m.from === me;
                const senderUser = await User.findOne({ username: m.from });
                const senderName = senderUser ? (senderUser.full_name || senderUser.username) : m.from;
                const initial = senderName.charAt(0).toUpperCase();
                const avatarUrl = senderUser && senderUser.avatar ? `<img src="${senderUser.avatar}" alt="Avatar">` : initial;

                if (isMe) {
                    const tick = m.read ? doubleTick : singleTick;
                    messagesHtml += `
                        <div class="msg-row sent">
                            <div class="msg-content">
                                <div class="msg-bubble msg-sent-bubble">${m.body}${tick}</div>
                            </div>
                        </div>
                    `;
                } else {
                    messagesHtml += `
                        <div class="msg-row received">
                            <div class="msg-avatar">${avatarUrl}</div>
                            <div class="msg-content">
                                <div class="msg-bubble msg-received-bubble">${m.body}</div>
                            </div>
                        </div>
                    `;
                }
            }
        }

        const groupAvatarUrl = group.avatar ? `<img src="${group.avatar}" alt="Group Avatar" style="width:32px;height:32px;border-radius:50%;margin-right:10px;">` : '';
        const displayTitle = `<span style="display:flex; align-items:center;">${groupAvatarUrl} ${group.name}</span>`;

        res.send(`
            <html><head><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.svg"></head><body>
            <div class="container">
                <header>
                    <span class="profile-title">${displayTitle}</span>
                    <a href="/chat" class="header-icon" title="Back">${icons.back}</a>
                </header>
                <p style="font-size:0.8rem; color:#718096; margin-bottom: 15px;">${group.members.length} members</p>
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
