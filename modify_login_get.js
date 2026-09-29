const fs = require('fs');
let src = fs.readFileSync('routes/auth.js', 'utf8');
const before = src;

// Add addMode var after errorMsg line
const oldLine = `    const errorMsg = req.query.error || '';
    const usernameVal = (req.query.u || '').replace(/"/g, '&quot;');
    const errorHtml = errorMsg ? \`<div class="au-error">\${errorMsg}</div>\` : '';`;

const newLine = `    const errorMsg = req.query.error || '';
    const usernameVal = (req.query.u || '').replace(/"/g, '&quot;');
    const errorHtml = errorMsg ? \`<div class="au-error">\${errorMsg}</div>\` : '';
    const addMode = req.query.add === '1' && req.session.user;
    const title = addMode ? 'Add account' : 'Welcome back';
    const sub = addMode ? 'Sign in to another account. You can switch anytime.' : 'Text-only. No algorithms. Just thoughts.';
    const backHref = addMode ? '/settings' : '/';
    const switchText = addMode ? \`<a href="/settings">Cancel</a>\` : \`New here? <a href="/auth/signup">Create an account</a>\`;`;

if (!src.includes(oldLine)) { console.log('ERROR: login get head not found'); process.exit(1); }
src = src.replace(oldLine, function() { return newLine; });
console.log('OK: vars added');

// Update header back link
const oldBack = `                <a href="/" class="au-back" title="Back">\${icons.back}</a>`;
const newBack = `                <a href="\${backHref}" class="au-back" title="Back">\${icons.back}</a>`;
// Might appear in multiple routes — only replace within login route
// Safer: replace once via indexOf
const loginStart = src.indexOf("router.get('/login'");
const loginEnd = src.indexOf("router.post('/login'");
if (loginStart === -1 || loginEnd === -1) { console.log('ERROR: login block boundaries not found'); process.exit(1); }

let loginBlock = src.slice(loginStart, loginEnd);
loginBlock = loginBlock.replace(oldBack, newBack);
console.log('OK: back link updated in login');

// Update title
const oldTitle = `                    <h1 class="au-title">Welcome back</h1>
                    <p class="au-sub">Text-only. No algorithms. Just thoughts.</p>`;
const newTitle = `                    <h1 class="au-title">\${title}</h1>
                    <p class="au-sub">\${sub}</p>`;
if (loginBlock.includes(oldTitle)) {
    loginBlock = loginBlock.replace(oldTitle, newTitle);
    console.log('OK: title sub updated');
} else {
    console.log('WARN: title block not found');
}

// Update switch text
const oldSwitch = `                <div class="au-switch">
                    New here? <a href="/auth/signup">Create an account</a>
                </div>`;
const newSwitch = `                <div class="au-switch">
                    \${switchText}
                </div>`;
if (loginBlock.includes(oldSwitch)) {
    loginBlock = loginBlock.replace(oldSwitch, newSwitch);
    console.log('OK: switch updated');
} else {
    console.log('WARN: switch block not found');
}

// Add hidden input for add mode
const oldForm = `                <form action="/auth/login" method="POST" class="au-form">`;
const newForm = `                <form action="/auth/login" method="POST" class="au-form">
                    \${addMode ? '<input type="hidden" name="add_account" value="1">' : ''}`;
if (loginBlock.includes(oldForm)) {
    loginBlock = loginBlock.replace(oldForm, newForm);
    console.log('OK: hidden input added');
} else {
    console.log('WARN: form tag not found');
}

src = src.slice(0, loginStart) + loginBlock + src.slice(loginEnd);
fs.writeFileSync('routes/auth.js', src);
console.log('DONE');
