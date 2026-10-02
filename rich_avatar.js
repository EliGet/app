const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');

const startMarker = "app.get('/profile/avatar', isAuthenticated, async (req, res) => {";
const endMarker = "app.post('/profile/avatar', isAuthenticated, async (req, res) => {";
const s = src.indexOf(startMarker);
const e = src.indexOf(endMarker);
if (s === -1 || e === -1) { console.log('ERROR: markers not found'); process.exit(1); }

const newRoute = `app.get('/profile/avatar', isAuthenticated, async (req, res) => {
    const me = req.session.user;

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
                <button type="button" class="ab-random" onclick="abShuffle()" title="Shuffle">
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
        var AB_STATE = {
            seed: 'Felix',
            bg: 'b6e3f4',
            skinColor: 'edb98a',
            top: 'shortFlat',
            hairColor: 'a55728',
            eyes: 'happy',
            mouth: 'smile',
            eyebrows: 'default',
            accessories: '',
            facialHair: ''
        };

        // Diverse face presets - each has its own look
        var AB_FACES = [
            { seed: 'Felix',   skin: 'edb98a', hair: 'a55728', top: 'shortFlat' },
            { seed: 'Aneka',   skin: 'd08b5b', hair: '2c1b18', top: 'longHairBigHair' },
            { seed: 'Milo',    skin: 'ffdbb4', hair: 'b58143', top: 'shortRound' },
            { seed: 'Lily',    skin: 'ffdbb4', hair: '724133', top: 'longHairBob' },
            { seed: 'Zoe',     skin: 'd08b5b', hair: '2c1b18', top: 'longHairCurly' },
            { seed: 'Leo',     skin: 'ae5d29', hair: '2c1b18', top: 'shortCurly' },
            { seed: 'Mia',     skin: '614335', hair: '2c1b18', top: 'longHairFro' },
            { seed: 'Ryan',    skin: 'edb98a', hair: '4a312c', top: 'theCaesar' },
            { seed: 'Nora',    skin: 'ffdbb4', hair: 'd6b370', top: 'longHairStraight' },
            { seed: 'Kai',     skin: 'f8d25c', hair: '2c1b18', top: 'shortFlat' },
            { seed: 'Ivy',     skin: 'd08b5b', hair: '724133', top: 'longHairBun' },
            { seed: 'Oscar',   skin: 'ae5d29', hair: '2c1b18', top: 'shortWaved' },
            { seed: 'Aisha',   skin: 'ae5d29', hair: '2c1b18', top: 'hijab' },
            { seed: 'Arjun',   skin: 'd08b5b', hair: '2c1b18', top: 'shortRound' },
            { seed: 'Chen',    skin: 'f8d25c', hair: '2c1b18', top: 'shortFlat' },
            { seed: 'Amara',   skin: '614335', hair: '2c1b18', top: 'longHairCurly' },
            { seed: 'Diego',   skin: 'edb98a', hair: '4a312c', top: 'frizzle' },
            { seed: 'Yuki',    skin: 'ffdbb4', hair: '2c1b18', top: 'longHairBob' }
        ];

        var AB_OPTIONS = {
            bg: [
                { v: 'b6e3f4' }, { v: 'c0aede' }, { v: 'd1d4f9' }, { v: 'ffd5dc' },
                { v: 'ffdfbf' }, { v: 'a8e6cf' }, { v: 'fddb92' }, { v: 'a0c4ff' },
                { v: 'bdb2ff' }, { v: 'ffc6ff' }, { v: 'ffffff' }, { v: '1e293b' }
            ],
            skinColor: [
                { v: 'ffdbb4' }, { v: 'edb98a' }, { v: 'd08b5b' },
                { v: 'ae5d29' }, { v: '614335' }, { v: 'f8d25c' }, { v: 'fd9841' }
            ],
            hairColor: [
                { v: 'a55728' }, { v: '2c1b18' }, { v: 'b58143' },
                { v: 'd6b370' }, { v: '724133' }, { v: '4a312c' },
                { v: 'f59797' }, { v: 'e8e1e1' }, { v: 'ecdcbf' }, { v: 'c93305' }
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
                { v: 'straight02', l: 'Longer' },
                { v: 'dreads', l: 'Dreads' },
                { v: 'miaWallace', l: 'Mia' },
                { v: 'hat', l: 'Hat' },
                { v: 'winterHat1', l: 'Winter' },
                { v: 'turban', l: 'Turban' },
                { v: 'hijab', l: 'Hijab' }
            ],
            eyes: [
                { v: 'default', l: 'Normal' },
                { v: 'happy', l: 'Happy' },
                { v: 'wink', l: 'Wink' },
                { v: 'squint', l: 'Squint' },
                { v: 'side', l: 'Side' },
                { v: 'surprised', l: 'Surprised' },
                { v: 'hearts', l: 'Hearts' },
                { v: 'cry', l: 'Cry' },
                { v: 'dizzy', l: 'Dizzy' },
                { v: 'closed', l: 'Close' }
            ],
            mouth: [
                { v: 'default', l: 'Normal' },
                { v: 'smile', l: 'Smile' },
                { v: 'twinkle', l: 'Twinkle' },
                { v: 'serious', l: 'Serious' },
                { v: 'concerned', l: 'Concerned' },
                { v: 'disbelief', l: 'Disbelief' },
                { v: 'sad', l: 'Sad' },
                { v: 'grimace', l: 'Grimace' },
                { v: 'eating', l: 'Eating' },
                { v: 'tongue', l: 'Tongue' }
            ],
            eyebrows: [
                { v: 'default', l: 'Normal' },
                { v: 'raised', l: 'Raised' },
                { v: 'angry', l: 'Angry' },
                { v: 'concerned', l: 'Concerned' },
                { v: 'flat', l: 'Flat' },
                { v: 'sad', l: 'Sad' },
                { v: 'up', l: 'Up' },
                { v: 'angryNatural', l: 'Bold' },
                { v: 'defaultNatural', l: 'Natural' }
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

        function abComposeUrl(override) {
            var s = override || AB_STATE;
            var parts = ['seed=' + s.seed];
            parts.push('backgroundColor=' + s.bg);
            parts.push('skinColor=' + s.skinColor);
            parts.push('top=' + s.top);
            parts.push('hairColor=' + s.hairColor);
            parts.push('eyes=' + s.eyes);
            parts.push('mouth=' + s.mouth);
            parts.push('eyebrows=' + s.eyebrows);
            parts.push('clothing=hoodie');
            parts.push('clothesColor=5199e4');

            if (s.accessories) {
                parts.push('accessories=' + s.accessories);
                parts.push('accessoriesColor=262e33');
                parts.push('accessoriesProbability=100');
            } else {
                parts.push('accessoriesProbability=0');
            }
            if (s.facialHair) {
                parts.push('facialHair=' + s.facialHair);
                parts.push('facialHairColor=' + s.hairColor);
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

            // FACE PRESETS
            html += '<div class="ab-group"><div class="ab-group-label">Face</div><div class="ab-faces">';
            AB_FACES.forEach(function(f, i) {
                var active = AB_STATE.seed === f.seed ? ' active' : '';
                var thumbState = {
                    seed: f.seed, bg: AB_STATE.bg, skinColor: f.skin,
                    top: f.top, hairColor: f.hair,
                    eyes: 'happy', mouth: 'smile', eyebrows: 'default',
                    accessories: '', facialHair: ''
                };
                var thumbUrl = abComposeUrl(thumbState);
                html += '<button type="button" class="ab-face' + active + '" data-idx="' + i + '" onclick="abPickFace(this)"><img src="' + thumbUrl + '" alt="face"></button>';
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
            html += colorGroup('Skin', 'skinColor', AB_OPTIONS.skinColor);
            html += pillGroup('Hair style', 'top', AB_OPTIONS.top);
            html += colorGroup('Hair color', 'hairColor', AB_OPTIONS.hairColor);
            html += pillGroup('Eyes', 'eyes', AB_OPTIONS.eyes);
            html += pillGroup('Mouth', 'mouth', AB_OPTIONS.mouth);
            html += pillGroup('Eyebrows', 'eyebrows', AB_OPTIONS.eyebrows);
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
            var idx = parseInt(btn.getAttribute('data-idx'), 10);
            var f = AB_FACES[idx];
            if (!f) return;
            AB_STATE.seed = f.seed;
            AB_STATE.skinColor = f.skin;
            AB_STATE.top = f.top;
            AB_STATE.hairColor = f.hair;
            document.querySelectorAll('.ab-face').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            abRenderControls();
            abUpdatePreview();
        }

        function abShuffle() {
            function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
            var face = pick(AB_FACES);
            AB_STATE.seed = face.seed;
            AB_STATE.skinColor = face.skin;
            AB_STATE.top = face.top;
            AB_STATE.hairColor = face.hair;
            AB_STATE.bg = pick(AB_OPTIONS.bg).v;
            AB_STATE.eyes = pick(AB_OPTIONS.eyes).v;
            AB_STATE.mouth = pick(AB_OPTIONS.mouth).v;
            AB_STATE.eyebrows = pick(AB_OPTIONS.eyebrows).v;
            AB_STATE.accessories = pick(AB_OPTIONS.accessories).v;
            AB_STATE.facialHair = pick(AB_OPTIONS.facialHair).v;
            abRenderControls();
            abUpdatePreview();
        }

        function abReset() {
            AB_STATE.seed = 'Felix';
            AB_STATE.bg = 'b6e3f4';
            AB_STATE.skinColor = 'edb98a';
            AB_STATE.top = 'shortFlat';
            AB_STATE.hairColor = 'a55728';
            AB_STATE.eyes = 'happy';
            AB_STATE.mouth = 'smile';
            AB_STATE.eyebrows = 'default';
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
console.log('OK: rich avatar builder with 18 diverse faces + expressions');
