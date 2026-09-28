const fs = require('fs');
let src = fs.readFileSync('routes/group.js', 'utf8');
const before = src;

// 1. Received message-এ sender name label add
const oldReceived = `                    messagesHtml += \`
                        <div class="msg-row received">
                            <div class="msg-avatar">\${avatarUrl}</div>
                            <div class="msg-content">
                                <div class="msg-bubble msg-received-bubble">\${m.body}</div>
                            </div>
                        </div>
                    \`;`;
const newReceived = `                    messagesHtml += \`
                        <div class="msg-row received">
                            <div class="msg-avatar">\${avatarUrl}</div>
                            <div class="msg-content">
                                <div class="msg-sender-name">\${senderName}</div>
                                <div class="msg-bubble msg-received-bubble">\${m.body}</div>
                            </div>
                        </div>
                    \`;`;
if (!src.includes(oldReceived)) { console.log('ERROR: received block not found'); process.exit(1); }
src = src.replace(oldReceived, newReceived);
console.log('OK: sender name label added to received messages');

// 2. displayTitle-এ members count inline
const oldTitle = `        const displayTitle = \`<span style="display:flex; align-items:center;">\${groupAvatarUrl} \${group.name}</span>\`;`;
const newTitle = `        const displayTitle = \`<span style="display:flex; align-items:center;">\${groupAvatarUrl} \${group.name}<span class="group-member-count">\${group.members.length} members</span></span>\`;`;
if (!src.includes(oldTitle)) { console.log('ERROR: displayTitle not found'); process.exit(1); }
src = src.replace(oldTitle, newTitle);
console.log('OK: members count moved into header');

// 3. পুরনো separate members <p> line remove
const oldMembersLine = `                <p style="font-size:0.8rem; color:#718096; margin-bottom: 15px;">\${group.members.length} members</p>\n`;
if (!src.includes(oldMembersLine)) { console.log('ERROR: members <p> line not found'); process.exit(1); }
src = src.replace(oldMembersLine, '');
console.log('OK: standalone members line removed');

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/group.js', src);
console.log('DONE');
