import {
  suppressRedundantSignals,
  detectPidginLanguage,
  resolveCatalogProduct,
  processDemoMessage,
  createInitialDemoState,
} from '../lib/demo/demo-engine';

console.log('🧪 Starting Redundant Signal Suppression & Strict Catalog Matching Test Suite...\n');

// PART 1: Redundant Signal Suppression Tests
console.log('PART 1: Signal Deduplication Tests');

const s1 = suppressRedundantSignals(['yes do am', 'am']);
if (s1.length === 1 && s1[0] === 'yes do am') {
  console.log('  ✅ Test 1 — "yes do am" suppresses sub-signal "am" passed');
} else {
  console.error('  ❌ Test 1 Failed: Expected ["yes do am"], received:', s1);
  process.exit(1);
}

const s2 = suppressRedundantSignals(['make we do am', 'make we phrase', 'am']);
if (!s2.includes('am') && s2.includes('make we do am')) {
  console.log('  ✅ Test 2 — "make we do am" suppresses sub-signal "am" passed');
} else {
  console.error('  ❌ Test 2 Failed: Received:', s2);
  process.exit(1);
}

const d1 = detectPidginLanguage('yes do am');
if (d1.matchedSignals.includes('yes do am') && !d1.matchedSignals.includes('am')) {
  console.log('  ✅ Test 3 — detectPidginLanguage("yes do am") output is deduplicated passed');
} else {
  console.error('  ❌ Test 3 Failed: Received matchedSignals:', d1.matchedSignals);
  process.exit(1);
}

// PART 2: Strict Catalog Product Resolution Tests
console.log('\nPART 2: Strict Catalog Product Resolution Tests');

const r1 = resolveCatalogProduct('Black Oversized Hoodie');
if (r1.kind === 'exact' && r1.product?.id === 'demo_prod_1') {
  console.log('  ✅ Test 4 — Exact product name match passed');
} else {
  console.error('  ❌ Test 4 Failed:', r1);
  process.exit(1);
}

const r2 = resolveCatalogProduct('hoodie');
if (r2.kind === 'approved_alias' && r2.product?.id === 'demo_prod_1') {
  console.log('  ✅ Test 5 — Approved alias "hoodie" match passed');
} else {
  console.error('  ❌ Test 5 Failed:', r2);
  process.exit(1);
}

const r3 = resolveCatalogProduct('jackets');
if (r3.kind === 'unknown' && r3.queryTerm === 'jackets' && !r3.product) {
  console.log('  ✅ Test 6 — Unknown item "jackets" returns kind: unknown passed');
} else {
  console.error('  ❌ Test 6 Failed:', r3);
  process.exit(1);
}

const r4 = resolveCatalogProduct('jacketss');
if (r4.kind === 'unknown' && !r4.product) {
  console.log('  ✅ Test 7 — Misspelled unknown item "jacketss" returns kind: unknown passed');
} else {
  console.error('  ❌ Test 7 Failed:', r4);
  process.exit(1);
}

const r5 = resolveCatalogProduct('bags');
if (r5.kind === 'unknown' && !r5.product) {
  console.log('  ✅ Test 8 — Unknown item "bags" returns kind: unknown passed');
} else {
  console.error('  ❌ Test 8 Failed:', r5);
  process.exit(1);
}

// PART 3: Active Draft Preservation on Unknown Item Inquiry
console.log('\nPART 3: Integration Tests for Unknown Product Inquiries');

let state = createInitialDemoState();
// Set active draft: Black Oversized Hoodie, Size L, Lekki, READY_FOR_CHECKOUT
state = processDemoMessage(state, 'hoodie').updatedState;
state = processDemoMessage(state, 'L').updatedState;
state = processDemoMessage(state, 'Lekki').updatedState;

if (
  state.activeDraft?.productId !== 'demo_prod_1' ||
  state.activeDraft?.status !== 'READY_FOR_CHECKOUT'
) {
  console.error('❌ Setup Failed: Draft was not prepared properly. Current draft:', state.activeDraft);
  process.exit(1);
}

// Send unknown product inquiry "you get jackets?"
const resUnk = processDemoMessage(state, 'you get jackets?');

if (resUnk.updatedState.activeDraft?.productId !== 'demo_prod_1') {
  console.error('❌ Test 9 Failed: Active draft product changed! Current productId:', resUnk.updatedState.activeDraft?.productId);
  process.exit(1);
}

if (resUnk.updatedState.activeDraft?.status !== 'READY_FOR_CHECKOUT') {
  console.error('❌ Test 9 Failed: Draft status changed! Current status:', resUnk.updatedState.activeDraft?.status);
  process.exit(1);
}

if (resUnk.updatedState.orders.length !== 0) {
  console.error('❌ Test 9 Failed: Order was created erroneously!');
  process.exit(1);
}

if (
  !resUnk.responseText.includes('jackets') ||
  (!resUnk.responseText.includes("don't currently have") && !resUnk.responseText.includes("no get"))
) {
  console.error('❌ Test 9 Failed: Grounded response missing unlisted item notice. Received:', resUnk.responseText);
  process.exit(1);
}

console.log('  ✅ Test 9 — "you get jackets?" preserves active draft and returns grounded message passed');

console.log('\n======================================================');
console.log('🎉 REDUNDANT SIGNAL & STRICT MATCHING TEST SUITE PASSED 100%!');
console.log('======================================================\n');
