const fs = require('fs');
let src = fs.readFileSync('routes/post.js', 'utf8');
const before = src;

// ============ CREATE PAGE ============

// 1. Create page-এর moods array
const createMoodsArray = `    const moods = [
        { key: 'none', label: 'None' },
        { key: 'happy', label: 'Happy' },
        { key: 'romantic', label: 'Romantic' },
        { key: 'nature', label: 'Nature' },
        { key: 'thoughtful', label: 'Thoughtful' },
        { key: 'excited', label: 'Excited' },
        { key: 'calm', label: 'Calm' },
        { key: 'music', label: 'Music' },
        { key: 'book', label: 'Book' }
    ];

    let moodOptionsHtml = '';
    moods.forEach((m, index) => {
        const isChecked = index === 0 ? 'checked' : '';
        const isSelected = index === 0 ? 'selected' : '';
        const iconHtml = m.key === 'none' ? \`<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>\` : moodIcons[m.key];
        moodOptionsHtml += \`<label class="mood-option \${isSelected}" onclick="selectMood(this)"><input type="radio" name="mood" value="\${m.key}" \${isChecked}>\${iconHtml}<span>\${m.label}</span></label>\`;
    });

`;
if (!src.includes(createMoodsArray)) { console.log('ERROR: create moods array not found'); process.exit(1); }
src = src.replace(createMoodsArray, '');
console.log('OK: create moods array removed');

// 2. Create form-এর mood form-group
const createMoodGroup = `                    <div class="form-group">
                        <label>Choose a Mood</label>
                        <div class="mood-grid">\${moodOptionsHtml}</div>
                    </div>

`;
if (!src.includes(createMoodGroup)) { console.log('ERROR: create mood form-group not found'); process.exit(1); }
src = src.replace(createMoodGroup, '');
console.log('OK: create mood form-group removed');

// 3. Create page-এর selectMood script
const createScript = `        <script>
            function selectMood(el){document.querySelectorAll('.mood-option').forEach(o=>o.classList.remove('selected'));el.classList.add('selected');}
        </script>
`;
if (!src.includes(createScript)) { console.log('ERROR: create script not found'); process.exit(1); }
src = src.replace(createScript, '');
console.log('OK: create script removed');

// ============ EDIT PAGE ============

// 4. Edit page-এর moods array + loop
const editMoodsArray = `        const moods = [
            { key: 'none', label: 'None' },
            { key: 'happy', label: 'Happy' },
            { key: 'romantic', label: 'Romantic' },
            { key: 'nature', label: 'Nature' },
            { key: 'thoughtful', label: 'Thoughtful' },
            { key: 'excited', label: 'Excited' },
            { key: 'calm', label: 'Calm' },
            { key: 'music', label: 'Music' },
            { key: 'book', label: 'Book' }
        ];

        let moodOptionsHtml = '';
        moods.forEach((m) => {
            const isChecked = post.mood === m.key ? 'checked' : '';
            const isSelected = post.mood === m.key ? 'selected' : '';
            const iconHtml = m.key === 'none' ? \`<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>\` : moodIcons[m.key];
            moodOptionsHtml += \`<label class="mood-option \${isSelected}" onclick="selectMood(this)"><input type="radio" name="mood" value="\${m.key}" \${isChecked}>\${iconHtml}<span>\${m.label}</span></label>\`;
        });

`;
if (!src.includes(editMoodsArray)) { console.log('ERROR: edit moods array not found'); process.exit(1); }
src = src.replace(editMoodsArray, '');
console.log('OK: edit moods array removed');

// 5. Edit form-এর mood form-group
const editMoodGroup = `                        <div class="form-group">
                            <label>Choose a Mood</label>
                            <div class="mood-grid">\${moodOptionsHtml}</div>
                        </div>
`;
if (!src.includes(editMoodGroup)) { console.log('ERROR: edit mood form-group not found'); process.exit(1); }
src = src.replace(editMoodGroup, '');
console.log('OK: edit mood form-group removed');

// 6. Edit page-এর selectMood script
const editScript = `            <script>
                function selectMood(el){document.querySelectorAll('.mood-option').forEach(o=>o.classList.remove('selected'));el.classList.add('selected');}
            </script>
`;
if (!src.includes(editScript)) { console.log('ERROR: edit script not found'); process.exit(1); }
src = src.replace(editScript, '');
console.log('OK: edit script removed');

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/post.js', src);
console.log('DONE: routes/post.js written');
