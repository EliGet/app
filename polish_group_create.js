const fs = require('fs');
let src = fs.readFileSync('routes/group.js', 'utf8');
const before = src;

// Find the member items generation
const oldMemberHtml = `        let memberItemsHtml = '';
        for (const username of friendUsernames) {
            const u = await User.findOne({ username: username });
            if (!u) continue;
            const displayName = u.full_name || u.username;
            const initial = displayName.charAt(0).toUpperCase();
            const avatarUrl = u.avatar ? \`<img src="\${u.avatar}" alt="Avatar">\` : initial;
            memberItemsHtml += \`
                <label class="member-item">
                    <input type="checkbox" name="members" value="\${u.username}">
                    <div class="member-avatar">\${avatarUrl}</div>
                    <div class="member-info">
                        <div class="member-name">\${displayName}</div>
                        <div class="member-username">@\${u.username}</div>
                    </div>
                </label>
            \`;
        }`;

const newMemberHtml = `        let memberItemsHtml = '';
        for (const username of friendUsernames) {
            const u = await User.findOne({ username: username });
            if (!u) continue;
            const displayName = u.full_name || u.username;
            const initial = displayName.charAt(0).toUpperCase();
            const avatarUrl = u.avatar ? \`<img src="\${u.avatar}" alt="Avatar">\` : initial;
            memberItemsHtml += \`
                <label class="gc-member">
                    <input type="checkbox" name="members" value="\${u.username}">
                    <div class="gc-member-check">
                        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
                    </div>
                    <div class="gc-member-avatar">\${avatarUrl}</div>
                    <div class="gc-member-info">
                        <div class="gc-member-name">\${displayName}</div>
                        <div class="gc-member-username">@\${u.username}</div>
                    </div>
                </label>
            \`;
        }`;

if (src.includes(oldMemberHtml)) {
    src = src.replace(oldMemberHtml, function() { return newMemberHtml; });
    console.log('OK: member list restructured');
} else {
    console.log('WARN: member HTML pattern not found');
}

// Fix empty state
src = src.replace(
    "memberItemsHtml = '<p style=\"color:#718096; text-align:center; padding: 20px 0;\">You have no friends yet. Accept some chat requests first.</p>';",
    "memberItemsHtml = '<p class=\"gc-empty\">No one to add yet. Follow people first — mutual follows can be group members.</p>';"
);

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('routes/group.js', src);
console.log('DONE');
