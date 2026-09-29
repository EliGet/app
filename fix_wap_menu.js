const fs = require('fs');
let src = fs.readFileSync('routes/wap.js', 'utf8');
const before = src;

const oldMenu = `        menu = \`
            <p>Welcome, <b>\${escapeXml(username)}</b></p>
            <p><a href="/wap/feed">1. Feed</a></p>
            <p><a href="/wap/post">2. New Post</a></p>
            <p><a href="/wap/chat">3. Chat</a></p>
            <p><a href="/wap/notifications">4. Notifications\${notifBadge}</a></p>
            <p><a href="/wap/profile">5. Profile</a></p>
            <p><a href="/wap/logout">6. Logout</a></p>
        \`;`;

const newMenu = `        menu = \`
            <p><b>1.</b> <a href="/wap/feed">Feed</a></p>
            <p><b>2.</b> <a href="/wap/post">New Post</a></p>
            <p><b>3.</b> <a href="/wap/chat">Chat</a></p>
            <p><b>4.</b> <a href="/wap/notifications">Notifications\${notifBadge}</a></p>
            <p><b>5.</b> <a href="/wap/profile">Profile</a></p>
            <p><b>6.</b> <a href="/wap/logout">Logout</a></p>
        \`;`;

if (!src.includes(oldMenu)) { console.log('WARN: menu pattern not found'); }
else {
    src = src.replace(oldMenu, function() { return newMenu; });
    console.log('OK: home menu polished');
}

const oldGuest = `        menu = \`
            <p>Text-only, anti-addiction network</p>
            <p><a href="/wap/login">1. Login</a></p>
            <p><a href="/wap/signup">2. Signup</a></p>
            <p><a href="/wap/feed">3. Feed (read only)</a></p>
        \`;`;

const newGuest = `        menu = \`
            <p>Text-only network.<br/>No algorithms. No videos.<br/>Just pure thoughts.</p>
            <p><b>1.</b> <a href="/wap/login">Login</a></p>
            <p><b>2.</b> <a href="/wap/signup">Create Account</a></p>
            <p><b>3.</b> <a href="/wap/feed">Browse Feed (read only)</a></p>
        \`;`;

if (!src.includes(oldGuest)) { console.log('WARN: guest menu pattern not found'); }
else {
    src = src.replace(oldGuest, function() { return newGuest; });
    console.log('OK: guest menu polished');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/wap.js', src);
console.log('DONE');
