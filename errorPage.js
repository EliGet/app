// Editorial error page — shared across routes
module.exports = function errorPage(code, title, message, backHref, backLabel) {
    const href = backHref || '/';
    const label = backLabel || 'Back to home';
    return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="/style.css">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>${code} — EliGet</title>
</head><body class="au-body">
<div class="err-wrap">
    <div class="err-code">${code}</div>
    <h1 class="err-title">${title}</h1>
    <p class="err-msg">${message}</p>
    <a href="${href}" class="err-back">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
        ${label}
    </a>
</div>
</body></html>`;
};
