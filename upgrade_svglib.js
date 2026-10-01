const fs = require('fs');
let src = fs.readFileSync('routes/post.js', 'utf8');

const startMarker = "// ===== SVG LIBRARY PAGE =====";
const endMarker = "// ===== NEW POST PAGE =====";
const s = src.indexOf(startMarker);
const e = src.indexOf(endMarker);
if (s === -1 || e === -1) { console.log('ERROR: markers not found'); process.exit(1); }

const newRoute = `// ===== SVG LIBRARY PAGE =====
router.get('/svg-library', (req, res) => {
    const currentImage = req.query.current || 'none';
    const fromEdit = req.query.from === 'edit' ? 'edit' : 'create';
    const postId = req.query.postId || '';

    const { images: postImages, labels: imageLabels, categories } = require('../lib/svg-library');

    const baseUrl = (key) => {
        if (fromEdit === 'edit') {
            return \`/post/edit/\${postId}?image=\${key}\`;
        }
        return \`/post/create?image=\${key}\`;
    };

    let libraryHtml = '';
    // None option first
    libraryHtml += \`
        <a href="\${baseUrl('none')}" class="library-item \${currentImage === 'none' ? 'library-selected' : ''}" data-name="none">
            <div class="library-icon none-icon">\${icons.close}</div>
            <span class="library-label">None</span>
        </a>
    \`;

    // Group by category
    Object.keys(categories).forEach(cat => {
        const keys = categories[cat];
        libraryHtml += \`<h3 class="library-cat-title" data-cat="\${cat}">\${cat}</h3>\`;
        keys.forEach(key => {
            if (!postImages[key]) return;
            const selected = currentImage === key ? 'library-selected' : '';
            const name = (imageLabels[key] || key).toLowerCase();
            libraryHtml += \`
                <a href="\${baseUrl(key)}" class="library-item \${selected}" data-name="\${name}" data-cat="\${cat}">
                    <div class="library-icon">\${postImages[key]}</div>
                    <span class="library-label">\${imageLabels[key] || key}</span>
                </a>
            \`;
        });
    });

    // Category tabs
    let catTabsHtml = \`<button type="button" class="lib-tab active" onclick="libFilter('all', this)">All</button>\`;
    Object.keys(categories).forEach(cat => {
        catTabsHtml += \`<button type="button" class="lib-tab" onclick="libFilter('\${cat}', this)">\${cat}</button>\`;
    });

    const backUrl = fromEdit === 'edit' ? \`/post/edit/\${postId}\` : \`/post/create\${currentImage !== 'none' ? '?image=' + currentImage : ''}\`;

    res.send(\`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
        <title>SVG Library - EliGet</title>
        </head><body>
        <div class="container">
            <header class="feed-header">
                <a href="\${backUrl}" class="header-icon" title="Back">\${icons.back}</a>
                <h1 class="feed-title" style="margin-left:10px;">SVG Library</h1>
            </header>

            <form class="sp-search-form" onsubmit="return false;">
                <input type="text" id="libSearch" class="sp-search-input" placeholder="Search by name..." autocomplete="off">
            </form>

            <div class="sp-chips lib-tabs">\${catTabsHtml}</div>

            <div class="library-grid" id="libraryGrid">\${libraryHtml}</div>
            <p class="lib-empty" id="libEmpty" style="display:none;">No SVG found.</p>
        </div>
        <script>
            var activeCat = 'all';
            var libSearch = document.getElementById('libSearch');
            var items = document.querySelectorAll('.library-item');
            var catTitles = document.querySelectorAll('.library-cat-title');
            var libEmpty = document.getElementById('libEmpty');

            function applyFilter() {
                var q = (libSearch.value || '').toLowerCase().trim();
                var visible = 0;
                items.forEach(function(it) {
                    var name = it.getAttribute('data-name') || '';
                    var cat = it.getAttribute('data-cat') || '';
                    var catOk = (activeCat === 'all') || (cat === activeCat) || (name === 'none' && activeCat === 'all');
                    var searchOk = !q || name.indexOf(q) !== -1;
                    if (catOk && searchOk) {
                        it.style.display = '';
                        if (name !== 'none') visible++;
                    } else {
                        it.style.display = 'none';
                    }
                });
                // Show/hide category titles
                catTitles.forEach(function(t) {
                    var tCat = t.getAttribute('data-cat');
                    if (activeCat === 'all' && !q) t.style.display = '';
                    else t.style.display = 'none';
                });
                libEmpty.style.display = (visible === 0 && q) ? 'block' : 'none';
            }

            function libFilter(cat, btn) {
                activeCat = cat;
                document.querySelectorAll('.lib-tab').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                applyFilter();
            }

            if (libSearch) libSearch.addEventListener('input', applyFilter);
        </script>
        </body></html>
    \`);
});

`;

src = src.slice(0, s) + newRoute + src.slice(e);
fs.writeFileSync('routes/post.js', src);
console.log('OK: SVG library route upgraded');
