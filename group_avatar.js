const fs = require('fs');
let src = fs.readFileSync('routes/group.js', 'utf8');
const before = src;

// Remove old avatar options generation
const oldAvatarGen = `        const avatarSeeds = ['School', 'Work', 'Friends', 'Family', 'Tech', 'Music', 'Sports', 'Art', 'Travel', 'Food', 'Nature', 'Gaming'];
        let avatarOptionsHtml = '';

        avatarSeeds.forEach((seed, index) => {
            const url = \`https://api.dicebear.com/7.x/shapes/svg?seed=\${seed}\`;
            const isChecked = index === 0 ? 'checked' : '';
            const isSelected = index === 0 ? 'selected' : '';
            avatarOptionsHtml += \`
                <label class="avatar-option \${isSelected}" onclick="selectAvatar(this)">
                    <input type="radio" name="avatar_url" value="\${url}" \${isChecked} required>
                    <img src="\${url}" alt="\${seed}">
                    <span>\${seed}</span>
                </label>
            \`;
        });
`;
if (src.includes(oldAvatarGen)) {
    src = src.replace(oldAvatarGen, '');
    console.log('OK: old avatar grid removed');
}

// Replace old form avatar section
const oldForm = `                        <div class="form-group">
                            <label>Choose Avatar</label>
                            <div class="avatar-grid">\${avatarOptionsHtml}</div>
                        </div>
                        <div class="form-group">
                            <label>Select Members</label>
                            <div class="member-list">\${memberItemsHtml}</div>
                        </div>
                        <button type="submit" class="btn-full" \${!hasFriends ? 'disabled' : ''}>Create Group</button>
                    </form>
                </div>
            </div>
            \${getBottomNav('chat')}
            <script>function selectAvatar(el){document.querySelectorAll('.avatar-option').forEach(o=>o.classList.remove('selected'));el.classList.add('selected');}</script>
            </body></html>`;

const newForm = `                        <div class="form-group">
                            <label>Group Avatar</label>
                            <input type="hidden" name="avatar_url" id="groupAvatarUrl" value="">
                            <div id="groupAvatarPreview" class="group-avatar-preview" style="display:none;">
                                <div class="group-avatar-preview-icon" id="groupAvatarPreviewIcon"></div>
                                <button type="button" class="group-avatar-change" onclick="openGroupAvatarModal()">Change</button>
                            </div>
                            <button type="button" class="group-avatar-build" id="groupAvatarBuild" onclick="openGroupAvatarModal()">
                                <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                                Build avatar
                            </button>
                        </div>
                        <div class="form-group">
                            <label>Select Members</label>
                            <div class="member-list">\${memberItemsHtml}</div>
                        </div>
                        <button type="submit" class="btn-full" \${!hasFriends ? 'disabled' : ''}>Create Group</button>
                    </form>
                </div>
            </div>

            <div class="sp-svg-modal ga-modal" id="groupAvatarModal">
                <div class="sp-svg-modal-inner ga-modal-inner">
                    <div class="sp-svg-modal-head">
                        <span class="sp-svg-modal-title">Build group avatar</span>
                        <button type="button" class="sp-svg-modal-close" onclick="closeGroupAvatarModal()" aria-label="Close">
                            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
                        </button>
                    </div>

                    <div class="ga-preview">
                        <div class="ga-preview-frame">
                            <img id="gaPreviewImg" src="" alt="Group avatar">
                        </div>
                        <button type="button" class="ga-shuffle" onclick="gaShuffle()">
                            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg>
                            Shuffle
                        </button>
                    </div>

                    <div class="ga-controls" id="gaControls"></div>

                    <div class="ga-actions">
                        <button type="button" class="ab-btn-secondary" onclick="gaReset()">Reset</button>
                        <button type="button" class="ab-btn-primary" onclick="gaSave()">Save avatar</button>
                    </div>
                </div>
            </div>

            \${getBottomNav('chat')}
            <script>
            var GA_STATE = {
                seed: 'Group',
                bg: 'b6e3f4',
                skinColor: 'edb98a',
                top: 'shortFlat',
                hairColor: 'a55728',
                eyes: 'happy',
                mouth: 'smile',
                eyebrows: 'default',
                accessories: '',
                facialHair: '',
                clothing: 'hoodie',
                clothesColor: '5199e4'
            };

            var GA_OPTIONS = {
                bg: [
                    { v: 'b6e3f4' }, { v: 'c0aede' }, { v: 'd1d4f9' }, { v: 'ffd5dc' },
                    { v: 'ffdfbf' }, { v: 'a8e6cf' }, { v: 'fddb92' }, { v: 'a0c4ff' },
                    { v: 'bdb2ff' }, { v: 'ffc6ff' }, { v: 'ffffff' }, { v: '1e293b' }
                ],
                skinColor: [
                    { v: 'ffdbb4' }, { v: 'edb98a' }, { v: 'd08b5b' },
                    { v: 'ae5d29' }, { v: '614335' }, { v: 'f8d25c' }
                ],
                hairColor: [
                    { v: 'a55728' }, { v: '2c1b18' }, { v: 'b58143' },
                    { v: 'd6b370' }, { v: '724133' }, { v: '4a312c' }
                ],
                top: [
                    { v: 'shortFlat', l: 'Short' },
                    { v: 'shortRound', l: 'Round' },
                    { v: 'theCaesar', l: 'Caesar' },
                    { v: 'bob', l: 'Bob' },
                    { v: 'bun', l: 'Bun' },
                    { v: 'curly', l: 'Curly' },
                    { v: 'fro', l: 'Fro' },
                    { v: 'hat', l: 'Hat' },
                    { v: 'winterHat1', l: 'Winter' },
                    { v: 'hijab', l: 'Hijab' }
                ],
                accessories: [
                    { v: '', l: 'None' },
                    { v: 'round', l: 'Round' },
                    { v: 'prescription02', l: 'Classic' },
                    { v: 'wayfarers', l: 'Wayfarer' },
                    { v: 'sunglasses', l: 'Sunglasses' }
                ],
                facialHair: [
                    { v: '', l: 'None' },
                    { v: 'beardMedium', l: 'Medium' },
                    { v: 'beardMajestic', l: 'Majestic' },
                    { v: 'moustacheFancy', l: 'Fancy' }
                ],
                clothing: [
                    { v: 'hoodie', l: 'Hoodie' },
                    { v: 'blazerAndShirt', l: 'Blazer' },
                    { v: 'shirtCrewNeck', l: 'Crew' },
                    { v: 'shirtVNeck', l: 'V-Neck' }
                ],
                clothesColor: [
                    { v: '262e33' }, { v: '65c9ff' }, { v: '5199e4' },
                    { v: '25557c' }, { v: 'ff5c5c' }, { v: 'a7ffc4' }
                ],
                eyes: [
                    { v: 'default', l: 'Normal' },
                    { v: 'happy', l: 'Happy' },
                    { v: 'wink', l: 'Wink' },
                    { v: 'squint', l: 'Squint' },
                    { v: 'surprised', l: 'Surprised' }
                ],
                mouth: [
                    { v: 'default', l: 'Normal' },
                    { v: 'smile', l: 'Smile' },
                    { v: 'twinkle', l: 'Twinkle' },
                    { v: 'serious', l: 'Serious' }
                ],
                eyebrows: [
                    { v: 'default', l: 'Normal' },
                    { v: 'raised', l: 'Raised' },
                    { v: 'angry', l: 'Angry' },
                    { v: 'concerned', l: 'Concerned' }
                ]
            };

            function gaComposeUrl() {
                var s = GA_STATE;
                var parts = ['seed=' + encodeURIComponent(s.seed)];
                parts.push('backgroundColor=' + s.bg);
                parts.push('skinColor=' + s.skinColor);
                parts.push('top=' + s.top);
                parts.push('hairColor=' + s.hairColor);
                parts.push('eyes=' + s.eyes);
                parts.push('mouth=' + s.mouth);
                parts.push('eyebrows=' + s.eyebrows);
                parts.push('clothing=' + s.clothing);
                parts.push('clothesColor=' + s.clothesColor);
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

            function gaUpdatePreview() {
                var img = document.getElementById('gaPreviewImg');
                if (img) img.src = gaComposeUrl();
            }

            function gaRenderControls() {
                var box = document.getElementById('gaControls');
                var html = '';
                function colorGroup(label, key, opts) {
                    var h = '<div class="ab-group"><div class="ab-group-label">' + label + '</div><div class="ab-colors">';
                    opts.forEach(function(o) {
                        var active = GA_STATE[key] === o.v ? ' active' : '';
                        h += '<button type="button" class="ab-color' + active + '" style="background:#' + o.v + '" data-key="' + key + '" data-val="' + o.v + '" onclick="gaPick(this)"></button>';
                    });
                    h += '</div></div>';
                    return h;
                }
                function pillGroup(label, key, opts) {
                    var h = '<div class="ab-group"><div class="ab-group-label">' + label + '</div><div class="ab-pills">';
                    opts.forEach(function(o) {
                        var active = GA_STATE[key] === o.v ? ' active' : '';
                        h += '<button type="button" class="ab-pill' + active + '" data-key="' + key + '" data-val="' + o.v + '" onclick="gaPick(this)">' + o.l + '</button>';
                    });
                    h += '</div></div>';
                    return h;
                }
                html += colorGroup('Background', 'bg', GA_OPTIONS.bg);
                html += colorGroup('Skin', 'skinColor', GA_OPTIONS.skinColor);
                html += pillGroup('Hair', 'top', GA_OPTIONS.top);
                html += colorGroup('Hair color', 'hairColor', GA_OPTIONS.hairColor);
                html += pillGroup('Glasses', 'accessories', GA_OPTIONS.accessories);
                html += pillGroup('Beard', 'facialHair', GA_OPTIONS.facialHair);
                html += pillGroup('Dress', 'clothing', GA_OPTIONS.clothing);
                html += colorGroup('Dress color', 'clothesColor', GA_OPTIONS.clothesColor);
                html += pillGroup('Eyes', 'eyes', GA_OPTIONS.eyes);
                html += pillGroup('Mouth', 'mouth', GA_OPTIONS.mouth);
                html += pillGroup('Eyebrows', 'eyebrows', GA_OPTIONS.eyebrows);
                box.innerHTML = html;
            }

            function gaPick(btn) {
                var key = btn.getAttribute('data-key');
                var val = btn.getAttribute('data-val');
                GA_STATE[key] = val;
                var parent = btn.parentNode;
                parent.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                gaUpdatePreview();
            }

            function gaShuffle() {
                function pick(arr) { return arr[Math.floor(Math.random() * arr.length)].v; }
                GA_STATE.seed = 'g' + Math.random().toString(36).slice(2, 8);
                GA_STATE.bg = pick(GA_OPTIONS.bg);
                GA_STATE.skinColor = pick(GA_OPTIONS.skinColor);
                GA_STATE.top = pick(GA_OPTIONS.top);
                GA_STATE.hairColor = pick(GA_OPTIONS.hairColor);
                GA_STATE.eyes = pick(GA_OPTIONS.eyes);
                GA_STATE.mouth = pick(GA_OPTIONS.mouth);
                GA_STATE.eyebrows = pick(GA_OPTIONS.eyebrows);
                GA_STATE.accessories = pick(GA_OPTIONS.accessories);
                GA_STATE.facialHair = pick(GA_OPTIONS.facialHair);
                GA_STATE.clothing = pick(GA_OPTIONS.clothing);
                GA_STATE.clothesColor = pick(GA_OPTIONS.clothesColor);
                gaRenderControls();
                gaUpdatePreview();
            }

            function gaReset() {
                GA_STATE.seed = 'Group';
                GA_STATE.bg = 'b6e3f4';
                GA_STATE.skinColor = 'edb98a';
                GA_STATE.top = 'shortFlat';
                GA_STATE.hairColor = 'a55728';
                GA_STATE.eyes = 'happy';
                GA_STATE.mouth = 'smile';
                GA_STATE.eyebrows = 'default';
                GA_STATE.accessories = '';
                GA_STATE.facialHair = '';
                GA_STATE.clothing = 'hoodie';
                GA_STATE.clothesColor = '5199e4';
                gaRenderControls();
                gaUpdatePreview();
            }

            function openGroupAvatarModal() {
                document.getElementById('groupAvatarModal').classList.add('open');
                document.body.style.overflow = 'hidden';
                gaRenderControls();
                gaUpdatePreview();
            }

            function closeGroupAvatarModal() {
                document.getElementById('groupAvatarModal').classList.remove('open');
                document.body.style.overflow = '';
            }

            function gaSave() {
                var url = gaComposeUrl();
                document.getElementById('groupAvatarUrl').value = url;
                document.getElementById('groupAvatarPreviewIcon').innerHTML = '<img src="' + url + '" alt="">';
                document.getElementById('groupAvatarPreview').style.display = 'flex';
                document.getElementById('groupAvatarBuild').style.display = 'none';
                closeGroupAvatarModal();
            }

            document.getElementById('groupAvatarModal').addEventListener('click', function(e) {
                if (e.target === this) closeGroupAvatarModal();
            });
            </script>
            </body></html>`;

if (src.includes(oldForm)) {
    src = src.replace(oldForm, function() { return newForm; });
    console.log('OK: group form rebuilt with modal');
} else {
    console.log('WARN: form pattern not found');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('routes/group.js', src);
console.log('DONE');
