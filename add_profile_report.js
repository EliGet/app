const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// Find profile block menu — currently only Block/Unblock
const oldMenu = `                \${!isBlockedByThem ? \`
                    <div class="pp-block-menu" id="blockMenu">
                        <button type="button" class="pp-block-item \${isBlocked ? 'unblock' : 'block'}" onclick="toggleBlock('\${targetUsername}', \${isBlocked ? 'true' : 'false'})">
                            \${isBlocked ? 'Unblock user' : 'Block user'}
                        </button>
                    </div>
                \` : ''}`;

const newMenu = `                \${!isBlockedByThem ? \`
                    <div class="pp-block-menu" id="blockMenu">
                        <button type="button" class="pp-block-item \${isBlocked ? 'unblock' : 'block'}" onclick="toggleBlock('\${targetUsername}', \${isBlocked ? 'true' : 'false'})">
                            \${isBlocked ? 'Unblock user' : 'Block user'}
                        </button>
                        <button type="button" class="pp-block-item report" onclick="toggleProfileMenuClose();rpOpen('user','\${targetUsername}')">
                            Report user
                        </button>
                    </div>
                \` : ''}`;

if (src.includes(oldMenu)) {
    src = src.replace(oldMenu, function() { return newMenu; });
    console.log('OK: profile report menu added');
} else {
    console.log('WARN: profile menu pattern not found');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('server.js', src);
console.log('DONE');
