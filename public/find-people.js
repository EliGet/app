(function() {
    var input = document.getElementById('userSearch');
    var box = document.getElementById('resultsBox');
    if (!input || !box) return;

    var timer = null;
    var lastQuery = null;

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function(c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function renderUsers(users, query) {
        if (!users.length) {
            box.innerHTML = '<p style="text-align:center; color:#a0aec0; padding:24px;">No user found for "' + escapeHtml(query) + '".</p>';
            return;
        }
        var html = '';
        users.forEach(function(u) {
            var avatar = u.avatar
                ? '<img src="' + escapeHtml(u.avatar) + '" alt="">'
                : escapeHtml(u.initial);

            var btn = '';
            if (u.status === 'mutual') {
                btn = '<a href="/chat/' + encodeURIComponent(u.username) + '" class="request-btn request-btn-accept" style="text-decoration:none;display:inline-block;">Message</a>';
            } else if (u.status === 'following') {
                btn = '<button type="button" class="request-btn-requested" data-username="' + escapeHtml(u.username) + '" onclick="fpToggleFollow(this)">Following</button>';
            } else {
                btn = '<button type="button" class="request-btn request-btn-accept" data-username="' + escapeHtml(u.username) + '" onclick="fpToggleFollow(this)">Follow</button>';
            }

            html += '<div class="chat-item">'
                + '<div class="chat-avatar">' + avatar + '</div>'
                + '<div class="chat-info">'
                + '<div class="chat-name">' + escapeHtml(u.displayName) + '</div>'
                + '<div class="chat-preview">@' + escapeHtml(u.username) + (u.status === 'mutual' ? ' · Mutual' : (u.status === 'follows-me' ? ' · Follows you' : '')) + '</div>'
                + '</div>'
                + btn
                + '</div>';
        });
        box.innerHTML = html;
    }

    function doSearch(q) {
        if (q === lastQuery) return;
        lastQuery = q;
        if (!q) {
            box.innerHTML = '<p style="text-align:center; color:#a0aec0; padding:24px;">Start typing to search people.</p>';
            return;
        }
        box.innerHTML = '<p style="text-align:center; color:#a0aec0; padding:24px;">Searching...</p>';
        fetch('/chat/api/search-users?q=' + encodeURIComponent(q), { credentials: 'same-origin' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (lastQuery !== q) return;
                renderUsers((data && data.users) || [], q);
            })
            .catch(function() {
                box.innerHTML = '<p style="text-align:center; color:#e53e3e; padding:24px;">Search failed. Try again.</p>';
            });
    }

    window.fpToggleFollow = function(btn) {
        var username = btn.getAttribute('data-username');
        if (!username || btn.disabled) return;
        btn.disabled = true;
        fetch('/follow/' + encodeURIComponent(username), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.ok) {
                btn.textContent = data.following ? 'Following' : 'Follow';
                btn.className = data.following ? 'request-btn-requested' : 'request-btn request-btn-accept';
                // If mutual — show Message
                if (data.following) {
                    // Re-check status to see if mutual
                    fetch('/chat/api/search-users?q=' + encodeURIComponent(username), { credentials: 'same-origin' })
                        .then(function(r) { return r.json(); })
                        .then(function(d) {
                            var fresh = (d.users || []).find(function(u) { return u.username === username; });
                            if (fresh && fresh.status === 'mutual') {
                                btn.outerHTML = '<a href="/chat/' + encodeURIComponent(username) + '" class="request-btn request-btn-accept" style="text-decoration:none;display:inline-block;">Message</a>';
                            }
                        });
                }
            } else {
                btn.disabled = false;
            }
        })
        .catch(function() { btn.disabled = false; })
        .then(function() { btn.disabled = false; });
    };

    input.addEventListener('input', function() {
        clearTimeout(timer);
        var q = input.value.trim();
        timer = setTimeout(function() { doSearch(q); }, 280);
    });
})();
