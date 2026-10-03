const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// Replace actionBtn block with mutual follow logic
const oldBlock = `        let actionBtn = '';
        if (isFriend) {
            actionBtn = \`<a href="/chat/\${targetUsername}" class="pp-action-btn primary">Message</a>\`;
        } else if (pendingRequest && pendingRequest.from === me) {
            actionBtn = \`<button class="pp-action-btn disabled" disabled>Requested</button>\`;
        } else if (pendingRequest && pendingRequest.to === me) {
            actionBtn = \`<a href="/chat/notifications" class="pp-action-btn primary">Respond</a>\`;
        } else {
            actionBtn = \`<form action="/chat/request/\${targetUsername}" method="POST" style="margin:0; display:inline;">
                <button type="submit" class="pp-action-btn primary">Add Friend</button>
            </form>\`;
        }`;

const newBlock = `        // Message button only if mutual follow
        let actionBtn = '';
        if (isFollowing) {
            const theyFollowMe = await Follow.findOne({ follower: targetUsername, following: me });
            if (theyFollowMe) {
                actionBtn = \`<a href="/chat/\${targetUsername}" class="pp-action-btn primary">Message</a>\`;
            }
        }`;

if (src.includes(oldBlock)) {
    src = src.replace(oldBlock, function() { return newBlock; });
    console.log('OK: actionBtn replaced with mutual follow check');
} else {
    console.log('WARN: actionBtn block not found');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('server.js', src);
console.log('DONE');
