const connectDB = require('./db');
const express = require('express');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');

// Models
const User = require('./models/User');
const Post = require('./models/Post');
const FriendRequest = require('./models/FriendRequest');
const Group = require('./models/Group');
const Message = require('./models/Message');
const GroupMessage = require('./models/GroupMessage');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');
const chatRoutes = require('./routes/chat');
const groupRoutes = require('./routes/group');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'eliget-secret-key-123',
    resave: false,
    saveUninitialized: true
}));

function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/auth/login');
}

app.use('/auth', authRoutes);
app.use('/post', isAuthenticated, postRoutes);
app.use('/chat', isAuthenticated, chatRoutes);
app.use('/group', isAuthenticated, groupRoutes);

// ===== ICONS =====
const icons = {
    home: `<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    chat: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`,
    profile: `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    feed: `<svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
    back: `<svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>`,
    check: `<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#68d391"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
};

const moodIcons = {
    happy: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>`,
    romantic: `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    nature: `<svg viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>`,
    thoughtful: `<svg viewBox="0 0 24 24"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>`,
    excited: `<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
    calm: `<svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm-3.5-7c.83 0 1.5-.67 1.5-1.5S9.33 9 8.5 9 7 9.67 7 10.5 7.67 12 8.5 12zm7 0c.83 0 1.5-.67 1.5-1.5S16.33 9 15.5 9 14 9.67 14 10.5s.67 1.5 1.5 1.5zM12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>`,
    music: `<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
    book: `<svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>`
};

// ===== RENDER POST CARD =====
async function renderPostCard(p, currentUser) {
    const author = await User.findOne({ username: p.author });
    const displayName = author ? (author.full_name || author.username) : p.author;
    const initial = displayName.charAt(0).toUpperCase();
    const avatarUrl = author && author.avatar ? `<img src="${author.avatar}" alt="Avatar">` : initial;
    
    const moodKey = p.mood || 'happy';
    const moodSvg = moodIcons[moodKey] || moodIcons.happy;

    let menuHtml = '';
    if (currentUser && currentUser === p.author) {
        menuHtml = `
            <div class="post-menu-wrapper">
                <button type="button" class="post-menu-btn" onclick="togglePostMenu(event, '${p._id}')">
                    <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                </button>
                <div class="post-menu-dropdown" id="menu-${p._id}">
                    <a href="/post/edit/${p._id}" class="post-menu-item">
                        <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        Edit
                    </a>
                    <button type="button" class="post-menu-item danger" onclick="confirmDeletePost('${p._id}')">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    const editedLabel = p.edited ? ' <span style="font-size:0.7rem;color:#a0aec0;font-weight:400;">(edited)</span>' : '';

    return `
        <div class="post-card">
            <div class="post-header">
                <div class="post-avatar">${avatarUrl}</div>
                <div class="post-user-info">
                    <div class="post-author-row">
                        <span class="post-author-name">${displayName}${editedLabel}</span>
                        <span class="post-mood" style="fill:#3182ce">${moodSvg}</span>
                    </div>
                </div>
                ${menuHtml}
            </div>
            <div class="post-content">${p.body}</div>
        </div>
    `;
}

function getDeleteModal() {
    return `
        <div id="deletePostModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-icon danger">
                    <svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:#e53e3e"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </div>
                <h3>Delete Post?</h3>
                <p>This action cannot be undone.</p>
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-cancel" onclick="closeModal('deletePostModal')">Cancel</button>
                    <form id="deletePostForm" action="/post/delete" method="POST" style="flex: 1;">
                        <button type="submit" class="modal-btn modal-btn-danger" style="width: 100%;">Delete</button>
                    </form>
                </div>
            </div>
        </div>
        <script>
            function confirmDeletePost(postId) {
                document.querySelectorAll('.post-menu-dropdown').forEach(m => m.classList.remove('active'));
                document.getElementById('deletePostForm').action = '/post/delete/' + postId;
                document.getElementById('deletePostModal').classList.add('active');
            }
            function togglePostMenu(event, postId) {
                event.stopPropagation();
                const menu = document.getElementById('menu-' + postId);
                const isActive = menu.classList.contains('active');
                document.querySelectorAll('.post-menu-dropdown').forEach(m => m.classList.remove('active'));
                if (!isActive) menu.classList.add('active');
            }
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.post-menu-wrapper')) {
                    document.querySelectorAll('.post-menu-dropdown').forEach(m => m.classList.remove('active'));
                }
            });
        </script>
    `;
}

// ===== HOME PAGE (FEED) =====
app.get('/', async (req, res) => {
    if (req.session.user) {
        const posts = await Post.find().sort({ created_at: -1 }).limit(50);
        let html = '<html><head><link rel="stylesheet" href="/style.css"></head><body><div class="container">';
        html += '<header><h1 class="feed-title">EliGet Feed</h1></header>';
        
        if (posts.length === 0) {
            html += '<p style="text-align:center; color:#a0aec0; padding:20px;">No posts yet. Be the first to post!</p>';
        } else {
            for (const p of posts) {
                html += await renderPostCard(p, req.session.user);
            }
        }
        html += '</div>';
        html += getDeleteModal();
        html += `<div class="bottom-nav"><a href="/" class="active">${icons.home}<span>Home</span></a><a href="/post/create">${icons.plus}<span>Post</span></a><a href="/chat">${icons.chat}<span>Chat</span></a><a href="/profile">${icons.profile}<span>Profile</span></a></div>`;
        html += '</body></html>';
        res.send(html);
    } else {
        res.send(`
            <html><head><link rel="stylesheet" href="/style.css"></head><body>
            <div class="container">
                <div class="hero"><h1>EliGet</h1><p>Text-only, anti-addiction network.</p><p class="hero-sub">No algorithms. No videos. Just pure thoughts.</p></div>
                <div class="features-grid">
                    <div class="feature-card">${icons.chat}<h3>Chat</h3><p>Direct text messaging with friends.</p></div>
                    <div class="feature-card">${icons.feed}<h3>Feed</h3><p>Read new posts and share your thoughts.</p></div>
                    <div class="feature-card">${icons.plus}<h3>Post</h3><p>Write your mind, without images or videos.</p></div>
                    <div class="feature-card">${icons.profile}<h3>No Algorithm</h3><p>No dopamine loops, just clean text.</p></div>
                </div>
                <div class="action-buttons"><a href="/auth/login" class="btn btn-primary">Login</a><a href="/auth/signup" class="btn btn-secondary">Create Account</a></div>
                <div class="browse-link"><a href="/feed">${icons.feed} Browse Feed without Account</a></div>
            </div>
            </body></html>
        `);
    }
});

// ===== FEED (PUBLIC) =====
app.get('/feed', async (req, res) => {
    const posts = await Post.find().sort({ created_at: -1 }).limit(50);
    let html = '<html><head><link rel="stylesheet" href="/style.css"></head><body><div class="container">';
    html += '<header><h1 class="feed-title">Feed</h1></header>';
    
    if (posts.length === 0) {
        html += '<p style="text-align:center; color:#a0aec0; padding:20px;">No posts yet.</p>';
    } else {
        for (const p of posts) {
            html += await renderPostCard(p, req.session.user || null);
        }
    }
    html += '</div>';
    if (req.session.user) {
        html += getDeleteModal();
        html += `<div class="bottom-nav"><a href="/" class="active">${icons.home}<span>Home</span></a><a href="/post/create">${icons.plus}<span>Post</span></a><a href="/chat">${icons.chat}<span>Chat</span></a><a href="/profile">${icons.profile}<span>Profile</span></a></div>`;
    } else {
        html += '<div style="text-align:center; margin-top:20px;"><a href="/auth/login" style="color:#3182ce; text-decoration:none;">Login to interact</a></div>';
    }
    html += '</body></html>';
    res.send(html);
});

// ===== PROFILE =====
app.get('/profile', isAuthenticated, async (req, res) => {
    const user = await User.findOne({ username: req.session.user });
    if (!user) return res.redirect('/auth/logout');

    const displayName = user.full_name || user.username;
    const initial = displayName.charAt(0).toUpperCase();
    const avatarUrl = user.avatar ? `<img src="${user.avatar}" alt="Avatar">` : initial;
    
    const myPosts = await Post.find({ author: req.session.user }).sort({ created_at: -1 });

    let postsHtml = '';
    if (myPosts.length === 0) {
        postsHtml = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h7v2H7z"/></svg>
                <p>You have not posted anything yet.</p>
                <a href="/post/create">Write your first post</a>
            </div>
        `;
    } else {
        for (const p of myPosts) {
            postsHtml += await renderPostCard(p, req.session.user);
        }
    }

    res.send(`
        <html><head><link rel="stylesheet" href="/style.css"></head><body>
        <div class="container">
            <header><span class="profile-title">Your EliGet Profile</span><a href="/settings" class="settings-icon" title="Settings">${icons.settings}</a></header>
            <div class="profile-card">
                <div class="profile-avatar">${avatarUrl}</div>
                <h2>${displayName}</h2>
                <p>@${user.username}</p>
                <a href="/profile/avatar" class="edit-avatar-btn">Change Avatar</a>
            </div>
            <div class="section-title">Your Posts</div>
            ${postsHtml}
        </div>
        ${getDeleteModal()}
        <div class="bottom-nav"><a href="/">${icons.home}<span>Home</span></a><a href="/post/create">${icons.plus}<span>Post</span></a><a href="/chat">${icons.chat}<span>Chat</span></a><a href="/profile" class="active">${icons.profile}<span>Profile</span></a></div>
        </body></html>
    `);
});

// ===== AVATAR SELECTION =====
app.get('/profile/avatar', isAuthenticated, async (req, res) => {
    const user = await User.findOne({ username: req.session.user });
    const avatarSeeds = ['Felix', 'Aneka', 'Leo', 'Mia', 'Zoe', 'Max', 'Luna', 'Kai', 'Nora', 'Ryan', 'Ivy', 'Oscar'];
    let avatarOptionsHtml = '';
    avatarSeeds.forEach(seed => {
        const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
        const isSelected = user.avatar === url;
        avatarOptionsHtml += `<form action="/profile/avatar" method="POST" style="margin:0;"><input type="hidden" name="avatar_url" value="${url}"><button type="submit" class="avatar-option ${isSelected ? 'selected' : ''}"><img src="${url}" alt="Avatar"><span>${seed}</span></button></form>`;
    });
    res.send(`<html><head><link rel="stylesheet" href="/style.css"></head><body><div class="container"><header><span class="profile-title">Choose Avatar</span><a href="/profile" class="header-icon" title="Back">${icons.back}</a></header><div class="form-card"><p style="text-align: center; color: #718096; margin-bottom: 10px;">Select a built-in avatar for your profile.</p><div class="avatar-grid">${avatarOptionsHtml}</div></div></div><div class="bottom-nav"><a href="/">${icons.home}<span>Home</span></a><a href="/post/create">${icons.plus}<span>Post</span></a><a href="/chat">${icons.chat}<span>Chat</span></a><a href="/profile" class="active">${icons.profile}<span>Profile</span></a></div></body></html>`);
});

app.post('/profile/avatar', isAuthenticated, async (req, res) => {
    const { avatar_url } = req.body;
    await User.updateOne({ username: req.session.user }, { avatar: avatar_url });
    res.redirect('/profile');
});

// ===== SETTINGS =====
app.get('/settings', isAuthenticated, async (req, res) => {
    const user = await User.findOne({ username: req.session.user });
    const currentFullName = user.full_name || user.username;
    const showToast = req.query.status === 'saved';

    res.send(`
        <html><head><link rel="stylesheet" href="/style.css"></head><body>
        ${showToast ? `<div class="toast">${icons.check} Saved successfully!</div>` : ''}
        <div class="container">
            <header><span class="settings-page-title">Settings</span><a href="/profile" class="header-icon" title="Back">${icons.back}</a></header>
            <div class="settings-card">
                <div class="settings-card-header"><h3 class="settings-card-title">Edit Profile</h3></div>
                <div class="settings-row">
                    <div class="settings-row-icon neutral">
                        <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </div>
                    <div class="settings-row-content">
                        <div class="settings-row-title">Full Name</div>
                        <div class="settings-row-desc">Change your display name</div>
                    </div>
                </div>
                <form action="/settings/update-name" method="POST">
                    <div class="settings-input-row">
                        <input type="text" name="full_name" value="${currentFullName}" required placeholder="Enter full name">
                        <button type="submit" class="settings-save-btn">Save</button>
                    </div>
                </form>
            </div>
            <div class="settings-card">
                <div class="settings-card-header"><h3 class="settings-card-title">Account</h3></div>
                <div class="settings-row settings-clickable" onclick="openLogoutModal()">
                    <div class="settings-row-icon">
                        <svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                    </div>
                    <div class="settings-row-content">
                        <div class="settings-row-title">Logout</div>
                        <div class="settings-row-desc">Sign out of your EliGet account</div>
                    </div>
                </div>
            </div>
            <div class="danger-card">
                <div class="danger-card-header">
                    <div class="danger-card-icon">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </div>
                    <div>
                        <div class="danger-card-title">Delete Account</div>
                        <div class="danger-card-desc">Permanently delete your account and all data</div>
                    </div>
                </div>
                <button type="button" class="danger-card-btn" onclick="openDeleteModal()">Delete Account</button>
            </div>
        </div>
        <div class="bottom-nav"><a href="/">${icons.home}<span>Home</span></a><a href="/post/create">${icons.plus}<span>Post</span></a><a href="/chat">${icons.chat}<span>Chat</span></a><a href="/profile" class="active">${icons.profile}<span>Profile</span></a></div>
        <div id="logoutModal" class="modal-overlay"><div class="modal-content"><div class="modal-icon warning"><svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: #dd6b20;"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg></div><h3>Logout?</h3><p>Are you sure you want to log out?</p><div class="modal-actions"><button class="modal-btn modal-btn-cancel" onclick="closeModal('logoutModal')">Cancel</button><a href="/auth/logout" class="modal-btn modal-btn-danger" style="text-decoration:none; display:flex; justify-content:center; align-items:center;">Logout</a></div></div></div>
        <div id="deleteModal" class="modal-overlay"><div class="modal-content"><div class="modal-icon danger"><svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: #e53e3e;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></div><h3>Delete Account?</h3><p>This action cannot be undone.</p><p style="font-weight: bold; color: #e53e3e; margin-bottom: 10px; font-size: 0.85rem;">Type "Delete me" to confirm.</p><input type="text" id="deleteConfirmInput" class="modal-input" placeholder="Delete me" oninput="checkDeleteInput()"><div class="modal-actions"><button class="modal-btn modal-btn-cancel" onclick="closeModal('deleteModal')">Cancel</button><form action="/settings/delete" method="POST" style="flex: 1;"><button type="submit" id="confirmDeleteBtn" class="modal-btn modal-btn-danger" style="width: 100%;" disabled>Delete</button></form></div></div></div>
        <script>function openLogoutModal(){document.getElementById('logoutModal').classList.add('active');}function openDeleteModal(){document.getElementById('deleteModal').classList.add('active');document.getElementById('deleteConfirmInput').value='';document.getElementById('confirmDeleteBtn').disabled=true;}function closeModal(id){document.getElementById(id).classList.remove('active');}function checkDeleteInput(){const input=document.getElementById('deleteConfirmInput').value;const btn=document.getElementById('confirmDeleteBtn');btn.disabled=input.toLowerCase()!=='delete me';}</script>
        </body></html>
    `);
});

app.post('/settings/update-name', isAuthenticated, async (req, res) => {
    await User.updateOne({ username: req.session.user }, { full_name: req.body.full_name });
    res.redirect('/settings?status=saved');
});

app.post('/settings/delete', isAuthenticated, async (req, res) => {
    const username = req.session.user;
    await User.deleteOne({ username });
    await Post.deleteMany({ author: username });
    await FriendRequest.deleteMany({ $or: [{ from: username }, { to: username }] });
    await Group.updateMany({ members: username }, { $pull: { members: username } });
    req.session.destroy();
    res.redirect('/');
});

// ===== START SERVER =====
connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => { console.log('EliGet সার্ভার চালু হয়েছে: http://localhost:' + PORT); });
});
