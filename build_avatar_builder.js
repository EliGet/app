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
        <title>Avatar Builder - EliGet</title>
        </head><body class="ab-body">
        <div class="ab-wrap">

            <header class="ab-topbar">
                <a href="/profile" class="ab-back" title="Back">
                    <svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
                </a>
                <span class="ab-title">Build your avatar</span>
                <button type="button" class="ab-random" onclick="abRandom()" title="Random">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M17 3h4v4h-2V5h-2V3zm-4 14l-4-4 4-4 1.4 1.4L12.8 12l1.6 1.6L13 17zM3 17h4v2H5v2H3v-4zm14-8l1.4 1.4L17.8 12l.6.6L17 14l-3-3 3-2zm-9 5H5v-2h3v2zm6-11l-1.4-1.4L13.2 1H9l2.4 2.4L10 5l4 4 4-4-4-2z" fill="currentColor"/></svg>
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
            seed: '\\\${me}',
            bg: 'b6e3f4',
            skinColor: 'light',
            top: 'ShortHairShortFlat',
            hairColor: 'brown',
            accessories: 'prescription02',
            accessoriesColor: 'black',
            facialHair: '',
            facialHairColor: 'brown',
            clothing: 'hoodie',
            clothesColor: 'blue',
            eyes: 'happy',
            mouth: 'smile'
        };

        var AB_OPTIONS = {
            bg: [
                { v: 'b6e3f4', c: '#b6e3f4' }, { v: 'c0aede', c: '#c0aede' },
                { v: 'd1d4f9', c: '#d1d4f9' }, { v: 'ffd5dc', c: '#ffd5dc' },
                { v: 'ffdfbf', c: '#ffdfbf' }, { v: 'a8e6cf', c: '#a8e6cf' },
                { v: 'fddb92', c: '#fddb92' }, { v: 'a0c4ff', c: '#a0c4ff' },
                { v: 'bdb2ff', c: '#bdb2ff' }, { v: 'ffc6ff', c: '#ffc6ff' },
                { v: 'fffffc', c: '#ffffff' }, { v: '1e293b', c: '#1e293b' }
            ],
            skinColor: [
                { v: 'ffdbb4', c: '#ffdbb4' }, { v: 'edb98a', c: '#edb98a' },
                { v: 'd08b5b', c: '#d08b5b' }, { v: 'ae5d29', c: '#ae5d29' },
                { v: '614335', c: '#614335' }, { v: 'f8d25c', c: '#f8d25c' },
                { v: 'fd9841', c: '#fd9841' }
            ],
            top: [
                { v: 'NoHair', l: 'Bald' },
                { v: 'ShortHairShortFlat', l: 'Short' },
                { v: 'ShortHairShortRound', l: 'Round' },
                { v: 'ShortHairShortWaved', l: 'Waved' },
                { v: 'ShortHairTheCaesar', l: 'Caesar' },
                { v: 'ShortHairFrizzle', l: 'Frizzle' },
                { v: 'ShortHairSides', l: 'Sides' },
                { v: 'LongHairBigHair', l: 'Big' },
                { v: 'LongHairBob', l: 'Bob' },
                { v: 'LongHairBun', l: 'Bun' },
                { v: 'LongHairCurly', l: 'Curly' },
                { v: 'LongHairCurvy', l: 'Curvy' },
                { v: 'LongHairDreads', l: 'Dreads' },
                { v: 'LongHairFro', l: 'Fro' },
                { v: 'LongHairMiaWallace', l: 'Mia' },
                { v: 'LongHairStraight', l: 'Straight' },
                { v: 'Hat', l: 'Hat' },
                { v: 'WinterHat1', l: 'Winter' },
                { v: 'Turban', l: 'Turban' },
                { v: 'Hijab', l: 'Hijab' }
            ],
            hairColor: [
                { v: 'a55728', c: '#a55728' }, { v: '2c1b18', c: '#2c1b18' },
                { v: 'b58143', c: '#b58143' }, { v: 'd6b370', c: '#d6b370' },
                { v: '724133', c: '#724133' }, { v: '4a312c', c: '#4a312c' },
                { v: 'f59797', c: '#f59797' }, { v: 'e8e1e1', c: '#e8e1e1' },
                { v: 'ecdcbf', c: '#ecdcbf' }, { v: 'c93305', c: '#c93305' }
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
            accessoriesColor: [
                { v: '262e33', c: '#262e33' }, { v: '65c9ff', c: '#65c9ff' },
                { v: '5199e4', c: '#5199e4' }, { v: '25557c', c: '#25557c' },
                { v: 'ff5c5c', c: '#ff5c5c' }, { v: 'ffafb9', c: '#ffafb9' },
                { v: 'ffffb1', c: '#ffffb1' }, { v: 'ffffff', c: '#ffffff' }
            ],
            facialHair: [
                { v: '', l: 'None' },
                { v: 'beardMedium', l: 'Medium' },
                { v: 'beardLight', l: 'Light' },
                { v: 'beardMajestic', l: 'Majestic' },
                { v: 'moustacheFancy', l: 'Fancy' },
                { v: 'moustacheMagnum', l: 'Magnum' }
            ],
            facialHairColor: [
                { v: 'a55728', c: '#a55728' }, { v: '2c1b18', c: '#2c1b18' },
                { v: 'b58143', c: '#b58143' }, { v: 'd6b370', c: '#d6b370' },
                { v: '724133', c: '#724133' }, { v: '4a312c', c: '#4a312c' }
            ],
            clothing: [
                { v: 'hoodie', l: 'Hoodie' },
                { v: 'blazerAndShirt', l: 'Blazer' },
                { v: 'blazerAndSweater', l: 'Sweater' },
                { v: 'collarAndSweater', l: 'Collar' },
                { v: 'graphicShirt', l: 'Graphic' },
                { v: 'overall', l: 'Overall' },
                { v: 'shirtCrewNeck', l: 'Crew' },
                { v: 'shirtScoopNeck', l: 'Scoop' },
                { v: 'shirtVNeck', l: 'V-Neck' }
            ],
            clothesColor: [
                { v: '262e33', c: '#262e33' }, { v: '65c9ff', c: '#65c9ff' },
                { v: '5199e4', c: '#5199e4' }, { v: '25557c', c: '#25557c' },
                { v: '929598', c: '#929598' }, { v: 'a7ffc4', c: '#a7ffc4' },
                { v: 'ffafb9', c: '#ffafb9' }, { v: 'ff488e', c: '#ff488e' },
                { v: 'ff5c5c', c: '#ff5c5c' }, { v: 'ffffb1', c: '#ffffb1' }
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
                { v: 'close', l: 'Close' }
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
                { v: 'eating', l: 'Eating' }
            ]
        };

        function abComposeUrl() {
            var s = AB_STATE;
            var parts = ['seed=' + encodeURIComponent(s.seed)];
            parts.push('backgroundColor=' + s.bg);
            parts.push('skinColor=' + s.skinColor);
            parts.push('top=' + s.top);
            parts.push('hairColor=' + s.hairColor);
            parts.push('accessories=' + (s.accessories || ''));
            if (s.accessories) parts.push('accessoriesColor=' + s.accessoriesColor);
            if (s.facialHair) {
                parts.push('facialHair=' + s.facialHair);
                parts.push('facialHairColor=' + s.facialHairColor);
            } else {
                parts.push('facialHairProbability=0');
            }
            parts.push('clothing=' + s.clothing);
            parts.push('clothesColor=' + s.clothesColor);
            parts.push('eyes=' + s.eyes);
            parts.push('mouth=' + s.mouth);
            return 'https://api.dicebear.com/7.x/avataaars/svg?' + parts.join('&');
        }

        function abUpdatePreview() {
            var img = document.getElementById('abPreview');
            if (img) img.src = abComposeUrl();
        }

        function abRenderControls() {
            var box = document.getElementById('abControls');
            var html = '';

            function colorGroup(label, key, opts) {
                var h = '<div class="ab-group"><div class="ab-group-label">' + label + '</div><div class="ab-colors">';
                opts.forEach(function(o) {
                    var active = AB_STATE[key] === o.v ? ' active' : '';
                    h += '<button type="button" class="ab-color' + active + '" style="background:' + o.c + '" data-key="' + key + '" data-val="' + o.v + '" onclick="abPick(this)"></button>';
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
            html += pillGroup('Glasses', 'accessories', AB_OPTIONS.accessories);
            html += colorGroup('Glasses color', 'accessoriesColor', AB_OPTIONS.accessoriesColor);
            html += pillGroup('Facial hair', 'facialHair', AB_OPTIONS.facialHair);
            html += colorGroup('Facial color', 'facialHairColor', AB_OPTIONS.facialHairColor);
            html += pillGroup('Clothing', 'clothing', AB_OPTIONS.clothing);
            html += colorGroup('Clothing color', 'clothesColor', AB_OPTIONS.clothesColor);
            html += pillGroup('Eyes', 'eyes', AB_OPTIONS.eyes);
            html += pillGroup('Mouth', 'mouth', AB_OPTIONS.mouth);

            box.innerHTML = html;
        }

        function abPick(btn) {
            var key = btn.getAttribute('data-key');
            var val = btn.getAttribute('data-val');
            AB_STATE[key] = val;
            // Update active state in siblings
            var parent = btn.parentNode;
            parent.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            abUpdatePreview();
        }

        function abRandom() {
            function pick(arr) { return arr[Math.floor(Math.random() * arr.length)].v; }
            AB_STATE.bg = pick(AB_OPTIONS.bg);
            AB_STATE.skinColor = pick(AB_OPTIONS.skinColor);
            AB_STATE.top = pick(AB_OPTIONS.top);
            AB_STATE.hairColor = pick(AB_OPTIONS.hairColor);
            AB_STATE.accessories = pick(AB_OPTIONS.accessories);
            AB_STATE.accessoriesColor = pick(AB_OPTIONS.accessoriesColor);
            AB_STATE.facialHair = pick(AB_OPTIONS.facialHair);
            AB_STATE.facialHairColor = pick(AB_OPTIONS.facialHairColor);
            AB_STATE.clothing = pick(AB_OPTIONS.clothing);
            AB_STATE.clothesColor = pick(AB_OPTIONS.clothesColor);
            AB_STATE.eyes = pick(AB_OPTIONS.eyes);
            AB_STATE.mouth = pick(AB_OPTIONS.mouth);
            abRenderControls();
            abUpdatePreview();
        }

        function abReset() {
            AB_STATE.bg = 'b6e3f4';
            AB_STATE.skinColor = 'light';
            AB_STATE.top = 'ShortHairShortFlat';
            AB_STATE.hairColor = 'brown';
            AB_STATE.accessories = 'prescription02';
            AB_STATE.accessoriesColor = 'black';
            AB_STATE.facialHair = '';
            AB_STATE.facialHairColor = 'brown';
            AB_STATE.clothing = 'hoodie';
            AB_STATE.clothesColor = 'blue';
            AB_STATE.eyes = 'happy';
            AB_STATE.mouth = 'smile';
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
console.log('OK: avatar builder route installed');
