(function() {
    var input = document.getElementById('au-uname');
    var status = document.getElementById('au-uname-status');
    var hint = document.getElementById('au-uname-hint');
    var submit = document.getElementById('au-submit');
    if (!input || !status) return;

    var timer = null;
    var lastQuery = null;
    var lastOk = false;

    function setState(state, message) {
        input.setAttribute('data-availability', state);
        status.className = 'au-status ' + state;
        if (message) {
            status.innerHTML = message;
        } else {
            status.innerHTML = '';
        }
    }

    function setHint(text, danger) {
        hint.textContent = text;
        hint.className = 'au-hint' + (danger ? ' danger' : '');
    }

    function setSubmitEnabled(ok) {
        lastOk = ok;
        if (submit) {
            submit.disabled = !ok;
            submit.style.opacity = ok ? '1' : '0.55';
            submit.style.cursor = ok ? 'pointer' : 'not-allowed';
        }
    }

    function validate(raw) {
        if (!raw) return { state: 'idle', msg: '' };
        if (raw.length < 3) return { state: 'bad', msg: '<span class="au-dot"></span>Too short' };
        if (raw.length > 20) return { state: 'bad', msg: '<span class="au-dot"></span>Too long' };
        if (!/^[a-zA-Z0-9_]+$/.test(raw)) return { state: 'bad', msg: '<span class="au-dot"></span>Invalid characters' };
        return null;
    }

    function check(raw) {
        if (raw === lastQuery) return;
        lastQuery = raw;

        var local = validate(raw);
        if (local) {
            setState(local.state, local.msg);
            setSubmitEnabled(false);
            return;
        }

        setState('checking', '<span class="au-spinner"></span>Checking...');
        setSubmitEnabled(false);

        fetch('/auth/api/check-username?u=' + encodeURIComponent(raw), { credentials: 'same-origin' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (lastQuery !== raw) return;
                if (data && data.ok) {
                    setState('good', '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#16a34a"/></svg> Available');
                    setHint('Looks good. You can use this username.', false);
                    setSubmitEnabled(true);
                } else {
                    var reason = data && data.reason;
                    var msg = 'Taken';
                    if (reason === 'short') msg = 'Too short';
                    else if (reason === 'long') msg = 'Too long';
                    else if (reason === 'invalid') msg = 'Invalid';
                    setState('bad', '<span class="au-dot"></span>' + msg);
                    setHint(msg === 'Taken' ? 'Try another one.' : 'Fix the username to continue.', true);
                    setSubmitEnabled(false);
                }
            })
            .catch(function() {
                if (lastQuery !== raw) return;
                setState('bad', '<span class="au-dot"></span>Check failed');
                setHint('Could not verify. Try again.', true);
                setSubmitEnabled(false);
            });
    }

    input.addEventListener('input', function() {
        clearTimeout(timer);
        var raw = input.value.trim();
        if (!raw) {
            lastQuery = null;
            setState('idle', '');
            setHint('Letters, numbers, underscore. 3-20 characters.', false);
            setSubmitEnabled(false);
            return;
        }
        var local = validate(raw);
        if (local) {
            setState(local.state, local.msg);
            setHint('Letters, numbers, underscore. 3-20 characters.', true);
            setSubmitEnabled(false);
            return;
        }
        setSubmitEnabled(false);
        timer = setTimeout(function() { check(raw); }, 400);
    });

    // Submit guard — availability না হলে block
    var form = document.getElementById('signupForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            if (!lastOk) {
                e.preventDefault();
                input.focus();
            }
        });
    }

    // Initial state: if pre-filled (from error redirect), trigger check
    if (input.value.trim()) {
        check(input.value.trim());
    } else {
        setSubmitEnabled(true); // allow submit for fname/pass-only users? No — need username. But keep button enabled so they can try.
        setSubmitEnabled(false);
    }
})();
