const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const usersFile = path.join(__dirname, '../data/users.json');

function getUsers() { return JSON.parse(fs.readFileSync(usersFile, 'utf-8')); }
function saveUsers(data) { fs.writeFileSync(usersFile, JSON.stringify(data, null, 2)); }

function generateRecoveryCodes() {
    const codes = [];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 3; i++) {
        let code = 'ELI-';
        for (let j = 0; j < 8; j++) {
            if (j === 4) code += '-';
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        codes.push(code);
    }
    return codes;
}

const icons = {
    userAdd: `<svg viewBox="0 0 24 24" style="width:40px;height:40px;fill:#3182ce;margin-bottom:10px;"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    check: `<svg viewBox="0 0 24 24" style="width:40px;height:40px;fill:#38a169;margin-bottom:10px;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    back: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`
};

router.get('/signup', (req, res) => {
    res.send(`
        <html><head><link rel="stylesheet" href="/style.css"></head><body>
        <div class="container center-screen">
            <div class="auth-box">
                ${icons.userAdd}
                <h2>Create Account</h2>
                <p class="subtitle">No email required. Just a full name, username, and password.</p>
                
                <form action="/auth/signup" method="POST">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" name="full_name" required placeholder="e.g., Abdullah Mohim">
                    </div>
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" name="username" required placeholder="Set username">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" name="password" required placeholder="Set password">
                    </div>
                    <button type="submit" class="btn-full">Sign Up</button>
                </form>
                
                <div class="auth-links">
                    Already have an account? <a href="/auth/login">Login</a>
                </div>
                <a href="/" class="back-home">${icons.back} Back to Home</a>
            </div>
        </div>
        </body></html>
    `);
});

router.post('/signup', async (req, res) => {
    const { full_name, username, password } = req.body;
    const data = getUsers();

    if (username.includes(' ')) {
        return res.send('Username cannot contain spaces. <a href="/auth/signup">Try again</a>');
    }

    if (data.users.find(u => u.username === username)) {
        return res.send('Sorry, this username is already taken. <a href="/auth/signup">Try again</a>');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const rawCodes = generateRecoveryCodes();
    const hashedCodes = rawCodes.map(code => ({ hash: bcrypt.hashSync(code, 10), used: false }));

    data.users.push({
        id: 'u_' + Date.now(),
        full_name: full_name,
        username: username,
        password_hash: hashedPassword,
        recovery_codes: hashedCodes,
        created_at: new Date().toISOString(),
        status: 'active'
    });
    saveUsers(data);

    res.send(`
        <html><head><link rel="stylesheet" href="/style.css"></head><body>
        <div class="container center-screen">
            <div class="auth-box">
                ${icons.check}
                <h2 style="color: #38a169;">Account Created!</h2>
                <p class="subtitle">Write down these 3 recovery codes. You will need them if you forget your password.</p>
                
                <div class="recovery-box">
                    <ul>
                        ${rawCodes.map(c => `<li>${c}</li>`).join('')}
                    </ul>
                </div>
                
                <p style="color: #e53e3e; font-weight: bold; margin-top: 15px; font-size: 0.9rem;">Warning: These codes will only be shown once!</p>
                
                <a href="/auth/login" class="btn-full" style="display:block; text-decoration:none; margin-top:20px;">Proceed to Login</a>
            </div>
        </div>
        </body></html>
    `);
});

router.get('/login', (req, res) => {
    res.send(`
        <html><head><link rel="stylesheet" href="/style.css"></head><body>
        <div class="container center-screen">
            <div class="auth-box">
                <h2>Welcome Back</h2>
                <p class="subtitle">Login to your EliGet account.</p>
                
                <form action="/auth/login" method="POST">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" name="username" required placeholder="Enter username">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" name="password" required placeholder="Enter password">
                    </div>
                    <button type="submit" class="btn-full">Login</button>
                </form>
                
                <div class="auth-links">
                    Don't have an account? <a href="/auth/signup">Sign Up</a>
                </div>
                <a href="/" class="back-home">${icons.back} Back to Home</a>
            </div>
        </div>
        </body></html>
    `);
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const data = getUsers();

    const user = data.users.find(u => u.username === username);
    if (!user) return res.send('User not found. <a href="/auth/login">Try again</a>');

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.send('Incorrect password. <a href="/auth/login">Try again</a>');

    req.session.user = username;
    res.redirect('/');
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
