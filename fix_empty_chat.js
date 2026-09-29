const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// 1. Notifications empty — line 327
const old1 = `                <div class="chat-list">\${requestItemsHtml || '<p style="text-align:center; color:#a0aec0; padding:20px;">No new notifications.</p>'}</div>`;
const new1 = `                <div class="chat-list">\${requestItemsHtml || \`<div class="empty-state">
                    <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>
                    <h3>All caught up</h3>
                    <p>No new friend requests right now.</p>
                    <a href="/chat">Back to chats</a>
                </div>\`}</div>`;
if (src.includes(old1)) { src = src.replace(old1, function(){return new1;}); console.log('OK: notifications'); }
else { console.log('WARN: notifications empty not found'); }

// 2. Chat room (1-to-1) empty — line 379
const old2 = `            messagesHtml = '<p style="text-align:center; color:#a0aec0; padding: 20px;">No messages yet. Say hi!</p>';`;
const new2 = `            messagesHtml = \`<div class="empty-state empty-compact">
                <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                <h3>No messages yet</h3>
                <p>Say hi to start the conversation.</p>
            </div>\`;`;
if (src.includes(old2)) { src = src.replace(old2, function(){return new2;}); console.log('OK: chat room'); }
else { console.log('WARN: chat room empty not found'); }

// 3. Chat list empty — check
const chatListEmptyOld = `            let emptyMsg = 'No chats yet.';`;
if (src.includes(chatListEmptyOld)) {
    const chatListEmptyNew = `            let emptyMsg = \`<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                <h3>No conversations yet</h3>
                <p>Find a friend and start a chat.</p>
                <a href="/chat/new">Find friends</a>
            </div>\`;`;
    src = src.replace(chatListEmptyOld, function(){return chatListEmptyNew;});
    console.log('OK: chat list');
}

if (src === before) { console.log('ERROR: nothing changed in chat.js'); process.exit(1); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE chat.js');
