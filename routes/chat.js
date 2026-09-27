const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const chatsDir = path.join(__dirname, '../data/chats');
const requestsFile = path.join(__dirname, '../data/requests.json');
const groupsFile = path.join(__dirname, '../data/groups.json');

function getChatFile(user1, user2) {
    const users = [user1.toLowerCase(), user2.toLowerCase()].sort();
    return path.join(chatsDir, `${users[0]}_${users[1]}.json`);
}

function getRequests() {
    if (!fs.existsSync(requestsFile)) return { requests: [] };
    return JSON.parse(fs.readFileSync(requestsFile, 'utf-8'));
}

function saveRequests(data) {
    fs.writeFileSync(requestsFile, JSON.stringify(data, null, 2));
}

function getGroups() {
    if (!fs.existsSync(groupsFile)) return { groups: [] };
    return JSON.parse(fs.readFileSync(groupsFile, 'utf-8'));
}

// ===== Tick SVGs =====
const singleTick = `<span class="msg-tick sent"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>`;
const doubleTick = `<span class="msg-tick seen"><svg viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg></span>`;

const icons = {
    home: `<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    chat: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`,
    profile: `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    feed: `<svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>`,
    send: `<svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:#fff"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
    back: `<svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>`,
    group: `<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
    bell: `<svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>`
};

function getBottomNav(active) {
    return `
        <div class="bottom-nav">
            <a href="/" class="${active === 'home' ? 'active' : ''}">${icons.home}<span>Home</span></a>
            <a href="/post/create" class="${active === 'post' ? 'active' : ''}">${icons.plus}<span>Post</span></a>
            <a href="/chat" class="${active === 'chat' ? 'active' : ''}">${icons.chat}<span>Chat</span></a>
            <a href="/profile" class="${active === 'profile' ? 'active' : ''}">${icons.profile}<span>Profile</span></a>
        </div>
    `;
}

// ===== Chat List (with Green Dot for Unread) =====
router.get('/', (req, res) => {
    const me = req.session.user;
    const filter = req.query.filter || 'all';
    const usersFile = path.join(__dirname, '../data/users.json');
    const allUsers = JSON.parse(fs.readFileSync(usersFile, 'utf-8')).users;
    const requestsData = getRequests();
    const groupsData = getGroups();

    const acceptedUsers = requestsData.requests
        .filter(r => r.status === 'accepted' && (r.from === me || r.to === me))
        .map(r => r.from === me ? r.to : r.from);

    let chatItemsHtml = '';
    let hasChats = false;

    if (filter === 'all' || filter === 'unread') {
        allUsers.forEach(u => {
            if (u.username !== me) {
                const chatFile = getChatFile(me, u.username);
                const hasChatFile = fs.existsSync(chatFile) && JSON.parse(fs.readFileSync(chatFile, 'utf-8')).messages.length > 0;
                
                if (hasChatFile || acceptedUsers.includes(u.username)) {
                    let lastMsgText = 'No messages yet';
                    let lastMsgTime = '';
                    let isUnread = false;
                    let unreadCount = 0;

                    if (hasChatFile) {
                        const messages = JSON.parse(fs.readFileSync(chatFile, 'utf-8')).messages;
                        const lastMsg = messages[messages.length - 1];
                        lastMsgText = lastMsg.body;
                        const date = new Date(lastMsg.time);
                        lastMsgTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        
                        // Proper unread: messages from other user that are not read
                        unreadCount = messages.filter(m => m.from !== me && !m.read).length;
                        isUnread = unreadCount > 0;
                    }

                    if (filter === 'unread' && !isUnread) return;

                    hasChats = true;
                    const displayName = u.full_name || u.username;
                    const initial = displayName.charAt(0).toUpperCase();
                    const avatarUrl = u.avatar ? `<img src="${u.avatar}" alt="Avatar">` : initial;

                    chatItemsHtml += `
                        <a href="/chat/${u.username}" class="chat-item">
                            <div class="chat-avatar-wrapper">
                                <div class="chat-avatar">${avatarUrl}</div>
                                ${isUnread ? `<span class="unread-dot"></span>` : ''}
                            </div>
                            <div class="chat-info">
                                <div class="chat-name-row">
                                    <span class="chat-name">${displayName}</span>
                                    <span class="chat-time">${lastMsgTime}</span>
                                </div>
                                <div class="chat-preview">${lastMsgText}</div>
                            </div>
                        </a>
                    `;
                }
            }
        });
    }

    if (filter === 'all' || filter === 'groups' || filter === 'unread') {
        groupsData.groups.forEach(g => {
            if (g.members.includes(me)) {
                const msgFile = path.join(__dirname, '../data/group_messages', `${g.id}.json`);
                let lastMsgText = 'Group created. No messages yet.';
                let lastMsgTime = '';
                let isUnread = false;
                let unreadCount = 0;

                if (fs.existsSync(msgFile)) {
                    const messages = JSON.parse(fs.readFileSync(msgFile, 'utf-8')).messages || [];
                    if (messages.length > 0) {
                        const lastMsg = messages[messages.length - 1];
                        lastMsgText = `${lastMsg.from}: ${lastMsg.body}`;
                        const date = new Date(lastMsg.time);
                        lastMsgTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        unreadCount = messages.filter(m => m.from !== me && !m.read).length;
                        isUnread = unreadCount > 0;
                    }
                }

                if (filter === 'unread' && !isUnread) return;

                hasChats = true;
                const initial = g.name.charAt(0).toUpperCase();
                const avatarUrl = g.avatar ? `<img src="${g.avatar}" alt="Group Avatar">` : initial;

                chatItemsHtml += `
                    <a href="/group/${g.id}" class="chat-item">
                        <div class="chat-avatar-wrapper">
                            <div class="chat-avatar">${avatarUrl}</div>
                            ${isUnread ? `<span class="unread-dot"></span>` : ''}
                        </div>
                        <div class="chat-info">
                            <div class="chat-name-row">
                                <span class="chat-name">${g.name}</span>
                                <span class="chat-time">${lastMsgTime}</span>
                            </div>
                            <div class="chat-preview">${lastMsgText}</div>
                        </div>
                    </a>
                `;
            }
        });
    }

    if (!hasChats) {
        let emptyMsg = 'No chats yet.';
        if (filter === 'groups') emptyMsg = 'No group chats found.';
        if (filter === 'unread') emptyMsg = 'No unread messages. All caught up!';
        chatItemsHtml = `<p style="text-align:center; color:#a0aec0; padding: 20px;">${emptyMsg}</p>`;
    }

    const pendingCount = requestsData.requests.filter(r => r.to === me && r.status === 'pending').length;

    res.send(`
        <html><head><link rel="stylesheet" href="/style.css"></head><body>
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
            
            <div class="tab-bar">
                <a href="/chat?filter=all" class="tab-item ${filter === 'all' ? 'active' : ''}">All</a>
                <a href="/chat?filter=groups" class="tab-item ${filter === 'groups' ? 'active' : ''}">Groups</a>
                <a href="/chat?filter=unread" class="tab-item ${filter === 'unread' ? 'active' : ''}">Unread</a>
            </div>

            <div class="chat-list">${chatItemsHtml}</div>
        </div>
        ${getBottomNav('chat')}
        </body></html>
    `);
});

// Add Friends page
router.get('/new', (req, res) => {
    const me = req.session.user;
    const usersFile = path.join(__dirname, '../data/users.json');
    const allUsers = JSON.parse(fs.readFileSync(usersFile, 'utf-8')).users;
    const requestsData = getRequests();

    let userItemsHtml = '';
    let hasUsers = false;

    allUsers.forEach(u => {
        if (u.username !== me) {
            const existingReq = requestsData.requests.find(r => 
                (r.from === me && r.to === u.username) || 
                (r.from === u.username && r.to === me)
            );

            if (existingReq && existingReq.status === 'accepted') return;

            hasUsers = true;
            const displayName = u.full_name || u.username;
            const initial = displayName.charAt(0).toUpperCase();
            const avatarUrl = u.avatar ? `<img src="${u.avatar}" alt="Avatar">` : initial;

            let btnHtml;
            if (existingReq && existingReq.status === 'pending' && existingReq.from === me) {
                btnHtml = `<button type="button" class="request-btn-requested" disabled>Requested</button>`;
            } else if (existingReq && existingReq.status === 'pending' && existingReq.to === me) {
                btnHtml = `<a href="/chat/notifications" class="request-btn request-btn-accept" style="text-decoration:none; display:inline-block;">Respond</a>`;
            } else {
                btnHtml = `<button type="button" class="request-btn request-btn-accept" id="btn-${u.username}" onclick="sendRequest(this, '${u.username}')">Request</button>`;
            }

            userItemsHtml += `
                <div class="chat-item">
                    <div class="chat-avatar">${avatarUrl}</div>
                    <div class="chat-info"><div class="chat-name">${displayName}</div></div>
                    ${btnHtml}
                </div>
            `;
        }
    });

    if (!hasUsers) {
        userItemsHtml = '<p style="text-align:center; color:#a0aec0; padding:20px;">No new users to add right now.</p>';
    }

    res.send(`
        <html><head><link rel="stylesheet" href="/style.css"></head><body>
        <div class="container">
            <header>
                <span class="profile-title">Add Friends</span>
                <a href="/chat" class="header-icon" title="Back">${icons.back}</a>
            </header>
            <div class="chat-list">${userItemsHtml}</div>
        </div>
        ${getBottomNav('chat')}
        <script>
            function sendRequest(btn, username) {
                btn.disabled = true;
                btn.textContent = '...';
                fetch('/chat/api/request/' + username, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            btn.textContent = 'Requested';
                            btn.className = 'request-btn-requested';
                            showToast('Request Sent');
                        } else {
                            btn.textContent = 'Request';
                            btn.disabled = false;
                        }
                    })
                    .catch(() => { btn.textContent = 'Request'; btn.disabled = false; });
            }
            function showToast(msg) {
                const toast = document.createElement('div');
                toast.className = 'toast';
                toast.innerHTML = '<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#68d391"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> ' + msg;
                document.body.appendChild(toast);
                setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3500);
            }
        </script>
        </body></html>
    `);
});

router.post('/api/request/:target', (req, res) => {
    const me = req.session.user;
    const target = req.params.target;
    const data = getRequests();
    const existing = data.requests.find(r => (r.from === me && r.to === target) || (r.from === target && r.to === me));
    if (!existing) {
        data.requests.push({ id: 'req_' + Date.now(), from: me, to: target, status: 'pending', created_at: new Date().toISOString() });
        saveRequests(data);
    }
    res.json({ success: true });
});

router.get('/notifications', (req, res) => {
    const me = req.session.user;
    const data = getRequests();
    const pendingRequests = data.requests.filter(r => r.to === me && r.status === 'pending');
    const usersFile = path.join(__dirname, '../data/users.json');
    const allUsers = JSON.parse(fs.readFileSync(usersFile, 'utf-8')).users;

    let requestItemsHtml = '';
    pendingRequests.forEach(req => {
        const sender = allUsers.find(u => u.username === req.from);
        if (sender) {
            const displayName = sender.full_name || sender.username;
            const initial = displayName.charAt(0).toUpperCase();
            const avatarUrl = sender.avatar ? `<img src="${sender.avatar}" alt="Avatar">` : initial;
            requestItemsHtml += `
                <div class="chat-item">
                    <div class="chat-avatar">${avatarUrl}</div>
                    <div class="chat-info">
                        <div class="chat-name">${displayName}</div>
                        <div class="request-actions">
                            <form action="/chat/accept/${req.id}" method="POST" style="margin:0;"><button type="submit" class="request-btn request-btn-accept">Accept</button></form>
                            <form action="/chat/reject/${req.id}" method="POST" style="margin:0;"><button type="submit" class="request-btn request-btn-reject">Reject</button></form>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    res.send(`
        <html><head><link rel="stylesheet" href="/style.css"></head><body>
        <div class="container">
            <header>
                <span class="profile-title">Notifications</span>
                <a href="/chat" class="header-icon" title="Back">${icons.back}</a>
            </header>
            <div class="chat-list">${requestItemsHtml || '<p style="text-align:center; color:#a0aec0; padding:20px;">No new notifications.</p>'}</div>
        </div>
        ${getBottomNav('chat')}
        </body></html>
    `);
});

router.post('/accept/:id', (req, res) => {
    const data = getRequests();
    const request = data.requests.find(r => r.id === req.params.id);
    if (request) { request.status = 'accepted'; saveRequests(data); }
    res.redirect('/chat');
});

router.post('/reject/:id', (req, res) => {
    const data = getRequests();
    data.requests = data.requests.filter(r => r.id !== req.params.id);
    saveRequests(data);
    res.redirect('/chat/notifications');
});

// ===== Direct Chat Room (with Ticks + Auto-Read + Auto Refresh) =====
router.get('/:withUser', (req, res) => {
    const me = req.session.user;
    const withUser = req.params.withUser;
    const chatFile = getChatFile(me, withUser);
    const usersFile = path.join(__dirname, '../data/users.json');
    const allUsers = JSON.parse(fs.readFileSync(usersFile, 'utf-8')).users;
    const otherUser = allUsers.find(u => u.username === withUser);
    const displayName = otherUser ? (otherUser.full_name || otherUser.username) : withUser;
    const initial = displayName.charAt(0).toUpperCase();
    const otherAvatarUrl = otherUser && otherUser.avatar ? `<img src="${otherUser.avatar}" alt="Avatar">` : initial;

    let messages = [];
    if (fs.existsSync(chatFile)) messages = JSON.parse(fs.readFileSync(chatFile, 'utf-8')).messages || [];

    // Mark all received messages as read
    let markedAsRead = false;
    messages.forEach(m => {
        if (m.from !== me && !m.read) {
            m.read = true;
            markedAsRead = true;
        }
    });
    if (markedAsRead) {
        fs.writeFileSync(chatFile, JSON.stringify({ messages }, null, 2));
    }

    let messagesHtml = '';
    if (messages.length === 0) messagesHtml = '<p style="text-align:center; color:#a0aec0; padding: 20px;">No messages yet. Say hi!</p>';
    else {
        messages.forEach(m => {
            const isMe = m.from === me;
            if (isMe) {
                // Tick: single if not read, double if read
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
                        <div class="msg-avatar">${otherAvatarUrl}</div>
                        <div class="msg-content">
                            <div class="msg-bubble msg-received-bubble">${m.body}</div>
                        </div>
                    </div>
                `;
            }
        });
    }

    res.send(`
        <html><head><link rel="stylesheet" href="/style.css"></head><body>
        <div class="container">
            <header>
                <span class="profile-title">${displayName}</span>
                <a href="/chat" class="header-icon" title="Back">${icons.back}</a>
            </header>
            <div class="chat-container" id="chatContainer">${messagesHtml}</div>
            <form class="chat-form" action="/chat/${withUser}" method="POST">
                <input type="text" name="body" required placeholder="Type a message..." autocomplete="off">
                <button type="submit" title="Send">${icons.send}</button>
            </form>
        </div>
        <script>
            // Auto-scroll to bottom
            const chatBox = document.getElementById('chatContainer');
            if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
            window.scrollTo(0, document.body.scrollHeight);

            // Auto-refresh every 5 seconds (only if user is not typing)
            let isTyping = false;
            const inputField = document.querySelector('.chat-form input');
            if (inputField) {
                inputField.addEventListener('focus', () => { isTyping = true; });
                inputField.addEventListener('blur', () => { isTyping = false; });
                inputField.addEventListener('input', () => {
                    // Reset typing timer
                    isTyping = true;
                    clearTimeout(window._typingTimer);
                    window._typingTimer = setTimeout(() => { isTyping = false; }, 3000);
                });
            }

            setInterval(() => {
                if (!isTyping) {
                    fetch(window.location.href + '?ajax=1', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
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
});

router.post('/:withUser', (req, res) => {
    const me = req.session.user;
    const withUser = req.params.withUser;
    const { body } = req.body;
    const chatFile = getChatFile(me, withUser);
    let chatData = { messages: [] };
    if (fs.existsSync(chatFile)) chatData = JSON.parse(fs.readFileSync(chatFile, 'utf-8'));
    chatData.messages.push({ 
        id: 'm_' + Date.now(), 
        from: me, 
        body: body, 
        time: new Date().toISOString(),
        read: false
    });
    fs.writeFileSync(chatFile, JSON.stringify(chatData, null, 2));
    res.redirect(`/chat/${withUser}`);
});

module.exports = router;
