const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// 1. require Follow at top
if (!src.includes("require('./models/Follow')")) {
    const m = src.match(/const User = require\('\.\/models\/User'\);/);
    if (!m) { console.log('ERROR: User require not found'); process.exit(1); }
    src = src.replace(m[0], m[0] + "\nconst Follow = require('./models/Follow');");
    console.log('OK: Follow required');
}

// 2. Public profile page — stats + follow button
// Find the friendCount query & stats block. We'll replace the stats block and action buttons.
const oldStatsBlock = `        const friendCount = await FriendRequest.countDocuments({
            status: 'accepted',
            $or: [{ from: targetUsername }, { to: targetUsername }]
        });`;
const newStatsBlock = `        const friendCount = await FriendRequest.countDocuments({
            status: 'accepted',
            $or: [{ from: targetUsername }, { to: targetUsername }]
        });

        const followerCount = await Follow.countDocuments({ following: targetUsername });
        const followingCount = await Follow.countDocuments({ follower: targetUsername });
        const isFollowing = await Follow.findOne({ follower: me, following: targetUsername });`;

if (src.includes(oldStatsBlock)) {
    src = src.replace(oldStatsBlock, function() { return newStatsBlock; });
    console.log('OK: follow counts queried');
} else {
    console.log('WARN: friendCount block not found');
}

// 3. Replace stats display (Posts + Friends grid)
const oldStatsHtml = `                    <div class="pp-stats">
                        <div class="pp-stat">
                            <div class="pp-stat-num">\${postCount}</div>
                            <div class="pp-stat-label">\${postCount === 1 ? 'Post' : 'Posts'}</div>
                        </div>
                        <div class="pp-stat">
                            <div class="pp-stat-num">\${friendCount}</div>
                            <div class="pp-stat-label">\${friendCount === 1 ? 'Friend' : 'Friends'}</div>
                        </div>
                    </div>

                    <div>\${actionBtn}</div>`;

const newStatsHtml = `                    <div class="pp-stats">
                        <div class="pp-stat">
                            <div class="pp-stat-num">\${postCount}</div>
                            <div class="pp-stat-label">\${postCount === 1 ? 'Post' : 'Posts'}</div>
                        </div>
                        <div class="pp-stat">
                            <div class="pp-stat-num">\${followerCount}</div>
                            <div class="pp-stat-label">\${followerCount === 1 ? 'Follower' : 'Followers'}</div>
                        </div>
                        <div class="pp-stat">
                            <div class="pp-stat-num">\${followingCount}</div>
                            <div class="pp-stat-label">Following</div>
                        </div>
                    </div>

                    <div class="pp-action-row-2">
                        \${followBtn}
                        \${actionBtn}
                    </div>`;

if (src.includes(oldStatsHtml)) {
    src = src.replace(oldStatsHtml, function() { return newStatsHtml; });
    console.log('OK: stats + action row updated');
} else {
    console.log('WARN: stats block not found — checking exact pattern');
}

// 4. Follow button variable — add after actionBtn block
const oldActionEnd = `        } else {
            actionBtn = \`<form action="/chat/request/\${targetUsername}" method="POST" style="margin:0; display:inline;">
                <button type="submit" class="pp-action-btn primary">Add Friend</button>
            </form>\`;
        }`;
const newActionEnd = `        } else {
            actionBtn = \`<form action="/chat/request/\${targetUsername}" method="POST" style="margin:0; display:inline;">
                <button type="submit" class="pp-action-btn primary">Add Friend</button>
            </form>\`;
        }

        let followBtn;
        if (isFollowing) {
            followBtn = \`<button type="button" class="pp-follow-btn following" data-username="\${targetUsername}" onclick="toggleFollow(this)">Following</button>\`;
        } else {
            followBtn = \`<button type="button" class="pp-follow-btn" data-username="\${targetUsername}" onclick="toggleFollow(this)">Follow</button>\`;
        }`;

if (src.includes(oldActionEnd)) {
    src = src.replace(oldActionEnd, function() { return newActionEnd; });
    console.log('OK: follow button var added');
} else {
    console.log('WARN: actionBtn block not found');
}

// 5. Add follow toggle route — insert before START SERVER
const marker = '// ===== 404 HANDLER =====';
const idx = src.indexOf(marker);
if (idx === -1) { console.log('ERROR: 404 marker not found'); process.exit(1); }

const followRoute = `// ===== FOLLOW TOGGLE =====
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
        } else {
            await Follow.create({ follower: me, following: target });
            following = true;
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

        const posts = await Post.find({ author: { $in: followingUsernames } }).sort({ created_at: -1 }).limit(50);

        let html = '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>Following - EliGet</title></head><body>';
        html += '<div class="container">';
        html += '<header class="feed-header"><a href="/" class="header-icon" title="Back">' + icons.back + '</a><h1 class="feed-title">Following</h1></header>';
        if (posts.length === 0) {
            html += '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h7v2H7z"/></svg><h3>No posts yet</h3><p>The people you follow haven\'t posted anything.</p></div>';
        } else {
            for (const p of posts) {
                html += await renderPostCard(p, me);
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

`;

src = src.slice(0, idx) + followRoute + src.slice(idx);
console.log('OK: follow routes added');

fs.writeFileSync('server.js', src);
console.log('DONE');
