const fs = require('fs');
let src = fs.readFileSync('routes/auth.js', 'utf8');
const before = src;

const oldBlock = `        req.session.user = username;
        res.redirect('/');
    } catch (error) {`;

const newBlock = `        // Check for add-account mode
        const addMode = req.body.add_account === '1';
        if (addMode && req.session.user) {
            if (!req.session.accounts) req.session.accounts = [req.session.user];
            if (req.session.accounts.includes(username)) {
                return res.redirect('/settings?status=already');
            }
            if (req.session.accounts.length >= 2) {
                return res.redirect('/settings?status=full');
            }
            req.session.accounts.push(username);
            return res.redirect('/settings?status=added');
        }

        req.session.user = username;
        req.session.accounts = [username];
        res.redirect('/');
    } catch (error) {`;

if (!src.includes(oldBlock)) { console.log('ERROR: login success block not found'); process.exit(1); }
src = src.replace(oldBlock, function() { return newBlock; });
fs.writeFileSync('routes/auth.js', src);
console.log('OK: login POST modified for add-account');
