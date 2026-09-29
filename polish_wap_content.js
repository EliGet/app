const fs = require('fs');
let src = fs.readFileSync('routes/wap.js', 'utf8');
const before = src;

// Feed — cleaner pagination + author format
const oldFeed = `                html += \`<p>\${skip + i + 1}. <b>\${escapeXml(displayName)}</b><br/>\${escapeXml(body)}\${readMore}</p>\`;
            }

            // Pagination
            html += '<hr/>';
            if (page > 1) {
                html += \`<a href="/wap/feed?page=\${page - 1}">Previous</a> \`;
            }
            html += \`[Page \${page} of \${totalPages}] \`;
            if (page < totalPages) {
                html += \`<a href="/wap/feed?page=\${page + 1}">Next</a>\`;
            }`;

const newFeed = `                html += \`<p><b>\${escapeXml(displayName)}</b><br/>\${escapeXml(body)}\${readMore}</p>\`;
            }

            // Pagination
            html += '<hr/>';
            if (page > 1) {
                html += \`<a href="/wap/feed?page=\${page - 1}">[ Previous ]</a>  \`;
            }
            html += \`<small>Page \${page}/\${totalPages}</small>\`;
            if (page < totalPages) {
                html += \`  <a href="/wap/feed?page=\${page + 1}">[ Next ]</a>\`;
            }`;

if (!src.includes(oldFeed)) { console.log('WARN: feed pattern not found'); }
else {
    src = src.replace(oldFeed, function() { return newFeed; });
    console.log('OK: feed pagination polished');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/wap.js', src);
console.log('DONE');
