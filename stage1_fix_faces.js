const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

const oldFaces = `        var AB_FACES = [
            { seed: 'Felix',   skin: 'edb98a', hair: 'a55728', top: 'shortFlat' },
            { seed: 'Aneka',   skin: 'd08b5b', hair: '2c1b18', top: 'longHairBigHair' },
            { seed: 'Milo',    skin: 'ffdbb4', hair: 'b58143', top: 'shortRound' },
            { seed: 'Lily',    skin: 'ffdbb4', hair: '724133', top: 'longHairBob' },
            { seed: 'Zoe',     skin: 'd08b5b', hair: '2c1b18', top: 'longHairCurly' },
            { seed: 'Leo',     skin: 'ae5d29', hair: '2c1b18', top: 'shortCurly' },
            { seed: 'Mia',     skin: '614335', hair: '2c1b18', top: 'longHairFro' },
            { seed: 'Ryan',    skin: 'edb98a', hair: '4a312c', top: 'theCaesar' },
            { seed: 'Nora',    skin: 'ffdbb4', hair: 'd6b370', top: 'longHairStraight' },
            { seed: 'Kai',     skin: 'f8d25c', hair: '2c1b18', top: 'shortFlat' },
            { seed: 'Ivy',     skin: 'd08b5b', hair: '724133', top: 'longHairBun' },
            { seed: 'Oscar',   skin: 'ae5d29', hair: '2c1b18', top: 'shortWaved' },
            { seed: 'Aisha',   skin: 'ae5d29', hair: '2c1b18', top: 'hijab' },
            { seed: 'Arjun',   skin: 'd08b5b', hair: '2c1b18', top: 'shortRound' },
            { seed: 'Chen',    skin: 'f8d25c', hair: '2c1b18', top: 'shortFlat' },
            { seed: 'Amara',   skin: '614335', hair: '2c1b18', top: 'longHairCurly' },
            { seed: 'Diego',   skin: 'edb98a', hair: '4a312c', top: 'frizzle' },
            { seed: 'Yuki',    skin: 'ffdbb4', hair: '2c1b18', top: 'longHairBob' }
        ];`;

const newFaces = `        var AB_FACES = [
            { seed: 'Felix',   skin: 'edb98a', hair: 'a55728', top: 'shortFlat' },
            { seed: 'Aneka',   skin: 'd08b5b', hair: '2c1b18', top: 'bigHair' },
            { seed: 'Milo',    skin: 'ffdbb4', hair: 'b58143', top: 'shortRound' },
            { seed: 'Lily',    skin: 'ffdbb4', hair: '724133', top: 'bob' },
            { seed: 'Zoe',     skin: 'd08b5b', hair: '2c1b18', top: 'curly' },
            { seed: 'Leo',     skin: 'ae5d29', hair: '2c1b18', top: 'shortCurly' },
            { seed: 'Mia',     skin: '614335', hair: '2c1b18', top: 'fro' },
            { seed: 'Ryan',    skin: 'edb98a', hair: '4a312c', top: 'theCaesar' },
            { seed: 'Nora',    skin: 'ffdbb4', hair: 'd6b370', top: 'straight01' },
            { seed: 'Kai',     skin: 'f8d25c', hair: '2c1b18', top: 'shortFlat' },
            { seed: 'Ivy',     skin: 'd08b5b', hair: '724133', top: 'bun' },
            { seed: 'Oscar',   skin: 'ae5d29', hair: '2c1b18', top: 'shortWaved' },
            { seed: 'Aisha',   skin: 'ae5d29', hair: '2c1b18', top: 'hijab' },
            { seed: 'Arjun',   skin: 'd08b5b', hair: '2c1b18', top: 'shortRound' },
            { seed: 'Chen',    skin: 'f8d25c', hair: '2c1b18', top: 'shortFlat' },
            { seed: 'Amara',   skin: '614335', hair: '2c1b18', top: 'curly' },
            { seed: 'Diego',   skin: 'edb98a', hair: '4a312c', top: 'frizzle' },
            { seed: 'Yuki',    skin: 'ffdbb4', hair: '2c1b18', top: 'bob' }
        ];`;

if (src.includes(oldFaces)) {
    src = src.replace(oldFaces, function() { return newFaces; });
    console.log('OK: face preset values corrected');
} else {
    console.log('WARN: AB_FACES block not found — checking manually');
}

if (src === before) { console.log('nothing changed'); process.exit(0); }
fs.writeFileSync('server.js', src);
console.log('DONE');
