const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// 1. timeStr compute + editedLabel shift
const oldCompute = `    const likeCount = (p.likes || []).length;
    const liked = currentUser && (p.likes || []).includes(currentUser);

    let menuHtml = '';`;

const newCompute = `    const likeCount = (p.likes || []).length;
    const liked = currentUser && (p.likes || []).includes(currentUser);

    const diffMs = Date.now() - new Date(p.created_at).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    let timeStr;
    if (diffMin < 1) timeStr = 'just now';
    else if (diffMin < 60) timeStr = diffMin + 'm';
    else if (diffMin < 1440) timeStr = Math.floor(diffMin / 60) + 'h';
    else if (diffMin < 10080) timeStr = Math.floor(diffMin / 1440) + 'd';
    else timeStr = new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    let menuHtml = '';`;

if (!src.includes(oldCompute)) { console.log('ERROR: compute block not found'); process.exit(1); }
src = src.replace(oldCompute, function() { return newCompute; });
console.log('OK: timeStr computed');

// 2. Remove editedLabel variable
const oldEdited = `    const editedLabel = p.edited ? ' <span style="font-size:0.7rem;color:#a0aec0;font-weight:400;">(edited)</span>' : '';\n\n`;
if (src.includes(oldEdited)) {
    src = src.replace(oldEdited, '');
    console.log('OK: old editedLabel removed');
}

// 3. Return block replace — restructure header + meta
const oldReturnStart = `    return \`
        <div class="post-card">
            <div class="post-header">
                <a href="/profile/\${p.author}" class="post-avatar-link"><div class="post-avatar">\${avatarUrl}</div></a>
                <div class="post-user-info">
                    <div class="post-author-row">
                        <a href="/profile/\${p.author}" class="post-author-link"><span class="post-author-name">\${displayName}\${editedLabel}</span></a>
                        \${moodSvg ? \`<span class="post-mood" style="fill:#3182ce">\${moodSvg}</span>\` : ''}
                    </div>
                </div>
                \${menuHtml}
            </div>
            <div class="post-content">\${p.body}</div>
            \${imageHtml}
            <div class="post-love-row">
                <button type="button" class="post-love-btn \${liked ? 'liked' : ''}" data-post-id="\${p._id}" onclick="toggleLove(event, this)">
                    <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    <span class="post-love-count">\${likeCount}</span>
                </button>
            </div>
        </div>
    \`;`;

const newReturn = `    return \`
        <div class="post-card">
            <div class="post-header">
                <a href="/profile/\${p.author}" class="post-avatar-link"><div class="post-avatar">\${avatarUrl}</div></a>
                <div class="post-user-info">
                    <div class="post-author-row">
                        <a href="/profile/\${p.author}" class="post-author-link"><span class="post-author-name">\${displayName}</span></a>
                        \${moodSvg ? \`<span class="post-mood">\${moodSvg}</span>\` : ''}
                    </div>
                    <div class="post-meta-row">
                        <span class="post-time">\${timeStr}</span>
                        \${p.edited ? \`<span class="post-meta-dot">\\u00b7</span><span class="post-edited">edited</span>\` : ''}
                    </div>
                </div>
                \${menuHtml}
            </div>
            <div class="post-content">\${p.body}</div>
            \${imageHtml}
            <div class="post-love-row">
                <button type="button" class="post-love-btn \${liked ? 'liked' : ''}" data-post-id="\${p._id}" onclick="toggleLove(event, this)">
                    <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    <span class="post-love-count">\${likeCount}</span>
                </button>
            </div>
        </div>
    \`;`;

if (!src.includes(oldReturnStart)) { console.log('ERROR: return block not found'); process.exit(1); }
src = src.replace(oldReturnStart, function() { return newReturn; });
console.log('OK: return block restructured');

// 4. Home route header — "EliGet Feed" → "Feed"
const oldHomeHeader = `html += '<header><h1 class="feed-title">EliGet Feed</h1></header>';`;
const newHomeHeader = `html += '<header class="feed-header"><h1 class="feed-title">Feed</h1></header>';`;
if (src.includes(oldHomeHeader)) {
    src = src.replace(oldHomeHeader, function() { return newHomeHeader; });
    console.log('OK: home header updated');
}

// 5. Public feed header
const oldFeedHeader = `    html += '<header><h1 class="feed-title">Feed</h1></header>';`;
const newFeedHeader = `    html += '<header class="feed-header"><h1 class="feed-title">Feed</h1></header>';`;
if (src.includes(oldFeedHeader)) {
    src = src.replace(oldFeedHeader, function() { return newFeedHeader; });
    console.log('OK: public feed header updated');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('DONE');
