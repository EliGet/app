const fs = require('fs');
let src = fs.readFileSync('routes/wap.js', 'utf8');
const before = src;

// ===== FEED polish =====
const oldFeed = `        let html = '';
        if (posts.length === 0) {
            html = '<p>No posts yet.</p>';
        } else {
            for (let i = 0; i < posts.length; i++) {
                const p = posts[i];
                const author = await User.findOne({ username: p.author });
                const displayName = author ? (author.full_name || author.username) : p.author;

                let body = p.body;
                let readMore = '';
                if (body.length > 120) {
                    body = body.substring(0, 120) + '...';
                    readMore = \` <a href="/wap/post/\${p._id}">Read more</a>\`;
                }

                html += \`<p><b>\${escapeXml(displayName)}</b><br/>\${escapeXml(body)}\${readMore}</p>\`;
            }

            // Pagination
            html += '<hr/>';
            if (page > 1) {
                html += \`<a href="/wap/feed?page=\${page - 1}">[ Previous ]</a>  \`;
            }
            html += \`<small>Page \${page}/\${totalPages}</small>\`;
            if (page < totalPages) {
                html += \`  <a href="/wap/feed?page=\${page + 1}">[ Next ]</a>\`;
            }
        }`;

const newFeed = `        let html = '';
        if (posts.length === 0) {
            html = '<p>No posts yet.<br/><small>Be the first to write something.</small></p>';
        } else {
            for (let i = 0; i < posts.length; i++) {
                const p = posts[i];
                const author = await User.findOne({ username: p.author });
                const displayName = author ? (author.full_name || author.username) : p.author;

                // Time ago
                const diff = Date.now() - new Date(p.created_at).getTime();
                const min = Math.floor(diff / 60000);
                let timeStr;
                if (min < 1) timeStr = 'now';
                else if (min < 60) timeStr = min + 'm';
                else if (min < 1440) timeStr = Math.floor(min / 60) + 'h';
                else timeStr = Math.floor(min / 1440) + 'd';

                let body = p.body;
                let readMore = '';
                if (body.length > 150) {
                    body = body.substring(0, 150) + '...';
                    readMore = \` <a href="/wap/post/\${p._id}">more</a>\`;
                }

                html += \`<p><b>\${escapeXml(displayName)}</b> <small>· \${timeStr}</small><br/>\${escapeXml(body)}\${readMore}</p>\`;
            }

            html += '<hr/>';
            if (page > 1) {
                html += \`<a href="/wap/feed?page=\${page - 1}">&lt;&lt; Newer</a> | \`;
            }
            html += \`<small>Page \${page}/\${totalPages}</small>\`;
            if (page < totalPages) {
                html += \` | <a href="/wap/feed?page=\${page + 1}">Older &gt;&gt;</a>\`;
            }
        }`;

if (src.includes(oldFeed)) {
    src = src.replace(oldFeed, function() { return newFeed; });
    console.log('OK: Feed polished');
} else {
    console.log('WARN: feed pattern not found');
}

// ===== POST DETAIL polish =====
const oldDetail = `                <p><b>\${escapeXml(displayName)}</b><br/>\${escapeXml(post.body)}</p>`;

if (src.includes(oldDetail)) {
    // Need to find the surrounding context first
}

if (src === before) { console.log('nothing changed for feed'); }
fs.writeFileSync('routes/wap.js', src);
console.log('DONE stage 3a');
