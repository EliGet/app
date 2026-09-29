const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// 1. getFollowSet helper — insert right before renderPostCard
const rpcMarker = 'async function renderPostCard(p, currentUser) {';
if (!src.includes(rpcMarker)) { console.log('ERROR: renderPostCard not found'); process.exit(1); }
const helper = `async function getFollowSet(currentUser) {
    if (!currentUser) return new Set();
    const follows = await Follow.find({ follower: currentUser }).select('following');
    return new Set(follows.map(f => f.following));
}

async function renderPostCard(p, currentUser, followSet) {`;
src = src.replace(rpcMarker, helper);
console.log('OK: helper + signature updated');

// 2. In renderPostCard — build follow button and insert in author-row
const oldAuthorRow = `                        <a href="/profile/\${p.author}" class="post-author-link"><span class="post-author-name">\${displayName}</span></a>
                        \${moodSvg ? \`<span class="post-mood">\${moodSvg}</span>\` : ''}`;

const newAuthorRow = `                        <a href="/profile/\${p.author}" class="post-author-link"><span class="post-author-name">\${displayName}</span></a>
                        \${postFollowBtn}
                        \${moodSvg ? \`<span class="post-mood">\${moodSvg}</span>\` : ''}`;

if (!src.includes(oldAuthorRow)) { console.log('ERROR: author row not found'); process.exit(1); }
src = src.replace(oldAuthorRow, newAuthorRow);
console.log('OK: author row updated');

// 3. Build postFollowBtn variable — insert before "let menuHtml"
const menuMarker = `    let menuHtml = '';
    if (currentUser && currentUser === p.author) {`;
const followVar = `    let postFollowBtn = '';
    if (currentUser && currentUser !== p.author) {
        const isFollowingAuthor = followSet && followSet.has(p.author);
        postFollowBtn = \`<button type="button" class="post-follow-btn\${isFollowingAuthor ? ' following' : ''}" data-username="\${p.author}" onclick="togglePostFollow(event, this)">\${isFollowingAuthor ? 'Following' : 'Follow'}</button>\`;
    }

    let menuHtml = '';
    if (currentUser && currentUser === p.author) {`;

if (!src.includes(menuMarker)) { console.log('ERROR: menu block not found'); process.exit(1); }
src = src.replace(menuMarker, followVar);
console.log('OK: postFollowBtn var added');

// 4. Update all renderPostCard callers to pass followSet
// Home route
src = src.split('                html += await renderPostCard(p, req.session.user);')
         .join('                html += await renderPostCard(p, req.session.user, feedFollowSet);');

// Feed route
src = src.split('            html += await renderPostCard(p, req.session.user || null);')
         .join('            html += await renderPostCard(p, req.session.user || null, feedFollowSet);');

// Own profile (using ownFollowSet)
src = src.split('                postsHtml += await renderPostCard(p, req.session.user);')
         .join('                postsHtml += await renderPostCard(p, req.session.user, ownFollowSet);');

// Other profile
src = src.split('                postsHtml += await renderPostCard(p, me);')
         .join('                postsHtml += await renderPostCard(p, me, otherFollowSet);');

// Following feed (uses followingFollowSet)
src = src.split('                html += await renderPostCard(p, me);')
         .join('                html += await renderPostCard(p, me, followingFollowSet);');

console.log('OK: callers updated');

// 5. Insert feedFollowSet compute before home route loop
const homeLoopMarker = `        if (posts.length === 0) {
            html += \`<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h7v2H7z"/></svg>
                <h3>Nothing here yet</h3>`;
if (!src.includes(homeLoopMarker)) {
    // Try simpler approach - insert before the loop in home route
    const homePostLoop = `        } else {
            for (const p of posts) {
                html += await renderPostCard(p, req.session.user, feedFollowSet);`;
    if (src.includes(homePostLoop)) {
        src = src.replace(homePostLoop, `        } else {
            const feedFollowSet = await getFollowSet(req.session.user);
            for (const p of posts) {
                html += await renderPostCard(p, req.session.user, feedFollowSet);`);
        console.log('OK: home feedFollowSet added');
    } else {
        console.log('WARN: home loop pattern not found for feedFollowSet');
    }
} else {
    console.log('WARN: home empty state pattern found — need manual check');
}

// 6. Feed route followSet
const feedLoopMarker = `        for (const p of posts) {
            html += await renderPostCard(p, req.session.user || null, feedFollowSet);`;
if (src.includes(feedLoopMarker)) {
    src = src.replace(feedLoopMarker, `        const feedFollowSet = await getFollowSet(req.session.user || null);
        for (const p of posts) {
            html += await renderPostCard(p, req.session.user || null, feedFollowSet);`);
    console.log('OK: public feedFollowSet added');
}

// 7. Own profile
const ownLoopMarker = `            for (const p of myPosts) {
                postsHtml += await renderPostCard(p, req.session.user, ownFollowSet);`;
if (src.includes(ownLoopMarker)) {
    src = src.replace(ownLoopMarker, `            const ownFollowSet = await getFollowSet(req.session.user);
            for (const p of myPosts) {
                postsHtml += await renderPostCard(p, req.session.user, ownFollowSet);`);
    console.log('OK: ownFollowSet added');
}

// 8. Other profile
const otherLoopMarker = `            for (const p of theirPosts) {
                postsHtml += await renderPostCard(p, me, otherFollowSet);`;
if (src.includes(otherLoopMarker)) {
    src = src.replace(otherLoopMarker, `            const otherFollowSet = await getFollowSet(me);
            for (const p of theirPosts) {
                postsHtml += await renderPostCard(p, me, otherFollowSet);`);
    console.log('OK: otherFollowSet added');
}

// 9. Following feed
const followingLoopMarker = `            for (const p of posts) {
                html += await renderPostCard(p, me, followingFollowSet);`;
if (src.includes(followingLoopMarker)) {
    src = src.replace(followingLoopMarker, `            const followingFollowSet = await getFollowSet(me);
            for (const p of posts) {
                html += await renderPostCard(p, me, followingFollowSet);`);
    console.log('OK: followingFollowSet added');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('DONE');
