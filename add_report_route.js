const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// require Report
if (!src.includes("require('./models/Report')")) {
    const m = src.match(/const Notification = require\('\.\/models\/Notification'\);/);
    if (m) {
        src = src.replace(m[0], m[0] + "\nconst Report = require('./models/Report');");
        console.log('OK: Report required');
    } else {
        console.log('WARN: Notification require not found');
    }
}

// Add report route before 404
const marker404 = '// ===== 404 HANDLER =====';
if (!src.includes('// ===== REPORT SUBMIT =====')) {
    const idx = src.indexOf(marker404);
    if (idx === -1) { console.log('ERROR: 404 marker not found'); process.exit(1); }

    const route = `// ===== REPORT SUBMIT =====
app.post('/report', isAuthenticated, async (req, res) => {
    try {
        const me = req.session.user;
        const { target_type, target_id, reason, note } = req.body;

        const validTypes = ['post', 'student_post', 'user', 'chat_message', 'group_message'];
        const validReasons = ['spam', 'harassment', 'hate', 'misinformation', 'other'];

        if (!validTypes.includes(target_type) || !validReasons.includes(reason) || !target_id) {
            return res.json({ ok: false, reason: 'invalid' });
        }

        // Prevent duplicate reports
        const existing = await Report.findOne({ reporter: me, target_type: target_type, target_id: target_id });
        if (existing) {
            return res.json({ ok: true, duplicate: true });
        }

        // Fetch target owner
        let target_owner = '';
        try {
            if (target_type === 'post') {
                const p = await Post.findById(target_id);
                if (p) target_owner = p.author;
            } else if (target_type === 'student_post') {
                const StudentPost = require('./models/StudentPost');
                const sp = await StudentPost.findById(target_id);
                if (sp) target_owner = sp.author;
            } else if (target_type === 'user') {
                target_owner = target_id;
            }
        } catch (e) {}

        await Report.create({
            reporter: me,
            target_type: target_type,
            target_id: target_id,
            target_owner: target_owner,
            reason: reason,
            note: String(note || '').slice(0, 500)
        });

        res.json({ ok: true });
    } catch (err) {
        console.error('Report error:', err);
        res.json({ ok: false });
    }
});

`;

    src = src.slice(0, idx) + route + src.slice(idx);
    console.log('OK: /report route added');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('server.js', src);
console.log('DONE');
