const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

const oldNav = `            \${getBottomNav('home')}
            \${getDeleteModal()}
            </body></html>
        \`);
    } catch (err) {
        console.error('Search error:', err);`;

const newNav = `            <div class="bottom-nav"><a href="/" class="active">\${icons.home}<span>Home</span></a><a href="/students">\${icons.students}<span>Students</span></a><a href="/post/create">\${icons.plus}<span>Post</span></a><a href="/chat">\${icons.chat}<span>Chat</span></a><a href="/profile">\${icons.profile}<span>Profile</span></a></div>
            \${getDeleteModal()}
            </body></html>
        \`);
    } catch (err) {
        console.error('Search error:', err);`;

if (!src.includes(oldNav)) { console.log('ERROR: nav pattern not found'); process.exit(1); }
src = src.replace(oldNav, function() { return newNav; });
fs.writeFileSync('server.js', src);
console.log('OK: bottom nav replaced with inline');
