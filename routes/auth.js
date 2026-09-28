const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

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
    back: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`,
    check: `<svg viewBox="0 0 24 24" style="width:56px;height:56px;fill:#38a169;margin-bottom:12px;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
};

// ===== LOGIN PAGE =====
router.get('/login', (req, res) => {
    res.send(`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <title>Login - EliGet</title>
        </head><body>
        <div class="auth-page">
            <div class="auth-topbar">
                <a href="/" class="auth-back-icon" title="Back to Home">${icons.back}</a>
            </div>

            <div class="auth-card">
                <div class="auth-brand">
                    <p class="auth-welcome-to">Welcome back to</p>
                    <h1 class="elget-wordmark elget-wordmark-lg" style="margin: 0;">EliGet</h1>
                    <p class="auth-tagline">Text-only, anti-addiction network.</p>
                </div>

                <form action="/auth/login" method="POST">
                    <div class="auth-field">
                        <label>Username</label>
                        <input type="text" name="username" required placeholder="Enter your username" autocomplete="username">
                    </div>
                    <div class="auth-field">
                        <label>Password</label>
                        <input type="password" name="password" required placeholder="Enter your password" autocomplete="current-password">
                    </div>
                    <a href="/auth/recover" class="auth-forgot">Forgot password?</a>
                    <button type="submit" class="auth-submit">Login</button>
                </form>

                <div class="auth-switch">
                    Don't have an account? <a href="/auth/signup">Sign Up</a>
                </div>
            </div>
        </div>
        </body></html>
    `);
});

// ===== LOGIN POST =====
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.send('User not found. <a href="/auth/login">Try again</a>');

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.send('Incorrect password. <a href="/auth/login">Try again</a>');

        req.session.user = username;
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.send('Something went wrong. <a href="/auth/login">Try again</a>');
    }
});

// ===== SIGNUP PAGE =====
router.get('/signup', (req, res) => {
    res.send(`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <title>Sign Up - EliGet</title>
        </head><body>
        <div class="auth-page">
            <div class="auth-topbar">
                <a href="/" class="auth-back-icon" title="Back to Home">${icons.back}</a>
            </div>

            <div class="auth-card">
                <div class="auth-brand">
                    <p class="auth-welcome-to">Join</p>
                    <h1 class="elget-wordmark elget-wordmark-lg" style="margin: 0;">EliGet</h1>
                    <p class="auth-tagline">Text-only, anti-addiction network.</p>
                </div>

                <form action="/auth/signup" method="POST">
                    <div class="auth-field">
                        <label>Full Name</label>
                        <input type="text" name="full_name" required placeholder="e.g., Abdullah Mohim">
                    </div>
                    <div class="auth-field">
                        <label>Username</label>
                        <input type="text" name="username" required placeholder="Choose a unique username">
                    </div>
                    <div class="auth-field">
                        <label>Password</label>
                        <input type="password" name="password" required placeholder="Min 6 characters">
                    </div>
                    <button type="submit" class="auth-submit">Create Account</button>
                </form>

                <div class="auth-switch">
                    Already have an account? <a href="/auth/login">Login</a>
                </div>
            </div>
        </div>
        </body></html>
    `);
});

// ===== SIGNUP POST =====
router.post('/signup', async (req, res) => {
    try {
        const { full_name, username, password } = req.body;

        if (username.includes(' ')) {
            return res.send('Username cannot contain spaces. <a href="/auth/signup">Try again</a>');
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.send('Sorry, this username is already taken. <a href="/auth/signup">Try again</a>');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const rawCodes = generateRecoveryCodes();
        const hashedCodes = rawCodes.map(code => ({
            hash: bcrypt.hashSync(code, 10),
            used: false
        }));

        const newUser = new User({
            full_name: full_name,
            username: username,
            password_hash: hashedPassword,
            recovery_codes: hashedCodes
        });
        await newUser.save();

        res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <title>Account Created - EliGet</title>
            </head><body>
            <div class="auth-page">
                <div class="auth-topbar">
                    <a href="/" class="auth-back-icon" title="Back to Home">${icons.back}</a>
                </div>
                <div class="auth-card">
                    <div class="auth-brand">
                        <h1 class="elget-wordmark elget-wordmark-md" style="margin: 0;">EliGet</h1>
                    </div>
                    <div style="text-align: center;">${icons.check}</div>
                    <h2 class="auth-heading" style="color: #38a169;">Account Created!</h2>
                    <p class="auth-subtitle">Save these 3 recovery codes. You'll need them if you forget your password.</p>

                    <div class="recovery-box">
                        <ul>
                            ${rawCodes.map(c => `<li>${c}</li>`).join('')}
                        </ul>
                    </div>

                    <p style="color: #e53e3e; font-weight: 600; text-align: center; font-size: 0.85rem; margin: 16px 0;">Warning: Shown only once!</p>

                    <a href="/auth/login" class="auth-submit" style="display:block; text-decoration:none; text-align:center;">Proceed to Login</a>
                </div>
            </div>
            </body></html>
        `);
    } catch (error) {
        console.error('Signup error:', error);
        res.send('Something went wrong. <a href="/auth/signup">Try again</a>');
    }
});

// ===== FORGOT PASSWORD (Placeholder) =====
router.get('/recover', (req, res) => {
    res.send(`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <title>Recover Password - EliGet</title>
        </head><body>
        <div class="auth-page">
            <div class="auth-topbar">
                <a href="/auth/login" class="auth-back-icon" title="Back">${icons.back}</a>
            </div>
            <div class="auth-card">
                <div class="auth-brand">
                    <h1 class="elget-wordmark elget-wordmark-md" style="margin: 0;">EliGet</h1>
                </div>
                <h2 class="auth-heading">Recover Password</h2>
                <p class="auth-subtitle">Enter your username and one recovery code to reset password.</p>

                <form action="/auth/recover" method="POST">
                    <div class="auth-field">
                        <label>Username</label>
                        <input type="text" name="username" required placeholder="Your username">
                    </div>
                    <div class="auth-field">
                        <label>Recovery Code</label>
                        <input type="text" name="code" required placeholder="ELI-XXXX-XXXX">
                    </div>
                    <div class="auth-field">
                        <label>New Password</label>
                        <input type="password" name="new_password" required placeholder="New password">
                    </div>
                    <button type="submit" class="auth-submit">Reset Password</button>
                </form>

                <div class="auth-switch">
                    Remember password? <a href="/auth/login">Login</a>
                </div>
            </div>
        </div>
        </body></html>
    `);
});

router.post('/recover', async (req, res) => {
    try {
        const { username, code, new_password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.send('User not found. <a href="/auth/recover">Try again</a>');

        let matched = false;
        for (const rc of user.recovery_codes) {
            if (!rc.used && await bcrypt.compare(code, rc.hash)) {
                rc.used = true;
                matched = true;
                break;
            }
        }

        if (!matched) return res.send('Invalid or used code. <a href="/auth/recover">Try again</a>');

        user.password_hash = await bcrypt.hash(new_password, 10);
        await user.save();

        res.send(`
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
            <title>Password Reset - EliGet</title>
            </head><body>
            <div class="auth-page">
                <div class="auth-card">
                    <div style="text-align: center;">${icons.check}</div>
                    <h2 class="auth-heading" style="color: #38a169;">Password Reset!</h2>
                    <p class="auth-subtitle">Your password has been changed. Login with your new password.</p>
                    <a href="/auth/login" class="auth-submit" style="display:block; text-decoration:none; text-align:center;">Login</a>
                </div>
            </div>
            </body></html>
        `);
    } catch (error) {
        console.error('Recover error:', error);
        res.send('Something went wrong. <a href="/auth/recover">Try again</a>');
    }
});

// ===== LOGOUT =====
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
