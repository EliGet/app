const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');

const startMarker = "app.get('/profile/avatar', isAuthenticated, async (req, res) => {";
const endMarker = "app.post('/profile/avatar', isAuthenticated, async (req, res) => {";
const s = src.indexOf(startMarker);
const e = src.indexOf(endMarker);
if (s === -1 || e === -1) { console.log('ERROR: markers not found'); process.exit(1); }

const newRoute = `app.get('/profile/avatar', isAuthenticated, async (req, res) => {
    const me = req.session.user;
    const safeSeed = encodeURIComponent(me);

    res.send(\`
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
        <title>Avatar - EliGet</title>
        </head><body class="ab-body">
        <div class="ab-wrap">

            <header class="ab-topbar">
                <a href="/profile" class="ab-back" title="Back">
                    <svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
                </a>
                <span class="ab-title">Your avatar</span>
                <button type="button" class="ab-random" onclick="abRandomSeed()" title="New face">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg>
                </button>
            </header>

            <div class="ab-preview">
                <div class="ab-preview-frame">
                    <img id="abPreview" src="" alt="Avatar">
                </div>
            </div>

            <div class="ab-controls" id="abControls"></div>

            <div class="ab-actions">
                <button type="button" class="ab-btn-secondary" onclick="abReset()">Reset</button>
                <button type="button" class="ab-btn-primary" onclick="abSave()">Save avatar</button>
            </div>

        </div>

        <script>
        var AB_SEED = '\\\${safeSeed}';
        var AB_STATE = {
            bg: 'b6e3f4',
            top: 'shortFlat',
            accessories: '',
            facialHair: ''
        };

        var AB_FACES = [
            { s: 'Felix' }, { s: 'Aneka' }, { s: 'Milo' }, { s: 'Lily' },
            { s: 'Zoe' }, { s: 'Leo' }, { s: 'Mia' }, { s: 'Ryan' },
            { s: 'Nora' }, { s: 'Kai' }, { s: 'Ivy' }, { s: 'Oscar' },
            { s: 'Walter' }, { s: 'Margaret' }, { s: 'Arthur' }, { s: 'Eleanor' }
        ];

        var AB_OPTIONS = {
            bg: [
                { v: 'b6e3f4' }, { v: 'c0aede' }, { v: 'd1d4f9' }, { v: 'ffd5dc' },
                { v: 'ffdfbf' }, { v: 'a8e6cf' }, { v: 'fddb92' }, { v: 'a0c4ff' },
                { v: 'bdb2ff' }, { v: 'ffc6ff' }, { v: 'ffffff' }, { v: '1e293b' }
            ],
            top: [
                { v: 'shortFlat', l: 'Short' },
                { v: 'shortRound', l: 'Round' },
                { v: 'shortCurly', l: 'Curly' },
                { v: 'shortWaved', l: 'Waved' },
                { v: 'theCaesar', l: 'Caesar' },
                { v: 'frizzle', l: 'Frizzle' },
                { v: 'bigHair', l: 'Big' },
                { v: 'bob', l: 'Bob' },
                { v: 'bun', l: 'Bun' },
                { v: 'curly', l: 'Curvy' },
                { v: 'fro', l: 'Fro' },
                { v: 'straight01', l: 'Straight' },
                { v: 'dreads', l: 'Dreads' },
                { v: 'miaWallace', l: 'Mia' },
                { v: 'hat', l: 'Hat' },
                { v: 'winterHat1', l: 'Winter' },
                { v: 'turban', l: 'Turban' },
                { v: 'hijab', l: 'Hijab' }
            ],
            accessories: [
                { v: '', l: 'None' },
                { v: 'round', l: 'Round' },
                { v: 'prescription01', l: 'Small' },
                { v: 'prescription02', l: 'Classic' },
                { v: 'wayfarers', l: 'Wayfarer' },
                { v: 'sunglasses', l: 'Sunglasses' },
                { v: 'kurt', l: 'Bold' }
            ],
            facialHair: [
                { v: '', l: 'None' },
                { v: 'beardMedium', l: 'Medium' },
                { v: 'beardLight', l: 'Light' },
                { v: 'beardMajestic', l: 'Majestic' },
                { v: 'moustacheFancy', l: 'Fancy' },
                { v: 'moustacheMagnum', l: 'Magnum' }
            ]
        };

        function abComposeUrl() {
            var s = AB_STATE;
            var parts = ['seed=' + AB_SEED];
            parts.push('backgroundColor=' + s.bg);
            parts.push('skinColor=edb98a');
            parts.push('top=' + s.top);
            parts.push('hairColor=a55728');
            parts.push('eyes=happy');
            parts.push('mouth=smile');
            parts.push('clothing=hoodie');
            parts.push('clothesColor=5199e4');

            // Force accessories probability when set
            if (s.accessories) {
                parts.push('accessories=' + s.accessories);
                parts.push('accessoriesColor=262e33');
                parts.push('accessoriesProbability=100');
            } else {
                parts.push('accessoriesProbability=0');
            }

            // Force facial hair probability when set
            if (s.facialHair) {
                parts.push('facialHair=' + s.facialHair);
                parts.push('facialHairColor=a55728');
                parts.push('facialHairProbability=100');
            } else {
                parts.push('facialHairProbability=0');
            }

            return 'https://api.dicebear.com/7.x/avataaars/svg?' + parts.join('&');
        }

        function abUpdatePreview() {
            var img = document.getElementById('abPreview');
            if (img) img.src = abComposeUrl();
        }

        function abRenderControls() {
            var box = document.getElementById('abControls');
            var html = '';

            // Face picker row (thumbnails)
            html += '<div class="ab-group"><div class="ab-group-label">Face</div><div class="ab-faces">';
            AB_FACES.forEach(function(f) {
                var active = AB_SEED === f.s ? ' active' : '';
                var thumbUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + f.s + '&backgroundColor=' + AB_STATE.bg + '&top=' + AB_STATE.top + '&skinColor=edb98a&hairColor=a55728&eyes=happy&mouth=smile&clothing=hoodie&clothesColor=5199e4&accessoriesProbability=0&facialHairProbability=0';
                html += '<button type="button" class="ab-face' + active + '" data-seed="' + f.s + '" onclick="abPickFace(this)"><img src="' + thumbUrl + '" alt="' + f.s + '"></button>';
            });
            html += '</div></div>';

            function colorGroup(label, key, opts) {
                var h = '<div class="ab-group"><div class="ab-group-label">' + label + '</div><div class="ab-colors">';
                opts.forEach(function(o) {
                    var active = AB_STATE[key] === o.v ? ' active' : '';
                    h += '<button type="button" class="ab-color' + active + '" style="background:#' + o.v + '" data-key="' + key + '" data-val="' + o.v + '" onclick="abPick(this)"></button>';
                });
                h += '</div></div>';
                return h;
            }

            function pillGroup(label, key, opts) {
                var h = '<div class="ab-group"><div class="ab-group-label">' + label + '</div><div class="ab-pills">';
                opts.forEach(function(o) {
                    var active = AB_STATE[key] === o.v ? ' active' : '';
                    h += '<button type="button" class="ab-pill' + active + '" data-key="' + key + '" data-val="' + o.v + '" onclick="abPick(this)">' + o.l + '</button>';
                });
                h += '</div></div>';
                return h;
            }

            html += colorGroup('Background', 'bg', AB_OPTIONS.bg);
            html += pillGroup('Hat / Hair', 'top', AB_OPTIONS.top);
            html += pillGroup('Glasses', 'accessories', AB_OPTIONS.accessories);
            html += pillGroup('Beard', 'facialHair', AB_OPTIONS.facialHair);

            box.innerHTML = html;
        }

        function abPick(btn) {
            var key = btn.getAttribute('data-key');
            var val = btn.getAttribute('data-val');
            AB_STATE[key] = val;
            var parent = btn.parentNode;
            parent.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            abUpdatePreview();
        }

        function abPickFace(btn) {
            AB_SEED = btn.getAttribute('data-seed');
            document.querySelectorAll('.ab-face').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            abUpdatePreview();
        }

        function abRandomSeed() {
            var pick = AB_FACES[Math.floor(Math.random() * AB_FACES.length)].s;
            AB_SEED = pick;
            document.querySelectorAll('.ab-face').forEach(function(b) {
                b.classList.toggle('active', b.getAttribute('data-seed') === pick);
            });
            abUpdatePreview();
        }

        function abReset() {
            AB_STATE.bg = 'b6e3f4';
            AB_STATE.top = 'shortFlat';
            AB_STATE.accessories = '';
            AB_STATE.facialHair = '';
            abRenderControls();
            abUpdatePreview();
        }

        function abSave() {
            var url = abComposeUrl();
            var form = document.createElement('form');
            form.method = 'POST';
            form.action = '/profile/avatar';
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'avatar_url';
            input.value = url;
            form.appendChild(input);
            document.body.appendChild(form);
            form.submit();
        }

        abRenderControls();
        abUpdatePreview();
        </script>
        </body></html>
    \`);
});

`;

src = src.slice(0, s) + newRoute + src.slice(e);
fs.writeFileSync('server.js', src);
console.log('OK: face picker + probability fix');
