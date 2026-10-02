const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// require Notification
if (!src.includes("require('./models/Notification')")) {
    const m = src.match(/const Follow = require\('\.\/models\/Follow'\);/);
    if (m) {
        src = src.replace(m[0], m[0] + "\nconst Notification = require('./models/Notification');");
        console.log('OK: Notification required');
    }
}

// Home route — compute unread count
if (!src.includes('const homeUnreadCount')) {
    const homeStart = "app.get('/', async (req, res) => {";
    const homeIdx = src.indexOf(homeStart);
    if (homeIdx !== -1) {
        // Find the "const me = req.session.user;" inside home route
        const meIdx = src.indexOf('const me = req.session.user;', homeIdx);
        if (meIdx !== -1) {
            const insertPos = meIdx + 'const me = req.session.user;'.length;
            src = src.slice(0, insertPos) + "\n    const homeUnreadCount = await Notification.countDocuments({ recipient: me, seen: false });" + src.slice(insertPos);
            console.log('OK: home unread count computed');
        }
    }
}

// Home header — add bell icon next to search
const oldHomeHeader = `<h1 class="feed-title">Home</h1>
                <a href="/search" class="header-icon" title="Search">\${icons.search}</a>
                <span id="home-students-banner"></span>`;

const newHomeHeader = `<h1 class="feed-title">Home</h1>
                <a href="/search" class="header-icon" title="Search">\${icons.search}</a>
                <a href="/chat/notifications" class="header-icon header-icon-bell" title="Notifications">
                    \${icons.bell}
                    \${homeUnreadCount > 0 ? \`<span class="header-badge">\${homeUnreadCount}</span>\` : ''}
                </a>
                <span id="home-students-banner"></span>`;

if (src.includes(oldHomeHeader)) {
    src = src.replace(oldHomeHeader, function() { return newHomeHeader; });
    console.log('OK: home header search + bell');
} else {
    console.log('WARN: home header pattern not found');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('DONE');
