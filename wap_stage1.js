const fs = require('fs');
let src = fs.readFileSync('routes/wap.js', 'utf8');
const before = src;

const oldFn = `function wapPage(title, body, options = {}) {
    const autoRefresh = options.refresh
        ? \`<meta http-equiv="refresh" content="\${options.refresh}"/>\`
        : '';
    const user = options.user || '';
    const userParam = user ? '?u=' + encodeURIComponent(user) : '';
    const backUrl = options.back ? (options.back + userParam) : '';

    // Auto-append ?u= to all /wap links in body if user is set
    let processedBody = body;
    if (user) {
        processedBody = body.replace(/href="(\\/wap[^"]*?)"/g, (match, url) => {
            if (url.includes('?')) {
                return \`href="\${url}&u=\${encodeURIComponent(user)}"\`;
            } else {
                return \`href="\${url}?u=\${encodeURIComponent(user)}"\`;
            }
        });
    }

    // Only show "Back" if the caller explicitly requested it (not Home)
    const backLink = backUrl
        ? \`<p><a href="\${backUrl}">[ Back ]</a>  <a href="/wap\${userParam}">[ Home ]</a></p>\`
        : '';

    const userLine = user
        ? \`<p><small>Signed in as <b>\${escapeXml(user)}</b></small></p>\`
        : '';

    return \`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.0//EN" "http://www.wapforum.org/DTD/xhtml-mobile10.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
\${autoRefresh}
<title>\${escapeXml(title)} - EliGet</title>
</head>
<body>
<h1>\${escapeXml(title)}</h1>
<hr/>
\${processedBody}
<hr/>
\${backLink}
\${userLine}
<p><small><b>EliGet</b><br/>Text-only network</small></p>
</body>
</html>\`;
}`;

const newFn = `function wapPage(title, body, options = {}) {
    const autoRefresh = options.refresh
        ? \`<meta http-equiv="refresh" content="\${options.refresh}"/>\`
        : '';
    const user = options.user || '';
    const userParam = user ? '?u=' + encodeURIComponent(user) : '';
    const backUrl = options.back ? (options.back + userParam) : '';

    // Auto-append ?u= to all /wap links in body if user is set
    let processedBody = body;
    if (user) {
        processedBody = body.replace(/href="(\\/wap[^"]*?)"/g, (match, url) => {
            if (url.includes('?')) {
                return \`href="\${url}&u=\${encodeURIComponent(user)}"\`;
            } else {
                return \`href="\${url}?u=\${encodeURIComponent(user)}"\`;
            }
        });
    }

    // Top nav bar: Back + Home (classic WAP style)
    const topNav = backUrl
        ? \`<p><a href="\${backUrl}">&lt;&lt; Back</a> | <a href="/wap\${userParam}">Home</a></p>\`
        : '<p><b>EliGet</b></p>';

    const userLine = user
        ? \`<p><small>You: <b>\${escapeXml(user)}</b></small></p>\`
        : '';

    return \`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.0//EN" "http://www.wapforum.org/DTD/xhtml-mobile10.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
\${autoRefresh}
<title>\${escapeXml(title)} - EliGet</title>
</head>
<body>
\${topNav}
<h1>\${escapeXml(title)}</h1>
<hr/>
\${processedBody}
<hr/>
\${userLine}
<p><small>EliGet - Text-only network</small></p>
</body>
</html>\`;
}`;

if (src.includes(oldFn)) {
    src = src.replace(oldFn, function() { return newFn; });
    console.log('OK: wapPage redesigned');
} else {
    console.log('WARN: wapPage pattern not found');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('routes/wap.js', src);
console.log('DONE');
