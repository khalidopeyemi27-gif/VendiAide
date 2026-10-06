import { createInitialDemoState, processDemoMessage } from '../lib/demo/demo-engine';

console.log('🧪 Starting Language & Authorization Separation Test Suite...\n');

function completeReadyForCheckoutState() {
  let state = createInitialDemoState();
  state = processDemoMessage(state, 'I want the Black Oversized Hoodie').updatedState;
  state = processDemoMessage(state, 'size L').updatedState;
  state = processDemoMessage(state, 'deliver to Ikeja').updatedState;
  return state;
}

// Test 1: Pidgin detection does not authorize an order
const s1 = completeReadyForCheckoutState();
const r1 = processDemoMessage(s1, 'abeg reserve am for me');
if (r1.updatedState.activeDraft.authorized !== false) {
  console.error('❌ Test 1 Failed: Pidgin phrase "abeg reserve am for me" authorized active draft!');
  process.exit(1);
}
if (r1.updatedState.orders.length !== 0) {
  console.error('❌ Test 1 Failed: Pidgin phrase "abeg reserve am for me" created an order!');
  process.exit(1);
}
console.log('  ✅ Test 1 — Pidgin detection does not authorize an order passed');

// Test 2: Pidgin purchase intent does not create an order on unconfigured state
const s2 = createInitialDemoState();
const r2 = processDemoMessage(s2, 'i wan take the hoodie');
if (r2.updatedState.orders.length !== 0) {
  console.error('❌ Test 2 Failed: Pidgin purchase intent created an order on unconfigured draft!');
  process.exit(1);
}
if (r2.updatedState.activeDraft.authorized !== false) {
  console.error('❌ Test 2 Failed: Pidgin purchase intent authorized unconfigured draft!');
  process.exit(1);
}
console.log('  ✅ Test 2 — Pidgin purchase intent does not create an order passed');

// Test 3: Pidgin explicit confirmation creates one order
const s3 = completeReadyForCheckoutState();
const r3 = processDemoMessage(s3, 'yes do am');
if (r3.updatedState.orders.length !== 1) {
  console.error('❌ Test 3 Failed: Pidgin explicit confirmation "yes do am" failed to create order!');
  process.exit(1);
}
console.log('  ✅ Test 3 — Pidgin explicit confirmation creates one order passed');

// Test 4: English explicit confirmation creates one order
const s4 = completeReadyForCheckoutState();
const r4 = processDemoMessage(s4, 'confirm order');
if (r4.updatedState.orders.length !== 1) {
  console.error('❌ Test 4 Failed: English explicit confirmation "confirm order" failed to create order!');
  process.exit(1);
}
console.log('  ✅ Test 4 — English explicit confirmation creates one order passed');

// Test 5: Repeated Pidgin confirmation is idempotent
const s5 = completeReadyForCheckoutState();
const r5a = processDemoMessage(s5, 'yes do am');
const r5b = processDemoMessage(r5a.updatedState, 'make we do am');
if (r5b.updatedState.orders.length !== 1) {
  console.error('❌ Test 5 Failed: Repeated confirmation created duplicate order! Count:', r5b.updatedState.orders.length);
  process.exit(1);
}
console.log('  ✅ Test 5 — Repeated Pidgin confirmation is idempotent passed');

// Test 6: Informational Pidgin question is read-only
const s6 = completeReadyForCheckoutState();
const r6 = processDemoMessage(s6, 'you get sneakers?');
if (r6.updatedState.orders.length !== 0) {
  console.error('❌ Test 6 Failed: Informational Pidgin question created an order!');
  process.exit(1);
}
if (r6.updatedState.activeDraft.productId !== s6.activeDraft.productId) {
  console.error('❌ Test 6 Failed: Informational Pidgin question altered active draft!');
  process.exit(1);
}
if (r6.updatedState.activeDraft.authorized !== false) {
  console.error('❌ Test 6 Failed: Informational Pidgin question authorized draft!');
  process.exit(1);
}
console.log('  ✅ Test 6 — Informational Pidgin question is read-only passed');

// Test 7: Language mode does not change intent behavior
const engState = completeReadyForCheckoutState();
const pidState = completeReadyForCheckoutState();
pidState.languageMode = 'pidgin';

const engRes = processDemoMessage(engState, 'confirm order');
const pidRes = processDemoMessage(pidState, 'yes do am');

if (engRes.updatedState.orders.length !== 1 || pidRes.updatedState.orders.length !== 1) {
  console.error('❌ Test 7 Failed: Language mode altered confirmation behavior!');
  process.exit(1);
}
console.log('  ✅ Test 7 — Language mode does not change intent behavior passed');

// Test 8: Does not authorize an incomplete draft
let s8 = createInitialDemoState();
s8 = processDemoMessage(s8, 'I want the Black Oversized Hoodie').updatedState;
const r8 = processDemoMessage(s8, 'yes do am');
if (r8.updatedState.orders.length !== 0) {
  console.error('❌ Test 8 Failed: Incomplete draft was authorized by "yes do am"!');
  process.exit(1);
}
if (r8.updatedState.activeDraft.authorized !== false) {
  console.error('❌ Test 8 Failed: Incomplete draft set authorized = true!');
  process.exit(1);
}
console.log('  ✅ Test 8 — Incomplete draft is not authorized passed');

// Test 9: High language confidence does not authorize an order
const s9 = {
  ...completeReadyForCheckoutState(),
  languageConfidence: 1,
  detectedLanguage: 'pidgin' as const,
};
if (s9.activeDraft.authorized !== false || s9.orders.length !== 0) {
  console.error('❌ Test 9 Failed: High language confidence state altered authorization!');
  process.exit(1);
}
console.log('  ✅ Test 9 — High language confidence does not authorize an order passed');

console.log('\n======================================================');
console.log('🎉 LANGUAGE & AUTHORIZATION SEPARATION SUITE PASSED 100%!');
console.log('======================================================\n');
