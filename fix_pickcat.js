const fs = require('fs');
let src = fs.readFileSync('routes/students.js', 'utf8');
const before = src;

const oldFn = `function pickSvgCat(btn) {
                var cat = btn.getAttribute('data-cat') || 'all';
                svgActiveCat = cat;
                document.querySelectorAll('#svgTabs .lib-tab').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                renderSvgGrid();
            }`;

const newFn = `function pickSvgCat(btn) {
                var cat = btn.getAttribute('data-cat') || 'all';
                svgActiveCat = cat;
                document.querySelectorAll('#svgTabs .lib-tab').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var si = document.getElementById('svgSearch');
                if (si) si.value = '';
                renderSvgGrid();
            }`;

if (src.includes(oldFn)) {
    src = src.replace(oldFn, function() { return newFn; });
    console.log('OK: pickSvgCat clears search');
} else if (src.includes('var si = document.getElementById')) {
    console.log('SKIP: already fixed');
} else {
    console.log('WARN: pattern not matched');
}

if (src !== before) fs.writeFileSync('routes/students.js', src);
console.log('DONE');
