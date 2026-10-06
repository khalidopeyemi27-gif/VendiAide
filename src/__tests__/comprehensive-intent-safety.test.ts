import {
  createInitialDemoState,
  processDemoMessage,
  DEMO_PUBLIC_PRODUCTS,
} from '../lib/demo/demo-engine';

console.log('🧪 Starting Pre-Launch Comprehensive Conversational Safety Test Suite...\n');

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

// ----------------------------------------------------
// SCENARIO A: Unknown & Out-of-Scope Questions
// ----------------------------------------------------
console.log('PART A: Out-of-Scope & Domain Boundary Tests');

const outOfScopeQueries = [
  'what is the weather in Lagos today?',
  'who is the president of Nigeria?',
  'write python code for binary search algorithm',
  'how to bake chocolate cake',
  'what is 25 multiplied by 4?',
  'who won the Premier League match yesterday?',
];

let stateA = createInitialDemoState();
for (const query of outOfScopeQueries) {
  const initialDraft = { ...stateA.activeDraft };
  const initialOrdersCount = stateA.orders.length;

  const result = processDemoMessage(stateA, query, DEMO_PUBLIC_PRODUCTS);
  stateA = result.updatedState;

  const draftUnchanged = JSON.stringify(stateA.activeDraft) === JSON.stringify(initialDraft);
  const ordersUnchanged = stateA.orders.length === initialOrdersCount;
  const isPoliteResponse = result.responseText.length > 10;

  assert(
    draftUnchanged && ordersUnchanged && isPoliteResponse,
    `Out-of-scope query "${query.substring(0, 30)}..." handled safely`,
    `Intent=${result.intent}, DraftMutated=${!draftUnchanged}`
  );
}

// ----------------------------------------------------
// SCENARIO B: Payment & Bank Details Inquiries
// ----------------------------------------------------
console.log('\nPART B: Payment & Bank Inquiries (Read-Only Safety)');

const paymentQueries = [
  'how do I pay for my order?',
  'what is your bank account number?',
  'send me your account details for transfer',
  'do you accept bank transfer or USSD?',
];

let stateB = createInitialDemoState();
for (const query of paymentQueries) {
  const result = processDemoMessage(stateB, query, DEMO_PUBLIC_PRODUCTS);
  stateB = result.updatedState;

  assert(
    stateB.orders.length === 0,
    `Payment inquiry "${query.substring(0, 30)}..." created zero orders`,
    `OrdersCount=${stateB.orders.length}`
  );
  assert(
    result.intent === 'PAYMENT_INQUIRY' || result.intent === 'PAYMENT_METHOD_INQUIRY' || result.intent === 'POLICY_INQUIRY',
    `Payment inquiry mapped to safe intent (${result.intent})`
  );
}

// ----------------------------------------------------
// SCENARIO C: Complaints, Refund & Exchange Requests
// ----------------------------------------------------
console.log('\nPART C: Complaints, Refund & Exchange Requests');

const complaintQueries = [
  'where is my refund?',
  'I want to report an issue with my item',
  'I want to file a complaint',
  'can I return this if it does not fit?',
];

let stateC = createInitialDemoState();
for (const query of complaintQueries) {
  const result = processDemoMessage(stateC, query, DEMO_PUBLIC_PRODUCTS);
  stateC = result.updatedState;

  assert(
    stateC.orders.length === 0,
    `Complaint query "${query.substring(0, 30)}..." created zero orders`
  );
  assert(
    stateC.activeDraft.status === 'EMPTY',
    `Complaint query preserved empty draft`
  );
}

// ----------------------------------------------------
// SCENARIO D: Topic Switching During Active Purchase Draft
// ----------------------------------------------------
console.log('\nPART D: Topic Switching During Active Draft');

let stateD = createInitialDemoState();

// 1. Customer configures hoodie to Lekki -> READY_FOR_CHECKOUT
const step1 = processDemoMessage(stateD, 'I want the Black Hoodie in L to Lekki', DEMO_PUBLIC_PRODUCTS);
stateD = step1.updatedState;

assert(
  stateD.activeDraft.status === 'READY_FOR_CHECKOUT' && stateD.activeDraft.productId === 'demo_prod_1',
  'Active hoodie draft set to READY_FOR_CHECKOUT'
);

// 2. Customer asks material question mid-order
const step2 = processDemoMessage(stateD, 'what material is the hoodie made of?', DEMO_PUBLIC_PRODUCTS);
stateD = step2.updatedState;

assert(
  stateD.activeDraft.status === 'READY_FOR_CHECKOUT' && stateD.activeDraft.productId === 'demo_prod_1',
  'Material inquiry preserved active hoodie draft',
  `ActiveDraft=${JSON.stringify(stateD.activeDraft)}`
);

// 3. Customer asks delivery time question mid-order
const step3 = processDemoMessage(stateD, 'how long will delivery to Lekki take?', DEMO_PUBLIC_PRODUCTS);
stateD = step3.updatedState;

assert(
  stateD.activeDraft.status === 'READY_FOR_CHECKOUT' && stateD.activeDraft.productId === 'demo_prod_1',
  'Delivery timeframe inquiry preserved active hoodie draft'
);

// 4. Customer asks refund policy question mid-order
const step4 = processDemoMessage(stateD, 'what if it does not fit when it arrives?', DEMO_PUBLIC_PRODUCTS);
stateD = step4.updatedState;

assert(
  stateD.activeDraft.status === 'READY_FOR_CHECKOUT' && stateD.activeDraft.productId === 'demo_prod_1',
  'Refund/fit policy inquiry preserved active hoodie draft'
);

// 5. Customer confirms order
const step5 = processDemoMessage(stateD, 'yes do am', DEMO_PUBLIC_PRODUCTS);
stateD = step5.updatedState;

assert(
  stateD.orders.length === 1 && stateD.orders[0].productId === 'demo_prod_1' && stateD.orders[0].size === 'L',
  'Order successfully placed after multiple informational topic switches!'
);

// ----------------------------------------------------
// SCENARIO E: Fuzzing & Robustness Edge Cases
// ----------------------------------------------------
console.log('\nPART E: Fuzzing & Robustness Edge Cases');

const fuzzInputs = [
  '',
  '   ',
  '!@#$%^&*()_+',
  'a',
  'asdfghjklqwerty',
  'boss wetin be python code',
  '???',
  '1234567890',
];

let stateE = createInitialDemoState();
let fuzzCrash = false;

for (const input of fuzzInputs) {
  try {
    const res = processDemoMessage(stateE, input, DEMO_PUBLIC_PRODUCTS);
    stateE = res.updatedState;
  } catch (err) {
    fuzzCrash = true;
    console.error(`Fuzz input "${input}" crashed:`, err);
  }
}

assert(!fuzzCrash, 'All fuzzing inputs executed without crashing');
assert(stateE.orders.length === 0, 'Fuzzing inputs created zero illegal orders');

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n======================================================');
if (totalFailed === 0) {
  console.log(`🎉 PRE-LAUNCH COMPREHENSIVE SAFETY SUITE PASSED 100%! (${totalPassed}/${totalPassed} assertions)`);
  console.log('======================================================\n');
  process.exit(0);
} else {
  console.error(`❌ PRE-LAUNCH COMPREHENSIVE SAFETY SUITE FAILED (${totalFailed} failed, ${totalPassed} passed)`);
  console.log('======================================================\n');
  process.exit(1);
}
