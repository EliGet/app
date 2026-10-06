const connectDB = require('./db');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const app = express();

// Health check for monitoring
app.get('/health', (req, res) => {
    res.json({ ok: true, ts: Date.now() });
});

// Security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many attempts. Please try again in 15 minutes.'
});

const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests. Please slow down.'
});

const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/auth/login', authLimiter);
app.use('/auth/signup', authLimiter);
app.use('/auth/recover', authLimiter);
app.use('/post/create', writeLimiter);
app.use('/report', writeLimiter);
app.use('/search', searchLimiter);

// Trust proxy for HTTPS termination (Render, etc.)
app.set('trust proxy', 1);

// Inject love.js into every HTML response
app.use((req, res, next) => {
    const _send = res.send.bind(res);
    res.send = function(body) {
        const isWap = typeof body === 'string' && (body.indexOf('wapforum') !== -1 || body.indexOf('<?xml') === 0);
        if (!isWap && typeof body === 'string' && body.includes('<head>') && !body.includes('eliget-theme-init')) {
            body = body.replace('<head>', '<head><script id="eliget-theme-init">(function(){try{var t=localStorage.getItem("eliget-theme")||"light";if(t==="dark")document.documentElement.setAttribute("data-theme","dark");}catch(e){}})();</script>');
        }
        if (!isWap && typeof body === 'string' && body.includes('</body>') && !body.includes('/love.js')) {
            body = body.replace('</body>', '<script src="/love.js"></script><script src="/follow.js"></script><script src="/report.js"></script></body>');
        }
        return _send(body);
    };
    next();
});
const PORT = process.env.PORT || 3000;
const path = require('path');
const { linkify, linkifyPost, linkifyBio } = require('./lib/linkify');

// Models
const User = require('./models/User');
const Follow = require('./models/Follow');
const Block = require('./models/Block');
const Notification = require('./models/Notification');
const Report = require('./models/Report');
const Post = require('./models/Post');
const StudentPost = require('./models/StudentPost');
const FriendRequest = require('./models/FriendRequest');
const Group = require('./models/Group');
const Message = require('./models/Message');
const GroupMessage = require('./models/GroupMessage');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');
const chatRoutes = require('./routes/chat');
const groupRoutes = require('./routes/group');
const wapRoutes = require('./routes/wap');
const studentsRoutes = require('./routes/students');
const { badges: badgeLibrary } = require('./public/badges.js');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-only-change-in-production-' + Math.random().toString(36),
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' && process.env.DISABLE_HTTPS !== '1',
        sameSite: 'lax'
    }
}));

// ===== WAP SESSION FALLBACK =====
// If cookie doesn't work (jWAP), read user from URL query
app.use((req, res, next) => {
    if (!req.session.user && req.query.u) {
        const usersFile = null; // no file DB anymore, use MongoDB
        // Verify user exists
        const User = require('./models/User');
        User.findOne({ username: req.query.u }).then(user => {
            if (user) {
                req.session.user = user.username;
            }
            next();
        }).catch(() => next());
    } else {
        next();
    }
});

function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/auth/login');
}

app.use('/auth', authRoutes);
app.use('/post', isAuthenticated, postRoutes);
app.use('/chat', isAuthenticated, chatRoutes);
app.use('/group', isAuthenticated, groupRoutes);
app.use('/wap', wapRoutes);
app.use('/students', isAuthenticated, studentsRoutes);

// ===== ICONS =====
const icons = {
    home: `<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    search: `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
    bell: `<svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>`,
    students: `<svg viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    chat: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`,
    profile: `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    feed: `<svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
    back: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`,
    check: `<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#68d391"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    send: `<svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:#fff"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`
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
const { images: postImagesMap } = require('./lib/svg-library');

async function getBlockSets(currentUser) {
    if (!currentUser) return { iBlocked: new Set(), blockedMe: new Set() };
    const mine = await Block.find({ blocker: currentUser }).select('blocked');
    const theirs = await Block.find({ blocked: currentUser }).select('blocker');
    return {
        iBlocked: new Set(mine.map(b => b.blocked)),
        blockedMe: new Set(theirs.map(b => b.blocker))
    };
}

async function getFollowSet(currentUser) {
    if (!currentUser) return new Set();
    const follows = await Follow.find({ follower: currentUser }).select('following');
    return new Set(follows.map(f => f.following));
}

// 5-minute edit/delete window
const EDIT_WINDOW_MS = 5 * 60 * 1000;
function canModifyPost(createdAt) {
    if (!createdAt) return false;
    return (Date.now() - new Date(createdAt).getTime()) < EDIT_WINDOW_MS;
}

async function renderPostCard(p, currentUser, followSet) {
    const author = await User.findOne({ username: p.author });
    const displayName = author ? (author.full_name || author.username) : p.author;
    const initial = displayName.charAt(0).toUpperCase();
    const avatarUrl = author && author.avatar ? `<img src="${author.avatar}" alt="Avatar">` : initial;
    
    let moodSvg = '';
    if (p.mood && p.mood !== 'none') {
        moodSvg = moodIcons[p.mood] || '';
    }

    const likeCount = (p.likes || []).length;
    const liked = currentUser && (p.likes || []).includes(currentUser);

    const diffMs = Date.now() - new Date(p.created_at).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    let timeStr;
    if (diffMin < 1) timeStr = 'just now';
    else if (diffMin < 60) timeStr = diffMin + 'm';
    else if (diffMin < 1440) timeStr = Math.floor(diffMin / 60) + 'h';
    else if (diffMin < 10080) timeStr = Math.floor(diffMin / 1440) + 'd';
    else timeStr = new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    let postFollowBtn = '';
    if (currentUser && currentUser !== p.author) {
        const isFollowingAuthor = followSet && followSet.has(p.author);
        postFollowBtn = `<button type="button" class="post-follow-btn${isFollowingAuthor ? ' following' : ''}" data-username="${p.author}" onclick="togglePostFollow(event, this)">${isFollowingAuthor ? 'Following' : 'Follow'}</button>`;
    }

    let menuHtml = '';
    if (currentUser && currentUser !== p.author) {
        // Report option for other users' posts
        menuHtml = `
            <div class="post-menu-wrapper">
                <button type="button" class="post-menu-btn" onclick="togglePostMenu(event, '${p._id}')">
                    <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                </button>
                <div class="post-menu-dropdown" id="menu-${p._id}">
                    <button type="button" class="post-menu-item danger" onclick="closePostMenus();rpOpen('post','${p._id}')">
                        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                        Report
                    </button>
                </div>
            </div>
        `;
    } else if (currentUser && currentUser === p.author && canModifyPost(p.created_at)) {
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

    // Post Image (Emotional Scene)
    let imageHtml = '';
    if (p.image && p.image !== 'none' && postImagesMap[p.image]) {
        imageHtml = `<div class="post-image-scene">${postImagesMap[p.image]}</div>`;
    }

    return `
        <div class="post-card">
            <div class="post-header">
                <a href="/profile/${p.author}" class="post-avatar-link"><div class="post-avatar">${avatarUrl}</div></a>
                <div class="post-user-info">
                    <div class="post-author-row">
                        <a href="/profile/${p.author}" class="post-author-link"><span class="post-author-name">${displayName}</span></a>
                        ${postFollowBtn}
                        ${moodSvg ? `<span class="post-mood">${moodSvg}</span>` : ''}
                    </div>
                    <div class="post-meta-row">
                        <span class="post-time">${timeStr}</span>
                        ${p.edited ? `<span class="post-meta-dot">\u00b7</span><span class="post-edited">edited</span>` : ''}
                    </div>
                </div>
                ${menuHtml}
            </div>
            <div class="post-content">${linkifyPost(p.body)}</div>
            ${imageHtml}
            <div class="post-love-row">
                <button type="button" class="post-love-btn ${liked ? 'liked' : ''}" data-post-id="${p._id}" onclick="toggleLove(event, this)">
                    <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    <span class="post-love-count">${likeCount}</span>
                </button>
            </div>
        </div>
    `;
}

// ===== LIKE POST (toggle) =====
app.post('/post/:id/like', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.json({ ok: false });
        if (!post.likes) post.likes = [];
        const me = req.session.user;
        const idx = post.likes.indexOf(me);
        if (idx === -1) post.likes.push(me);
        else post.likes.splice(idx, 1);
        await post.save();
        res.json({ ok: true, likes: post.likes.length, liked: post.likes.includes(me) });
    } catch (err) {
        console.error('Like error:', err);
        res.json({ ok: false });
    }
});

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

function isButtonPhone(req) {
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    if (ua.includes('jwap') || ua.includes('obigo') || ua.includes('maui') ||
        ua.includes('openwave') || ua.includes('up.browser') || ua.includes('wap')) {
        return true;
    }
    return false;
}

// ===== HOME PAGE (FEED) =====
app.get('/', async (req, res) => {
    if (isButtonPhone(req)) {
        return res.redirect('/wap');
    }

    if (!req.session.user) {
        // Public landing page — unchanged
        const latestPosts = await Post.find().sort({ created_at: -1 }).limit(2);
        let previewHtml = '';
        const demos = [
            { name: 'Ayesha Khatun', text: 'The best conversations happen when nobody is trying to win.', likes: 12, time: '2h', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ayesha' },
            { name: 'Tanvir Hasan', text: 'Wrote three pages in my notebook today. No screen, just ink.', likes: 8, time: '5h', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Tanvir' },
            { name: 'Samira Rahman', text: 'Quiet mornings are underrated. So is saying nothing.', likes: 24, time: '1d', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Samira' }
        ];
        for (const d of demos) {
            previewHtml += `
                <div class="lp-post">
                    <div class="lp-post-head">
                        <div class="lp-post-avatar has-img"><img src="${d.avatar}" alt=""></div>
                        <span class="lp-post-author">${d.name}</span>
                    </div>
                    <p class="lp-post-body">${d.text}</p>
                    <div class="lp-post-meta"><span>${d.time}</span><span class="lp-post-dot">\u00b7</span><span>${d.likes} likes</span></div>
                </div>
            `;
        }
        return res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
            <title>EliGet</title>
            </head><body class="lp-body">
            <div class="lp-wrap">

                <nav class="lp-nav">
                    <span class="lp-brand">EliGet<span class="lp-brand-dot"></span></span>
                    <div class="lp-nav-links">
                        <a href="#features">Features</a>
                        <a href="/auth/login">Login</a>
                    </div>
                </nav>

                <section class="lp-hero">
                    <h1 class="lp-headline">A social network<br>for people who think.</h1>
                    <p class="lp-sub">Text-only. No algorithms. No videos.<br>Just pure thoughts.</p>
                </section>

                <div class="lp-cta">
                    <a href="/auth/signup" class="lp-btn-primary">Create Account<span class="lp-arrow">\u2192</span></a>
                    <a href="/auth/login" class="lp-btn-secondary">Login</a>
                </div>

                <section class="lp-features" id="features">
                    <h2 class="lp-features-title">Built around conversation</h2>
                    <div class="lp-feature-grid">
                        <div class="lp-feature">
                            <div class="lp-feature-label">Text-first</div>
                            <div class="lp-feature-text">Share ideas</div>
                        </div>
                        <div class="lp-feature">
                            <div class="lp-feature-label">Real-time</div>
                            <div class="lp-feature-text">Chat</div>
                        </div>
                        <div class="lp-feature">
                            <div class="lp-feature-label">Simple Feed</div>
                            <div class="lp-feature-text">No noise</div>
                        </div>
                    </div>
                </section>

                <section class="lp-preview">
                    <h2 class="lp-preview-title">Latest thoughts</h2>
                    ${previewHtml}
                </section>

                <div class="lp-guest">
                    <span class="lp-guest-text">Not ready to join?</span>
                    <a href="/feed" class="lp-guest-link">Browse the public feed<span class="lp-arrow-svg-inline">\u2192</span></a>
                </div>

            </div>
            </body></html>
        `);
    }

    // ========== LOGGED-IN HOME WITH TABS ==========
    const me = req.session.user;
    const homeUnreadCount = await Notification.countDocuments({ recipient: me, seen: false });
    const feedParam = req.query.feed === 'following' ? 'following' : 'foryou';

    let posts = [];
    let followSet = await getFollowSet(me);

    if (feedParam === 'following') {
        const follows = await Follow.find({ follower: me }).select('following');
        const followingUsernames = follows.map(f => f.following);
        if (followingUsernames.length > 0) {
            posts = await Post.find({ author: { $in: followingUsernames } }).sort({ created_at: -1 }).limit(50);
        }
    } else {
        posts = await Post.find().sort({ created_at: -1 }).limit(50);
    }

    // Filter out blocked users (both directions)
    const { iBlocked: homeIBlocked, blockedMe: homeBlockedMe } = await getBlockSets(me);
    posts = posts.filter(p => !homeIBlocked.has(p.author) && !homeBlockedMe.has(p.author));

    let postsHtml = '';
    if (posts.length === 0) {
        if (feedParam === 'following') {
            postsHtml = `<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h7v2H7z"/></svg>
                <h3>Nothing here yet</h3>
                <p>Follow people and their posts will show up here.</p>
                <a href="/feed">Browse public feed</a>
            </div>`;
        } else {
            postsHtml = `<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h7v2H7z"/></svg>
                <h3>Nothing here yet</h3>
                <p>Be the first to share a thought with the community.</p>
                <a href="/post/create">Write the first post</a>
            </div>`;
        }
    } else {
        for (const p of posts) {
            postsHtml += await renderPostCard(p, me, followSet);
        }
    }

    const bottomNav = `<div class="bottom-nav"><a href="/" class="active">${icons.home}<span>Home</span></a><a href="/students">${icons.students}<span>Students</span></a><a href="/post/create">${icons.plus}<span>Post</span></a><a href="/chat">${icons.chat}<span>Chat</span></a><a href="/profile">${icons.profile}<span>Profile</span></a></div>`;

    res.send(`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
        <title>EliGet</title>
        </head><body>
        <div class="container">
            <header class="feed-header">
                <h1 class="feed-title">Home</h1>
                <a href="/search" class="header-icon" title="Search">${icons.search}</a>
                <a href="/chat/notifications" class="header-icon header-icon-bell" title="Notifications">
                    ${icons.bell}
                    ${homeUnreadCount > 0 ? `<span class="header-badge">${homeUnreadCount}</span>` : ''}
                </a>
                <span id="home-students-banner"></span>
            </header>

            <a href="/students" class="home-students-banner">
                <div class="hsb-inner">
                    <div class="hsb-icon">
                        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" fill="currentColor"/></svg>
                    </div>
                    <div class="hsb-text">
                        <div class="hsb-title">Students Community</div>
                        <div class="hsb-sub">Questions, MCQ, Polls, Notes</div>
                    </div>
                    <div class="hsb-arrow">→</div>
                </div>
            </a>

            <div class="tab-bar">
                <a href="/?feed=foryou" class="tab-item ${feedParam === 'foryou' ? 'active' : ''}">For You</a>
                <a href="/?feed=following" class="tab-item ${feedParam === 'following' ? 'active' : ''}">Following</a>
            </div>

            <div class="feed-list">${postsHtml}</div>
        </div>
        ${bottomNav}
        ${getDeleteModal()}
        </body></html>
    `);
});

// ===== FEED (PUBLIC) =====
app.get('/feed', async (req, res) => {
    let posts = await Post.find().sort({ created_at: -1 }).limit(50);
    if (req.session.user) {
        const { iBlocked, blockedMe } = await getBlockSets(req.session.user);
        posts = posts.filter(p => !iBlocked.has(p.author) && !blockedMe.has(p.author));
    }
    let html = '<html><head><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.svg"></head><body><div class="container">';
    html += '<header class="feed-header"><h1 class="feed-title">Feed</h1></header>';
    
    if (posts.length === 0) {
        html += `<div class="empty-state">
            <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h7v2H7z"/></svg>
            <h3>Nothing here yet</h3>
            <p>Be the first to share a thought.</p>
        </div>`;
    } else {
        const feedFollowSet = await getFollowSet(req.session.user || null);
        for (const p of posts) {
            html += await renderPostCard(p, req.session.user || null, feedFollowSet);
        }
    }
    html += '</div>';
    if (req.session.user) {
        html += getDeleteModal();
        html += `<div class="bottom-nav"><a href="/" class="active">${icons.home}<span>Home</span></a><a href="/students">${icons.students}<span>Students</span></a><a href="/post/create">${icons.plus}<span>Post</span></a><a href="/chat">${icons.chat}<span>Chat</span></a><a href="/profile">${icons.profile}<span>Profile</span></a></div>`;
    } else {
        html += '<div style="text-align:center; margin-top:20px;"><a href="/auth/login" style="color:#3182ce; text-decoration:none;">Login to interact</a></div>';
    }
    html += '</body></html>';
    res.send(html);
});

// ===== OWN PROFILE =====
app.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.session.user });
        if (!user) return res.redirect('/auth/logout');

        const displayName = user.full_name || user.username;
        const initial = displayName.charAt(0).toUpperCase();
        const avatarUrl = user.avatar ? `<img src="${user.avatar}" alt="Avatar">` : initial;

        const myPosts = await Post.find({ author: req.session.user }).sort({ created_at: -1 });
        const postCount = myPosts.length;
        const totalLikes = myPosts.reduce((sum, p) => sum + ((p.likes || []).length), 0);

        const FriendRequest = require('./models/FriendRequest');
        const friendCount = await FriendRequest.countDocuments({
            status: 'accepted',
            $or: [{ from: req.session.user }, { to: req.session.user }]
        });

        let postsHtml = '';
        if (myPosts.length === 0) {
            postsHtml = `<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h7v2H7z"/></svg>
                <p>You have not posted anything yet.</p>
                <a href="/post/create">Write your first post</a>
            </div>`;
        } else {
            const ownFollowSet = await getFollowSet(req.session.user);
            for (const p of myPosts) {
                postsHtml += await renderPostCard(p, req.session.user, ownFollowSet);
            }
        }

        let bioHtml = '';
        if (user.bio && user.bio.trim()) {
            bioHtml = `<p class="pp-bio">${linkifyBio(user.bio)}</p>`;
        }

        let badgesInline = '';
        if (user.badges && user.badges.length > 0) {
            user.badges.forEach(b => {
                if (badgeLibrary[b]) {
                    badgesInline += `<span class="pp-badge pp-badge-inline" title="${badgeLibrary[b].label}">${badgeLibrary[b].svg}</span>`;
                }
            });
        }

        const bottomNav = `<div class="bottom-nav"><a href="/">${icons.home}<span>Home</span></a><a href="/students">${icons.students}<span>Students</span></a><a href="/post/create">${icons.plus}<span>Post</span></a><a href="/chat">${icons.chat}<span>Chat</span></a><a href="/profile" class="active">${icons.profile}<span>Profile</span></a></div>`;

        res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <title>Your Profile - EliGet</title>
            </head><body>
            <div class="container">
                <header>
                    <span class="profile-title">Your Profile</span>
                    <a href="/settings" class="settings-icon" title="Settings">${icons.settings}</a>
                </header>

                <div class="pp-card">
                    <button type="button" class="pp-menu-btn" onclick="toggleProfileMenu(event)" aria-label="Menu">
                        <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                    </button>
                    <div class="pp-menu-dropdown" id="ownProfileMenu">
                        <a href="#" onclick="openChangeNameModal();return false;">Change Name</a>
                        <a href="/profile/avatar">Edit Avatar</a>
                        <a href="/profile/badges">Edit Badges</a>
                        <a href="/profile/bio">Edit Bio</a>
                    </div>

                    <div class="pp-avatar-wrap">
                        <div class="pp-avatar">${avatarUrl}</div>
                    </div>

                    <div class="pp-name-row">
                        <h2 class="pp-name">${displayName}</h2>
                        ${badgesInline}
                    </div>
                    <p class="pp-username">@${user.username}</p>
                    ${bioHtml}

                    <p class="pp-stats-line"><strong>${postCount}</strong> ${postCount === 1 ? 'Post' : 'Posts'} <span class="pp-dot">·</span> <strong>${totalLikes}</strong> ${totalLikes === 1 ? 'Like' : 'Likes'}</p>
                </div>

                <div class="pp-section-title">Your Posts</div>
                ${postsHtml}
            </div>

            <div class="modal-overlay" id="changeNameModal">
                <div class="modal-box">
                    <h3 class="modal-title">Change Name</h3>
                    <form method="POST" action="/settings/update-name">
                        <input type="hidden" name="redirect" value="/profile">
                        <input type="text" name="full_name" value="${displayName.replace(/"/g, '&quot;')}" required maxlength="50" placeholder="Enter your name">
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="closeModal('changeNameModal')">Cancel</button>
                            <button type="submit" class="btn-primary">Save</button>
                        </div>
                    </form>
                </div>
            </div>

            <script>
                function toggleProfileMenu(e){
                    e.stopPropagation();
                    document.getElementById('ownProfileMenu').classList.toggle('open');
                }
                function openChangeNameModal(){
                    document.getElementById('ownProfileMenu').classList.remove('open');
                    document.getElementById('changeNameModal').classList.add('active');
                }
                function closeModal(id){
                    document.getElementById(id).classList.remove('active');
                }
                document.addEventListener('click', function(e){
                    var menu = document.getElementById('ownProfileMenu');
                    if (menu && !menu.contains(e.target)) menu.classList.remove('open');
                });
            </script>
            ${bottomNav}
            </body></html>
        `);
    } catch (err) {
        console.error('Own profile error:', err);
        res.redirect('/');
    }
});

app.get('/profile/avatar', isAuthenticated, async (req, res) => {
    const me = req.session.user;
    const safeSeed = encodeURIComponent(me);

    res.send(`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
        <title>Avatar - EliGet</title>
        </head><body class="ab-body">
        <div class="ab-wrap">

            <header class="ab-topbar">
                <a href="/profile" class="ab-back" title="Back">
                    <svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
                </a>
                <span class="ab-title">Your avatar</span>
                <button type="button" class="ab-random" onclick="abShuffle()" title="Shuffle">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg>
                </button>
            </header>

            <div class="ab-preview">
                <div class="ab-preview-frame">
                    <img id="abPreview" src="" alt="Avatar">
                </div>
            </div>

            <div class="ab-controls" id="abControls"></div>

            <div class="ab-actions">
                <button type="button" class="ab-btn-secondary" onclick="abReset()">Reset</button>
                <button type="button" class="ab-btn-primary" onclick="abSave()">Save avatar</button>
            </div>

        </div>

        <script>
        var AB_SEED = 'Felix';
        var AB_STATE = {
            bg: 'b6e3f4',
            skinColor: 'edb98a',
            top: 'shortFlat',
            hairColor: 'a55728',
            eyes: 'happy',
            mouth: 'smile',
            eyebrows: 'default',
            accessories: '',
            facialHair: '',
            clothing: 'hoodie',
            clothesColor: '5199e4'
        };

        var AB_OPTIONS = {
            bg: [
                { v: 'b6e3f4' }, { v: 'c0aede' }, { v: 'd1d4f9' }, { v: 'ffd5dc' },
                { v: 'ffdfbf' }, { v: 'a8e6cf' }, { v: 'fddb92' }, { v: 'a0c4ff' },
                { v: 'bdb2ff' }, { v: 'ffc6ff' }, { v: 'ffffff' }, { v: '1e293b' }
            ],
            skinColor: [
                { v: 'ffdbb4' }, { v: 'edb98a' }, { v: 'd08b5b' },
                { v: 'ae5d29' }, { v: '614335' }, { v: 'f8d25c' }, { v: 'fd9841' }
            ],
            hairColor: [
                { v: 'a55728' }, { v: '2c1b18' }, { v: 'b58143' },
                { v: 'd6b370' }, { v: '724133' }, { v: '4a312c' },
                { v: 'f59797' }, { v: 'e8e1e1' }, { v: 'ecdcbf' }, { v: 'c93305' }
            ],
            top: [
                { v: 'shortFlat', l: 'Short' },
                { v: 'shortRound', l: 'Round' },
                { v: 'shortCurly', l: 'Curly' },
                { v: 'shortWaved', l: 'Waved' },
                { v: 'theCaesar', l: 'Caesar' },
                { v: 'frizzle', l: 'Frizzle' },
                { v: 'bigHair', l: 'Big' },
                { v: 'bob', l: 'Bob' },
                { v: 'bun', l: 'Bun' },
                { v: 'curly', l: 'Curvy' },
                { v: 'fro', l: 'Fro' },
                { v: 'straight01', l: 'Straight' },
                { v: 'straight02', l: 'Longer' },
                { v: 'dreads', l: 'Dreads' },
                { v: 'miaWallace', l: 'Mia' },
                { v: 'hat', l: 'Hat' },
                { v: 'winterHat1', l: 'Winter' },
                { v: 'turban', l: 'Turban' },
                { v: 'hijab', l: 'Hijab' }
            ],
            eyes: [
                { v: 'default', l: 'Normal' },
                { v: 'happy', l: 'Happy' },
                { v: 'wink', l: 'Wink' },
                { v: 'squint', l: 'Squint' },
                { v: 'side', l: 'Side' },
                { v: 'surprised', l: 'Surprised' },
                { v: 'hearts', l: 'Hearts' },
                { v: 'cry', l: 'Cry' },
                { v: 'dizzy', l: 'Dizzy' },
                { v: 'closed', l: 'Close' }
            ],
            mouth: [
                { v: 'default', l: 'Normal' },
                { v: 'smile', l: 'Smile' },
                { v: 'twinkle', l: 'Twinkle' },
                { v: 'serious', l: 'Serious' },
                { v: 'concerned', l: 'Concerned' },
                { v: 'disbelief', l: 'Disbelief' },
                { v: 'sad', l: 'Sad' },
                { v: 'grimace', l: 'Grimace' },
                { v: 'eating', l: 'Eating' },
                { v: 'tongue', l: 'Tongue' }
            ],
            eyebrows: [
                { v: 'default', l: 'Normal' },
                { v: 'raised', l: 'Raised' },
                { v: 'angry', l: 'Angry' },
                { v: 'concerned', l: 'Concerned' },
                { v: 'flat', l: 'Flat' },
                { v: 'sad', l: 'Sad' },
                { v: 'up', l: 'Up' },
                { v: 'angryNatural', l: 'Bold' },
                { v: 'defaultNatural', l: 'Natural' }
            ],
            accessories: [
                { v: '', l: 'None' },
                { v: 'round', l: 'Round' },
                { v: 'prescription01', l: 'Small' },
                { v: 'prescription02', l: 'Classic' },
                { v: 'wayfarers', l: 'Wayfarer' },
                { v: 'sunglasses', l: 'Sunglasses' },
                { v: 'kurt', l: 'Bold' }
            ],
            facialHair: [
                { v: '', l: 'None' },
                { v: 'beardMedium', l: 'Medium' },
                { v: 'beardLight', l: 'Light' },
                { v: 'beardMajestic', l: 'Majestic' },
                { v: 'moustacheFancy', l: 'Fancy' },
                { v: 'moustacheMagnum', l: 'Magnum' }
            ],
            clothing: [
                { v: 'hoodie', l: 'Hoodie' },
                { v: 'blazerAndShirt', l: 'Blazer' },
                { v: 'blazerAndSweater', l: 'Sweater' },
                { v: 'collarAndSweater', l: 'Collar' },
                { v: 'graphicShirt', l: 'Graphic' },
                { v: 'overall', l: 'Overall' },
                { v: 'shirtCrewNeck', l: 'Crew' },
                { v: 'shirtScoopNeck', l: 'Scoop' },
                { v: 'shirtVNeck', l: 'V-Neck' }
            ],
            clothesColor: [
                { v: '262e33' }, { v: '65c9ff' }, { v: '5199e4' },
                { v: '25557c' }, { v: '929598' }, { v: 'a7ffc4' },
                { v: 'ffafb9' }, { v: 'ff488e' }, { v: 'ff5c5c' },
                { v: 'ffffb1' }, { v: 'ffffff' }, { v: '1e293b' }
            ]
        };

        function abComposeUrl() {
            var s = AB_STATE;
            var parts = ['seed=' + AB_SEED];
            parts.push('backgroundColor=' + s.bg);
            parts.push('skinColor=' + s.skinColor);
            parts.push('top=' + s.top);
            parts.push('hairColor=' + s.hairColor);
            parts.push('eyes=' + s.eyes);
            parts.push('mouth=' + s.mouth);
            parts.push('eyebrows=' + s.eyebrows);
            parts.push('clothing=' + s.clothing);
            parts.push('clothesColor=' + s.clothesColor);

            if (s.accessories) {
                parts.push('accessories=' + s.accessories);
                parts.push('accessoriesColor=262e33');
                parts.push('accessoriesProbability=100');
            } else {
                parts.push('accessoriesProbability=0');
            }
            if (s.facialHair) {
                parts.push('facialHair=' + s.facialHair);
                parts.push('facialHairColor=' + s.hairColor);
                parts.push('facialHairProbability=100');
            } else {
                parts.push('facialHairProbability=0');
            }
            return 'https://api.dicebear.com/7.x/avataaars/svg?' + parts.join('&');
        }

        function abUpdatePreview() {
            var img = document.getElementById('abPreview');
            if (img) img.src = abComposeUrl();
        }

        function abRenderControls() {
            var box = document.getElementById('abControls');
            var html = '';

            function colorGroup(label, key, opts) {
                var h = '<div class="ab-group"><div class="ab-group-label">' + label + '</div><div class="ab-colors">';
                opts.forEach(function(o) {
                    var active = AB_STATE[key] === o.v ? ' active' : '';
                    h += '<button type="button" class="ab-color' + active + '" style="background:#' + o.v + '" data-key="' + key + '" data-val="' + o.v + '" onclick="abPick(this)"></button>';
                });
                h += '</div></div>';
                return h;
            }

            function pillGroup(label, key, opts) {
                var h = '<div class="ab-group"><div class="ab-group-label">' + label + '</div><div class="ab-pills">';
                opts.forEach(function(o) {
                    var active = AB_STATE[key] === o.v ? ' active' : '';
                    h += '<button type="button" class="ab-pill' + active + '" data-key="' + key + '" data-val="' + o.v + '" onclick="abPick(this)">' + o.l + '</button>';
                });
                h += '</div></div>';
                return h;
            }

            html += colorGroup('Background', 'bg', AB_OPTIONS.bg);
            html += colorGroup('Skin', 'skinColor', AB_OPTIONS.skinColor);
            html += pillGroup('Hair style', 'top', AB_OPTIONS.top);
            html += colorGroup('Hair color', 'hairColor', AB_OPTIONS.hairColor);
            html += pillGroup('Glasses', 'accessories', AB_OPTIONS.accessories);
            html += pillGroup('Beard', 'facialHair', AB_OPTIONS.facialHair);
            html += pillGroup('Dress', 'clothing', AB_OPTIONS.clothing);
            html += colorGroup('Dress color', 'clothesColor', AB_OPTIONS.clothesColor);
            html += pillGroup('Eyes', 'eyes', AB_OPTIONS.eyes);
            html += pillGroup('Mouth', 'mouth', AB_OPTIONS.mouth);
            html += pillGroup('Eyebrows', 'eyebrows', AB_OPTIONS.eyebrows);

            box.innerHTML = html;
        }

        function abPick(btn) {
            var key = btn.getAttribute('data-key');
            var val = btn.getAttribute('data-val');
            AB_STATE[key] = val;
            var parent = btn.parentNode;
            parent.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            abUpdatePreview();
        }

        function abShuffle() {
            function pick(arr) { return arr[Math.floor(Math.random() * arr.length)].v; }
            AB_STATE.bg = pick(AB_OPTIONS.bg);
            AB_STATE.skinColor = pick(AB_OPTIONS.skinColor);
            AB_STATE.top = pick(AB_OPTIONS.top);
            AB_STATE.hairColor = pick(AB_OPTIONS.hairColor);
            AB_STATE.eyes = pick(AB_OPTIONS.eyes);
            AB_STATE.mouth = pick(AB_OPTIONS.mouth);
            AB_STATE.eyebrows = pick(AB_OPTIONS.eyebrows);
            AB_STATE.accessories = pick(AB_OPTIONS.accessories);
            AB_STATE.facialHair = pick(AB_OPTIONS.facialHair);
            AB_STATE.clothing = pick(AB_OPTIONS.clothing);
            AB_STATE.clothesColor = pick(AB_OPTIONS.clothesColor);
            abRenderControls();
            abUpdatePreview();
        }

        function abReset() {
            AB_STATE.bg = 'b6e3f4';
            AB_STATE.skinColor = 'edb98a';
            AB_STATE.top = 'shortFlat';
            AB_STATE.hairColor = 'a55728';
            AB_STATE.eyes = 'happy';
            AB_STATE.mouth = 'smile';
            AB_STATE.eyebrows = 'default';
            AB_STATE.accessories = '';
            AB_STATE.facialHair = '';
            AB_STATE.clothing = 'hoodie';
            AB_STATE.clothesColor = '5199e4';
            abRenderControls();
            abUpdatePreview();
        }

        function abSave() {
            var url = abComposeUrl();
            var form = document.createElement('form');
            form.method = 'POST';
            form.action = '/profile/avatar';
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'avatar_url';
            input.value = url;
            form.appendChild(input);
            document.body.appendChild(form);
            form.submit();
        }

        abRenderControls();
        abUpdatePreview();
        </script>
        </body></html>
    `);
});

app.post('/profile/avatar', isAuthenticated, async (req, res) => {
    const { avatar_url } = req.body;
    await User.updateOne({ username: req.session.user }, { avatar: avatar_url });
    res.redirect('/profile');
});

// ===== SETTINGS =====

// ===== BADGE LIBRARY PAGE =====
app.get('/profile/badges', isAuthenticated, async (req, res) => {
    const user = await User.findOne({ username: req.session.user });
    const currentBadges = user.badges || [];

    let badgeGridHtml = '';
    Object.keys(badgeLibrary).forEach(key => {
        const b = badgeLibrary[key];
        const isSelected = currentBadges.includes(key);
        badgeGridHtml += `
            <label class="badge-option ${isSelected ? 'selected' : ''}" onclick="toggleBadge(this, '${key}')">
                <input type="checkbox" name="badges" value="${key}" ${isSelected ? 'checked' : ''}>
                <div class="badge-icon">${b.svg}</div>
                <span class="badge-label">${b.label}</span>
            </label>
        `;
    });

    res.send(`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <title>Badge Library - EliGet</title>
        </head><body>
        <div class="container">
            <header>
                <a href="/profile" class="header-icon" title="Back">${icons.back}</a>
                <span class="profile-title" style="flex:1;">Badge Library</span>
            </header>

            <p style="color: #718096; font-size: 0.9rem; margin-bottom: 15px; text-align: center;">Select up to 3 badges for your profile</p>

            <form action="/profile/badges" method="POST" id="badgeForm">
                <div class="badge-grid">
                    ${badgeGridHtml}
                </div>
                <div class="badge-save-bar">
                    <a href="/profile" class="avatar-cancel-btn">Cancel</a>
                    <button type="submit" class="avatar-save-btn">Save Badges</button>
                </div>
            </form>
        </div>
        <div class="bottom-nav"><a href="/">${icons.home}<span>Home</span></a><a href="/students">${icons.students}<span>Students</span></a><a href="/post/create">${icons.plus}<span>Post</span></a><a href="/chat">${icons.chat}<span>Chat</span></a><a href="/profile" class="active">${icons.profile}<span>Profile</span></a></div>

        <script>
            function toggleBadge(el, key) {
                const checkbox = el.querySelector('input');
                const selected = document.querySelectorAll('.badge-option.selected');
                
                if (!checkbox.checked) {
                    // Selecting
                    if (selected.length >= 3) {
                        alert('You can select max 3 badges');
                        return;
                    }
                    checkbox.checked = true;
                    el.classList.add('selected');
                } else {
                    // Deselecting
                    checkbox.checked = false;
                    el.classList.remove('selected');
                }
            }
        </script>
        </body></html>
    `);
});

// Save Badges (POST)
app.post('/profile/badges', isAuthenticated, async (req, res) => {
    try {
        let selected = req.body.badges || [];
        if (!Array.isArray(selected)) selected = [selected];
        selected = selected.slice(0, 3);

        await User.updateOne(
            { username: req.session.user },
            { badges: selected }
        );
        res.redirect('/profile?status=badges_saved');
    } catch (err) {
        console.error('Badge save error:', err);
        res.redirect('/profile');
    }
});

// ===== BIO EDIT PAGE =====
app.get('/profile/bio', isAuthenticated, async (req, res) => {
    const user = await User.findOne({ username: req.session.user });
    const currentBio = user.bio || '';

    res.send(`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <title>Edit Bio - EliGet</title>
        </head><body>
        <div class="container">
            <header>
                <a href="/profile" class="header-icon" title="Back">${icons.back}</a>
                <span class="profile-title" style="flex:1;">Edit Bio</span>
            </header>

            <div class="form-card">
                <form action="/profile/bio" method="POST">
                    <div class="form-group">
                        <label>About You (Max 150 characters)</label>
                        <textarea name="bio" rows="4" maxlength="150" placeholder="Tell people about yourself...">${currentBio}</textarea>
                        <p style="font-size: 0.75rem; color: #a0aec0; margin-top: 6px;">Keep it short. This shows on your profile.</p>
                    </div>
                    <button type="submit" class="btn-full">Save Bio</button>
                </form>
            </div>
        </div>
        <div class="bottom-nav"><a href="/">${icons.home}<span>Home</span></a><a href="/students">${icons.students}<span>Students</span></a><a href="/post/create">${icons.plus}<span>Post</span></a><a href="/chat">${icons.chat}<span>Chat</span></a><a href="/profile" class="active">${icons.profile}<span>Profile</span></a></div>
        </body></html>
    `);
});

app.post('/profile/bio', isAuthenticated, async (req, res) => {
    try {
        const bio = (req.body.bio || '').trim().substring(0, 150);
        await User.updateOne({ username: req.session.user }, { bio });
        res.redirect('/profile');
    } catch (err) {
        console.error('Bio save error:', err);
        res.redirect('/profile');
    }
});

// ===== VISIT OTHER USER'S PROFILE =====
const interestIcons = {
    music: `<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
    book: `<svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>`,
    nature: `<svg viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>`,
    tech: `<svg viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>`,
    sports: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08C16.71 17.72 14.5 19 12 19z"/></svg>`,
    art: `<svg viewBox="0 0 24 24"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.2-.64-1.67-.08-.1-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z"/></svg>`,
    travel: `<svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
    coffee: `<svg viewBox="0 0 24 24"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg>`,
    poetry: `<svg viewBox="0 0 24 24"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>`,
    gaming: `<svg viewBox="0 0 24 24"><path d="M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>`
};

const interestLabels = {
    music: 'Music', book: 'Books', nature: 'Nature', tech: 'Tech',
    sports: 'Sports', art: 'Art', travel: 'Travel', coffee: 'Coffee',
    poetry: 'Poetry', gaming: 'Gaming'
};

app.get('/profile/:username', isAuthenticated, async (req, res) => {
    try {
        const targetUsername = req.params.username;
        const me = req.session.user;

        if (targetUsername === me) return res.redirect('/profile');
        if (targetUsername === 'avatar') return res.redirect('/profile/avatar');

        const user = await User.findOne({ username: targetUsername });
        if (!user) return res.redirect('/');

        const displayName = user.full_name || user.username;
        const initial = displayName.charAt(0).toUpperCase();
        const avatarUrl = user.avatar ? `<img src="${user.avatar}" alt="Avatar">` : initial;

        const FriendRequest = require('./models/FriendRequest');
        const friendship = await FriendRequest.findOne({
            status: 'accepted',
            $or: [{ from: me, to: targetUsername }, { from: targetUsername, to: me }]
        });
        const isFriend = !!friendship;

        // Block state
        const iBlockedThem = await Block.findOne({ blocker: me, blocked: targetUsername });
        const theyBlockedMe = await Block.findOne({ blocker: targetUsername, blocked: me });
        const isBlocked = !!iBlockedThem;
        const isBlockedByThem = !!theyBlockedMe;

        const pendingRequest = await FriendRequest.findOne({
            status: 'pending',
            $or: [{ from: me, to: targetUsername }, { from: targetUsername, to: me }]
        });

        const theirPosts = (isBlocked || isBlockedByThem) ? [] : await Post.find({ author: targetUsername }).sort({ created_at: -1 });
        const postCount = theirPosts.length;

        const friendCount = await FriendRequest.countDocuments({
            status: 'accepted',
            $or: [{ from: targetUsername }, { to: targetUsername }]
        });

        const followerCount = await Follow.countDocuments({ following: targetUsername });
        const followingCount = await Follow.countDocuments({ follower: targetUsername });
        const isFollowing = await Follow.findOne({ follower: me, following: targetUsername });

        let postsHtml = '';
        if (theirPosts.length === 0) {
            postsHtml = `<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h7v2H7z"/></svg>
                <h3>No posts yet</h3>
                <p>This user has not shared anything.</p>
            </div>`;
        } else {
            const otherFollowSet = await getFollowSet(me);
            for (const p of theirPosts) {
                postsHtml += await renderPostCard(p, me, otherFollowSet);
            }
        }

        let bioHtml = '';
        if (user.bio && user.bio.trim()) {
            bioHtml = `<p class="pp-bio">${linkifyBio(user.bio)}</p>`;
        }

        let badgesHtml = '';
        if (user.badges && user.badges.length > 0) {
            user.badges.forEach(b => {
                if (badgeLibrary[b]) {
                    badgesHtml += `<span class="pp-badge" title="${badgeLibrary[b].label}">${badgeLibrary[b].svg}</span>`;
                }
            });
            if (badgesHtml) badgesHtml = `<div class="pp-badges">${badgesHtml}</div>`;
        }

        // Message button only if mutual follow
        let actionBtn = '';
        if (isFollowing) {
            const theyFollowMe = await Follow.findOne({ follower: targetUsername, following: me });
            if (theyFollowMe) {
                actionBtn = `<a href="/chat/${targetUsername}" class="pp-action-btn primary">Message</a>`;
            }
        }

        let followBtn;
        if (isFollowing) {
            followBtn = `<button type="button" class="pp-follow-btn following" data-username="${targetUsername}" onclick="toggleFollow(this)">Following</button>`;
        } else {
            followBtn = `<button type="button" class="pp-follow-btn" data-username="${targetUsername}" onclick="toggleFollow(this)">Follow</button>`;
        }

        const bottomNav = `<div class="bottom-nav"><a href="/" class="active">${icons.home}<span>Home</span></a><a href="/students">${icons.students}<span>Students</span></a><a href="/post/create">${icons.plus}<span>Post</span></a><a href="/chat">${icons.chat}<span>Chat</span></a><a href="/profile">${icons.profile}<span>Profile</span></a></div>`;

        res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <title>${displayName} - EliGet</title>
            </head><body>
            <div class="container">
                <header>
                    <a href="/" class="header-icon" title="Back">${icons.back}</a>
                    <span class="profile-title" style="flex:1;">Profile</span>
                    ${!isBlockedByThem ? `
                        <button type="button" class="pp-menu-btn-static" onclick="toggleBlockMenu(event)" aria-label="Menu">
                            <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/></svg>
                        </button>
                    ` : ''}
                </header>

                ${!isBlockedByThem ? `
                    <div class="pp-block-menu" id="blockMenu">
                        <button type="button" class="pp-block-item ${isBlocked ? 'unblock' : 'block'}" onclick="toggleBlock('${targetUsername}', ${isBlocked ? 'true' : 'false'})">
                            ${isBlocked ? 'Unblock user' : 'Block user'}
                        </button>
                        <button type="button" class="pp-block-item report" onclick="toggleProfileMenuClose();rpOpen('user','${targetUsername}')">
                            Report user
                        </button>
                    </div>
                ` : ''}

                ${(isBlocked || isBlockedByThem) ? `
                    <div class="pp-blocked-banner">
                        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z" fill="currentColor"/></svg>
                        <span>${isBlocked ? 'You blocked this user' : 'This user is unavailable'}</span>
                    </div>
                ` : ''}

                ${!(isBlocked || isBlockedByThem) ? `
                <div class="pp-card">
                    <div class="pp-avatar-wrap">
                        <div class="pp-avatar">${avatarUrl}</div>
                    </div>

                    <h2 class="pp-name">${displayName}</h2>
                    <p class="pp-username">@${user.username}</p>
                    ${badgesHtml}
                    ${bioHtml}

                    <div class="pp-stats">
                        <div class="pp-stat">
                            <div class="pp-stat-num">${postCount}</div>
                            <div class="pp-stat-label">${postCount === 1 ? 'Post' : 'Posts'}</div>
                        </div>
                        <div class="pp-stat">
                            <div class="pp-stat-num">${followerCount}</div>
                            <div class="pp-stat-label">${followerCount === 1 ? 'Follower' : 'Followers'}</div>
                        </div>
                        <div class="pp-stat">
                            <div class="pp-stat-num">${followingCount}</div>
                            <div class="pp-stat-label">Following</div>
                        </div>
                    </div>

                    <div class="pp-action-row-2">
                        ${followBtn}
                        ${actionBtn}
                    </div>
                </div>
                ` : ''}

                <div class="pp-section-title">Recent Posts</div>
                ${postsHtml}
            </div>
            ${bottomNav}
            </body></html>
        `);
    } catch (err) {
        console.error('Profile visit error:', err);
        res.redirect('/');
    }
});

app.get('/settings', isAuthenticated, async (req, res) => {
    const user = await User.findOne({ username: req.session.user });
    const currentFullName = user.full_name || user.username;
    const showToast = req.query.status === 'saved';
    const esc = (str) => String(str).replace(/"/g, '&quot;');

    // Build accounts list from session
    const accountUsernames = req.session.accounts && req.session.accounts.length ? req.session.accounts : [req.session.user];
    const accountsData = [];
    for (const un of accountUsernames) {
        const acc = await User.findOne({ username: un });
        if (!acc) continue;
        const dn = acc.full_name || acc.username;
        accountsData.push({
            username: un,
            displayName: dn,
            initial: dn.charAt(0).toUpperCase(),
            avatar: acc.avatar || '',
            isActive: un === req.session.user
        });
    }

    let accountsHtml = '';
    for (const a of accountsData) {
        const avatarInner = a.avatar ? `<img src="${a.avatar}" alt="">` : a.initial;
        if (a.isActive) {
            accountsHtml += `
                <div class="st-account st-account-active">
                    <div class="st-account-avatar">${avatarInner}</div>
                    <div class="st-account-info">
                        <div class="st-account-name">${a.displayName}</div>
                        <div class="st-account-username">@${a.username} · Active</div>
                    </div>
                    <span class="st-account-check">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#16a34a"/></svg>
                    </span>
                </div>
            `;
        } else {
            accountsHtml += `
                <div class="st-account">
                    <div class="st-account-avatar">${avatarInner}</div>
                    <div class="st-account-info">
                        <div class="st-account-name">${a.displayName}</div>
                        <div class="st-account-username">@${a.username}</div>
                    </div>
                    <div class="st-account-actions">
                        <form action="/settings/switch" method="POST" style="margin:0;">
                            <input type="hidden" name="username" value="${a.username}">
                            <button type="submit" class="st-account-switch">Switch</button>
                        </form>
                        <form action="/settings/remove-account" method="POST" style="margin:0;">
                            <input type="hidden" name="username" value="${a.username}">
                            <button type="submit" class="st-account-remove" title="Remove" aria-label="Remove">
                                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
                            </button>
                        </form>
                    </div>
                </div>
            `;
        }
    }

    const canAddMore = accountsData.length < 2;

    // Blocked users
    const myBlocks = await Block.find({ blocker: req.session.user });
    const blockedData = [];
    for (const b of myBlocks) {
        const u = await User.findOne({ username: b.blocked });
        if (!u) continue;
        const dn = u.full_name || u.username;
        blockedData.push({
            username: b.blocked,
            displayName: dn,
            initial: dn.charAt(0).toUpperCase(),
            avatar: u.avatar || ''
        });
    }

    let blockedHtml = '';
    if (blockedData.length === 0) {
        blockedHtml = '<div class="st-empty">You have not blocked anyone.</div>';
    } else {
        for (const b of blockedData) {
            const avatarInner = b.avatar ? `<img src="${b.avatar}" alt="">` : b.initial;
            blockedHtml += `
                <div class="st-blocked-item">
                    <div class="st-account-avatar">${avatarInner}</div>
                    <div class="st-account-info">
                        <div class="st-account-name">${b.displayName}</div>
                        <div class="st-account-username">@${b.username}</div>
                    </div>
                    <form action="/settings/unblock" method="POST" style="margin:0;">
                        <input type="hidden" name="username" value="${b.username}">
                        <button type="submit" class="st-unblock-btn">Unblock</button>
                    </form>
                </div>
            `;
        }
    }

    res.send(`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
        <title>Settings - EliGet</title>
        </head><body class="st-body">
        ${showToast ? `<div class="toast">${icons.check} Saved successfully!</div>` : ''}
        <div class="st-wrap">

            <header class="st-topbar">
                <a href="/profile" class="st-back" title="Back">
                    <svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
                </a>
                <span class="st-title">Settings</span>
                <span class="st-spacer"></span>
            </header>

            <section class="st-section">
                <h2 class="st-section-label">Accounts</h2>
                <div class="st-card st-accounts-card">
                    ${accountsHtml}
                    ${canAddMore ? `
                        <a href="/auth/login?add=1" class="st-add-account">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                            Add another account
                        </a>
                    ` : `
                        <div class="st-accounts-note">You can have up to 2 accounts.</div>
                    `}
                </div>
            </section>

            <section class="st-section">
                <h2 class="st-section-label">Account</h2>
                <div class="st-card">
                    <button type="button" class="st-action-row" onclick="openModal('stLogoutModal')">
                        <div class="st-row-icon">
                            <svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                        </div>
                        <div class="st-row-content">
                            <div class="st-row-title">Log out</div>
                            <div class="st-row-desc">Sign out of all accounts</div>
                        </div>
                        <svg class="st-chev" viewBox="0 0 24 24" width="18" height="18"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" fill="currentColor"/></svg>
                    </button>
                </div>
            </section>

            <section class="st-section">
                <h2 class="st-section-label">Blocked users</h2>
                <div class="st-card">
                    ${blockedHtml}
                </div>
            </section>

            <section class="st-section">
                <h2 class="st-section-label">Appearance</h2>
                <div class="st-card">
                    <div class="st-row st-row-toggle" onclick="eligetToggleTheme()">
                        <div class="st-row-icon">
                            <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" fill="currentColor"/></svg>
                        </div>
                        <div class="st-row-content">
                            <div class="st-row-title">Dark mode</div>
                            <div class="st-row-desc" id="themeStatusText">Switch between light and dark</div>
                        </div>
                        <div class="st-toggle" id="themeToggle">
                            <div class="st-toggle-knob"></div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="st-section st-danger-section">
                <h2 class="st-section-label st-danger-label">Danger zone</h2>
                <div class="st-card st-danger-card">
                    <div class="st-row">
                        <div class="st-row-content">
                            <div class="st-row-title st-danger-title">Delete account</div>
                            <div class="st-row-desc">Permanently delete @${req.session.user}, its posts, and all data. This cannot be undone.</div>
                        </div>
                    </div>
                    <button type="button" class="st-danger-btn" onclick="openModal('stDeleteModal')">Delete @${req.session.user}</button>
                </div>
            </section>

            <div class="st-footer">
                <span class="st-footer-brand">EliGet<span class="st-footer-dot"></span></span>
                <span class="st-footer-version">Text-only network</span>
            </div>

        </div>

        <div class="modal-overlay" id="stLogoutModal">
            <div class="modal-box">
                <h3 class="modal-title">Log out?</h3>
                <p class="modal-desc">You'll be signed out of all ${accountsData.length} account(s).</p>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal('stLogoutModal')">Cancel</button>
                    <a href="/auth/logout" class="btn-primary">Log out</a>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="stDeleteModal">
            <div class="modal-box">
                <h3 class="modal-title modal-title-danger">Delete account?</h3>
                <p class="modal-desc">This will permanently delete <strong>@${req.session.user}</strong> and all data. Type <strong>Delete me</strong> below to confirm.</p>
                <input type="text" id="stDeleteInput" placeholder="Delete me" oninput="stCheckDelete()" autocomplete="off">
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal('stDeleteModal')">Cancel</button>
                    <form action="/settings/delete" method="POST" style="flex:1;margin:0;">
                        <button type="submit" id="stConfirmDelete" class="btn-primary btn-danger" style="width:100%;" disabled>Delete</button>
                    </form>
                </div>
            </div>
        </div>

        <script>
            function openModal(id) {
                document.getElementById(id).classList.add('active');
                if (id === 'stDeleteModal') {
                    var inp = document.getElementById('stDeleteInput');
                    inp.value = '';
                    document.getElementById('stConfirmDelete').disabled = true;
                    setTimeout(function() { inp.focus(); }, 100);
                }
            }
            function closeModal(id) {
                document.getElementById(id).classList.remove('active');
            }
            function stCheckDelete() {
                var v = document.getElementById('stDeleteInput').value;
                document.getElementById('stConfirmDelete').disabled = (v.toLowerCase() !== 'delete me');
            }
            document.querySelectorAll('.modal-overlay').forEach(function(el) {
                el.addEventListener('click', function(e) {
                    if (e.target === el) el.classList.remove('active');
                });
            });
        </script>
        </body></html>
    `);
});

// ===== SWITCH ACCOUNT =====
app.post('/settings/switch', isAuthenticated, async (req, res) => {
    const target = req.body.username;
    if (!target || !req.session.accounts || !req.session.accounts.includes(target)) {
        return res.redirect('/settings?status=invalid');
    }
    req.session.user = target;
    res.redirect('/');
});

// ===== REMOVE ACCOUNT FROM SESSION =====
app.post('/settings/remove-account', isAuthenticated, async (req, res) => {
    const target = req.body.username;
    if (!target || target === req.session.user) {
        return res.redirect('/settings?status=invalid');
    }
    if (req.session.accounts) {
        req.session.accounts = req.session.accounts.filter(u => u !== target);
    }
    res.redirect('/settings?status=removed');
});

app.post('/settings/update-name', isAuthenticated, async (req, res) => {
    await User.updateOne({ username: req.session.user }, { full_name: req.body.full_name });
    const back = req.body.redirect === '/profile' ? '/profile' : '/settings?status=saved';
    res.redirect(back);
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

// ===== FOLLOW TOGGLE =====
app.post('/follow/:username', isAuthenticated, async (req, res) => {
    try {
        const me = req.session.user;
        const target = req.params.username;
        if (target === me) return res.json({ ok: false, reason: 'self' });

        const targetUser = await User.findOne({ username: target });
        if (!targetUser) return res.json({ ok: false, reason: 'notfound' });

        const existing = await Follow.findOne({ follower: me, following: target });
        let following;
        if (existing) {
            await Follow.deleteOne({ _id: existing._id });
            following = false;
            // Remove associated notification
            await Notification.deleteMany({ recipient: target, actor: me, type: 'follow' });
        } else {
            await Follow.create({ follower: me, following: target });
            following = true;
            // Create notification
            await Notification.create({
                recipient: target,
                actor: me,
                type: 'follow',
                ref_id: ''
            });

            // Check for mutual follow → send system message (only if no prior chat)
            const reverseFollow = await Follow.findOne({ follower: target, following: me });
            if (reverseFollow) {
                const Message = require('./models/Message');
                const users = [me.toLowerCase(), target.toLowerCase()].sort();
                const chatId = users[0] + '_' + users[1];
                const anyExisting = await Message.findOne({ chat_id: chatId });
                if (!anyExisting) {
                    await Message.create({
                        chat_id: chatId,
                        from: 'system',
                        body: 'You are now friends. Say hi!',
                        read: false
                    });
                }
            }
        }
        const count = await Follow.countDocuments({ following: target });
        res.json({ ok: true, following: following, count: count });
    } catch (err) {
        console.error('Follow error:', err);
        res.json({ ok: false });
    }
});

// ===== FOLLOWING FEED =====
app.get('/following', isAuthenticated, async (req, res) => {
    try {
        const me = req.session.user;
        const follows = await Follow.find({ follower: me }).select('following');
        const followingUsernames = follows.map(f => f.following);

        if (followingUsernames.length === 0) {
            let html = '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>Following - EliGet</title></head><body>';
            html += '<div class="container">';
            html += '<header class="feed-header"><a href="/" class="header-icon" title="Back">' + icons.back + '</a><h1 class="feed-title">Following</h1></header>';
            html += '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg><h3>No one followed yet</h3><p>Find people to follow and their posts will appear here.</p><a href="/feed">Browse public feed</a></div>';
            html += '</div>';
            html += '<div class="bottom-nav"><a href="/" >' + icons.home + '<span>Home</span></a><a href="/post/create">' + icons.plus + '<span>Post</span></a><a href="/chat">' + icons.chat + '<span>Chat</span></a><a href="/profile">' + icons.profile + '<span>Profile</span></a></div>';
            html += '</body></html>';
            return res.send(html);
        }

        const { iBlocked: fIBlocked, blockedMe: fBlockedMe } = await getBlockSets(me);
        const visibleAuthors = followingUsernames.filter(u => !fIBlocked.has(u) && !fBlockedMe.has(u));
        const posts = await Post.find({ author: { $in: visibleAuthors } }).sort({ created_at: -1 }).limit(50);

        let html = '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>Following - EliGet</title></head><body>';
        html += '<div class="container">';
        html += '<header class="feed-header"><a href="/" class="header-icon" title="Back">' + icons.back + '</a><h1 class="feed-title">Following</h1></header>';
        if (posts.length === 0) {
            html += '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h7v2H7z"/></svg><h3>No posts yet</h3><p>The people you follow have not posted anything.</p></div>';
        } else {
            const followingFollowSet = await getFollowSet(me);
            for (const p of posts) {
                html += await renderPostCard(p, me, followingFollowSet);
            }
        }
        html += '</div>';
        html += '<div class="bottom-nav"><a href="/" >' + icons.home + '<span>Home</span></a><a href="/post/create">' + icons.plus + '<span>Post</span></a><a href="/chat">' + icons.chat + '<span>Chat</span></a><a href="/profile">' + icons.profile + '<span>Profile</span></a></div>';
        html += '</body></html>';
        res.send(html);
    } catch (err) {
        console.error('Following feed error:', err);
        res.redirect('/');
    }
});

// ===== BLOCK / UNBLOCK TOGGLE =====
app.post('/block/:username', isAuthenticated, async (req, res) => {
    try {
        const me = req.session.user;
        const target = req.params.username;
        if (target === me) return res.json({ ok: false, reason: 'self' });

        const targetUser = await User.findOne({ username: target });
        if (!targetUser) return res.json({ ok: false, reason: 'notfound' });

        const existing = await Block.findOne({ blocker: me, blocked: target });
        let blocked;
        if (existing) {
            await Block.deleteOne({ _id: existing._id });
            blocked = false;
        } else {
            await Block.create({ blocker: me, blocked: target });
            // Also unfollow each other
            await Follow.deleteMany({
                $or: [
                    { follower: me, following: target },
                    { follower: target, following: me }
                ]
            });
            // Cancel friend requests
            const FriendRequestModel = require('./models/FriendRequest');
            await FriendRequestModel.deleteMany({
                $or: [
                    { from: me, to: target },
                    { from: target, to: me }
                ]
            });
            blocked = true;
        }
        res.json({ ok: true, blocked: blocked });
    } catch (err) {
        console.error('Block error:', err);
        res.json({ ok: false });
    }
});

// ===== UNBLOCK FROM SETTINGS =====
app.post('/settings/unblock', isAuthenticated, async (req, res) => {
    const target = req.body.username;
    if (!target) return res.redirect('/settings');
    await Block.deleteOne({ blocker: req.session.user, blocked: target });
    res.redirect('/settings');
});

// ===== GLOBAL SEARCH =====
app.get('/search', isAuthenticated, async (req, res) => {
    try {
        const me = req.session.user;
        const q = (req.query.q || '').trim();
        const type = req.query.type || 'all';

        const escapeHtml = (s) => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        const timeAgo = (date) => {
            const diff = Date.now() - new Date(date).getTime();
            const m = Math.floor(diff / 60000);
            if (m < 1) return 'just now';
            if (m < 60) return m + 'm';
            const h = Math.floor(m / 60);
            if (h < 24) return h + 'h';
            const d = Math.floor(h / 24);
            if (d < 7) return d + 'd';
            return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        };

        let usersHtml = '';
        let postsHtml = '';
        let studentsHtml = '';
        let userCount = 0;
        let postCount = 0;
        let studentCount = 0;

        if (q) {
            // Get block sets
            const myBlocks = await Block.find({ blocker: me }).select('blocked');
            const theirBlocks = await Block.find({ blocked: me }).select('blocker');
            const blockedSet = new Set([
                ...myBlocks.map(b => b.blocked),
                ...theirBlocks.map(b => b.blocker)
            ]);

            // ===== USERS =====
            if (type === 'all' || type === 'users') {
                const users = await User.find({
                    username: { $ne: me },
                    $or: [
                        { username: { $regex: q, $options: 'i' } },
                        { full_name: { $regex: q, $options: 'i' } }
                    ]
                }).limit(15);

                for (const u of users) {
                    if (blockedSet.has(u.username)) continue;
                    userCount++;
                    const dn = u.full_name || u.username;
                    const initial = dn.charAt(0).toUpperCase();
                    const av = u.avatar ? `<img src="${u.avatar}" alt="">` : initial;
                    usersHtml += `
                        <a href="/profile/${u.username}" class="gs-item">
                            <div class="gs-avatar">${av}</div>
                            <div class="gs-info">
                                <div class="gs-name">${escapeHtml(dn)}</div>
                                <div class="gs-sub">@${escapeHtml(u.username)}</div>
                            </div>
                            <svg class="gs-chev" viewBox="0 0 24 24" width="18" height="18"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" fill="currentColor"/></svg>
                        </a>
                    `;
                }
            }

            // ===== POSTS =====
            if (type === 'all' || type === 'posts') {
                const posts = await Post.find({
                    body: { $regex: q, $options: 'i' }
                }).sort({ created_at: -1 }).limit(15);

                const followSet = await getFollowSet(me);
                for (const p of posts) {
                    if (blockedSet.has(p.author)) continue;
                    postCount++;
                    postsHtml += await renderPostCard(p, me, followSet);
                }
            }

            // ===== STUDENTS =====
            if (type === 'all' || type === 'students') {
                const sPosts = await StudentPost.find({
                    $or: [
                        { title: { $regex: q, $options: 'i' } },
                        { body: { $regex: q, $options: 'i' } }
                    ]
                }).sort({ created_at: -1 }).limit(15);

                const svgLib = require('./lib/svg-library');
                const TYPE_LABELS = {
                    question:'Question', blog:'Blog', notes:'Notes',
                    essay:'Essay', mcq:'MCQ', poll:'Poll'
                };
                for (const p of sPosts) {
                    if (blockedSet.has(p.author)) continue;
                    studentCount++;
                    const author = await User.findOne({ username: p.author });
                    const dn = author ? (author.full_name || author.username) : p.author;
                    const initial = dn.charAt(0).toUpperCase();
                    const av = author && author.avatar ? `<img src="${author.avatar}" alt="">` : initial;
                    const preview = p.body ? (p.body.length > 140 ? p.body.slice(0, 140) + '…' : p.body) : '';
                    studentsHtml += `
                        <a href="/students/${p._id}" class="sp-card">
                            <div class="sp-card-head">
                                <div class="sp-avatar">${av}</div>
                                <div class="sp-author-info">
                                    <div class="sp-author-name">${escapeHtml(dn)}</div>
                                    <div class="sp-card-meta"><span>${timeAgo(p.created_at)}</span></div>
                                </div>
                                <span class="sp-type-badge sp-type-${p.type}">${TYPE_LABELS[p.type] || p.type}</span>
                            </div>
                            ${p.title ? `<h3 class="sp-card-title">${escapeHtml(p.title)}</h3>` : ''}
                            ${(p.svgs && p.svgs.length && svgLib.images[p.svgs[0]]) ? `<div class="sp-card-svg">${svgLib.images[p.svgs[0]]}</div>` : ''}
                            ${preview ? `<p class="sp-card-preview">${escapeHtml(preview)}</p>` : ''}
                            <div class="sp-card-footer">
                                <span class="sp-subject-chip">${escapeHtml(p.subject)}</span>
                            </div>
                        </a>
                    `;
                }
            }
        }

        const totalResults = userCount + postCount + studentCount;

        let bodyContent = '';
        if (!q) {
            bodyContent = `<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <h3>Search EliGet</h3>
                <p>Find people, posts, or student writings.</p>
            </div>`;
        } else if (totalResults === 0) {
            bodyContent = `<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <h3>No results</h3>
                <p>Nothing found for "${escapeHtml(q)}". Try a different word.</p>
            </div>`;
        } else {
            if (usersHtml) {
                bodyContent += `<h2 class="gs-section-label">People · ${userCount}</h2><div class="gs-list">${usersHtml}</div>`;
            }
            if (studentsHtml) {
                bodyContent += `<h2 class="gs-section-label">Students · ${studentCount}</h2><div class="sp-feed">${studentsHtml}</div>`;
            }
            if (postsHtml) {
                bodyContent += `<h2 class="gs-section-label">Posts · ${postCount}</h2><div class="feed-list">${postsHtml}</div>`;
            }
        }

        const filterChips = [
            { k: 'all', l: 'All' },
            { k: 'users', l: 'People' },
            { k: 'posts', l: 'Posts' },
            { k: 'students', l: 'Students' }
        ];
        let chipsHtml = '';
        for (const f of filterChips) {
            const url = `/search?q=${encodeURIComponent(q)}&type=${f.k}`;
            chipsHtml += `<a href="${url}" class="sp-chip ${type === f.k ? 'active' : ''}">${f.l}</a>`;
        }

        res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
            <title>Search - EliGet</title>
            </head><body>
            <div class="container">
                <header class="feed-header">
                    <a href="/" class="header-icon" title="Back">${icons.back}</a>
                    <h1 class="feed-title" style="margin-left:10px;">Search</h1>
                </header>

                <form action="/search" method="GET" class="sp-search-form">
                    <input type="text" name="q" value="${escapeHtml(q)}" placeholder="Search people, posts, students..." class="sp-search-input" autofocus autocomplete="off">
                    ${type !== 'all' ? `<input type="hidden" name="type" value="${escapeHtml(type)}">` : ''}
                </form>

                ${q ? `<div class="sp-chips">${chipsHtml}</div>` : ''}

                ${bodyContent}
            </div>
            <div class="bottom-nav"><a href="/" class="active">${icons.home}<span>Home</span></a><a href="/students">${icons.students}<span>Students</span></a><a href="/post/create">${icons.plus}<span>Post</span></a><a href="/chat">${icons.chat}<span>Chat</span></a><a href="/profile">${icons.profile}<span>Profile</span></a></div>
            ${getDeleteModal()}
            </body></html>
        `);
    } catch (err) {
        console.error('Search error:', err);
        res.redirect('/');
    }
});

// ===== NOTIFICATION SEEN (mark all as seen) =====
app.post('/notifications/seen', isAuthenticated, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.session.user, seen: false },
            { $set: { seen: true } }
        );
        res.json({ ok: true });
    } catch (err) {
        console.error('Mark seen error:', err);
        res.json({ ok: false });
    }
});

// ===== REPORT SUBMIT =====
app.post('/report', isAuthenticated, async (req, res) => {
    try {
        const me = req.session.user;
        const { target_type, target_id, reason, note } = req.body;

        const validTypes = ['post', 'student_post', 'user', 'chat_message', 'group_message'];
        const validReasons = ['spam', 'harassment', 'hate', 'misinformation', 'other'];

        if (!validTypes.includes(target_type) || !validReasons.includes(reason) || !target_id) {
            return res.json({ ok: false, reason: 'invalid' });
        }

        // Prevent duplicate reports
        const existing = await Report.findOne({ reporter: me, target_type: target_type, target_id: target_id });
        if (existing) {
            return res.json({ ok: true, duplicate: true });
        }

        // Fetch target owner
        let target_owner = '';
        try {
            if (target_type === 'post') {
                const p = await Post.findById(target_id);
                if (p) target_owner = p.author;
            } else if (target_type === 'student_post') {
                const StudentPost = require('./models/StudentPost');
                const sp = await StudentPost.findById(target_id);
                if (sp) target_owner = sp.author;
            } else if (target_type === 'user') {
                target_owner = target_id;
            }
        } catch (e) {}

        await Report.create({
            reporter: me,
            target_type: target_type,
            target_id: target_id,
            target_owner: target_owner,
            reason: reason,
            note: String(note || '').slice(0, 500)
        });

        res.json({ ok: true });
    } catch (err) {
        console.error('Report error:', err);
        res.json({ ok: false });
    }
});

// ===== 404 HANDLER =====
app.use((req, res) => {
    const errorPage = require('./errorPage');
    res.status(404).send(errorPage(
        404,
        'Page not found',
        'The page you are looking for does not exist or has been moved.',
        '/',
        'Back to home'
    ));
});

// ===== 500 ERROR HANDLER =====
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    const errorPage = require('./errorPage');
    res.status(500).send(errorPage(
        500,
        'Something went wrong',
        'An unexpected error occurred. Please try again.',
        '/',
        'Back to home'
    ));
});

// ===== START SERVER =====
connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => { console.log('EliGet সার্ভার চালু হয়েছে: http://localhost:' + PORT);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down...');
    process.exit(0);
}); });
});

// ===== SPLASH SCREEN =====
app.get('/splash', (req, res) => {
    res.send(`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <title>EliGet</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(180deg, #f5f7fa 0%, #ebf8ff 100%); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            .splash { text-align: center; animation: fadeIn 0.6s ease-out; }
            .logo { width: 120px; height: 120px; border-radius: 26px; background: linear-gradient(135deg, #3182ce, #1e3a8a); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; position: relative; box-shadow: 0 12px 32px rgba(49,130,206,0.3); }
            .logo-text { color: white; font-size: 48px; font-weight: 900; letter-spacing: -2px; }
            .dots { position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; }
            .dot { width: 5px; height: 5px; border-radius: 50%; background: white; }
            .dot:nth-child(1) { opacity: 0.5; }
            .dot:nth-child(2) { opacity: 0.75; }
            .dot:nth-child(3) { opacity: 1; }
            h1 { font-size: 32px; font-weight: 700; color: #1a202c; margin-bottom: 8px; letter-spacing: 1px; }
            p { font-size: 15px; color: #718096; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        </style>
        </head><body>
        <div class="splash">
            <div class="logo">
                <span class="logo-text">EG</span>
                <div class="dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
            <h1>EliGet</h1>
            <p>Text-only, anti-addiction network</p>
        </div>
        <script>
            setTimeout(() => { window.location.href = '/'; }, 1500);
        </script>
        </body></html>
    `);
});
