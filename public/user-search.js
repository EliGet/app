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
                ? '<img src="' + escapeHtml(u.avatar) + '" alt="Avatar">'
                : escapeHtml(u.initial);
            var btn = '';
            if (u.status === 'requested') {
                btn = '<button type="button" class="request-btn-requested" disabled>Requested</button>';
            } else if (u.status === 'respond') {
                btn = '<a href="/chat/notifications" class="request-btn request-btn-accept" style="text-decoration:none;display:inline-block;">Respond</a>';
            } else if (u.status === 'friend') {
                btn = '<a href="/chat/' + encodeURIComponent(u.username) + '" class="request-btn request-btn-accept" style="text-decoration:none;display:inline-block;">Chat</a>';
            } else {
                btn = '<button type="button" class="request-btn request-btn-accept" data-username="' + escapeHtml(u.username) + '">Request</button>';
            }
            html += '<div class="chat-item">'
                + '<div class="chat-avatar">' + avatar + '</div>'
                + '<div class="chat-info">'
                + '<div class="chat-name">' + escapeHtml(u.displayName) + '</div>'
                + '<div class="chat-preview">@' + escapeHtml(u.username) + '</div>'
                + '</div>'
                + btn
                + '</div>';
        });
        box.innerHTML = html;

        // Request button handler
        box.querySelectorAll('button.request-btn').forEach(function(b) {
            b.addEventListener('click', function() {
                sendRequest(b, b.getAttribute('data-username'));
            });
        });
    }

    function doSearch(q) {
        if (q === lastQuery) return;
        lastQuery = q;
        if (!q) {
            box.innerHTML = '<p style="text-align:center; color:#a0aec0; padding:24px;">Start typing to search users.</p>';
            return;
        }
        box.innerHTML = '<p style="text-align:center; color:#a0aec0; padding:24px;">Searching...</p>';
        fetch('/chat/api/search?q=' + encodeURIComponent(q), { credentials: 'same-origin' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (lastQuery !== q) return;
                renderUsers((data && data.users) || [], q);
            })
            .catch(function() {
                box.innerHTML = '<p style="text-align:center; color:#e53e3e; padding:24px;">Search failed. Try again.</p>';
            });
    }

    function sendRequest(btn, username) {
        btn.disabled = true;
        btn.textContent = 'Sending...';
        fetch('/chat/api/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ to: username })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data && data.ok) {
                btn.textContent = 'Requested';
                btn.className = 'request-btn-requested';
            } else {
                btn.textContent = 'Failed';
                btn.disabled = false;
            }
        })
        .catch(function() {
            btn.textContent = 'Failed';
            btn.disabled = false;
        });
    }

    function onType() {
        clearTimeout(timer);
        var q = input.value.trim();
        timer = setTimeout(function() { doSearch(q); }, 280);
    }

    input.addEventListener('input', onType);
    input.addEventListener('keyup', onType);
    input.addEventListener('change', onType);
})();
