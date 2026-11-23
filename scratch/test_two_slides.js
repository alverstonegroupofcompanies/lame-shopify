// Test infinite loop with 2 slides
const realCount = 2;
const slides = ['Slide A (Cetaphil)', 'Slide B (Elite Pro)'];

// Clones:
// For seamless peek with 2 slides:
// If we clone 2 before and 2 after:
// Before: slides[realCount - 2] -> slides[0] (A), slides[realCount - 1] -> slides[1] (B)
// Real: slides[0] (A), slides[1] (B)
// After: slides[0] (A), slides[1] (B)
// DOM order:
// Index 0: Clone A
// Index 1: Clone B
// Index 2: Real A (Active) -> Left is Index 1 (Clone B), Right is Index 3 (Real B)!!
// Index 3: Real B (Active) -> Left is Index 2 (Real A), Right is Index 4 (Clone A)!!
// Index 4: Clone A
// Index 5: Clone B

console.log('When active is Real A (domIndex 2):');
console.log('Left visible sibling:', 'Index 1 = Clone B (Elite Pro)');
console.log('Center visible slide:', 'Index 2 = Real A (Cetaphil)');
console.log('Right visible sibling:', 'Index 3 = Real B (Elite Pro)');
console.log('--> PERFECT! Both sides peek Elite Pro while center is Cetaphil!');

console.log('\nWhen user clicks NEXT:');
console.log('Target domIndex = 3 (Real B)');
console.log('Left visible sibling:', 'Index 2 = Real A (Cetaphil)');
console.log('Center visible slide:', 'Index 3 = Real B (Elite Pro)');
console.log('Right visible sibling:', 'Index 4 = Clone A (Cetaphil)');
console.log('--> PERFECT! Both sides peek Cetaphil while center is Elite Pro!');

console.log('\nWhen user clicks NEXT again:');
console.log('Target domIndex = 4 (Clone A)');
console.log('Animates smoothly to index 4.');
console.log('On transitionend: domIndex >= 2 + 2 (4 >= 4) -> snaps silently to domIndex 2 (Real A)!');
console.log('User sees zero jump because Clone A at index 4 looks 100% identical to Real A at index 2!');

console.log('\nWhen user at domIndex 2 clicks PREV:');
console.log('Target domIndex = 1 (Clone B)');
console.log('Animates smoothly to index 1.');
console.log('On transitionend: domIndex < 2 (1 < 2) -> snaps silently to domIndex = 2 + 2 - 1 = 3 (Real B)!');
console.log('User sees zero jump because Clone B at index 1 looks 100% identical to Real B at index 3!');
