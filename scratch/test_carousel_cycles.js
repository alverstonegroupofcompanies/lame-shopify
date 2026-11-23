// Edge case test for carousel JS
function testCarousel(realCount) {
  console.log(`\n=== Testing realCount = ${realCount} ===`);
  const slides = Array.from({ length: realCount }, (_, i) => `Slide${i}`);
  
  if (realCount <= 1) {
    console.log('Single slide mode: static center, no clones, no loop needed.');
    return;
  }

  const domOffset = 2;
  const clonesBefore = [
    slides[realCount - 2],
    slides[realCount - 1]
  ];
  const clonesAfter = [
    slides[0],
    slides[1]
  ];

  const track = [...clonesBefore.map(s => 'Clone_' + s), ...slides.map(s => 'Real_' + s), ...clonesAfter.map(s => 'Clone_' + s)];
  console.log('Track layout:', track.join(' | '));

  let currentDomIndex = domOffset;
  console.log(`Start at domIndex ${currentDomIndex} (${track[currentDomIndex]})`);
  console.log(`  Left peek: ${track[currentDomIndex - 1]}`);
  console.log(`  Right peek: ${track[currentDomIndex + 1]}`);

  // Simulate Next clicks through a full cycle
  for (let step = 1; step <= realCount + 2; step++) {
    currentDomIndex++;
    let movedTo = track[currentDomIndex];
    let snapped = false;
    if (currentDomIndex >= realCount + domOffset) {
      currentDomIndex = domOffset;
      snapped = true;
    }
    console.log(`Step ${step} (NEXT): moved to ${movedTo}${snapped ? ` -> snapped to domIndex ${currentDomIndex} (${track[currentDomIndex]})` : ''}`);
  }

  // Simulate Prev clicks through a full cycle
  console.log('\nTesting PREV clicks:');
  currentDomIndex = domOffset;
  for (let step = 1; step <= realCount + 2; step++) {
    currentDomIndex--;
    let movedTo = track[currentDomIndex];
    let snapped = false;
    if (currentDomIndex < domOffset) {
      currentDomIndex = realCount + domOffset - 1;
      snapped = true;
    }
    console.log(`Step ${step} (PREV): moved to ${movedTo}${snapped ? ` -> snapped to domIndex ${currentDomIndex} (${track[currentDomIndex]})` : ''}`);
  }
}

testCarousel(2);
testCarousel(3);
testCarousel(4);
testCarousel(1);
