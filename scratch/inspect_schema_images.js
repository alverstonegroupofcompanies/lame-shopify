const fs = require('fs');
const content = fs.readFileSync('blocks/ai_gen_block_e2174bd.liquid', 'utf8');
const schemaMatch = content.match(/\{\%\s*schema\s*\%\}([\s\S]*?)\{\%\s*endschema\s*\%\}/);
if (schemaMatch) {
  const schema = JSON.parse(schemaMatch[1]);
  console.log('Schema settings count:', schema.settings.length);
  schema.settings.forEach(s => {
    if (s.id && (s.id.includes('image') || s.id.includes('banner') || s.type === 'image_picker')) {
      console.log(s.id, s.type, s.label);
    }
  });
}
