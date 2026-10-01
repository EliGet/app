const fs = require('fs');
let src = fs.readFileSync('routes/auth.js', 'utf8');

// Find the signup success block: starts at 4th occurrence pattern
const startMarker = `        res.send(\`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <title>Account Created - EliGet</title>`;

const start = src.indexOf(startMarker);
if (start === -1) { console.log('ERROR: start marker not found'); process.exit(1); }

// End: find the closing of this res.send — search for `\`);` after start, then the `} catch`
const endSearch = src.indexOf('} catch (error) {', start);
if (endSearch === -1) { console.log('ERROR: catch not found'); process.exit(1); }

// Walk back to find closing backtick + );
const end = src.lastIndexOf('`);', endSearch);
if (end === -1 || end < start) { console.log('ERROR: closing backtick not found'); process.exit(1); }

const newBlock = `        res.send(\`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
            <title>Recovery Codes - EliGet</title>
            </head><body class="au-body">
            <div class="au-wrap">

                <header class="au-topbar">
                    <a href="/" class="au-back" title="Home">\${icons.back}</a>
                    <span class="au-brand">EliGet</span>
                    <span class="au-spacer"></span>
                </header>

                <div class="au-card">
                    <div class="au-head">
                        <div class="rc-check">
                            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
                        </div>
                        <h1 class="au-title">Save your recovery codes</h1>
                        <p class="au-sub">These 3 codes are your only way back if you forget your password. Save them somewhere safe.</p>
                    </div>

                    <div class="rc-codes">
                        \${rawCodes.map((c, i) => \`<div class="rc-code"><span class="rc-code-num">\${i + 1}</span><code>\${c}</code></div>\`).join('')}
                    </div>

                    <div class="rc-warning">
                        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/></svg>
                        <span>Shown only once. You will not see these again.</span>
                    </div>

                    <a href="/auth/login" class="au-submit" style="text-decoration:none;">
                        Continue to login
                        <svg class="au-arrow" viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </a>
                </div>

            </div>
            </body></html>
        \`);`;

src = src.slice(0, start) + newBlock + src.slice(end + 3);
fs.writeFileSync('routes/auth.js', src);
console.log('OK: recovery codes screen replaced');
