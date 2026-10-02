const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// 1. require StudentPost if missing
if (!src.includes("require('./models/StudentPost')")) {
    const m = src.match(/const Post = require\('\.\/models\/Post'\);/);
    if (m) {
        src = src.replace(m[0], m[0] + "\nconst StudentPost = require('./models/StudentPost');");
        console.log('OK: StudentPost required');
    }
}

// 2. search icon in icons object (if missing)
if (!src.includes('search: `<svg')) {
    const m = src.match(/(\n\s*home: `<svg[^\n]*`,\n)/);
    if (m) {
        const searchIcon = "    search: `<svg viewBox=\"0 0 24 24\"><path d=\"M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z\"/></svg>`,\n";
        src = src.replace(m[0], m[0] + searchIcon);
        console.log('OK: search icon added');
    }
}

// 3. Search icon in Home header
const oldHomeHeader = `<h1 class="feed-title">Home</h1><span id="home-students-banner"></span>`;
const newHomeHeader = `<h1 class="feed-title">Home</h1>
                <a href="/search" class="header-icon" title="Search">\${icons.search}</a>
                <span id="home-students-banner"></span>`;
if (src.includes(oldHomeHeader)) {
    src = src.replace(oldHomeHeader, function() { return newHomeHeader; });
    console.log('OK: home header search link added');
} else {
    console.log('WARN: home header pattern not found');
}

// 4. /search route before 404 handler
const marker404 = '// ===== 404 HANDLER =====';
const idx = src.indexOf(marker404);
if (idx === -1) { console.log('ERROR: 404 marker not found'); process.exit(1); }

const searchRoute = `// ===== GLOBAL SEARCH =====
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
                    const av = u.avatar ? \`<img src="\${u.avatar}" alt="">\` : initial;
                    usersHtml += \`
                        <a href="/profile/\${u.username}" class="gs-item">
                            <div class="gs-avatar">\${av}</div>
                            <div class="gs-info">
                                <div class="gs-name">\${escapeHtml(dn)}</div>
                                <div class="gs-sub">@\${escapeHtml(u.username)}</div>
                            </div>
                            <svg class="gs-chev" viewBox="0 0 24 24" width="18" height="18"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" fill="currentColor"/></svg>
                        </a>
                    \`;
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
                    const av = author && author.avatar ? \`<img src="\${author.avatar}" alt="">\` : initial;
                    const preview = p.body ? (p.body.length > 140 ? p.body.slice(0, 140) + '…' : p.body) : '';
                    studentsHtml += \`
                        <a href="/students/\${p._id}" class="sp-card">
                            <div class="sp-card-head">
                                <div class="sp-avatar">\${av}</div>
                                <div class="sp-author-info">
                                    <div class="sp-author-name">\${escapeHtml(dn)}</div>
                                    <div class="sp-card-meta"><span>\${timeAgo(p.created_at)}</span></div>
                                </div>
                                <span class="sp-type-badge sp-type-\${p.type}">\${TYPE_LABELS[p.type] || p.type}</span>
                            </div>
                            \${p.title ? \`<h3 class="sp-card-title">\${escapeHtml(p.title)}</h3>\` : ''}
                            \${(p.svgs && p.svgs.length && svgLib.images[p.svgs[0]]) ? \`<div class="sp-card-svg">\${svgLib.images[p.svgs[0]]}</div>\` : ''}
                            \${preview ? \`<p class="sp-card-preview">\${escapeHtml(preview)}</p>\` : ''}
                            <div class="sp-card-footer">
                                <span class="sp-subject-chip">\${escapeHtml(p.subject)}</span>
                            </div>
                        </a>
                    \`;
                }
            }
        }

        const totalResults = userCount + postCount + studentCount;

        let bodyContent = '';
        if (!q) {
            bodyContent = \`<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <h3>Search EliGet</h3>
                <p>Find people, posts, or student writings.</p>
            </div>\`;
        } else if (totalResults === 0) {
            bodyContent = \`<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <h3>No results</h3>
                <p>Nothing found for "\${escapeHtml(q)}". Try a different word.</p>
            </div>\`;
        } else {
            if (usersHtml) {
                bodyContent += \`<h2 class="gs-section-label">People · \${userCount}</h2><div class="gs-list">\${usersHtml}</div>\`;
            }
            if (studentsHtml) {
                bodyContent += \`<h2 class="gs-section-label">Students · \${studentCount}</h2><div class="sp-feed">\${studentsHtml}</div>\`;
            }
            if (postsHtml) {
                bodyContent += \`<h2 class="gs-section-label">Posts · \${postCount}</h2><div class="feed-list">\${postsHtml}</div>\`;
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
            const url = \`/search?q=\${encodeURIComponent(q)}&type=\${f.k}\`;
            chipsHtml += \`<a href="\${url}" class="sp-chip \${type === f.k ? 'active' : ''}">\${f.l}</a>\`;
        }

        res.send(\`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
            <title>Search - EliGet</title>
            </head><body>
            <div class="container">
                <header class="feed-header">
                    <a href="/" class="header-icon" title="Back">\${icons.back}</a>
                    <h1 class="feed-title" style="margin-left:10px;">Search</h1>
                </header>

                <form action="/search" method="GET" class="sp-search-form">
                    <input type="text" name="q" value="\${escapeHtml(q)}" placeholder="Search people, posts, students..." class="sp-search-input" autofocus autocomplete="off">
                    \${type !== 'all' ? \`<input type="hidden" name="type" value="\${escapeHtml(type)}">\` : ''}
                </form>

                \${q ? \`<div class="sp-chips">\${chipsHtml}</div>\` : ''}

                \${bodyContent}
            </div>
            \${getBottomNav('home')}
            \${getDeleteModal()}
            </body></html>
        \`);
    } catch (err) {
        console.error('Search error:', err);
        res.redirect('/');
    }
});

`;

src = src.slice(0, idx) + searchRoute + src.slice(idx);
console.log('OK: /search route added');

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('DONE');
