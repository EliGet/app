const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// Find menu condition — currently only shows for own posts
const oldMenu = `    let menuHtml = '';
    if (currentUser && currentUser === p.author && canModifyPost(p.created_at)) {`;

const newMenu = `    let menuHtml = '';
    if (currentUser && currentUser !== p.author) {
        // Report option for other users' posts
        menuHtml = \`
            <div class="post-menu-wrapper">
                <button type="button" class="post-menu-btn" onclick="togglePostMenu(event, '\${p._id}')">
                    <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                </button>
                <div class="post-menu-dropdown" id="menu-\${p._id}">
                    <button type="button" class="post-menu-item danger" onclick="closePostMenus();rpOpen('post','\${p._id}')">
                        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                        Report
                    </button>
                </div>
            </div>
        \`;
    } else if (currentUser && currentUser === p.author && canModifyPost(p.created_at)) {`;

if (src.includes(oldMenu)) {
    src = src.replace(oldMenu, function() { return newMenu; });
    console.log('OK: post card report menu added');
} else {
    console.log('WARN: menu condition not found');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('server.js', src);
console.log('DONE');
