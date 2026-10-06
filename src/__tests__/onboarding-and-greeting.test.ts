import { createInitialDemoState, processDemoMessage } from '../lib/demo/demo-engine';

console.log('🧪 Starting Onboarding & Greeting Test Suite...\n');

// Test 1: "hi" returns helpful greeting
const s1 = createInitialDemoState();
const r1 = processDemoMessage(s1, 'hi');
if (!r1.responseText.includes('Welcome to Kulture Fashion House') || !r1.responseText.includes('What are you shopping for today')) {
  console.error('❌ Test 1 Failed: "hi" did not return expected greeting response. Received:', r1.responseText);
  process.exit(1);
}
if (r1.updatedState.orders.length !== 0 || r1.updatedState.activeDraft.productId !== null) {
  console.error('❌ Test 1 Failed: "hi" mutated order or draft state!');
  process.exit(1);
}
console.log('  ✅ Test 1 — "hi" returns helpful greeting passed');

// Test 2: "hello" does not create an order or active draft
const s2 = createInitialDemoState();
const r2 = processDemoMessage(s2, 'hello');
if (r2.updatedState.orders.length !== 0 || r2.updatedState.activeDraft.productId !== null) {
  console.error('❌ Test 2 Failed: "hello" created an order or draft!');
  process.exit(1);
}
if (r2.intent !== 'GREETING') {
  console.error('❌ Test 2 Failed: "hello" intent was not GREETING. Received:', r2.intent);
  process.exit(1);
}
console.log('  ✅ Test 2 — "hello" does not create an order passed');

// Test 3: "boss hw far" returns natural Nigerian greeting
const s3 = createInitialDemoState();
const r3 = processDemoMessage(s3, 'boss hw far');
if (!r3.responseText.includes('Hey boss!') || !r3.responseText.includes('Wetin you dey find today')) {
  console.error('❌ Test 3 Failed: "boss hw far" did not return Nigerian Pidgin greeting. Received:', r3.responseText);
  process.exit(1);
}
if (r3.updatedState.orders.length !== 0) {
  console.error('❌ Test 3 Failed: Pidgin greeting created an order!');
  process.exit(1);
}
console.log('  ✅ Test 3 — "boss hw far" returns natural Nigerian greeting passed');

// Test 4: "Browse products" submits catalog inquiry
const s4 = createInitialDemoState();
const r4 = processDemoMessage(s4, 'Browse products');
if (!r4.responseText.includes('Black Oversized Hoodie') || r4.intent !== 'CATALOG_INQUIRY') {
  console.error('❌ Test 4 Failed: "Browse products" did not submit catalog inquiry correctly. Intent:', r4.intent);
  process.exit(1);
}
console.log('  ✅ Test 4 — "Browse products" submits catalog inquiry passed');

// Test 5: Onboarding state and message count reset
const s5 = createInitialDemoState();
if (s5.messages.filter(m => m.sender === 'customer').length !== 0) {
  console.error('❌ Test 5 Failed: Initial state had customer messages!');
  process.exit(1);
}
console.log('  ✅ Test 5 — Initial state onboarding panel condition verified passed');

console.log('\n======================================================');
console.log('🎉 ONBOARDING & GREETING TEST SUITE PASSED 100%!');
console.log('======================================================\n');
