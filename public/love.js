function toggleLove(event, btn) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    var postId = btn.getAttribute('data-post-id');
    if (!postId || btn.disabled) return;
    btn.disabled = true;
    fetch('/post/' + postId + '/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.ok) {
            btn.classList.toggle('liked', data.liked);
            var counter = btn.querySelector('.post-love-count');
            if (counter) counter.textContent = data.likes;
        }
    })
    .catch(function(err) { console.error('Love error:', err); })
    .then(function() { btn.disabled = false; });
}
