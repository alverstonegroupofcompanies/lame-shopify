const fs = require('fs');
const content = fs.readFileSync('templates/index.json', 'utf8');
const matches = content.match(/shopify:\/\/shop_images\/[^"'\s]+/g) || [];
console.log('Unique shop_images in index.json:');
console.log(Array.from(new Set(matches)));
