const fs = require('fs');
let src = fs.readFileSync('routes/wap.js', 'utf8');
const before = src;

// ===== POST DETAIL =====
const oldDetail = `        const html = \`
            <p><b>\${escapeXml(displayName)}</b></p>
            <hr/>
            <p>\${escapeXml(post.body)}</p>
        \`;`;

const newDetail = `        const diff = Date.now() - new Date(post.created_at).getTime();
        const min = Math.floor(diff / 60000);
        let timeStr;
        if (min < 1) timeStr = 'just now';
        else if (min < 60) timeStr = min + 'm ago';
        else if (min < 1440) timeStr = Math.floor(min / 60) + 'h ago';
        else if (min < 10080) timeStr = Math.floor(min / 1440) + 'd ago';
        else timeStr = new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

        const html = \`
            <p><b>\${escapeXml(displayName)}</b><br/>
            <small>\${timeStr}</small></p>
            <hr/>
            <p>\${escapeXml(post.body).replace(/\\n/g, '<br/>')}</p>
        \`;`;

if (src.includes(oldDetail)) {
    src = src.replace(oldDetail, function() { return newDetail; });
    console.log('OK: Post detail polished');
} else {
    console.log('WARN: post detail pattern not found');
}

// ===== NEW POST =====
const oldNewPost = `    const body = \`
        <form action="/wap/post" method="POST">
            <p>Your thoughts (max 300):<br/>
            <textarea name="body" rows="5" cols="20" maxlength="300"></textarea></p>
            <p><input type="submit" value="Post"/></p>
        </form>
    \`;`;

const newNewPost = `    const body = \`
        <p><small>Max 300 characters.</small></p>
        <form action="/wap/post" method="POST">
            <p><textarea name="body" rows="6" cols="20" maxlength="300"></textarea></p>
            <p><input type="submit" value="Publish"/></p>
        </form>
    \`;`;

if (src.includes(oldNewPost)) {
    src = src.replace(oldNewPost, function() { return newNewPost; });
    console.log('OK: New post polished');
} else {
    console.log('WARN: new post pattern not found');
}

// ===== PROFILE =====
const oldProfile = `        let postsHtml = '';
        if (posts.length === 0) {
            postsHtml = '<p>You have no posts yet.</p>';
        } else {
            posts.forEach((p, i) => {
                let body = p.body;
                if (body.length > 80) body = body.substring(0, 80) + '...';
                postsHtml += \`<p>\${i + 1}. \${escapeXml(body)}</p>\`;
            });
        }

        const html = \``;

const newProfile = `        let postsHtml = '';
        if (posts.length === 0) {
            postsHtml = '<p><small>No posts yet.</small></p>';
        } else {
            posts.forEach((p) => {
                let body = p.body;
                if (body.length > 100) body = body.substring(0, 100) + '...';
                postsHtml += \`<p>\${escapeXml(body)}</p>\`;
            });
        }

        const html = \``;

if (src.includes(oldProfile)) {
    src = src.replace(oldProfile, function() { return newProfile; });
    console.log('OK: Profile posts list polished');
} else {
    console.log('WARN: profile pattern not found');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('routes/wap.js', src);
console.log('DONE');
