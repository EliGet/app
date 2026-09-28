const fs = require('fs');

// ---- server.js ----
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// 1. Feed card: comment link block সরাও
const commentLinkBlock = `
            <a href="/post/\${p._id}" class="post-reply-link">
                <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
                \${p.replies && p.replies.length > 0 ? p.replies.length + ' ' + (p.replies.length === 1 ? 'comment' : 'comments') : 'Comment'}
            </a>`;

if (!src.includes(commentLinkBlock)) {
    console.log('WARN: comment link block not found (may already be removed)');
} else {
    src = src.replace(commentLinkBlock, '');
    console.log('OK: feed card comment link removed');
}

// 2. POST DETAIL + ADD REPLY routes পুরো সরাও
const startMarker = '// ===== POST DETAIL';
const endMarker = '// ===== OWN PROFILE';
const start = src.indexOf(startMarker);
const end = src.indexOf(endMarker);
if (start === -1) { console.log('ERROR: POST DETAIL marker not found'); process.exit(1); }
if (end === -1) { console.log('ERROR: OWN PROFILE marker not found'); process.exit(1); }
if (end <= start) { console.log('ERROR: end before start'); process.exit(1); }

src = src.slice(0, start) + src.slice(end);
console.log('OK: POST DETAIL + ADD REPLY routes removed');

if (src === before) { console.log('ERROR: server.js unchanged'); process.exit(1); }
fs.writeFileSync('server.js', src);

// ---- wap.js ----
let wsrc = fs.readFileSync('routes/wap.js', 'utf8');
if (wsrc.includes('Quick Comment:')) {
    wsrc = wsrc.replace(/Quick Comment:/g, 'Quick Reply:');
    fs.writeFileSync('routes/wap.js', wsrc);
    console.log('OK: wap.js reverted to Quick Reply');
} else {
    console.log('WARN: wap.js Quick Comment not found');
}
