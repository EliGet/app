const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');

// 1. totalLikes calculate add (postCount-এর ঠিক পরে)
const postCountBlock = `        const myPosts = await Post.find({ author: req.session.user }).sort({ created_at: -1 });
        const postCount = myPosts.length;
`;
const newPostCountBlock = `        const myPosts = await Post.find({ author: req.session.user }).sort({ created_at: -1 });
        const postCount = myPosts.length;
        const totalLikes = myPosts.reduce((sum, p) => sum + ((p.likes || []).length), 0);
`;
if (!src.includes(postCountBlock)) { console.log('ERROR: postCount block not found'); process.exit(1); }
src = src.replace(postCountBlock, newPostCountBlock);
console.log('OK: totalLikes computed');

// 2. Stats line: Friends → Likes
const oldStats = '<p class="pp-stats-line"><strong>${postCount}</strong> Posts <span class="pp-dot">·</span> <strong>${friendCount}</strong> Friends</p>';
const newStats = '<p class="pp-stats-line"><strong>${postCount}</strong> Posts <span class="pp-dot">·</span> <strong>${totalLikes}</strong> Likes</p>';
if (!src.includes(oldStats)) { console.log('ERROR: stats line not found'); process.exit(1); }
src = src.replace(oldStats, newStats);
console.log('OK: stats line updated');

fs.writeFileSync('server.js', src);
console.log('DONE');
