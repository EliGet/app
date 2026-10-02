const fs = require('fs');
let src = fs.readFileSync('server.js', 'utf8');
const before = src;

// Replace AB_STATE default colors with hex
const oldState = `var AB_STATE = {
            seed: '\\\${me}',
            bg: 'b6e3f4',
            skinColor: 'light',
            top: 'ShortHairShortFlat',
            hairColor: 'brown',
            accessories: 'prescription02',
            accessoriesColor: 'black',
            facialHair: '',
            facialHairColor: 'brown',
            clothing: 'hoodie',
            clothesColor: 'blue',
            eyes: 'happy',
            mouth: 'smile'
        };`;

const newState = `var AB_STATE = {
            seed: '\\\${me}',
            bg: 'b6e3f4',
            skinColor: 'edb98a',
            top: 'ShortHairShortFlat',
            hairColor: 'a55728',
            accessories: 'prescription02',
            accessoriesColor: '262e33',
            facialHair: '',
            facialHairColor: 'a55728',
            clothing: 'hoodie',
            clothesColor: '5199e4',
            eyes: 'happy',
            mouth: 'smile'
        };`;

if (src.includes(oldState)) {
    src = src.replace(oldState, function() { return newState; });
    console.log('OK: AB_STATE colors → hex');
} else {
    console.log('WARN: AB_STATE pattern not found');
}

// Fix abReset() colors too
const oldReset = `AB_STATE.skinColor = 'light';
            AB_STATE.top = 'ShortHairShortFlat';
            AB_STATE.hairColor = 'brown';
            AB_STATE.accessories = 'prescription02';
            AB_STATE.accessoriesColor = 'black';
            AB_STATE.facialHair = '';
            AB_STATE.facialHairColor = 'brown';
            AB_STATE.clothing = 'hoodie';
            AB_STATE.clothesColor = 'blue';`;

const newReset = `AB_STATE.skinColor = 'edb98a';
            AB_STATE.top = 'ShortHairShortFlat';
            AB_STATE.hairColor = 'a55728';
            AB_STATE.accessories = 'prescription02';
            AB_STATE.accessoriesColor = '262e33';
            AB_STATE.facialHair = '';
            AB_STATE.facialHairColor = 'a55728';
            AB_STATE.clothing = 'hoodie';
            AB_STATE.clothesColor = '5199e4';`;

if (src.includes(oldReset)) {
    src = src.replace(oldReset, function() { return newReset; });
    console.log('OK: abReset colors → hex');
}

// Fix composeUrl — remove facialHairProbability=0 (invalid), only push facialHair if set
const oldCompose = `            parts.push('accessories=' + (s.accessories || ''));
            if (s.accessories) parts.push('accessoriesColor=' + s.accessoriesColor);
            if (s.facialHair) {
                parts.push('facialHair=' + s.facialHair);
                parts.push('facialHairColor=' + s.facialHairColor);
            } else {
                parts.push('facialHairProbability=0');
            }`;

const newCompose = `            if (s.accessories) {
                parts.push('accessories=' + s.accessories);
                parts.push('accessoriesColor=' + s.accessoriesColor);
            } else {
                parts.push('accessoriesProbability=0');
            }
            if (s.facialHair) {
                parts.push('facialHair=' + s.facialHair);
                parts.push('facialHairColor=' + s.facialHairColor);
            } else {
                parts.push('facialHairProbability=0');
            }`;

if (src.includes(oldCompose)) {
    src = src.replace(oldCompose, function() { return newCompose; });
    console.log('OK: composeUrl fixed');
} else {
    console.log('WARN: composeUrl pattern not found');
}

if (src === before) { console.log('ERROR: nothing changed'); process.exit(1); }
fs.writeFileSync('server.js', src);
console.log('DONE');
