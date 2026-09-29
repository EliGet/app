const fs = require('fs');
let src = fs.readFileSync('lib/linkify.js', 'utf8');
const before = src;

const oldBlock = `            const vid = detectVideo(url);
            if (vid) {
                const thumbHtml = vid.thumb
                    ? '<div class="ev-thumb" style="background-image:url(\\'' + vid.thumb + '\\')"></div>'
                    : '<div class="ev-thumb ev-thumb-placeholder"><svg viewBox="0 0 24 24" width="32" height="32"><path d="M10 8.64v6.72L15.27 12z" fill="currentColor"/></svg></div>';
                out.push(
                    '<a href="' + vid.watch + '" target="_blank" rel="noopener noreferrer" class="ev-card">' +
                        thumbHtml +
                        '<div class="ev-body">' +
                            '<div class="ev-label">' + (vid.provider === 'youtube' ? 'YouTube' : 'Vimeo') + '</div>' +
                            '<div class="ev-title">Watch video</div>' +
                        '</div>' +
                        '<span class="ev-play"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span>' +
                    '</a>' + trail
                );
            } else {`;

const newBlock = `            const vid = detectVideo(url);
            if (vid) {
                const thumbHtml = vid.thumb
                    ? '<div class="ev-thumb" style="background-image:url(\\'' + vid.thumb + '\\')"></div>'
                    : '<div class="ev-thumb ev-thumb-placeholder"></div>';
                out.push(
                    '<a href="' + vid.watch + '" target="_blank" rel="noopener noreferrer" class="ev-card">' +
                        thumbHtml +
                    '</a>' + trail
                );
            } else {`;

if (!src.includes(oldBlock)) { console.log('ERROR: video block not found'); process.exit(1); }
src = src.replace(oldBlock, function() { return newBlock; });
fs.writeFileSync('lib/linkify.js', src);
console.log('OK: video card simplified to thumbnail only');
