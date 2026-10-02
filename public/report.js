(function() {
    if (document.getElementById('reportModal')) return;

    var modal = document.createElement('div');
    modal.id = 'reportModal';
    modal.className = 'rp-modal';
    modal.innerHTML = [
        '<div class="rp-modal-inner">',
            '<div class="rp-modal-head">',
                '<span class="rp-modal-title">Report</span>',
                '<button type="button" class="rp-modal-close" onclick="rpClose()" aria-label="Close">',
                    '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>',
                '</button>',
            '</div>',
            '<p class="rp-modal-desc">Help keep EliGet safe. Your report is anonymous.</p>',
            '<div class="rp-reasons" id="rpReasons"></div>',
            '<textarea id="rpNote" class="rp-note" placeholder="Add details (optional)" maxlength="500" rows="3"></textarea>',
            '<button type="button" class="rp-submit" id="rpSubmit" onclick="rpSend()">Submit report</button>',
        '</div>'
    ].join('');
    document.body.appendChild(modal);

    var REASONS = [
        { v: 'spam', l: 'Spam or misleading' },
        { v: 'harassment', l: 'Harassment or bullying' },
        { v: 'hate', l: 'Hate speech' },
        { v: 'misinformation', l: 'False information' },
        { v: 'other', l: 'Something else' }
    ];

    var state = { target_type: '', target_id: '', reason: '' };

    function renderReasons() {
        var box = document.getElementById('rpReasons');
        var html = '';
        REASONS.forEach(function(r) {
            var active = state.reason === r.v ? ' active' : '';
            html += '<button type="button" class="rp-reason' + active + '" data-v="' + r.v + '" onclick="rpPickReason(this)">' + r.l + '</button>';
        });
        box.innerHTML = html;
    }

    window.rpOpen = function(targetType, targetId) {
        state.target_type = targetType;
        state.target_id = targetId;
        state.reason = '';
        document.getElementById('rpNote').value = '';
        renderReasons();
        document.getElementById('reportModal').classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    window.rpClose = function() {
        document.getElementById('reportModal').classList.remove('open');
        document.body.style.overflow = '';
    };

    window.rpPickReason = function(btn) {
        state.reason = btn.getAttribute('data-v');
        var parent = btn.parentNode;
        parent.querySelectorAll('.rp-reason').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
    };

    window.rpSend = function() {
        if (!state.reason) {
            alert('Please pick a reason.');
            return;
        }
        var btn = document.getElementById('rpSubmit');
        btn.disabled = true;
        btn.textContent = 'Submitting...';

        fetch('/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                target_type: state.target_type,
                target_id: state.target_id,
                reason: state.reason,
                note: document.getElementById('rpNote').value.trim()
            })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data && data.ok) {
                btn.textContent = 'Report submitted';
                setTimeout(function() {
                    rpClose();
                    btn.disabled = false;
                    btn.textContent = 'Submit report';
                }, 1200);
            } else {
                btn.disabled = false;
                btn.textContent = 'Submit report';
                alert('Could not submit. Try again.');
            }
        })
        .catch(function() {
            btn.disabled = false;
            btn.textContent = 'Submit report';
            alert('Network error.');
        });
    };

    // Close on backdrop tap
    modal.addEventListener('click', function(e) {
        if (e.target === modal) rpClose();
    });
})();
