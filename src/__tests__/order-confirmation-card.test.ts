import { createInitialDemoState, processDemoMessage } from '../lib/demo/demo-engine';

console.log('🧪 Starting Order Confirmation Card Test Suite...\n');

// Helper to construct a complete READY_FOR_CHECKOUT draft
function buildReadyDraft() {
  let state = createInitialDemoState();
  state = processDemoMessage(state, 'I want the Black Oversized Hoodie').updatedState;
  state = processDemoMessage(state, 'size L').updatedState;
  state = processDemoMessage(state, 'deliver to Ikeja').updatedState;
  return state;
}

// Test 1: Complete draft reaches READY_FOR_CHECKOUT
const s1 = buildReadyDraft();
if (s1.activeDraft.status !== 'READY_FOR_CHECKOUT' || !s1.activeDraft.productId || !s1.activeDraft.location || !s1.activeDraft.size) {
  console.error('❌ Test 1 Failed: Draft did not reach READY_FOR_CHECKOUT with complete attributes. Draft:', s1.activeDraft);
  process.exit(1);
}
if (s1.orders.length !== 0) {
  console.error('❌ Test 1 Failed: Order created before confirmation! Orders:', s1.orders.length);
  process.exit(1);
}
console.log('  ✅ Test 1 — Complete draft reaches READY_FOR_CHECKOUT passed');

// Test 2: Clicking Confirm order ("yes do am") creates exactly 1 order
const r2 = processDemoMessage(s1, 'yes do am');
if (r2.updatedState.orders.length !== 1) {
  console.error('❌ Test 2 Failed: Confirming order did not create 1 order. Orders:', r2.updatedState.orders.length);
  process.exit(1);
}
const order = r2.updatedState.orders[0];
if (order.totalNaira !== 27500 || order.itemPriceNaira !== 25000 || order.deliveryFeeNaira !== 2500) {
  console.error('❌ Test 2 Failed: Incorrect order total calculation. Order:', order);
  process.exit(1);
}
console.log('  ✅ Test 2 — Confirming order creates exactly 1 order passed');

// Test 3: Repeated confirm clicks are idempotent (order count remains 1)
const r3 = processDemoMessage(r2.updatedState, 'yes do am');
if (r3.updatedState.orders.length !== 1) {
  console.error('❌ Test 3 Failed: Idempotency check failed! Second confirmation created duplicate order. Count:', r3.updatedState.orders.length);
  process.exit(1);
}
console.log('  ✅ Test 3 — Repeated confirm clicks are idempotent passed');

// Test 4: Change details preserves draft and creates 0 orders
const s4 = buildReadyDraft();
const r4 = processDemoMessage(s4, 'change details');
if (r4.updatedState.orders.length !== 0) {
  console.error('❌ Test 4 Failed: Change details created an order!');
  process.exit(1);
}
if (!r4.updatedState.activeDraft.productId) {
  console.error('❌ Test 4 Failed: Change details cleared the draft!');
  process.exit(1);
}
console.log('  ✅ Test 4 — Change details preserves draft and creates 0 orders passed');

// Test 5: Cancel clears draft and creates 0 orders
const s5 = buildReadyDraft();
const r5 = processDemoMessage(s5, 'cancel');
if (r5.updatedState.orders.length !== 0) {
  console.error('❌ Test 5 Failed: Cancel created an order!');
  process.exit(1);
}
if (r5.updatedState.activeDraft.status !== 'EMPTY' || r5.updatedState.activeDraft.productId !== null) {
  console.error('❌ Test 5 Failed: Cancel did not clear active draft!');
  process.exit(1);
}
console.log('  ✅ Test 5 — Cancel clears draft and creates 0 orders passed');

// Test 6: Informational question does not confirm order or alter draft
const s6 = buildReadyDraft();
const r6 = processDemoMessage(s6, 'you get sneakers?');
if (r6.updatedState.orders.length !== 0) {
  console.error('❌ Test 6 Failed: Informational question created an order!');
  process.exit(1);
}
if (r6.updatedState.activeDraft.productId !== 'demo_prod_1') {
  console.error('❌ Test 6 Failed: Informational question altered active draft!');
  process.exit(1);
}
console.log('  ✅ Test 6 — Informational question preserves draft and creates 0 orders passed');

console.log('\n======================================================');
console.log('🎉 ORDER CONFIRMATION CARD TEST SUITE PASSED 100%!');
console.log('======================================================\n');
