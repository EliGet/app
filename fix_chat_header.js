const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

const oldHeader = `                    <div class="chat-header-user">
                        <div class="chat-header-avatar">\${otherAvatarUrl}</div>
                        <span class="profile-title">\${displayName}</span>
                    </div>`;

const newHeader = `                    <a href="/profile/\${withUser}" class="chat-header-user">
                        <div class="chat-header-avatar">\${otherAvatarUrl}</div>
                        <span class="profile-title">\${displayName}</span>
                    </a>`;

if (!src.includes(oldHeader)) { console.log('ERROR: header not found'); process.exit(1); }
src = src.replace(oldHeader, function() { return newHeader; });
fs.writeFileSync('routes/chat.js', src);
console.log('OK: chat header linked to profile');
