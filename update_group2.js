const fs = require('fs');
let src = fs.readFileSync('routes/group.js', 'utf8');
const before = src;

// 1. Loop-এর আগে lastSender variable declare
const oldLoopStart = `        let messagesHtml = '';
        if (messages.length === 0) {
            messagesHtml = '<p style="text-align:center; color:#a0aec0; padding: 20px;">No messages yet. Start the conversation!</p>';
        } else {
            for (const m of messages) {
                const isMe = m.from === me;`;
const newLoopStart = `        let messagesHtml = '';
        if (messages.length === 0) {
            messagesHtml = '<p style="text-align:center; color:#a0aec0; padding: 20px;">No messages yet. Start the conversation!</p>';
        } else {
            let lastSender = null;
            for (const m of messages) {
                const isMe = m.from === me;`;
if (!src.includes(oldLoopStart)) { console.log('ERROR: loop start not found'); process.exit(1); }
src = src.replace(oldLoopStart, newLoopStart);
console.log('OK: lastSender var added');

// 2. Received message block replace (avatar বাদ, label conditional)
const oldReceived = `                } else {
                    messagesHtml += \`
                        <div class="msg-row received">
                            <div class="msg-avatar">\${avatarUrl}</div>
                            <div class="msg-content">
                                <div class="msg-sender-name">\${senderName}</div>
                                <div class="msg-bubble msg-received-bubble">\${m.body}</div>
                            </div>
                        </div>
                    \`;
                }`;
const newReceived = `                } else {
                    const showLabel = (m.from !== lastSender);
                    const labelHtml = showLabel ? \`<div class="msg-sender-name">\${senderName}</div>\` : '';
                    messagesHtml += \`
                        <div class="msg-row received \${showLabel ? 'has-label' : 'no-label'}">
                            <div class="msg-content">
                                \${labelHtml}
                                <div class="msg-bubble msg-received-bubble">\${m.body}</div>
                            </div>
                        </div>
                    \`;
                }
                lastSender = m.from;`;
if (!src.includes(oldReceived)) { console.log('ERROR: received block not found'); process.exit(1); }
src = src.replace(oldReceived, newReceived);
console.log('OK: received block updated');

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/group.js', src);
console.log('DONE');
