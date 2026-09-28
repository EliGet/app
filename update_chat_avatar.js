const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// 1. Received message block থেকে avatar বাদ
const oldReceived = `                } else {
                    messagesHtml += \`
                        <div class="msg-row received">
                            <div class="msg-avatar">\${otherAvatarUrl}</div>
                            <div class="msg-content">
                                <div class="msg-bubble msg-received-bubble">\${m.body}</div>
                            </div>
                        </div>
                    \`;
                }`;
const newReceived = `                } else {
                    messagesHtml += \`
                        <div class="msg-row received">
                            <div class="msg-content">
                                <div class="msg-bubble msg-received-bubble">\${m.body}</div>
                            </div>
                        </div>
                    \`;
                }`;
if (!src.includes(oldReceived)) { console.log('ERROR: received block not found'); process.exit(1); }
src = src.replace(oldReceived, newReceived);
console.log('OK: avatar removed from message bubble');

// 2. Header-এ avatar + name
const oldHeader = `                <header>
                    <span class="profile-title">\${displayName}</span>
                    <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                </header>`;
const newHeader = `                <header>
                    <div class="chat-header-user">
                        <div class="chat-header-avatar">\${otherAvatarUrl}</div>
                        <span class="profile-title">\${displayName}</span>
                    </div>
                    <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                </header>`;
if (!src.includes(oldHeader)) { console.log('ERROR: header not found'); process.exit(1); }
src = src.replace(oldHeader, newHeader);
console.log('OK: header updated with avatar');

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE');
