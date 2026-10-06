import { createInitialDemoState, processDemoMessage } from '../src/lib/demo/demo-engine';

const testPhrases = [
  'is it only the three goods you have?',
  'na only these three goods una get?',
  'is it only 3 items you have?',
  'na only 3 goods you get',
  'do you only have 3 products?',
  'are these the only 3 items available?',
  'is this all the items you have?'
];

console.log('🧪 Testing Catalog Scope & Positional Disambiguation...\n');

let pass = 0;
for (const phrase of testPhrases) {
  const state = createInitialDemoState();
  const res = processDemoMessage(state, phrase);

  if (res.updatedState.pendingProductId !== undefined) {
    console.error(`❌ FAILED for "${phrase}": Selected item ${res.updatedState.pendingProductId}!`);
  } else if (!res.responseText.includes('Hoodie') || !res.responseText.includes('Abaya')) {
    console.error(`❌ FAILED for "${phrase}": Did not present catalog list! Got: "${res.responseText}"`);
  } else {
    console.log(`✅ PASSED: "${phrase}" -> Intent: ${res.intent} | Responded cleanly with catalog scope without selecting item 3`);
    pass++;
  }
}

if (pass === testPhrases.length) {
  console.log(`\n🎉 ALL ${pass}/${testPhrases.length} CATALOG SCOPE DISAMBIGUATION TESTS PASSED 100%!`);
} else {
  process.exit(1);
}
