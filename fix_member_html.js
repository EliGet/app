const fs = require('fs');
let src = fs.readFileSync('routes/group.js', 'utf8');
const before = src;

const oldHtml = `            memberItemsHtml += \`
                <label class="member-item">
                    <input type="checkbox" name="members" value="\${u.username}">
                    <div class="member-avatar">\${avatarUrl}</div>
                    <div class="member-info">
                        <div class="member-name">\${displayName}</div>
                        <div class="member-username">@\${u.username}</div>
                    </div>
                </label>
            \`;`;

const newHtml = `            memberItemsHtml += \`
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
            \`;`;

if (src.includes(oldHtml)) {
    src = src.replace(oldHtml, function() { return newHtml; });
    console.log('OK: member HTML updated');
} else {
    console.log('WARN: exact pattern not found — trying loose match');
    // Fallback: just replace class names
    src = src.replace(/member-item/g, 'gc-member');
    src = src.replace(/member-avatar/g, 'gc-member-avatar');
    src = src.replace(/member-info/g, 'gc-member-info');
    src = src.replace(/member-name/g, 'gc-member-name');
    src = src.replace(/member-username/g, 'gc-member-username');
    console.log('OK: fallback used — classes renamed');
}

// Fix empty state
src = src.replace(
    /<p style="color:#718096; text-align:center; padding: 20px 0;">You have no friends yet\. Accept some chat requests first\.<\/p>/,
    '<p class="gc-empty">No one to add yet. Follow people first — mutual follows can be group members.</p>'
);

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('routes/group.js', src);
console.log('DONE');
