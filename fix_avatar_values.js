const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// Fix AB_OPTIONS.top values (DiceBear v7 uses no prefix)
const oldTop = `            top: [
                { v: 'NoHair', l: 'Bald' },
                { v: 'ShortHairShortFlat', l: 'Short' },
                { v: 'ShortHairShortRound', l: 'Round' },
                { v: 'ShortHairTheCaesar', l: 'Caesar' },
                { v: 'ShortHairFrizzle', l: 'Frizzle' },
                { v: 'LongHairBigHair', l: 'Big' },
                { v: 'LongHairBob', l: 'Bob' },
                { v: 'LongHairBun', l: 'Bun' },
                { v: 'LongHairCurly', l: 'Curly' },
                { v: 'LongHairFro', l: 'Fro' },
                { v: 'LongHairStraight', l: 'Straight' },
                { v: 'Hat', l: 'Hat' },
                { v: 'WinterHat1', l: 'Winter' },
                { v: 'WinterHat4', l: 'Beanie' },
                { v: 'Turban', l: 'Turban' },
                { v: 'Hijab', l: 'Hijab' }
            ],`;

const newTop = `            top: [
                { v: 'ShortFlat', l: 'Short' },
                { v: 'ShortRound', l: 'Round' },
                { v: 'ShortCurly', l: 'Curly' },
                { v: 'TheCaesar', l: 'Caesar' },
                { v: 'Frizzle', l: 'Frizzle' },
                { v: 'BigHair', l: 'Big' },
                { v: 'Bob', l: 'Bob' },
                { v: 'Bun', l: 'Bun' },
                { v: 'Curly', l: 'Curvy' },
                { v: 'Fro', l: 'Fro' },
                { v: 'Straight01', l: 'Straight' },
                { v: 'Dreads', l: 'Dreads' },
                { v: 'Hat', l: 'Hat' },
                { v: 'WinterHat1', l: 'Winter' },
                { v: 'WinterHat4', l: 'Beanie' },
                { v: 'Hijab', l: 'Hijab' }
            ],`;

if (src.includes(oldTop)) {
    src = src.replace(oldTop, function() { return newTop; });
    console.log('OK: top values fixed');
} else {
    console.log('WARN: top block not found');
}

// Fix AB_STATE.top default
src = src.replace("top: 'ShortHairShortFlat',", "top: 'ShortFlat',");
src = src.replace("AB_STATE.top = 'ShortHairShortFlat';", "AB_STATE.top = 'ShortFlat';");

// Also facialHair valid values — check
// DiceBear v7: beardLight, beardMedium, beardMajestic, moustacheFancy, moustacheMagnum
// These are fine.

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('server.js', src);
console.log('DONE');
