const fs = require('fs');
let src = fs.readFileSync('routes/chat.js', 'utf8');

// 1. window.onerror handler add (script-এর একেবারে শুরুতে)
const oldStart = `        <script>
            var input = document.getElementById('userSearch');`;
const newStart = `        <script>
            window.addEventListener('error', function(e) {
                var box = document.getElementById('resultsBox');
                if (box) box.innerHTML = '<p style="color:#e53e3e; padding:20px; text-align:center;">JS Error: ' + (e.message || 'unknown') + '</p>';
            });
            var input = document.getElementById('userSearch');`;
if (!src.includes(oldStart)) { console.log('ERROR: script start not found'); process.exit(1); }
src = src.replace(oldStart, newStart);

// 2. keyup listener add (input-এর পাশাপাশি)
const oldListener = `            input.addEventListener('input', function() {
                clearTimeout(timer);
                var q = input.value.trim();
                timer = setTimeout(function() { doSearch(q); }, 280);
            });`;
const newListener = `            function onType() {
                clearTimeout(timer);
                var q = input.value.trim();
                timer = setTimeout(function() { doSearch(q); }, 280);
            }
            input.addEventListener('input', onType);
            input.addEventListener('keyup', onType);
            input.addEventListener('change', onType);`;
if (!src.includes(oldListener)) { console.log('ERROR: listener block not found'); process.exit(1); }
src = src.replace(oldListener, newListener);

fs.writeFileSync('routes/chat.js', src);
console.log('OK: debug + fallback listeners added');
