const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');
const before = src;

// Find chat header icons block
const oldHeader = `                    <div class="header-actions">
                        <a href="/group/create" class="settings-icon" title="New Group">\${icons.group}</a>
                        <a href="/chat/new" class="settings-icon" title="Add Friends">\${icons.plus}</a>
                        <a href="/chat/notifications" class="settings-icon" title="Notifications">
                            \${icons.bell}
                            \${pendingCount > 0 ? \`<span class="badge">\${pendingCount}</span>\` : ''}
                        </a>
                    </div>`;

const newHeader = `                    <div class="header-actions">
                        <a href="/group/create" class="settings-icon" title="New Group">\${icons.group}</a>
                        <a href="/search" class="settings-icon" title="Search">\${icons.search}</a>
                        <a href="/chat/notifications" class="settings-icon" title="Notifications">
                            \${icons.bell}
                            \${pendingCount > 0 ? \`<span class="badge">\${pendingCount}</span>\` : ''}
                        </a>
                    </div>`;

if (src.includes(oldHeader)) {
    src = src.replace(oldHeader, function() { return newHeader; });
    console.log('OK: chat header icons updated');
} else {
    console.log('WARN: chat header pattern not found');
}

// Ensure search icon in chat.js icons
if (!src.includes('search: `<svg')) {
    const m = src.match(/(\n\s*home: `<svg[^\n]*`,\n)/);
    if (m) {
        const searchIcon = "    search: `<svg viewBox=\"0 0 24 24\"><path d=\"M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z\"/></svg>`,\n";
        src = src.replace(m[0], m[0] + searchIcon);
        console.log('OK: search icon added to chat.js');
    }
}

// /chat/new GET → redirect to /search
const newStart = "router.get('/new', async (req, res) => {";
const newEnd = "// ===== USER SEARCH API (for Find People) =====";
const ns = src.indexOf(newStart);
const ne = src.indexOf(newEnd);
if (ns !== -1 && ne !== -1 && ns < ne) {
    const redirectRoute = `router.get('/new', (req, res) => {
    res.redirect('/search');
});

`;
    src = src.slice(0, ns) + redirectRoute + src.slice(ne);
    console.log('OK: /chat/new → /search redirect');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/chat.js', src);
console.log('DONE');
