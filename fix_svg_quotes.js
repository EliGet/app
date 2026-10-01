const fs = require('fs');
let src = fs.readFileSync('routes/students.js', 'utf8');
const before = src;

// Fix renderSvgTabs — remove nested quotes
const tabsOld = `                var html = '<button type="button" class="lib-tab active" data-cat="all" onclick="pickSvgCat(\\'all\\', this)">All</button>';
                Object.keys(svgLibrary.categories).forEach(function(cat) {
                    html += '<button type="button" class="lib-tab" data-cat="' + cat + '" onclick="pickSvgCat(\\'' + cat.replace(/'/g, "&#39;") + '\\', this)">' + cat + '</button>';
                });`;

const tabsNew = `                var html = '<button type="button" class="lib-tab active" data-cat="all" onclick="pickSvgCat(this)">All</button>';
                Object.keys(svgLibrary.categories).forEach(function(cat) {
                    html += '<button type="button" class="lib-tab" data-cat="' + cat + '" onclick="pickSvgCat(this)">' + cat + '</button>';
                });`;

if (src.includes(tabsOld)) {
    src = src.replace(tabsOld, function() { return tabsNew; });
    console.log('OK: renderSvgTabs quotes fixed');
} else {
    console.log('WARN: tabsOld not found');
}

// Fix pickSvgCat signature
const pickCatOld = `            function pickSvgCat(cat, btn) {
                svgActiveCat = cat;`;
const pickCatNew = `            function pickSvgCat(btn) {
                var cat = btn.getAttribute('data-cat') || 'all';
                svgActiveCat = cat;`;
if (src.includes(pickCatOld)) {
    src = src.replace(pickCatOld, function() { return pickCatNew; });
    console.log('OK: pickSvgCat signature fixed');
}

// Fix renderSvgGrid tile onclick
const tileOld = `                    html += '<button type="button" class="sp-svg-tile" onclick="pickSvg(\\'' + it.key + '\\')">'
                        + '<div class="sp-svg-tile-icon">' + it.svg + '</div>'
                        + '<span class="sp-svg-tile-label">' + it.label + '</span>'
                        + '</button>';`;

const tileNew = `                    html += '<button type="button" class="sp-svg-tile" data-key="' + it.key + '" onclick="pickSvgFromTile(this)">'
                        + '<div class="sp-svg-tile-icon">' + it.svg + '</div>'
                        + '<span class="sp-svg-tile-label">' + it.label + '</span>'
                        + '</button>';`;

if (src.includes(tileOld)) {
    src = src.replace(tileOld, function() { return tileNew; });
    console.log('OK: tile onclick fixed');
} else {
    console.log('WARN: tileOld not found');
}

// Add pickSvgFromTile wrapper
const pickFn = `            function pickSvg(key) {`;
if (src.includes(pickFn) && !src.includes('function pickSvgFromTile')) {
    src = src.replace(pickFn, `            function pickSvgFromTile(btn) {
                var key = btn.getAttribute('data-key');
                if (key) pickSvg(key);
            }

            function pickSvg(key) {`);
    console.log('OK: pickSvgFromTile added');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('routes/students.js', src);
console.log('DONE');
