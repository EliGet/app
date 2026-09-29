const fs = require('fs');

function dayLabel(date) {
    const now = new Date();
    const d = new Date(date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.floor((today - msgDay) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ===== chat.js =====
let chat = fs.readFileSync('routes/chat.js', 'utf8');
const chatOld = `            messages.forEach(m => {
                const isMe = m.from === me;`;
const chatNew = `            let lastDay = null;
            messages.forEach(m => {
                const isMe = m.from === me;
                const dLabel = (function(dt){
                    const now = new Date();
                    const d = new Date(dt);
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    const diff = Math.floor((today - msgDay) / 86400000);
                    if (diff === 0) return 'Today';
                    if (diff === 1) return 'Yesterday';
                    if (diff < 7) return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
                    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                })(m.created_at);
                if (dLabel !== lastDay) {
                    messagesHtml += '<div class="msg-day-divider"><span>' + dLabel + '</span></div>';
                    lastDay = dLabel;
                }`;

if (chat.includes(chatOld)) {
    chat = chat.replace(chatOld, chatNew);
    fs.writeFileSync('routes/chat.js', chat);
    console.log('OK: chat.js day divider');
} else {
    console.log('WARN: chat.js loop pattern not found');
}

// ===== group.js =====
let grp = fs.readFileSync('routes/group.js', 'utf8');
const grpOld = `            let lastSender = null;
            for (const m of messages) {
                const isMe = m.from === me;`;
const grpNew = `            let lastSender = null;
            let lastDay = null;
            for (const m of messages) {
                const isMe = m.from === me;
                const dLabel = (function(dt){
                    const now = new Date();
                    const d = new Date(dt);
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    const diff = Math.floor((today - msgDay) / 86400000);
                    if (diff === 0) return 'Today';
                    if (diff === 1) return 'Yesterday';
                    if (diff < 7) return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
                    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                })(m.created_at);
                if (dLabel !== lastDay) {
                    messagesHtml += '<div class="msg-day-divider"><span>' + dLabel + '</span></div>';
                    lastDay = dLabel;
                    lastSender = null;
                }`;

if (grp.includes(grpOld)) {
    grp = grp.replace(grpOld, grpNew);
    fs.writeFileSync('routes/group.js', grp);
    console.log('OK: group.js day divider');
} else {
    console.log('WARN: group.js loop pattern not found');
}
