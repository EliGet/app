const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// 1. require Block
if (!src.includes("require('./models/Block')")) {
    const m = src.match(/const Follow = require\('\.\/models\/Follow'\);/);
    if (!m) { console.log('ERROR: Follow require not found'); process.exit(1); }
    src = src.replace(m[0], m[0] + "\nconst Block = require('./models/Block');");
    console.log('OK: Block required');
}

// 2. Profile route — add block status check
const oldFriendQ = `        const friendship = await FriendRequest.findOne({
            status: 'accepted',
            $or: [{ from: me, to: targetUsername }, { from: targetUsername, to: me }]
        });
        const isFriend = !!friendship;`;

const newFriendQ = `        const friendship = await FriendRequest.findOne({
            status: 'accepted',
            $or: [{ from: me, to: targetUsername }, { from: targetUsername, to: me }]
        });
        const isFriend = !!friendship;

        // Block state
        const iBlockedThem = await Block.findOne({ blocker: me, blocked: targetUsername });
        const theyBlockedMe = await Block.findOne({ blocker: targetUsername, blocked: me });
        const isBlocked = !!iBlockedThem;
        const isBlockedByThem = !!theyBlockedMe;`;

if (!src.includes(oldFriendQ)) { console.log('ERROR: friend query not found'); process.exit(1); }
src = src.replace(oldFriendQ, function() { return newFriendQ; });
console.log('OK: block state queried');

// 3. Filter posts if blocked
const oldPosts = `        const theirPosts = await Post.find({ author: targetUsername }).sort({ created_at: -1 });
        const postCount = theirPosts.length;`;
const newPosts = `        const theirPosts = (isBlocked || isBlockedByThem) ? [] : await Post.find({ author: targetUsername }).sort({ created_at: -1 });
        const postCount = theirPosts.length;`;
if (!src.includes(oldPosts)) { console.log('ERROR: their posts query not found'); process.exit(1); }
src = src.replace(oldPosts, function() { return newPosts; });
console.log('OK: posts filtered when blocked');

// 4. Add block menu HTML in profile header (before pp-card)
const oldHeader = `                <header>
                    <a href="/" class="header-icon" title="Back">\${icons.back}</a>
                    <span class="profile-title" style="flex:1;">Profile</span>
                </header>

                <div class="pp-card">
                    <div class="pp-avatar-wrap">`;
const newHeader = `                <header>
                    <a href="/" class="header-icon" title="Back">\${icons.back}</a>
                    <span class="profile-title" style="flex:1;">Profile</span>
                    \${!isBlockedByThem ? \`
                        <button type="button" class="pp-menu-btn-static" onclick="toggleBlockMenu(event)" aria-label="Menu">
                            <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/></svg>
                        </button>
                    \` : ''}
                </header>

                \${!isBlockedByThem ? \`
                    <div class="pp-block-menu" id="blockMenu">
                        <button type="button" class="pp-block-item \${isBlocked ? 'unblock' : 'block'}" onclick="toggleBlock('\${targetUsername}', \${isBlocked ? 'true' : 'false'})">
                            \${isBlocked ? 'Unblock user' : 'Block user'}
                        </button>
                    </div>
                \` : ''}

                \${(isBlocked || isBlockedByThem) ? \`
                    <div class="pp-blocked-banner">
                        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z" fill="currentColor"/></svg>
                        <span>\${isBlocked ? 'You blocked this user' : 'This user is unavailable'}</span>
                    </div>
                \` : ''}

                \${!(isBlocked || isBlockedByThem) ? \`
                <div class="pp-card">
                    <div class="pp-avatar-wrap">`;

if (!src.includes(oldHeader)) { console.log('ERROR: profile header not found'); process.exit(1); }
src = src.replace(oldHeader, function() { return newHeader; });
console.log('OK: block menu + banner added');

// 5. Close the wrapping conditional — find end of pp-card
const oldCardClose = `                    <div class="pp-action-row-2">
                        \${followBtn}
                        \${actionBtn}
                    </div>
                </div>

                <div class="pp-section-title">Recent Posts</div>
                \${postsHtml}`;

const newCardClose = `                    <div class="pp-action-row-2">
                        \${followBtn}
                        \${actionBtn}
                    </div>
                </div>
                \` : ''}

                <div class="pp-section-title">Recent Posts</div>
                \${postsHtml}`;

if (!src.includes(oldCardClose)) { console.log('WARN: card close pattern not found — check manually'); }
else {
    src = src.replace(oldCardClose, function() { return newCardClose; });
    console.log('OK: card close wrapped');
}

// 6. Block route + script
const marker404 = '// ===== 404 HANDLER =====';
const idx = src.indexOf(marker404);
if (idx === -1) { console.log('ERROR: 404 marker not found'); process.exit(1); }

const blockRoute = `// ===== BLOCK / UNBLOCK TOGGLE =====
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

`;

src = src.slice(0, idx) + blockRoute + src.slice(idx);
console.log('OK: block route added');

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('DONE');
