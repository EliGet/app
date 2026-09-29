const fs = require('fs');

const files = ['routes/auth.js', 'routes/chat.js', 'routes/group.js', 'routes/post.js'];

for (const file of files) {
    let src = fs.readFileSync(file, 'utf8');
    const before = src;

    // Ensure errorPage required at top
    if (!src.includes("require('../errorPage')")) {
        // Find first require line and insert after
        const reqMatch = src.match(/^(const .+ = require\(.+\);)$/m);
        if (reqMatch) {
            src = src.replace(reqMatch[0], reqMatch[0] + "\nconst errorPage = require('../errorPage');");
        } else {
            // Fallback: insert after first line
            const lines = src.split('\n');
            lines.splice(1, 0, "const errorPage = require('../errorPage');");
            src = lines.join('\n');
        }
    }

    // Replace common "Something went wrong" patterns
    const patterns = [
        { old: "res.send('Something went wrong. <a href=\"/auth/login\">Try again</a>');",
          new: "res.status(500).send(errorPage(500, 'Something went wrong', 'An unexpected error occurred. Please try again.', '/auth/login', 'Back to login'));" },
        { old: "res.send('Something went wrong. <a href=\"/auth/signup\">Try again</a>');",
          new: "res.status(500).send(errorPage(500, 'Something went wrong', 'An unexpected error occurred. Please try again.', '/auth/signup', 'Back to signup'));" },
        { old: "res.send('Something went wrong.');",
          new: "res.status(500).send(errorPage(500, 'Something went wrong', 'An unexpected error occurred. Please try again.', '/', 'Back to home'));" },
        { old: "res.send('Something went wrong. <a href=\"/group/create\">Try again</a>');",
          new: "res.status(500).send(errorPage(500, 'Something went wrong', 'An unexpected error occurred. Please try again.', '/group/create', 'Back to create group'));" },
        { old: "res.send('Something went wrong. <a href=\"/post/create\">Try again</a>');",
          new: "res.status(500).send(errorPage(500, 'Something went wrong', 'An unexpected error occurred. Please try again.', '/post/create', 'Back to create post'));" }
    ];

    let count = 0;
    for (const p of patterns) {
        if (src.includes(p.old)) {
            // Use global replace with function to avoid $ issues
            src = src.split(p.old).join(p.new);
            count++;
        }
    }

    if (src !== before) {
        fs.writeFileSync(file, src);
        console.log('OK: ' + file + ' — ' + count + ' patterns replaced');
    } else {
        console.log('SKIP: ' + file + ' (nothing changed)');
    }
}
