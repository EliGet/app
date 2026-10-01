const fs = require('fs');
let src = fs.readFileSync('routes/students.js', 'utf8');
const before = src;

// ===== 1. Add API route (before GET /new) =====
const newMarker = "// NEW POST PAGE\nrouter.get('/new', async (req, res) => {";
if (!src.includes(newMarker)) { console.log('ERROR: /new marker not found'); process.exit(1); }

const apiRoute = `// SVG LIBRARY API (JSON for modal picker)
router.get('/api/svgs', (req, res) => {
    const { images, labels, categories } = require('../lib/svg-library');
    res.json({ images: images, labels: labels, categories: categories });
});

// NEW POST PAGE
router.get('/new', async (req, res) => {`;

src = src.replace(newMarker, apiRoute);
console.log('OK: /api/svgs added');

// ===== 2. Add SVG picker section to /new form =====
const formMarker = `<div class="form-group">
                    <label class="sp-label">Body</label>
                    <textarea name="body" rows="8" maxlength="2000" placeholder="Write here..." class="sp-textarea"></textarea>
                </div>`;

const formNew = `<div class="form-group">
                    <label class="sp-label">Body</label>
                    <textarea name="body" rows="8" maxlength="2000" placeholder="Write here..." class="sp-textarea"></textarea>
                </div>

                <div class="form-group">
                    <label class="sp-label">Decoration SVG (optional)</label>
                    <input type="hidden" name="svg" id="svgInput" value="none">
                    <div id="svgPreview" class="sp-svg-preview" style="display:none;">
                        <div class="sp-svg-preview-icon" id="svgPreviewIcon"></div>
                        <div class="sp-svg-preview-info">
                            <div class="sp-svg-preview-label" id="svgPreviewLabel">SVG</div>
                            <button type="button" class="sp-svg-remove" onclick="clearSvg()">Remove</button>
                        </div>
                    </div>
                    <button type="button" class="sp-svg-attach" onclick="openSvgModal()">
                        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                        <span id="svgAttachLabel">Attach SVG</span>
                    </button>
                </div>`;

if (!src.includes(formMarker)) { console.log('ERROR: form body marker not found'); process.exit(1); }
src = src.replace(formMarker, function() { return formNew; });
console.log('OK: SVG section added to form');

// ===== 3. Add modal HTML before </body> =====
const bodyCloseMarker = `        </div>
        <script>
            var typeRadios = document.querySelectorAll('input[name="type"]');`;

const modalAndScript = `        </div>

        <div class="sp-svg-modal" id="svgModal">
            <div class="sp-svg-modal-inner">
                <div class="sp-svg-modal-head">
                    <span class="sp-svg-modal-title">Choose a decoration</span>
                    <button type="button" class="sp-svg-modal-close" onclick="closeSvgModal()" aria-label="Close">
                        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
                    </button>
                </div>
                <div class="sp-svg-modal-search">
                    <input type="text" id="svgSearch" class="sp-search-input" placeholder="Search SVG..." autocomplete="off">
                </div>
                <div class="sp-chips sp-svg-modal-tabs" id="svgTabs"></div>
                <div class="sp-svg-modal-grid" id="svgGrid"></div>
                <div class="sp-svg-modal-empty" id="svgEmpty" style="display:none;">No SVG found.</div>
            </div>
        </div>

        <script>
            var typeRadios = document.querySelectorAll('input[name="type"]');`;

if (!src.includes(bodyCloseMarker)) { console.log('ERROR: script marker not found'); process.exit(1); }
src = src.replace(bodyCloseMarker, function() { return modalAndScript; });
console.log('OK: modal HTML added');

// ===== 4. Add modal logic to script block =====
const scriptEnd = `            typeRadios.forEach(function(r) { r.addEventListener('change', updateOptionsVisibility); });
            updateOptionsVisibility();
        </script>`;

const newScriptEnd = `            typeRadios.forEach(function(r) { r.addEventListener('change', updateOptionsVisibility); });
            updateOptionsVisibility();

            // ===== SVG picker =====
            var svgLibrary = null;
            var svgActiveCat = 'all';

            function openSvgModal() {
                var modal = document.getElementById('svgModal');
                modal.classList.add('open');
                document.body.style.overflow = 'hidden';
                if (!svgLibrary) {
                    fetch('/students/api/svgs', { credentials: 'same-origin' })
                        .then(function(r) { return r.json(); })
                        .then(function(data) {
                            svgLibrary = data;
                            renderSvgTabs();
                            renderSvgGrid();
                        })
                        .catch(function() {
                            document.getElementById('svgGrid').innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#94a3b8;padding:20px;">Could not load library.</p>';
                        });
                }
            }

            function closeSvgModal() {
                document.getElementById('svgModal').classList.remove('open');
                document.body.style.overflow = '';
            }

            function renderSvgTabs() {
                var tabs = document.getElementById('svgTabs');
                var html = '<button type="button" class="lib-tab active" data-cat="all" onclick="pickSvgCat(\\'all\\', this)">All</button>';
                Object.keys(svgLibrary.categories).forEach(function(cat) {
                    html += '<button type="button" class="lib-tab" data-cat="' + cat + '" onclick="pickSvgCat(\\'' + cat.replace(/'/g, "\\\\'") + '\\', this)">' + cat + '</button>';
                });
                tabs.innerHTML = html;
            }

            function pickSvgCat(cat, btn) {
                svgActiveCat = cat;
                document.querySelectorAll('#svgTabs .lib-tab').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                renderSvgGrid();
            }

            function renderSvgGrid() {
                if (!svgLibrary) return;
                var q = (document.getElementById('svgSearch').value || '').toLowerCase().trim();
                var grid = document.getElementById('svgGrid');
                var empty = document.getElementById('svgEmpty');
                var items = [];

                Object.keys(svgLibrary.categories).forEach(function(cat) {
                    if (svgActiveCat !== 'all' && cat !== svgActiveCat) return;
                    svgLibrary.categories[cat].forEach(function(key) {
                        var label = svgLibrary.labels[key] || key;
                        if (q && label.toLowerCase().indexOf(q) === -1 && key.toLowerCase().indexOf(q) === -1) return;
                        items.push({ key: key, label: label, svg: svgLibrary.images[key] });
                    });
                });

                if (items.length === 0) {
                    grid.innerHTML = '';
                    empty.style.display = 'block';
                    return;
                }
                empty.style.display = 'none';

                var html = '';
                items.forEach(function(it) {
                    html += '<button type="button" class="sp-svg-tile" onclick="pickSvg(\\'' + it.key + '\\')">'
                        + '<div class="sp-svg-tile-icon">' + it.svg + '</div>'
                        + '<span class="sp-svg-tile-label">' + it.label + '</span>'
                        + '</button>';
                });
                grid.innerHTML = html;
            }

            function pickSvg(key) {
                if (!svgLibrary) return;
                var input = document.getElementById('svgInput');
                var preview = document.getElementById('svgPreview');
                var iconBox = document.getElementById('svgPreviewIcon');
                var labelEl = document.getElementById('svgPreviewLabel');
                var attachLabel = document.getElementById('svgAttachLabel');

                input.value = key;
                iconBox.innerHTML = svgLibrary.images[key];
                labelEl.textContent = svgLibrary.labels[key] || key;
                preview.style.display = 'flex';
                attachLabel.textContent = 'Change SVG';
                closeSvgModal();
            }

            function clearSvg() {
                document.getElementById('svgInput').value = 'none';
                document.getElementById('svgPreview').style.display = 'none';
                document.getElementById('svgAttachLabel').textContent = 'Attach SVG';
            }

            var searchInput = document.getElementById('svgSearch');
            if (searchInput) {
                searchInput.addEventListener('input', renderSvgGrid);
            }

            document.getElementById('svgModal').addEventListener('click', function(e) {
                if (e.target === this) closeSvgModal();
            });
        </script>`;

if (!src.includes(scriptEnd)) { console.log('ERROR: script end not found'); process.exit(1); }
src = src.replace(scriptEnd, function() { return newScriptEnd; });
console.log('OK: modal JS added');

// ===== 5. Update POST /create to save svg =====
const createOld = `        await StudentPost.create({
            author: me,
            type: type,
            subject: SUBJECTS.includes(subject) ? subject : 'General',
            title: String(title).slice(0, 100),
            body: String(body).slice(0, 2000),
            svgs: [],
            options: options,
            votes: {},
            helpfulCount: 0,
            helpfulBy: []
        });`;

const createNew = `        const svgKey = (req.body.svg || 'none').trim();
        const svgs = (svgKey && svgKey !== 'none') ? [svgKey] : [];

        await StudentPost.create({
            author: me,
            type: type,
            subject: SUBJECTS.includes(subject) ? subject : 'General',
            title: String(title).slice(0, 100),
            body: String(body).slice(0, 2000),
            svgs: svgs,
            options: options,
            votes: {},
            helpfulCount: 0,
            helpfulBy: []
        });`;

if (!src.includes(createOld)) { console.log('ERROR: create block not found'); process.exit(1); }
src = src.replace(createOld, function() { return createNew; });
console.log('OK: create POST saves svg');

// ===== 6. Display SVG in feed card =====
const feedCardOld = `                        \${p.title ? \`<h3 class="sp-card-title">\${escapeHtml(p.title)}</h3>\` : ''}
                        \${preview ? \`<p class="sp-card-preview">\${escapeHtml(preview)}</p>\` : ''}`;

const feedCardNew = `                        \${p.title ? \`<h3 class="sp-card-title">\${escapeHtml(p.title)}</h3>\` : ''}
                        \${(p.svgs && p.svgs.length && svgLib.images[p.svgs[0]]) ? \`<div class="sp-card-svg">\${svgLib.images[p.svgs[0]]}</div>\` : ''}
                        \${preview ? \`<p class="sp-card-preview">\${escapeHtml(preview)}</p>\` : ''}`;

if (!src.includes(feedCardOld)) { console.log('WARN: feed card pattern not found'); }
else {
    src = src.replace(feedCardOld, function() { return feedCardNew; });
    console.log('OK: feed card shows svg');
}

// ===== 7. Load svgLib at top for feed/detail =====
const requireMarker = "const User = require('../models/User');";
if (!src.includes("require('../lib/svg-library')")) {
    src = src.replace(requireMarker, requireMarker + "\nconst svgLib = require('../lib/svg-library');");
    console.log('OK: svgLib required');
}

// ===== 8. Display SVG in detail view =====
const detailOld = `                    \${post.title ? \`<h2 class="sp-detail-title">\${escapeHtml(post.title)}</h2>\` : ''}
                    \${bodyHtml}`;

const detailNew = `                    \${post.title ? \`<h2 class="sp-detail-title">\${escapeHtml(post.title)}</h2>\` : ''}
                    \${(post.svgs && post.svgs.length && svgLib.images[post.svgs[0]]) ? \`<div class="sp-detail-svg">\${svgLib.images[post.svgs[0]]}</div>\` : ''}
                    \${bodyHtml}`;

if (!src.includes(detailOld)) { console.log('WARN: detail pattern not found'); }
else {
    src = src.replace(detailOld, function() { return detailNew; });
    console.log('OK: detail shows svg');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/students.js', src);
console.log('DONE');
