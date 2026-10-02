const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

const newTop = `            top: [
                { v: 'shortFlat', l: 'Short' },
                { v: 'shortRound', l: 'Round' },
                { v: 'shortCurly', l: 'Curly' },
                { v: 'shortWaved', l: 'Waved' },
                { v: 'theCaesar', l: 'Caesar' },
                { v: 'frizzle', l: 'Frizzle' },
                { v: 'shaggy', l: 'Shaggy' },
                { v: 'bigHair', l: 'Big' },
                { v: 'bob', l: 'Bob' },
                { v: 'bun', l: 'Bun' },
                { v: 'curly', l: 'Curvy' },
                { v: 'fro', l: 'Fro' },
                { v: 'froBand', l: 'FroBand' },
                { v: 'straight01', l: 'Straight' },
                { v: 'straight02', l: 'Long' },
                { v: 'dreads', l: 'Dreads' },
                { v: 'miaWallace', l: 'Mia' },
                { v: 'longButNotTooLong', l: 'Longer' },
                { v: 'hat', l: 'Hat' },
                { v: 'winterHat1', l: 'Winter' },
                { v: 'winterHat4', l: 'Beanie' },
                { v: 'turban', l: 'Turban' },
                { v: 'hijab', l: 'Hijab' }
            ],`;

const m = src.match(/top:\s*\[[\s\S]*?\],/);
if (m) {
    src = src.replace(m[0], newTop);
    console.log('OK: top → camelCase');
} else {
    console.log('ERROR: top block not found');
    process.exit(1);
}

// Fix default state
src = src.replace("top: 'ShortFlat',", "top: 'shortFlat',");
src = src.replace("AB_STATE.top = 'ShortFlat';", "AB_STATE.top = 'shortFlat';");

// Fix facialHair — verify it's already camelCase
// 'beardMedium', 'beardLight', 'beardMajestic', 'moustacheFancy', 'moustacheMagnum' - OK

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('server.js', src);
console.log('DONE');
