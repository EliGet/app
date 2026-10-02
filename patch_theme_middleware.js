const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// Add head injection for theme script
const oldMid = `        if (typeof body === 'string' && body.includes('</body>') && !body.includes('/love.js')) {
            body = body.replace('</body>', '<script src="/love.js"></script><script src="/follow.js"></script><script src="/report.js"></script></body>');
        }`;

const newMid = `        if (typeof body === 'string' && body.includes('<head>') && !body.includes('eliget-theme-init')) {
            body = body.replace('<head>', '<head><script id="eliget-theme-init">(function(){try{var t=localStorage.getItem("eliget-theme")||"light";if(t==="dark")document.documentElement.setAttribute("data-theme","dark");}catch(e){}})();</script>');
        }
        if (typeof body === 'string' && body.includes('</body>') && !body.includes('/love.js')) {
            body = body.replace('</body>', '<script src="/love.js"></script><script src="/follow.js"></script><script src="/report.js"></script></body>');
        }`;

if (src.includes(oldMid)) {
    src = src.replace(oldMid, function() { return newMid; });
    console.log('OK: theme middleware patched');
} else {
    console.log('WARN: middleware pattern not found');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('server.js', src);
console.log('DONE');
