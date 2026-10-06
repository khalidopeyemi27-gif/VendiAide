import {
  createInitialDemoState,
  processDemoMessage,
  DEMO_PUBLIC_PRODUCTS,
} from '../lib/demo/demo-engine';

console.log('🧪 Starting Dedicated Conversation C Integration Test Suite...\n');

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${testName} passed`);
    totalPassed++;
  } else {
    console.error(`  ❌ ${testName} FAILED${detail ? `: ${detail}` : ''}`);
    totalFailed++;
  }
}

let state = createInitialDemoState();

// Step 1: "boss wetin una get"
const step1 = processDemoMessage(state, 'boss wetin una get', DEMO_PUBLIC_PRODUCTS);
state = step1.updatedState;

assert(
  state.detectedLanguage === 'pidgin',
  'Step 1 — Detected language is pidgin',
  `Language=${state.detectedLanguage}`
);
assert(
  step1.intent === 'CATALOG_INQUIRY' || step1.intent === 'CATALOG_DISCOVERY',
  'Step 1 — Intent is CATALOG_INQUIRY / CATALOG_DISCOVERY',
  `Intent=${step1.intent}`
);
assert(
  state.orders.length === 0,
  'Step 1 — Orders count is 0',
  `OrdersCount=${state.orders.length}`
);

// Step 2: "i wan take the hoodie"
const step2 = processDemoMessage(state, 'i wan take the hoodie', DEMO_PUBLIC_PRODUCTS);
state = step2.updatedState;

assert(
  state.activeDraft.productId === 'demo_prod_1' || state.pendingProductId === 'demo_prod_1',
  'Step 2 — Product is Black Oversized Hoodie',
  `ProductId=${state.activeDraft.productId || state.pendingProductId}`
);
assert(
  state.activeDraft.authorized === false,
  'Step 2 — Authorized is false'
);
assert(
  state.orders.length === 0,
  'Step 2 — Orders count is 0'
);

// Step 3: "L"
const step3 = processDemoMessage(state, 'L', DEMO_PUBLIC_PRODUCTS);
state = step3.updatedState;

assert(
  state.activeDraft.size === 'L' || state.pendingSize === 'L',
  'Step 3 — Size is L',
  `Size=${state.activeDraft.size || state.pendingSize}`
);
assert(
  state.activeDraft.authorized === false,
  'Step 3 — Authorized is false'
);
assert(
  state.orders.length === 0,
  'Step 3 — Orders count is 0'
);

// Step 4: "deliver to Ikeja"
const step4 = processDemoMessage(state, 'deliver to Ikeja', DEMO_PUBLIC_PRODUCTS);
state = step4.updatedState;

assert(
  state.activeDraft.location === 'Ikeja' || state.pendingLocation === 'Ikeja',
  'Step 4 — Location is Ikeja',
  `Location=${state.activeDraft.location || state.pendingLocation}`
);
assert(
  state.activeDraft.status === 'READY_FOR_CHECKOUT',
  'Step 4 — Draft status is READY_FOR_CHECKOUT',
  `DraftStatus=${state.activeDraft.status}`
);
assert(
  state.activeDraft.authorized === false,
  'Step 4 — Authorized is false'
);
assert(
  state.orders.length === 0,
  'Step 4 — Orders count is 0'
);

// Step 5: "discount dey?"
const step5 = processDemoMessage(state, 'discount dey?', DEMO_PUBLIC_PRODUCTS);
state = step5.updatedState;

assert(
  step5.intent === 'DISCOUNT_INQUIRY',
  'Step 5 — Intent is DISCOUNT_INQUIRY',
  `Intent=${step5.intent}`
);
assert(
  state.activeDraft.productId === 'demo_prod_1',
  'Step 5 — Product remains Black Oversized Hoodie'
);
assert(
  state.activeDraft.size === 'L',
  'Step 5 — Size remains L'
);
assert(
  state.activeDraft.location === 'Ikeja',
  'Step 5 — Location remains Ikeja'
);
assert(
  state.activeDraft.authorized === false,
  'Step 5 — Authorized remains false'
);
assert(
  state.orders.length === 0,
  'Step 5 — Orders count remains 0'
);

// Step 6: "yes do am"
const step6 = processDemoMessage(state, 'yes do am', DEMO_PUBLIC_PRODUCTS);
state = step6.updatedState;

assert(
  step6.intent === 'EXPLICIT_ORDER_CONFIRMATION',
  'Step 6 — Intent is EXPLICIT_ORDER_CONFIRMATION',
  `Intent=${step6.intent}`
);
assert(
  state.orders.length === 1,
  'Step 6 — Exactly one order exists',
  `OrdersCount=${state.orders.length}`
);
assert(
  state.orders[0]?.totalNaira === 27500,
  'Step 6 — Total is ₦27,500 (₦25,000 item + ₦2,500 delivery fee)',
  `TotalNaira=${state.orders[0]?.totalNaira}`
);

// Idempotency check: repeat "yes do am"
const step6_repeat = processDemoMessage(state, 'yes do am', DEMO_PUBLIC_PRODUCTS);
state = step6_repeat.updatedState;

assert(
  state.orders.length === 1,
  'Step 6 — Repeating "yes do am" creates no duplicate order',
  `OrdersCount=${state.orders.length}`
);

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n======================================================');
if (totalFailed === 0) {
  console.log(`🎉 CONVERSATION C INTEGRATION SUITE PASSED 100%! (${totalPassed}/${totalPassed} assertions)`);
  console.log('======================================================\n');
  process.exit(0);
} else {
  console.error(`❌ CONVERSATION C INTEGRATION SUITE FAILED (${totalFailed} failed, ${totalPassed} passed)`);
  console.log('======================================================\n');
  process.exit(1);
}
