const fs = require('fs');
let str = fs.readFileSync('templates/index.json', 'utf8');
str = str.replace(/\/\*[\s\S]*?\*\//g, '');
const lines = str.split('\n');
const cleaned = lines.filter(l => !l.trim().startsWith('//')).join('\n');
const index = JSON.parse(cleaned);
console.log('home_hero:', JSON.stringify(index.sections['home_hero'], null, 2));
console.log('promo_slideshow:', JSON.stringify(index.sections['promo_slideshow'], null, 2));
