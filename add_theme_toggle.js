const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// Find Settings page — insert Dark mode section before "Danger zone"
const oldSection = `            <section class="st-section st-danger-section">`;

const newSection = `            <section class="st-section">
                <h2 class="st-section-label">Appearance</h2>
                <div class="st-card">
                    <div class="st-row st-row-toggle" onclick="eligetToggleTheme()">
                        <div class="st-row-icon">
                            <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" fill="currentColor"/></svg>
                        </div>
                        <div class="st-row-content">
                            <div class="st-row-title">Dark mode</div>
                            <div class="st-row-desc" id="themeStatusText">Switch between light and dark</div>
                        </div>
                        <div class="st-toggle" id="themeToggle">
                            <div class="st-toggle-knob"></div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="st-section st-danger-section">`;

if (src.includes(oldSection)) {
    src = src.replace(oldSection, function() { return newSection; });
    console.log('OK: dark mode section added to settings');
} else {
    console.log('WARN: danger section pattern not found');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('server.js', src);
console.log('DONE');
