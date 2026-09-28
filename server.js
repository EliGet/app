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
const wapRoutes = require('./routes/wap');
const { badges: badgeLibrary } = require('./public/badges.js');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'eliget-secret-key-123',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
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
const postImagesMap = {
    none: null,

    // 1. MOUNTAINS - Blue sky, sun, peaks
    mountain: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="mSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bfdbfe"/><stop offset="100%" stop-color="#fef3c7"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#mSky)"/>
        <circle cx="72" cy="22" r="9" fill="#fbbf24"/><circle cx="72" cy="22" r="5.5" fill="#fde68a"/>
        <path d="M0 68 L20 38 L38 65 L58 40 L78 70 L100 48 L100 100 L0 100 Z" fill="#64748b"/>
        <path d="M0 78 L22 55 L42 78 L62 58 L82 82 L100 68 L100 100 L0 100 Z" fill="#334155"/>
        <polygon points="20,38 25,48 15,48" fill="#f1f5f9"/>
        <polygon points="58,40 63,50 53,50" fill="#f1f5f9"/>
      </svg>`,

    // 2. SUNRISE - Sun rising, orange gradient
    sunrise: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="srSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fbbf24"/><stop offset="60%" stop-color="#f97316"/><stop offset="100%" stop-color="#dc2626"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#srSky)"/>
        <circle cx="50" cy="62" r="18" fill="#fef3c7" opacity="0.5"/>
        <circle cx="50" cy="62" r="13" fill="#fef3c7"/>
        <rect y="70" width="100" height="30" fill="#7c2d12" opacity="0.4"/>
        <line x1="50" y1="42" x2="50" y2="35" stroke="#fef3c7" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
        <line x1="68" y1="45" x2="73" y2="39" stroke="#fef3c7" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
        <line x1="32" y1="45" x2="27" y2="39" stroke="#fef3c7" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
      </svg>`,

    // 3. MOON & STARS - Night sky
    moon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="moSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0c1445"/><stop offset="100%" stop-color="#3730a3"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#moSky)"/>
        <circle cx="60" cy="42" r="18" fill="#fef3c7"/>
        <circle cx="70" cy="35" r="16" fill="#0c1445"/>
        <circle cx="20" cy="18" r="1" fill="#fef3c7"/>
        <circle cx="38" cy="10" r="0.7" fill="#fef3c7" opacity="0.8"/>
        <circle cx="82" cy="20" r="1.2" fill="#fef3c7"/>
        <circle cx="15" cy="55" r="0.8" fill="#fef3c7" opacity="0.7"/>
        <circle cx="88" cy="60" r="0.9" fill="#fef3c7" opacity="0.8"/>
        <circle cx="48" cy="72" r="0.7" fill="#fef3c7" opacity="0.6"/>
        <circle cx="25" cy="80" r="0.6" fill="#fef3c7" opacity="0.5"/>
        <circle cx="75" cy="82" r="0.8" fill="#fef3c7" opacity="0.6"/>
      </svg>`,

    // 4. CLOUD - Soft clouds in sky
    cloud: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="clSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#bfdbfe"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#clSky)"/>
        <ellipse cx="35" cy="42" rx="22" ry="14" fill="#fff" opacity="0.95"/>
        <ellipse cx="22" cy="45" rx="14" ry="10" fill="#fff" opacity="0.95"/>
        <ellipse cx="50" cy="46" rx="14" ry="10" fill="#fff" opacity="0.95"/>
        <ellipse cx="72" cy="60" rx="18" ry="11" fill="#fff" opacity="0.85"/>
        <ellipse cx="82" cy="62" rx="10" ry="7" fill="#fff" opacity="0.85"/>
        <ellipse cx="62" cy="62" rx="10" ry="7" fill="#fff" opacity="0.85"/>
      </svg>`,

    // 5. TREE - Single pine tree, sunset
    tree: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="trSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fb923c"/><stop offset="100%" stop-color="#fde68a"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#trSky)"/>
        <circle cx="75" cy="28" r="10" fill="#fef3c7" opacity="0.8"/>
        <rect y="82" width="100" height="18" fill="#166534" opacity="0.7"/>
        <rect x="48" y="72" width="4" height="14" fill="#451a03"/>
        <polygon points="50,22 30,55 70,55" fill="#15803d"/>
        <polygon points="50,38 32,68 68,68" fill="#166534"/>
        <polygon points="50,52 34,80 66,80" fill="#14532d"/>
      </svg>`,

    // 6. WAVES - Ocean waves
    waves: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="wvSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fde68a"/><stop offset="50%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#0284c7"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#wvSky)"/>
        <circle cx="50" cy="35" r="12" fill="#fef3c7" opacity="0.6"/>
        <path d="M0 55 Q25 45 50 55 Q75 65 100 55 L100 100 L0 100 Z" fill="#0891b2" opacity="0.9"/>
        <path d="M0 68 Q25 58 50 68 Q75 78 100 68 L100 100 L0 100 Z" fill="#0369a1"/>
        <path d="M0 82 Q25 72 50 82 Q75 92 100 82 L100 100 L0 100 Z" fill="#075985"/>
      </svg>`,

    // 7. STAR - Single bright star, night sky
    star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="stSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#stSky)"/>
        <circle cx="50" cy="50" r="20" fill="#fef3c7" opacity="0.15"/>
        <path d="M50 22 L56 42 L78 42 L60 55 L67 77 L50 64 L33 77 L40 55 L22 42 L44 42 Z" fill="#fef3c7"/>
        <circle cx="20" cy="20" r="1" fill="#fef3c7" opacity="0.7"/>
        <circle cx="82" cy="25" r="0.8" fill="#fef3c7" opacity="0.6"/>
        <circle cx="15" cy="75" r="0.9" fill="#fef3c7" opacity="0.7"/>
        <circle cx="85" cy="80" r="1" fill="#fef3c7" opacity="0.6"/>
      </svg>`,

    // 8. RAINBOW - Full rainbow
    rainbow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="rbSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#dbeafe"/><stop offset="100%" stop-color="#fef3c7"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#rbSky)"/>
        <path d="M10 82 A40 40 0 0 1 90 82" fill="none" stroke="#dc2626" stroke-width="5"/>
        <path d="M15 82 A35 35 0 0 1 85 82" fill="none" stroke="#ea580c" stroke-width="5"/>
        <path d="M20 82 A30 30 0 0 1 80 82" fill="none" stroke="#facc15" stroke-width="5"/>
        <path d="M25 82 A25 25 0 0 1 75 82" fill="none" stroke="#16a34a" stroke-width="5"/>
        <path d="M30 82 A20 20 0 0 1 70 82" fill="none" stroke="#0284c7" stroke-width="5"/>
        <path d="M35 82 A15 15 0 0 1 65 82" fill="none" stroke="#7c3aed" stroke-width="5"/>
        <ellipse cx="15" cy="88" rx="12" ry="4" fill="#fff" opacity="0.9"/>
        <ellipse cx="85" cy="88" rx="12" ry="4" fill="#fff" opacity="0.9"/>
      </svg>`,

    // 9. SNOWFLAKE - Six-armed snowflake
    snowflake: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="snSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e3a8a"/><stop offset="100%" stop-color="#60a5fa"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#snSky)"/>
        <circle cx="50" cy="50" r="35" fill="#fff" opacity="0.1"/>
        <g stroke="#f0f9ff" stroke-width="2.5" stroke-linecap="round" fill="none" transform="translate(50,50)">
            <line x1="0" y1="-30" x2="0" y2="30"/>
            <line x1="-26" y1="-15" x2="26" y2="15"/>
            <line x1="-26" y1="15" x2="26" y2="-15"/>
            <path d="M0 -30 L-7 -22 M0 -30 L7 -22"/>
            <path d="M0 30 L-7 22 M0 30 L7 22"/>
            <path d="M-26 -15 L-15 -20 M-26 -15 L-20 -6"/>
            <path d="M26 15 L15 20 M26 15 L20 6"/>
            <path d="M-26 15 L-20 6 M-26 15 L-15 20"/>
            <path d="M26 -15 L20 -6 M26 -15 L15 -20"/>
        </g>
        <circle cx="50" cy="50" r="4" fill="#f0f9ff"/>
      </svg>`,

    // 10. FLAME - Fire flame
    flame: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="flSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1c1917"/><stop offset="100%" stop-color="#7c2d12"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#flSky)"/>
        <path d="M50 15 Q38 35 42 50 Q36 48 34 42 Q28 55 36 72 Q42 82 50 82 Q58 82 64 72 Q72 55 66 42 Q64 48 58 50 Q62 35 50 15 Z" fill="#ea580c"/>
        <path d="M50 32 Q44 45 46 55 Q42 54 41 50 Q38 60 44 70 Q48 76 50 76 Q52 76 56 70 Q62 60 59 50 Q58 54 54 55 Q56 45 50 32 Z" fill="#fbbf24"/>
        <path d="M50 48 Q47 56 48 62 Q46 61 46 58 Q44 65 48 71 Q49 73 50 73 Q51 73 52 71 Q56 65 54 58 Q54 61 52 62 Q53 56 50 48 Z" fill="#fef3c7"/>
      </svg>`,

    // 11. COFFEE - Cup with steam
    coffee: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="cfSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fde68a"/><stop offset="100%" stop-color="#b45309"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#cfSky)"/>
        <rect y="80" width="100" height="20" fill="#451a03" opacity="0.5"/>
        <ellipse cx="50" cy="78" rx="32" ry="4" fill="#fff" opacity="0.9"/>
        <path d="M26 52 L30 76 Q50 80 70 76 L74 52 Z" fill="#fff" stroke="#78350f" stroke-width="1.5"/>
        <ellipse cx="50" cy="52" rx="24" ry="5" fill="#fff" stroke="#78350f" stroke-width="1.5"/>
        <ellipse cx="50" cy="52" rx="20" ry="4" fill="#78350f"/>
        <ellipse cx="50" cy="51" rx="16" ry="3" fill="#451a03"/>
        <path d="M74 58 Q86 58 88 66 Q88 74 76 74" stroke="#78350f" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M40 42 Q38 34 42 28 Q44 23 42 16" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.85"/>
        <path d="M50 38 Q48 30 52 24 Q54 18 52 12" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.95"/>
        <path d="M60 42 Q58 34 62 28 Q64 23 62 16" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.85"/>
      </svg>`,

    // 12. BOOK - Open book
    book: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="bkSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fcd34d"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#bkSky)"/>
        <circle cx="50" cy="50" r="30" fill="#fff" opacity="0.4"/>
        <path d="M50 32 Q36 24 18 28 L18 76 Q36 72 50 80 Z" fill="#fff" stroke="#78350f" stroke-width="1.5"/>
        <path d="M50 32 Q64 24 82 28 L82 76 Q64 72 50 80 Z" fill="#fff" stroke="#78350f" stroke-width="1.5"/>
        <line x1="50" y1="32" x2="50" y2="80" stroke="#78350f" stroke-width="1.5"/>
        <line x1="26" y1="40" x2="44" y2="38" stroke="#94a3b8" stroke-width="1"/>
        <line x1="26" y1="46" x2="44" y2="44" stroke="#94a3b8" stroke-width="1"/>
        <line x1="26" y1="52" x2="44" y2="50" stroke="#94a3b8" stroke-width="1"/>
        <line x1="26" y1="58" x2="44" y2="56" stroke="#94a3b8" stroke-width="1"/>
        <line x1="26" y1="64" x2="44" y2="62" stroke="#94a3b8" stroke-width="1"/>
        <line x1="26" y1="70" x2="44" y2="68" stroke="#94a3b8" stroke-width="1"/>
        <line x1="56" y1="38" x2="74" y2="40" stroke="#94a3b8" stroke-width="1"/>
        <line x1="56" y1="44" x2="74" y2="46" stroke="#94a3b8" stroke-width="1"/>
        <line x1="56" y1="50" x2="74" y2="52" stroke="#94a3b8" stroke-width="1"/>
        <line x1="56" y1="56" x2="74" y2="58" stroke="#94a3b8" stroke-width="1"/>
        <line x1="56" y1="62" x2="74" y2="64" stroke="#94a3b8" stroke-width="1"/>
        <line x1="56" y1="68" x2="74" y2="70" stroke="#94a3b8" stroke-width="1"/>
      </svg>`,

    // 13. HEADPHONES - Music
    music: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="hpSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#581c87"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#hpSky)"/>
        <circle cx="50" cy="50" r="32" fill="#c4b5fd" opacity="0.15"/>
        <path d="M22 55 Q22 22 50 22 Q78 22 78 55" stroke="#c4b5fd" stroke-width="5" fill="none" stroke-linecap="round"/>
        <rect x="14" y="52" width="16" height="30" rx="8" fill="#8b5cf6" stroke="#e9d5ff" stroke-width="1.5"/>
        <rect x="70" y="52" width="16" height="30" rx="8" fill="#8b5cf6" stroke="#e9d5ff" stroke-width="1.5"/>
        <circle cx="22" cy="67" r="4" fill="#e9d5ff"/>
        <circle cx="78" cy="67" r="4" fill="#e9d5ff"/>
      </svg>`,

    // 14. AIRPLANE - Travel
    travel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="trSky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6"/><stop offset="60%" stop-color="#93c5fd"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#trSky2)"/>
        <circle cx="78" cy="25" r="10" fill="#fef3c7" opacity="0.9"/>
        <ellipse cx="18" cy="20" rx="11" ry="4" fill="#fff" opacity="0.8"/>
        <ellipse cx="22" cy="18" rx="8" ry="3" fill="#fff" opacity="0.95"/>
        <path d="M0 82 L20 60 L40 82 L60 62 L80 82 L100 68 L100 100 L0 100 Z" fill="#334155"/>
        <g transform="translate(52, 42) rotate(-15)">
            <path d="M-18 0 L10 -6 L16 0 L10 6 Z" fill="#fff" stroke="#0284c7" stroke-width="1"/>
            <path d="M0 -1 L2 -14 L5 -1 Z" fill="#0284c7"/>
            <path d="M0 1 L2 14 L5 1 Z" fill="#0284c7"/>
            <line x1="-18" y1="0" x2="-30" y2="0" stroke="#fff" stroke-width="1" stroke-dasharray="2 2" opacity="0.7"/>
        </g>
      </svg>`,

    // 15. LEAF - Single leaf, green
    leaf: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="lfSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#dcfce7"/><stop offset="100%" stop-color="#86efac"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#lfSky)"/>
        <circle cx="50" cy="50" r="32" fill="#fff" opacity="0.3"/>
        <path d="M50 82 Q22 65 22 42 Q22 24 50 18 Q78 24 78 42 Q78 65 50 82 Z" fill="#15803d"/>
        <path d="M50 82 Q50 60 50 30" stroke="#14532d" stroke-width="1.5" fill="none"/>
        <path d="M50 55 Q38 52 32 42" stroke="#14532d" stroke-width="1" fill="none"/>
        <path d="M50 55 Q62 52 68 42" stroke="#14532d" stroke-width="1" fill="none"/>
        <path d="M50 68 Q40 65 34 58" stroke="#14532d" stroke-width="1" fill="none"/>
        <path d="M50 68 Q60 65 66 58" stroke="#14532d" stroke-width="1" fill="none"/>
      </svg>`,

    // 16. HEART - Single heart, pink
    heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="hrSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fce7f3"/><stop offset="100%" stop-color="#f9a8d4"/></linearGradient></defs>
        <rect width="100" height="100" fill="url(#hrSky)"/>
        <path d="M50 82 C20 62 18 42 30 32 C40 24 48 30 50 36 C52 30 60 24 70 32 C82 42 80 62 50 82 Z" fill="#ec4899"/>
        <ellipse cx="38" cy="42" rx="5" ry="3" fill="#fff" opacity="0.5"/>
        <circle cx="80" cy="22" r="1" fill="#ec4899" opacity="0.5"/>
        <circle cx="18" cy="30" r="1.2" fill="#ec4899" opacity="0.4"/>
        <circle cx="86" cy="70" r="1" fill="#ec4899" opacity="0.5"/>
        <circle cx="14" cy="72" r="1.2" fill="#ec4899" opacity="0.4"/>
      </svg>`
};

async function renderPostCard(p, currentUser) {
    const author = await User.findOne({ username: p.author });
    const displayName = author ? (author.full_name || author.username) : p.author;
    const initial = displayName.charAt(0).toUpperCase();
    const avatarUrl = author && author.avatar ? `<img src="${author.avatar}" alt="Avatar">` : initial;
    
    let moodSvg = '';
    if (p.mood && p.mood !== 'none') {
        moodSvg = moodIcons[p.mood] || '';
    }

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
                        <a href="/profile/${p.author}" class="post-author-link"><span class="post-author-name">${displayName}${editedLabel}</span></a>
                        ${moodSvg ? `<span class="post-mood" style="fill:#3182ce">${moodSvg}</span>` : ''}
                    </div>
                </div>
                ${menuHtml}
            </div>
            <div class="post-content">${p.body}</div>
            ${imageHtml}
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
    // Auto-detect button phones and redirect to WAP UI
    if (isButtonPhone(req)) {
        return res.redirect('/wap');
    }
    if (req.session.user) {
        const posts = await Post.find().sort({ created_at: -1 }).limit(50);
        let html = '<html><head><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.svg"></head><body><div class="container">';
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
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
            <title>EliGet</title>
            </head><body>
            <div class="container">
                <div class="landing-hero">
                    <h1 class="elget-wordmark elget-wordmark-lg" style="margin-bottom: 10px;">EliGet</h1>
                    <p class="landing-tagline">Text-only, anti-addiction network.</p>
                    <p class="landing-sub">No algorithms. No videos. Just pure thoughts.</p>
                </div>

                <div class="landing-features">
                    <div class="landing-card">
                        <div class="landing-card-icon">${icons.chat}</div>
                        <h3>Chat</h3>
                        <p>Direct text messaging with friends.</p>
                    </div>
                    <div class="landing-card">
                        <div class="landing-card-icon">${icons.feed}</div>
                        <h3>Feed</h3>
                        <p>Read posts, share your thoughts.</p>
                    </div>
                    <div class="landing-card">
                        <div class="landing-card-icon">${icons.plus}</div>
                        <h3>Post</h3>
                        <p>Write your mind, no images or videos.</p>
                    </div>
                    <div class="landing-card">
                        <div class="landing-card-icon">${icons.profile}</div>
                        <h3>No Algorithm</h3>
                        <p>No dopamine loops, just clean text.</p>
                    </div>
                </div>

                <div class="landing-cta">
                    <a href="/auth/login" class="landing-btn-primary">Login</a>
                    <a href="/auth/signup" class="landing-btn-secondary">Create Account</a>
                </div>

                <div class="landing-footer">
                    <a href="/feed">${icons.feed} Browse Feed without Account</a>
                </div>
            </div>
            </body></html>
        `);
    }
});

// ===== FEED (PUBLIC) =====
app.get('/feed', async (req, res) => {
    const posts = await Post.find().sort({ created_at: -1 }).limit(50);
    let html = '<html><head><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.svg"></head><body><div class="container">';
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
        <html><head><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.svg"></head><body>
        <div class="container">
            <header><span class="profile-title">Your EliGet Profile</span><a href="/settings" class="settings-icon" title="Settings">${icons.settings}</a></header>
            <div class="profile-card">
                <div class="profile-avatar">${avatarUrl}</div>
                <h2>${displayName}</h2>
                <p>@${user.username}</p>
                ${user.badges && user.badges.length > 0 ? `<div class="pp-badges">${user.badges.map(b => badgeLibrary[b] ? `<span class="pp-badge">${badgeLibrary[b].svg}</span>` : '').join('')}</div>` : ''}
                ${user.bio && user.bio.trim() ? `<p class="pp-bio">${user.bio}</p>` : ''}
                <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <a href="/profile/avatar" class="edit-avatar-btn">Change Avatar</a>
                    <a href="/profile/badges" class="edit-avatar-btn">Manage Badges</a>
                </div>
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
    const selectedAvatar = req.query.avatar || user.avatar || '';

    // All avatars together - no fake categories
    const avatarList = [
        // Adventurer style
        { style: 'adventurer', seed: 'Felix' },
        { style: 'adventurer', seed: 'Aneka' },
        { style: 'adventurer', seed: 'Milo' },
        { style: 'adventurer', seed: 'Lily' },
        { style: 'adventurer', seed: 'Zoe' },
        { style: 'adventurer', seed: 'Leo' },
        { style: 'adventurer', seed: 'Mia' },
        { style: 'adventurer', seed: 'Ryan' },
        { style: 'adventurer', seed: 'Nora' },
        { style: 'adventurer', seed: 'Kai' },
        { style: 'adventurer', seed: 'Ivy' },
        { style: 'adventurer', seed: 'Oscar' },
        { style: 'adventurer', seed: 'Walter' },
        { style: 'adventurer', seed: 'Margaret' },
        { style: 'adventurer', seed: 'Arthur' },
        { style: 'adventurer', seed: 'Eleanor' },
        { style: 'adventurer', seed: 'Henry' },
        { style: 'adventurer', seed: 'Rose' },
        // Avataaars style
        { style: 'avataaars', seed: 'Oliver' },
        { style: 'avataaars', seed: 'Jack' },
        { style: 'avataaars', seed: 'Charlie' },
        { style: 'avataaars', seed: 'George' },
        { style: 'avataaars', seed: 'Harry' },
        { style: 'avataaars', seed: 'Thomas' },
        { style: 'avataaars', seed: 'Sophia' },
        { style: 'avataaars', seed: 'Olivia' },
        { style: 'avataaars', seed: 'Emma' },
        { style: 'avataaars', seed: 'Ava' },
        { style: 'avataaars', seed: 'Charlotte' },
        { style: 'avataaars', seed: 'Amelia' },
        { style: 'avataaars', seed: 'Isabella' },
        { style: 'avataaars', seed: 'Luna' },
        { style: 'avataaars', seed: 'Ruby' },
        { style: 'avataaars', seed: 'Adam' },
        { style: 'avataaars', seed: 'Noah' },
        { style: 'avataaars', seed: 'Max' },
        // Big Smile style
        { style: 'big-smile', seed: 'Happy' },
        { style: 'big-smile', seed: 'Cool' },
        { style: 'big-smile', seed: 'Sunny' },
        { style: 'big-smile', seed: 'Bright' },
        { style: 'big-smile', seed: 'Cheer' },
        { style: 'big-smile', seed: 'Joy' },
        { style: 'big-smile', seed: 'Fun' },
        { style: 'big-smile', seed: 'Smile' },
        { style: 'big-smile', seed: 'Star' },
        { style: 'big-smile', seed: 'Sparkle' },
        { style: 'big-smile', seed: 'Buzz' },
        { style: 'big-smile', seed: 'Zing' },
        // Fun Emoji style
        { style: 'fun-emoji', seed: 'Baby' },
        { style: 'fun-emoji', seed: 'Sweet' },
        { style: 'fun-emoji', seed: 'Cuddle' },
        { style: 'fun-emoji', seed: 'Hug' },
        { style: 'fun-emoji', seed: 'Angel' },
        { style: 'fun-emoji', seed: 'Sunshine' },
        { style: 'fun-emoji', seed: 'Cupcake' },
        { style: 'fun-emoji', seed: 'Peach' },
        { style: 'fun-emoji', seed: 'Berry' },
        { style: 'fun-emoji', seed: 'Honey' },
        { style: 'fun-emoji', seed: 'Bunny' },
        { style: 'fun-emoji', seed: 'Kitty' }
    ];

    let avatarGridHtml = '';
    avatarList.forEach(item => {
        const url = `https://api.dicebear.com/7.x/${item.style}/svg?seed=${encodeURIComponent(item.seed)}`;
        const isSelected = user.avatar === url;
        avatarGridHtml += `
            <a href="/profile/avatar?avatar=${encodeURIComponent(url)}" class="avatar-library-item ${isSelected ? 'library-selected' : ''}">
                <img src="${url}" alt="${item.seed}">
            </a>
        `;
    });

    // If an avatar is selected (differs from current), show Save bar
    let saveBar = '';
    if (selectedAvatar && selectedAvatar !== user.avatar) {
        saveBar = `
            <div class="avatar-save-bar">
                <form action="/profile/avatar" method="POST" style="margin:0; display:flex; gap:10px; width:100%;">
                    <input type="hidden" name="avatar_url" value="${selectedAvatar}">
                    <a href="/profile/avatar" class="avatar-cancel-btn">Cancel</a>
                    <button type="submit" class="avatar-save-btn">Save Avatar</button>
                </form>
            </div>
        `;
    }

    res.send(`
        <html><head><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.svg"></head><body>
        <div class="container">
            <header>
                <span class="profile-title">Choose Avatar</span>
                <a href="/profile" class="header-icon" title="Back">${icons.back}</a>
            </header>
            <p style="color: #718096; font-size: 0.9rem; margin-bottom: 15px; text-align: center;">Pick any avatar you like</p>
            <div class="avatar-library-grid">
                ${avatarGridHtml}
            </div>
            ${saveBar}
        </div>
        <div class="bottom-nav"><a href="/">${icons.home}<span>Home</span></a><a href="/post/create">${icons.plus}<span>Post</span></a><a href="/chat">${icons.chat}<span>Chat</span></a><a href="/profile" class="active">${icons.profile}<span>Profile</span></a></div>
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
                <span class="profile-title">Badge Library</span>
                <a href="/profile" class="header-icon" title="Back">${icons.back}</a>
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
        <div class="bottom-nav"><a href="/">${icons.home}<span>Home</span></a><a href="/post/create">${icons.plus}<span>Post</span></a><a href="/chat">${icons.chat}<span>Chat</span></a><a href="/profile" class="active">${icons.profile}<span>Profile</span></a></div>

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

        const pendingRequest = await FriendRequest.findOne({
            status: 'pending',
            $or: [{ from: me, to: targetUsername }, { from: targetUsername, to: me }]
        });

        const theirPosts = await Post.find({ author: targetUsername }).sort({ created_at: -1 });
        const postCount = theirPosts.length;

        const friendCount = await FriendRequest.countDocuments({
            status: 'accepted',
            $or: [{ from: targetUsername }, { to: targetUsername }]
        });

        let postsHtml = '';
        if (theirPosts.length === 0) {
            postsHtml = '<div class="empty-state"><p>No posts yet.</p></div>';
        } else {
            for (const p of theirPosts) {
                postsHtml += await renderPostCard(p, me);
            }
        }

        let bioHtml = '';
        if (user.bio && user.bio.trim()) {
            bioHtml = `<p class="pp-bio">${user.bio}</p>`;
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

        let actionBtn = '';
        if (isFriend) {
            actionBtn = `<a href="/chat/${targetUsername}" class="pp-action-btn primary">Message</a>`;
        } else if (pendingRequest && pendingRequest.from === me) {
            actionBtn = `<button class="pp-action-btn disabled" disabled>Requested</button>`;
        } else if (pendingRequest && pendingRequest.to === me) {
            actionBtn = `<a href="/chat/notifications" class="pp-action-btn primary">Respond</a>`;
        } else {
            actionBtn = `<form action="/chat/request/${targetUsername}" method="POST" style="margin:0; display:inline;">
                <button type="submit" class="pp-action-btn primary">Add Friend</button>
            </form>`;
        }

        const bottomNav = `<div class="bottom-nav"><a href="/" class="active">${icons.home}<span>Home</span></a><a href="/post/create">${icons.plus}<span>Post</span></a><a href="/chat">${icons.chat}<span>Chat</span></a><a href="/profile">${icons.profile}<span>Profile</span></a></div>`;

        res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <title>${displayName} - EliGet</title>
            </head><body>
            <div class="container">
                <header>
                    <span class="profile-title">Profile</span>
                    <a href="/" class="header-icon" title="Back">${icons.back}</a>
                </header>

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
                            <div class="pp-stat-label">Posts</div>
                        </div>
                        <div class="pp-stat">
                            <div class="pp-stat-num">${friendCount}</div>
                            <div class="pp-stat-label">Friends</div>
                        </div>
                    </div>

                    <div>${actionBtn}</div>
                </div>

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

    res.send(`
        <html><head><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.svg"></head><body>
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
