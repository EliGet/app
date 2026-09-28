const fs = require('fs');

// ===== chat.js =====
let chat = fs.readFileSync('routes/chat.js', 'utf8');

// 1. back arrow SVG বাঁ দিকে point করার জন্য বদল
const oldBackChat = "    back: `<svg viewBox=\"0 0 24 24\"><path d=\"M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z\"/></svg>`,";
const newBackChat = "    back: `<svg viewBox=\"0 0 24 24\"><path d=\"M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z\"/></svg>`,";
if (!chat.includes(oldBackChat)) { console.log('ERROR: chat.js back icon not found'); process.exit(1); }
chat = chat.replace(oldBackChat, newBackChat);

// 2. header-এ back arrow বাঁয়ে, user info পরে
const oldChatHeader = `                <header>
                    <div class="chat-header-user">
                        <div class="chat-header-avatar">\${otherAvatarUrl}</div>
                        <span class="profile-title">\${displayName}</span>
                    </div>
                    <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                </header>`;
const newChatHeader = `                <header>
                    <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                    <div class="chat-header-user">
                        <div class="chat-header-avatar">\${otherAvatarUrl}</div>
                        <span class="profile-title">\${displayName}</span>
                    </div>
                </header>`;
if (!chat.includes(oldChatHeader)) { console.log('ERROR: chat.js header not found'); process.exit(1); }
chat = chat.replace(oldChatHeader, newChatHeader);

fs.writeFileSync('routes/chat.js', chat);
console.log('OK: chat.js header fixed');

// ===== group.js =====
let grp = fs.readFileSync('routes/group.js', 'utf8');

// 1. back arrow SVG
const oldBackGrp = "    back: `<svg viewBox=\"0 0 24 24\"><path d=\"M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z\"/></svg>`,";
const newBackGrp = "    back: `<svg viewBox=\"0 0 24 24\"><path d=\"M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z\"/></svg>`,";
if (!grp.includes(oldBackGrp)) { console.log('ERROR: group.js back icon not found'); process.exit(1); }
grp = grp.replace(oldBackGrp, newBackGrp);

// 2. group header-এ back বাঁয়ে
const oldGrpHeader = `                <header>
                    <span class="profile-title">\${displayTitle}</span>
                    <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                </header>`;
const newGrpHeader = `                <header>
                    <a href="/chat" class="header-icon" title="Back">\${icons.back}</a>
                    <span class="profile-title" style="flex:1;">\${displayTitle}</span>
                </header>`;
if (!grp.includes(oldGrpHeader)) { console.log('ERROR: group.js header not found'); process.exit(1); }
grp = grp.replace(oldGrpHeader, newGrpHeader);

fs.writeFileSync('routes/group.js', grp);
console.log('OK: group.js header fixed');

console.log('DONE');
