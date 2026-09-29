const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// 1. Feed (logged in) — line 483
const old1 = `            html += '<p style="text-align:center; color:#a0aec0; padding:20px;">No posts yet. Be the first to post!</p>';`;
const new1 = `            html += \`<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h7v2H7z"/></svg>
                <h3>Nothing here yet</h3>
                <p>Be the first to share a thought with the community.</p>
                <a href="/post/create">Write the first post</a>
            </div>\`;`;
if (src.includes(old1)) { src = src.replace(old1, function(){return new1;}); console.log('OK: feed (logged in)'); }
else { console.log('WARN: feed logged-in empty not found'); }

// 2. Public feed — line 583
const old2 = `    html += '<p style="text-align:center; color:#a0aec0; padding:20px;">No posts yet.</p>';`;
const new2 = `    html += \`<div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h7v2H7z"/></svg>
        <h3>No public posts yet</h3>
        <p>Check back soon. The feed is quiet right now.</p>
    </div>\`;`;
if (src.includes(old2)) { src = src.replace(old2, function(){return new2;}); console.log('OK: public feed'); }
else { console.log('WARN: public feed empty not found'); }

// 3. Other user profile — line 1043
const old3 = `            postsHtml = '<div class="empty-state"><p>No posts yet.</p></div>';`;
const new3 = `            postsHtml = \`<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h7v2H7z"/></svg>
                <h3>No posts yet</h3>
                <p>This user hasn't shared anything.</p>
            </div>\`;`;
if (src.includes(old3)) { src = src.replace(old3, function(){return new3;}); console.log('OK: other profile'); }
else { console.log('WARN: other profile empty not found'); }

if (src === before) { console.log('ERROR: nothing changed in server.js'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('DONE server.js');
