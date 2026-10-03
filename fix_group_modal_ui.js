const fs = require('fs');
let src = fs.readFileSync('routes/group.js', 'utf8');
const before = src;

// Rebuild modal HTML with better structure
const oldModal = `            <div class="sp-svg-modal ga-modal" id="groupAvatarModal">
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
            </div>`;

const newModal = `            <div class="sp-svg-modal ga-modal" id="groupAvatarModal">
                <div class="sp-svg-modal-inner ga-modal-inner">
                    <div class="ga-head">
                        <button type="button" class="ga-head-btn" onclick="closeGroupAvatarModal()" aria-label="Close">
                            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
                        </button>
                        <span class="ga-head-title">Avatar</span>
                        <button type="button" class="ga-head-btn" onclick="gaShuffle()" aria-label="Shuffle">
                            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg>
                        </button>
                    </div>

                    <div class="ga-preview">
                        <div class="ga-preview-frame">
                            <img id="gaPreviewImg" src="" alt="Group avatar">
                        </div>
                    </div>

                    <div class="ga-controls" id="gaControls"></div>

                    <div class="ga-actions">
                        <button type="button" class="ga-btn-reset" onclick="gaReset()">Reset</button>
                        <button type="button" class="ga-btn-save" onclick="gaSave()">Save avatar</button>
                    </div>
                </div>
            </div>`;

if (src.includes(oldModal)) {
    src = src.replace(oldModal, function() { return newModal; });
    console.log('OK: modal structure simplified');
} else {
    console.log('WARN: modal HTML not found');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('routes/group.js', src);
console.log('DONE');
