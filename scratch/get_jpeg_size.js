const fs = require('fs');

// Simple JPEG dimensions parser
function getJpegSize(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xFF) break;
    let marker = buffer[offset + 1];
    if (marker === 0xC0 || marker === 0xC2) {
      let height = buffer.readUInt16BE(offset + 5);
      let width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    let length = buffer.readUInt16BE(offset + 2);
    offset += 2 + length;
  }
  return null;
}

const buf = fs.readFileSync('C:/Users/user/.gemini/antigravity/brain/1ab3b492-3801-4b74-820f-6123f98b9fb5/.user_uploaded/media_1795330353005_f6c98ddd.jpg');
console.log('JPEG Size:', getJpegSize(buf));
