// Escape HTML to prevent XSS
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function mentionify(text) {
    return text.replace(/(^|[^a-zA-Z0-9_])@([a-zA-Z0-9_]{3,20})/g, function(_, pre, un) {
        return pre + '<a href="/profile/' + un + '" class="elink elink-mention">@' + un + '</a>';
    });
}

function urlify(text) {
    const parts = text.split(/(https?:\/\/[^\s<]+)/);
    return parts.map(function(part, i) {
        if (i % 2 === 1) {
            let url = part;
            let trail = '';
            while (url && /[.,!?;:)\]]$/.test(url)) {
                trail = url.slice(-1) + trail;
                url = url.slice(0, -1);
            }
            return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="elink">' + url + '</a>' + trail;
        }
        return mentionify(part);
    }).join('');
}

// Detect YouTube / Vimeo
function detectVideo(url) {
    var yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (yt) {
        return {
            provider: 'youtube',
            id: yt[1],
            thumb: 'https://img.youtube.com/vi/' + yt[1] + '/mqdefault.jpg',
            watch: 'https://www.youtube.com/watch?v=' + yt[1]
        };
    }
    var vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) {
        return {
            provider: 'vimeo',
            id: vm[1],
            thumb: null,
            watch: 'https://vimeo.com/' + vm[1]
        };
    }
    return null;
}

// Video-enabled linkify — for chats (private)
function linkifyWithVideo(text) {
    if (text === null || text === undefined) return '';
    const str = String(text);
    if (!str) return '';
    const escaped = escapeHtml(str);
    const parts = escaped.split(/(https?:\/\/[^\s<]+)/);
    const out = [];
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i % 2 === 1) {
            let url = part;
            let trail = '';
            while (url && /[.,!?;:)\]]$/.test(url)) {
                trail = url.slice(-1) + trail;
                url = url.slice(0, -1);
            }
            const vid = detectVideo(url);
            if (vid) {
                const thumbHtml = vid.thumb
                    ? '<div class="ev-thumb" style="background-image:url(\'' + vid.thumb + '\')"></div>'
                    : '<div class="ev-thumb ev-thumb-placeholder"></div>';
                out.push(
                    '<a href="' + vid.watch + '" target="_blank" rel="noopener noreferrer" class="ev-card">' +
                        thumbHtml +
                    '</a>' + trail
                );
            } else {
                out.push('<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="elink">' + url + '</a>' + trail);
            }
        } else {
            out.push(mentionify(part));
        }
    }
    return out.join('');
}

// ============ PUBLIC API ============

// Post — no URLs (plain text), mentions clickable
function linkifyPost(text) {
    if (text === null || text === undefined) return '';
    const escaped = escapeHtml(String(text));
    // Strip URL auto-linking (plain text), but keep mentions
    return mentionify(escaped);
}

// Bio — URLs clickable, mentions clickable, no video preview
function linkifyBio(text) {
    if (text === null || text === undefined) return '';
    return urlify(escapeHtml(String(text)));
}

// Chat — URLs clickable + video preview + mentions
function linkifyChat(text) {
    return linkifyWithVideo(text);
}

// Backward compat — default linkify (used where?)
function linkify(text) {
    return linkifyBio(text);
}

module.exports = {
    linkify: linkify,
    linkifyPost: linkifyPost,
    linkifyBio: linkifyBio,
    linkifyChat: linkifyChat,
    escapeHtml: escapeHtml
};
