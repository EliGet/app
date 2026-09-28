const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// 1. Direct chat item-এ unread class
const oldDirectItem = `                    <a href="/chat/\${otherUsername}" class="chat-item" data-search="\${displayName.toLowerCase()} \${otherUsername.toLowerCase()}">`;
const newDirectItem = `                    <a href="/chat/\${otherUsername}" class="chat-item\${isUnread ? ' unread' : ''}" data-search="\${displayName.toLowerCase()} \${otherUsername.toLowerCase()}">`;
if (!src.includes(oldDirectItem)) { console.log('ERROR: direct chat-item not found'); process.exit(1); }
src = src.replace(oldDirectItem, newDirectItem);
console.log('OK: direct chat unread class');

// 2. Group chat item-এ unread class
const oldGroupItem = `                    <a href="/group/\${g._id}" class="chat-item" data-search="\${g.name.toLowerCase()}">`;
const newGroupItem = `                    <a href="/group/\${g._id}" class="chat-item\${isUnread ? ' unread' : ''}" data-search="\${g.name.toLowerCase()}">`;
if (!src.includes(oldGroupItem)) { console.log('ERROR: group chat-item not found'); process.exit(1); }
src = src.replace(oldGroupItem, newGroupItem);
console.log('OK: group chat unread class');

// 3. Empty preview-এ class (No messages yet)
const oldEmptyPreview = `                    <div class="chat-preview">\${lastMsgText}</div>`;
// এটা দুইবার আছে (direct + group) — দুটোতেই apply
let count = 0;
src = src.replace(/<div class="chat-preview">\$\{lastMsgText\}<\/div>/g, (m) => {
    count++;
    return `<div class="chat-preview\${!lastMsg ? ' empty' : ''}">\${lastMsgText}</div>`;
});
if (count < 2) { console.log('WARN: only ' + count + ' chat-preview found, expected 2'); }
else { console.log('OK: ' + count + ' chat-preview updated'); }

// 4. Group message preview-এ sender bold
const oldGroupMsg = "                    lastMsgText = `${lastMsg.from}: ${lastMsg.body}`;";
const newGroupMsg = "                    lastMsgText = `<strong class=\"sender\">${lastMsg.from}</strong>: ${lastMsg.body}`;";
if (!src.includes(oldGroupMsg)) { console.log('ERROR: group msg preview not found'); process.exit(1); }
src = src.replace(oldGroupMsg, newGroupMsg);
console.log('OK: group sender bold');

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE');
