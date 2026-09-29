const fs = require('fs');
let src = fs.readFileSync('routes/wap.js', 'utf8');
const before = src;

// 1. Login GET — cleaner form
const oldLoginGet = `router.get('/login', (req, res) => {
    const body = \`
        <form action="/wap/login" method="POST">
            <p>Username:<br/><input type="text" name="username" size="12" maxlength="20"/></p>
            <p>Password:<br/><input type="password" name="password" size="12" maxlength="30"/></p>
            <p><input type="submit" value="Login"/></p>
        </form>
        <p><a href="/wap/signup">Signup</a></p>
    \`;
    res.send(wapPage('Login', body, { back: '/wap' , user: req.session.user }));
});`;

const newLoginGet = `router.get('/login', (req, res) => {
    const err = req.query.err ? \`<p><b>Error:</b> \${escapeXml(req.query.err)}</p><hr/>\` : '';
    const body = \`
        \${err}
        <form action="/wap/login" method="POST">
            <p>Username<br/><input type="text" name="username" size="14" maxlength="20"/></p>
            <p>Password<br/><input type="password" name="password" size="14" maxlength="30"/></p>
            <p><input type="submit" value="Login"/></p>
        </form>
        <hr/>
        <p><a href="/wap/signup">Create new account</a></p>
    \`;
    res.send(wapPage('Login', body, { back: '/wap', user: req.session.user }));
});`;

if (!src.includes(oldLoginGet)) { console.log('WARN: login get not found'); }
else {
    src = src.replace(oldLoginGet, function() { return newLoginGet; });
    console.log('OK: login GET polished');
}

// 2. Login POST — error as query params
const oldLoginPost = `router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.send(wapPage('Error', \`<p>User not found.</p><p><a href="/wap/login">Try again</a></p>\`));
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.send(wapPage('Error', \`<p>Wrong password.</p><p><a href="/wap/login">Try again</a></p>\`));
        }
        req.session.user = username;
        res.redirect('/wap');
    } catch (err) {
        res.send(wapPage('Error', \`<p>Something went wrong.</p><p><a href="/wap/login">Try again</a></p>\`));
    }
});`;

const newLoginPost = `router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.redirect('/wap/login?err=' + encodeURIComponent('Fill both fields.'));
        }
        const user = await User.findOne({ username });
        if (!user) {
            return res.redirect('/wap/login?err=' + encodeURIComponent('User not found.'));
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.redirect('/wap/login?err=' + encodeURIComponent('Wrong password.'));
        }
        req.session.user = username;
        res.redirect('/wap');
    } catch (err) {
        res.redirect('/wap/login?err=' + encodeURIComponent('Something went wrong.'));
    }
});`;

if (!src.includes(oldLoginPost)) { console.log('WARN: login post not found'); }
else {
    src = src.replace(oldLoginPost, function() { return newLoginPost; });
    console.log('OK: login POST polished');
}

// 3. Signup GET — clearer rules
const oldSignupGet = `router.get('/signup', (req, res) => {
    const body = \`
        <form action="/wap/signup" method="POST">
            <p>Full Name:<br/><input type="text" name="full_name" size="15" maxlength="30"/></p>
            <p>Username:<br/><input type="text" name="username" size="12" maxlength="20"/></p>
            <p>Password:<br/><input type="password" name="password" size="12" maxlength="30"/></p>
            <p><input type="submit" value="Signup"/></p>
        </form>
        <p><a href="/wap/login">Already have account? Login</a></p>
    \`;
    res.send(wapPage('Create Account', body, { back: '/wap' , user: req.session.user }));
});`;

const newSignupGet = `router.get('/signup', (req, res) => {
    const err = req.query.err ? \`<p><b>Error:</b> \${escapeXml(req.query.err)}</p><hr/>\` : '';
    const body = \`
        \${err}
        <form action="/wap/signup" method="POST">
            <p>Full name<br/><input type="text" name="full_name" size="16" maxlength="50"/></p>
            <p>Username<br/><input type="text" name="username" size="14" maxlength="20"/></p>
            <p><small>Letters, numbers, underscore. 3-20 chars.</small></p>
            <p>Password<br/><input type="password" name="password" size="14" maxlength="30"/></p>
            <p><small>At least 6 characters.</small></p>
            <p><input type="submit" value="Create Account"/></p>
        </form>
        <hr/>
        <p><a href="/wap/login">Already have an account? Login</a></p>
    \`;
    res.send(wapPage('Create Account', body, { back: '/wap', user: req.session.user }));
});`;

if (!src.includes(oldSignupGet)) { console.log('WARN: signup get not found'); }
else {
    src = src.replace(oldSignupGet, function() { return newSignupGet; });
    console.log('OK: signup GET polished');
}

// 4. Signup POST — validation + redirect errors
const oldSignupPost = `router.post('/signup', async (req, res) => {
    try {
        const { full_name, username, password } = req.body;

        if (username.includes(' ')) {
            return res.send(wapPage('Error', \`<p>No spaces in username.</p><p><a href="/wap/signup">Try again</a></p>\`));
        }

        const existing = await User.findOne({ username });
        if (existing) {
            return res.send(wapPage('Error', \`<p>Username taken.</p><p><a href="/wap/signup">Try again</a></p>\`));
        }`;

const newSignupPost = `router.post('/signup', async (req, res) => {
    try {
        const { full_name, username, password } = req.body;

        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username || '')) {
            return res.redirect('/wap/signup?err=' + encodeURIComponent('Username: 3-20 letters, numbers, underscore.'));
        }
        if (!password || password.length < 6) {
            return res.redirect('/wap/signup?err=' + encodeURIComponent('Password needs 6+ characters.'));
        }

        const existing = await User.findOne({ username });
        if (existing) {
            return res.redirect('/wap/signup?err=' + encodeURIComponent('Username already taken.'));
        }`;

if (!src.includes(oldSignupPost)) { console.log('WARN: signup post not found'); }
else {
    src = src.replace(oldSignupPost, function() { return newSignupPost; });
    console.log('OK: signup POST polished');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/wap.js', src);
console.log('DONE');
