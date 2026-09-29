const fs = require('fs');
let src = fs.readFileSync('lib/linkify.js', 'utf8');

// Add linkifySimple before module.exports
const oldExport = `module.exports = { linkify: linkify, escapeHtml: escapeHtml };`;
const newExport = `// Simple linkify — URLs + mentions, no video preview
function linkifySimple(text) {
    if (text === null || text === undefined) return '';
    const str = String(text);
    if (!str) return '';

    const escaped = escapeHtml(str);
    const parts = escaped.split(/(https?:\\/\\/[^\\s<]+)/);

    return parts.map(function(part, i) {
        if (i % 2 === 1) {
            let url = part;
            let trail = '';
            while (url && /[.,!?;:)\\]]$/.test(url)) {
                trail = url.slice(-1) + trail;
                url = url.slice(0, -1);
            }
            return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="elink">' + url + '</a>' + trail;
        }
        return part.replace(/(^|[^a-zA-Z0-9_])@([a-zA-Z0-9_]{3,20})/g, function(_, pre, un) {
            return pre + '<a href="/profile/' + un + '" class="elink elink-mention">@' + un + '</a>';
        });
    }).join('');
}

module.exports = { linkify: linkify, linkifySimple: linkifySimple, escapeHtml: escapeHtml };`;

if (!src.includes('function linkifySimple')) {
    src = src.replace(oldExport, function() { return newExport; });
    fs.writeFileSync('lib/linkify.js', src);
    console.log('OK: linkifySimple added');
} else {
    console.log('WARN: linkifySimple already present');
}
