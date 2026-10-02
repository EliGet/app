function toggleFollow(btn) {
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
            btn.classList.toggle('following', data.following);
            // Update follower count if visible
            var stats = document.querySelectorAll('.pp-stat-num');
            if (stats && stats.length >= 2) {
                stats[1].textContent = data.count;
            }
        } else {
            btn.disabled = false;
        }
    })
    .catch(function() { btn.disabled = false; })
    .then(function() { btn.disabled = false; });
}

// Toggle follow from post card (uses same API)
function togglePostFollow(event, btn) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
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
            btn.classList.toggle('following', data.following);
        }
    })
    .catch(function() {})
    .then(function() { btn.disabled = false; });
}

// ===== Block toggle =====
function toggleBlockMenu(event) {
    if (event) { event.stopPropagation(); }
    var menu = document.getElementById('blockMenu');
    if (menu) menu.classList.toggle('open');
}

function toggleBlock(username, currentlyBlocked) {
    var action = currentlyBlocked ? 'Unblock' : 'Block';
    if (!confirm(action + ' @' + username + '?')) return;

    fetch('/block/' + encodeURIComponent(username), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.ok) {
            location.reload();
        } else {
            alert('Could not ' + action.toLowerCase() + '. Try again.');
        }
    })
    .catch(function() { alert('Network error.'); });
}

// Close menu on outside tap
document.addEventListener('click', function(e) {
    var menu = document.getElementById('blockMenu');
    if (menu && menu.classList.contains('open') && !menu.contains(e.target)) {
        var btn = e.target.closest('.pp-menu-btn-static');
        if (!btn) menu.classList.remove('open');
    }
});

// Close profile block/report menu
function toggleProfileMenuClose() {
    var menu = document.getElementById('blockMenu');
    if (menu) menu.classList.remove('open');
}

// Close all post dropdown menus
function closePostMenus() {
    document.querySelectorAll('.post-menu-dropdown').forEach(function(m) { m.classList.remove('active'); });
}

// ===== Theme toggle =====
function eligetToggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('eliget-theme', next); } catch(e) {}
    if (next === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    eligetUpdateThemeUI();
}

function eligetUpdateThemeUI() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var toggle = document.getElementById('themeToggle');
    var status = document.getElementById('themeStatusText');
    if (toggle) toggle.classList.toggle('on', isDark);
    if (status) status.textContent = isDark ? 'Enabled' : 'Switch between light and dark';
}

document.addEventListener('DOMContentLoaded', eligetUpdateThemeUI);
