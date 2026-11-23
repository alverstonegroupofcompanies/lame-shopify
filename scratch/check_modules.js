const fs = require('fs');

// Let's decode jpeg using jimp or jpeg-js or canvas if available, or write a simple script
// Let's see what packages are installed in node_modules
try {
  const p = require('./package.json');
  console.log('Dependencies:', p.dependencies, p.devDependencies);
} catch (e) {
  console.log('No package.json');
}
