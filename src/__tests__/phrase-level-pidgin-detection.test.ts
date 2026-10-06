import { detectPidginLanguage, createInitialDemoState, processDemoMessage } from '../lib/demo/demo-engine';

console.log('🧪 Starting Phrase-Level Nigerian Pidgin Detection Test Suite...\n');

// Test 1: Detects strong Pidgin phrases
const d1 = detectPidginLanguage('boss wetin una get');
if (d1.language !== 'pidgin' || d1.confidence < 0.375) {
  console.error('❌ Test 1 Failed: "boss wetin una get" did not classify as Pidgin. Result:', d1);
  process.exit(1);
}
console.log('  ✅ Test 1 — "boss wetin una get" classified as Pidgin passed');

// Test 2: Detects "I dey" phrase
const d2 = detectPidginLanguage('I dey look for a hoodie');
if (d2.language !== 'pidgin') {
  console.error('❌ Test 2 Failed: "I dey look for a hoodie" did not classify as Pidgin. Result:', d2);
  process.exit(1);
}
console.log('  ✅ Test 2 — "I dey look for a hoodie" classified as Pidgin passed');

// Test 3: Detects "abeg" phrase
const d3 = detectPidginLanguage('abeg how much be delivery');
if (d3.language !== 'pidgin') {
  console.error('❌ Test 3 Failed: "abeg how much be delivery" did not classify as Pidgin. Result:', d3);
  process.exit(1);
}
console.log('  ✅ Test 3 — "abeg how much be delivery" classified as Pidgin passed');

// Test 4: Detects mixed English and Pidgin with strong phrase
const d4 = detectPidginLanguage('Please show me wetin una get');
if (d4.language !== 'pidgin') {
  console.error('❌ Test 4 Failed: "Please show me wetin una get" did not classify as Pidgin. Result:', d4);
  process.exit(1);
}
console.log('  ✅ Test 4 — Mixed message "Please show me wetin una get" classified as Pidgin passed');

// Test 5: Does not over-classify ordinary English
const d5 = detectPidginLanguage('I want to buy the hoodie');
if (d5.language !== 'english') {
  console.error('❌ Test 5 Failed: Ordinary English "I want to buy the hoodie" misclassified as Pidgin. Result:', d5);
  process.exit(1);
}
console.log('  ✅ Test 5 — "I want to buy the hoodie" classified as English passed');

// Test 6: Does not classify weak token alone as Pidgin
const d6 = detectPidginLanguage('Please get the hoodie');
if (d6.language !== 'english') {
  console.error('❌ Test 6 Failed: Weak token "get" misclassified as Pidgin. Result:', d6);
  process.exit(1);
}
console.log('  ✅ Test 6 — Weak token "get" alone remains English passed');

// Test 7: Does not classify ordinary English sneaker question as Pidgin
const d7 = detectPidginLanguage('Do you have sneakers?');
if (d7.language !== 'english') {
  console.error('❌ Test 7 Failed: "Do you have sneakers?" misclassified as Pidgin. Result:', d7);
  process.exit(1);
}
console.log('  ✅ Test 7 — "Do you have sneakers?" classified as English passed');

// Test 8: Detects "no wahala"
const d8 = detectPidginLanguage('No wahala I will take it');
if (d8.language !== 'pidgin') {
  console.error('❌ Test 8 Failed: "No wahala I will take it" did not classify as Pidgin. Result:', d8);
  process.exit(1);
}
console.log('  ✅ Test 8 — "No wahala I will take it" classified as Pidgin passed');

// Test 9: Detects "make we"
const d9 = detectPidginLanguage('make we do am');
if (d9.language !== 'pidgin') {
  console.error('❌ Test 9 Failed: "make we do am" did not classify as Pidgin. Result:', d9);
  process.exit(1);
}
console.log('  ✅ Test 9 — "make we do am" classified as Pidgin passed');

// Test 10: Persists Pidgin in Auto mode
const s10 = createInitialDemoState();
const r10a = processDemoMessage(s10, 'boss wetin una get');
if (r10a.updatedState.detectedLanguage !== 'pidgin') {
  console.error('❌ Test 10 Failed: Pidgin language was not persisted in Auto mode state!');
  process.exit(1);
}
const r10b = processDemoMessage(r10a.updatedState, 'yes');
if (!r10b.responseText.includes('set') && !r10b.responseText.includes('dey') && !r10b.responseText.includes('boss') && !r10b.responseText.includes('Black Oversized Hoodie')) {
  console.error('❌ Test 10 Failed: Auto mode did not maintain Pidgin response style across turns!');
  process.exit(1);
}
console.log('  ✅ Test 10 — Persists Pidgin in Auto mode passed');

// Test 11: Manual English overrides detected Pidgin
const s11 = { ...createInitialDemoState(), languageMode: 'english' as const };
const r11 = processDemoMessage(s11, 'boss wetin una get');
if (r11.responseText.includes('Wetin') || r11.responseText.includes('una get')) {
  console.error('❌ Test 11 Failed: Manual English mode failed to override Pidgin input!');
  process.exit(1);
}
console.log('  ✅ Test 11 — Manual English mode overrides Pidgin input passed');

// Test 12: Manual Pidgin overrides English input
const s12 = { ...createInitialDemoState(), languageMode: 'pidgin' as const };
const r12 = processDemoMessage(s12, 'What products do you have?');
if (!r12.responseText.includes('These na the items') && !r12.responseText.includes('Wetin') && !r12.responseText.includes('una')) {
  console.error('❌ Test 12 Failed: Manual Pidgin mode failed to force Pidgin output!');
  process.exit(1);
}
console.log('  ✅ Test 12 — Manual Pidgin mode overrides English input passed');

console.log('\n======================================================');
console.log('🎉 PHRASE-LEVEL PIDGIN DETECTION SUITE PASSED 100%!');
console.log('======================================================\n');
