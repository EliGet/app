const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

const newTop = `            top: [
                { v: 'ShortFlat', l: 'Short' },
                { v: 'ShortRound', l: 'Round' },
                { v: 'ShortCurly', l: 'Curly' },
                { v: 'ShortWaved', l: 'Waved' },
                { v: 'TheCaesar', l: 'Caesar' },
                { v: 'Frizzle', l: 'Frizzle' },
                { v: 'Shaggy', l: 'Shaggy' },
                { v: 'BigHair', l: 'Big' },
                { v: 'Bob', l: 'Bob' },
                { v: 'Bun', l: 'Bun' },
                { v: 'Curly', l: 'Curvy' },
                { v: 'Fro', l: 'Fro' },
                { v: 'FroBand', l: 'FroBand' },
                { v: 'Straight01', l: 'Straight' },
                { v: 'Straight02', l: 'Long' },
                { v: 'Dreads', l: 'Dreads' },
                { v: 'MiaWallace', l: 'Mia' },
                { v: 'LongButNotTooLong', l: 'Long' },
                { v: 'Hat', l: 'Hat' },
                { v: 'WinterHat1', l: 'Winter' },
                { v: 'WinterHat4', l: 'Beanie' },
                { v: 'Turban', l: 'Turban' },
                { v: 'Hijab', l: 'Hijab' }
            ],`;

// Match existing top block
const m = src.match(/top:\s*\[[\s\S]*?\],/);
if (m) {
    src = src.replace(m[0], newTop);
    console.log('OK: top values replaced with full list');
} else {
    console.log('ERROR: top block not found');
    process.exit(1);
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('server.js', src);
console.log('DONE');
