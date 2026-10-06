import {
  processDemoMessage,
  createInitialDemoState,
} from '../lib/demo/demo-engine';

console.log('🧪 Starting Discount & Promotion Inquiry Test Suite...\n');

// Test 1: "do you do discounts" -> DISCOUNT_INQUIRY
const state1 = createInitialDemoState();
const res1 = processDemoMessage(state1, 'do you do discounts');

if (res1.intent === 'DISCOUNT_INQUIRY') {
  console.log('  ✅ Test 1 — "do you do discounts" classified as DISCOUNT_INQUIRY passed');
} else {
  console.error('  ❌ Test 1 Failed: Expected DISCOUNT_INQUIRY, received:', res1.intent);
  process.exit(1);
}

if (!res1.responseText.includes('do you discounts') && !res1.responseText.includes("don't currently have any")) {
  console.log('  ✅ Test 2 — "do you do discounts" does NOT misread as unlisted product passed');
} else {
  console.error('  ❌ Test 2 Failed: Output misread discount question as product name:', res1.responseText);
  process.exit(1);
}

// Test 3: "una dey give discount" -> DISCOUNT_INQUIRY (Pidgin)
const state3 = createInitialDemoState();
const res3 = processDemoMessage(state3, 'una dey give discount');

if (res3.intent === 'DISCOUNT_INQUIRY') {
  console.log('  ✅ Test 3 — "una dey give discount" classified as DISCOUNT_INQUIRY passed');
} else {
  console.error('  ❌ Test 3 Failed: Expected DISCOUNT_INQUIRY, received:', res3.intent);
  process.exit(1);
}

// Test 4: "any promo running" -> PROMOTION_INQUIRY
const state4 = createInitialDemoState();
const res4 = processDemoMessage(state4, 'any promo running');

if (res4.intent === 'PROMOTION_INQUIRY') {
  console.log('  ✅ Test 4 — "any promo running" classified as PROMOTION_INQUIRY passed');
} else {
  console.error('  ❌ Test 4 Failed: Expected PROMOTION_INQUIRY, received:', res4.intent);
  process.exit(1);
}

// Test 5: "una get promo" -> PROMOTION_INQUIRY (Pidgin)
const state5 = createInitialDemoState();
const res5 = processDemoMessage(state5, 'una get promo');

if (res5.intent === 'PROMOTION_INQUIRY') {
  console.log('  ✅ Test 5 — "una get promo" classified as PROMOTION_INQUIRY passed');
} else {
  console.error('  ❌ Test 5 Failed: Expected PROMOTION_INQUIRY, received:', res5.intent);
  process.exit(1);
}

// Test 6: Draft preservation when asking about discounts
let state6 = createInitialDemoState();
state6 = processDemoMessage(state6, 'hoodie').updatedState;
state6 = processDemoMessage(state6, 'L').updatedState;
state6 = processDemoMessage(state6, 'Lekki').updatedState;

if (state6.activeDraft.status !== 'READY_FOR_CHECKOUT') {
  console.error('❌ Setup Failed: Active draft not READY_FOR_CHECKOUT');
  process.exit(1);
}

const res6 = processDemoMessage(state6, 'do you do discounts');

if (res6.updatedState.activeDraft.productId !== 'demo_prod_1') {
  console.error('❌ Test 6 Failed: Active draft product changed! Current:', res6.updatedState.activeDraft.productId);
  process.exit(1);
}

if (res6.updatedState.activeDraft.status !== 'READY_FOR_CHECKOUT') {
  console.error('❌ Test 6 Failed: Active draft status changed! Current:', res6.updatedState.activeDraft.status);
  process.exit(1);
}

if (res6.updatedState.orders.length !== 0) {
  console.error('❌ Test 6 Failed: Order was created erroneously!');
  process.exit(1);
}

if (res6.intent !== 'DISCOUNT_INQUIRY') {
  console.error('❌ Test 6 Failed: Intent was not DISCOUNT_INQUIRY! Received:', res6.intent);
  process.exit(1);
}

console.log('  ✅ Test 6 — "do you do discounts" preserves active draft in READY_FOR_CHECKOUT passed');

console.log('\n======================================================');
console.log('🎉 DISCOUNT & PROMOTION INQUIRY TEST SUITE PASSED 100%!');
console.log('======================================================\n');
