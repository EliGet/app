const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');

// Find the home route
const startMarker = "app.get('/', async (req, res) => {";
const endMarker = "// ===== FEED (PUBLIC) =====";
const s = src.indexOf(startMarker);
const e = src.indexOf(endMarker);
if (s === -1 || e === -1) { console.log('ERROR: home route markers not found'); process.exit(1); }

const newHome = `app.get('/', async (req, res) => {
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
            previewHtml += \`
                <div class="lp-post">
                    <div class="lp-post-head">
                        <div class="lp-post-avatar has-img"><img src="\${d.avatar}" alt=""></div>
                        <span class="lp-post-author">\${d.name}</span>
                    </div>
                    <p class="lp-post-body">\${d.text}</p>
                    <div class="lp-post-meta"><span>\${d.time}</span><span class="lp-post-dot">\\u00b7</span><span>\${d.likes} likes</span></div>
                </div>
            \`;
        }
        return res.send(\`
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
                    <a href="/auth/signup" class="lp-btn-primary">Create Account<span class="lp-arrow">\\u2192</span></a>
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
                    \${previewHtml}
                </section>

                <div class="lp-guest">
                    <span class="lp-guest-text">Not ready to join?</span>
                    <a href="/feed" class="lp-guest-link">Browse the public feed<span class="lp-arrow-svg-inline">\\u2192</span></a>
                </div>

            </div>
            </body></html>
        \`);
    }

    // ========== LOGGED-IN HOME WITH TABS ==========
    const me = req.session.user;
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

    let postsHtml = '';
    if (posts.length === 0) {
        if (feedParam === 'following') {
            postsHtml = \`<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h7v2H7z"/></svg>
                <h3>Nothing here yet</h3>
                <p>Follow people and their posts will show up here.</p>
                <a href="/feed">Browse public feed</a>
            </div>\`;
        } else {
            postsHtml = \`<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h7v2H7z"/></svg>
                <h3>Nothing here yet</h3>
                <p>Be the first to share a thought with the community.</p>
                <a href="/post/create">Write the first post</a>
            </div>\`;
        }
    } else {
        for (const p of posts) {
            postsHtml += await renderPostCard(p, me, followSet);
        }
    }

    const bottomNav = \`<div class="bottom-nav"><a href="/" class="active">\${icons.home}<span>Home</span></a><a href="/post/create">\${icons.plus}<span>Post</span></a><a href="/chat">\${icons.chat}<span>Chat</span></a><a href="/profile">\${icons.profile}<span>Profile</span></a></div>\`;

    res.send(\`
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
            </header>

            <div class="tab-bar">
                <a href="/?feed=foryou" class="tab-item \${feedParam === 'foryou' ? 'active' : ''}">For You</a>
                <a href="/?feed=following" class="tab-item \${feedParam === 'following' ? 'active' : ''}">Following</a>
            </div>

            <div class="feed-list">\${postsHtml}</div>
        </div>
        \${bottomNav}
        \${getDeleteModal()}
        </body></html>
    \`);
});

`;

src = src.slice(0, s) + newHome + src.slice(e);
fs.writeFileSync('server.js', src);
console.log('OK: home route with tabs');
