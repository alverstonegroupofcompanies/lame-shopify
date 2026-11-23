const fs = require('fs');
const content = fs.readFileSync('blocks/ai_gen_block_e2174bd.liquid', 'utf8');
const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  console.log(scriptMatch[1]);
}
