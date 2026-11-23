const fs = require('fs');
const content = fs.readFileSync('blocks/ai_gen_block_e2174bd.liquid', 'utf8');
const schemaMatch = content.match(/\{\%\s*schema\s*\%\}([\s\S]*?)\{\%\s*endschema\s*\%\}/);
if (schemaMatch) {
  const schema = JSON.parse(schemaMatch[1]);
  console.log(JSON.stringify(schema, null, 2));
}
