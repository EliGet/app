const fs = require('fs');
let src = fs.readFileSync('routes/wap.js', 'utf8');
const before = src;

// ===== CHAT LIST =====
const oldChat = `        let html = '';
        if (chatItems.length === 0) {
            html = '<p>No chats yet.</p>';
        } else {
            html = '<ol>';
            chatItems.forEach(c => {
                html += \`<li><a href="/wap/chat/\${c.username}">\${escapeXml(c.displayName)}</a>\`;
                if (c.unread > 0) html += \` <b>(\${c.unread} new)</b>\`;
                if (c.lastMsg) html += \`<br/><small>\${escapeXml(c.lastMsg)}</small>\`;
                html += \`</li>\`;
            });
            html += '</ol>';
        }

        res.send(wapPage('Chats', html, { back: '/wap', user: req.session.user }));`;

const newChat = `        let html = '';
        if (chatItems.length === 0) {
            html = '<p>No conversations yet.<br/><small>Follow someone mutual to unlock chat.</small></p>';
            html += '<hr/><p><a href="/wap/add-friends">Find people to follow</a></p>';
        } else {
            chatItems.forEach(c => {
                html += \`<p><a href="/wap/chat/\${c.username}"><b>\${escapeXml(c.displayName)}</b></a>\`;
                if (c.unread > 0) html += \` <b>(\${c.unread} new)</b>\`;
                if (c.lastMsg) html += \`<br/><small>\${escapeXml(c.lastMsg)}</small>\`;
                html += '</p>';
            });
            html += '<hr/><p><a href="/wap/add-friends">Find more people</a></p>';
        }

        res.send(wapPage('Chats', html, { back: '/wap', user: req.session.user }));`;

if (src.includes(oldChat)) {
    src = src.replace(oldChat, function() { return newChat; });
    console.log('OK: chat list polished');
} else {
    console.log('WARN: chat list pattern not found');
}

// ===== NOTIFICATIONS =====
const oldNotif = `        res.send(wapPage('Notifications', requestItemsHtml || '<p>No new notifications.</p>', { back: '/wap', user: req.session.user }));`;

if (src.includes(oldNotif)) {
    console.log('OK: notifications route found');
} else {
    console.log('WARN: notifications pattern not found');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('routes/wap.js', src);
console.log('DONE');
