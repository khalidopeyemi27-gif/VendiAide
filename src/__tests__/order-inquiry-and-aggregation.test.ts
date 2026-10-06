import { createInitialDemoState, processDemoMessage } from '../lib/demo/demo-engine';

export async function runOrderInquiryAndAggregationTestSuite() {
  console.log('🧪 Starting VendiAide Order Inquiry & Aggregation Test Suite...\n');

  // Helper setup: Create a state with 2 completed orders:
  // Order 1: Black Velvet Abaya (₦35,000 + ₦2,500 Ikeja delivery = ₦37,500)
  // Order 2: White Premium Sneakers (₦45,000 + ₦2,500 Ikeja delivery = ₦47,500)
  // Grand Total = ₦85,000
  function setupTwoOrdersState() {
    let s = createInitialDemoState();
    s = processDemoMessage(s, 'I want the abaya size L send to Ikeja').updatedState;
    s = processDemoMessage(s, 'yes do am').updatedState;
    s = processDemoMessage(s, 'I want the sneakers size 42 send to Ikeja').updatedState;
    s = processDemoMessage(s, 'yes do am').updatedState;
    return s;
  }

  // Scenario 1: Productless Purchase Intent ("i wan buy something", "i want to buy", "i wan purchase something", "abeg i wan buy")
  console.log('--- Scenario 1: Productless Purchase Intent ---');
  const productlessPhrases = [
    'i wan buy something',
    'i want to buy',
    'i wan purchase something',
    'abeg i wan buy',
    'i wan get something',
    'make i buy something'
  ];

  for (const phrase of productlessPhrases) {
    const s = createInitialDemoState();
    const res = processDemoMessage(s, phrase);

    if (res.updatedState.orders.length > 0) {
      throw new Error(`[Scenario 1] PREMATURE ORDER created for phrase "${phrase}"!`);
    }

    if (res.responseText.includes('i wan buy something') || res.responseText.includes('i want to buy')) {
      throw new Error(`[Scenario 1] Extracted sentence as unlisted product name for "${phrase}": "${res.responseText}"`);
    }

    if (!res.responseText.toLowerCase().includes('hoodie') && !res.responseText.toLowerCase().includes('abaya')) {
      throw new Error(`[Scenario 1] Failed to present catalog selection prompt for "${phrase}": "${res.responseText}"`);
    }

    console.log(`  ✅ "${phrase.padEnd(25)}" -> Intent: ${res.intent.padEnd(18)} | Catalog prompt presented cleanly`);
  }

  // Scenario 2: "how many orders do i have"
  console.log('\n--- Scenario 2: Order Count Inquiry ---');
  const s2 = setupTwoOrdersState();
  const res2 = processDemoMessage(s2, 'how many orders do i have');
  if (res2.updatedState.orders.length !== 2) throw new Error('Order count mutated!');
  if (!res2.responseText.includes('2 orders')) throw new Error(`Expected "2 orders" in response, got: ${res2.responseText}`);
  console.log(`  ✅ "how many orders do i have" -> ${res2.responseText.split('\n')[0]}`);

  // Scenario 3: "what did i order"
  console.log('\n--- Scenario 3: Order Details Inquiry ---');
  const res3 = processDemoMessage(s2, 'what did i order');
  if (!res3.responseText.includes('Abaya') || !res3.responseText.includes('Sneakers')) {
    throw new Error(`Expected itemized order list, got: ${res3.responseText}`);
  }
  console.log(`  ✅ "what did i order" -> Returned itemized order history`);

  // Scenario 4: "how much altogether"
  console.log('\n--- Scenario 4: Aggregate Total ("how much altogether") ---');
  const res4 = processDemoMessage(s2, 'how much altogether');
  if (!res4.responseText.includes('85,000')) {
    throw new Error(`[Scenario 4] Expected grand total ₦85,000, got: ${res4.responseText}`);
  }
  console.log(`  ✅ "how much altogether" -> Total: ₦85,000 verified`);

  // Scenario 5: "how much be everything"
  console.log('\n--- Scenario 5: Aggregate Total ("how much be everything") ---');
  const res5 = processDemoMessage(s2, 'how much be everything');
  if (!res5.responseText.includes('85,000')) {
    throw new Error(`[Scenario 5] Expected grand total ₦85,000, got: ${res5.responseText}`);
  }
  console.log(`  ✅ "how much be everything" -> Total: ₦85,000 verified`);

  // Scenario 6: "how much are all my orders"
  console.log('\n--- Scenario 6: Aggregate Total ("how much are all my orders") ---');
  const res6 = processDemoMessage(s2, 'how much are all my orders');
  if (!res6.responseText.includes('85,000')) {
    throw new Error(`[Scenario 6] Expected grand total ₦85,000, got: ${res6.responseText}`);
  }
  console.log(`  ✅ "how much are all my orders" -> Total: ₦85,000 verified`);

  // Scenario 7: "how much is my order"
  console.log('\n--- Scenario 7: Order Price Inquiry ("how much is my order") ---');
  const res7 = processDemoMessage(s2, 'how much is my order');
  if (!res7.responseText.includes('85,000')) {
    throw new Error(`[Scenario 7] Expected order total breakdown, got: ${res7.responseText}`);
  }
  console.log(`  ✅ "how much is my order" -> Answered order total cleanly`);

  // Scenario 8: "how much is the order"
  console.log('\n--- Scenario 8: Order Price Inquiry ("how much is the order") ---');
  const res8 = processDemoMessage(s2, 'how much is the order');
  if (res8.responseText.includes('Great choice! To complete your order')) {
    throw new Error(`[Scenario 8] JUMPED TO ORDER COMPLETION PROMPT! "${res8.responseText}"`);
  }
  if (!res8.responseText.includes('85,000')) {
    throw new Error(`[Scenario 8] Expected order total summary, got: ${res8.responseText}`);
  }
  console.log(`  ✅ "how much is the order" -> Answered order total without triggering purchase draft completion`);

  // Scenario 9 & 10: Order History & Order Total Inquiry while a draft product is selected
  console.log('\n--- Scenario 9 & 10: Informational Inquiries with Active Draft Product ---');
  let s9 = setupTwoOrdersState();
  // Select a draft product (Hoodie) without completing order
  s9 = processDemoMessage(s9, 'how much is the hoodie').updatedState;
  if (s9.pendingProductId !== 'demo_prod_1') throw new Error('Failed to set draft hoodie');

  const res9 = processDemoMessage(s9, 'what did i order');
  if (res9.updatedState.orders.length !== 2) throw new Error('Order count mutated during history query with active draft!');
  if (!res9.responseText.includes('Abaya') || !res9.responseText.includes('Sneakers')) {
    throw new Error(`Expected itemized history during active draft, got: ${res9.responseText}`);
  }
  console.log(`  ✅ "what did i order" (with draft Hoodie) -> Returned history cleanly`);

  const res10 = processDemoMessage(s9, 'how much altogether');
  if (res10.updatedState.orders.length !== 2) throw new Error('Order count mutated during total query with active draft!');
  if (!res10.responseText.includes('85,000')) {
    throw new Error(`Expected ₦85,000 total during active draft, got: ${res10.responseText}`);
  }
  console.log(`  ✅ "how much altogether" (with draft Hoodie) -> Calculated ₦85,000 without mutating orders`);

  // Scenario 11: Multiple completed orders + unfinished draft state isolation
  console.log('\n--- Scenario 11: Multi-Order + Unfinished Draft Isolation ---');
  let s11 = setupTwoOrdersState();
  s11 = processDemoMessage(s11, 'I want the hoodie size L').updatedState; // Unfinished draft (missing location)

  if (s11.orders.length !== 2) {
    throw new Error(`[Scenario 11] Unfinished draft leaked into orders array! Expected 2, got ${s11.orders.length}`);
  }
  console.log(`  ✅ State Isolation Verified: 2 completed orders, draft Hoodie pending location`);

  // Scenario 12: Zero orders created across all informational questions
  console.log('\n--- Scenario 12: Zero Mutation Purity Verification ---');
  const infoQueries = [
    'how many orders do i have',
    'what did i order',
    'how much altogether',
    'how much be everything',
    'how much for everything',
    "what's the total",
    'what is my total',
    'how much are all my orders',
    'wetin be everything',
    'i wan buy something'
  ];

  for (const q of infoQueries) {
    const resQ = processDemoMessage(s2, q);
    if (resQ.updatedState.orders.length !== 2) {
      throw new Error(`[Scenario 12] Informational query "${q}" MUTATED state.orders! (${resQ.updatedState.orders.length})`);
    }
  }
  console.log(`  ✅ All ${infoQueries.length} informational queries verified 100% read-only zero-mutation pure`);

  console.log('\n==========================================');
  console.log('🎉 ORDER INQUIRY & AGGREGATION TEST SUITE PASSED 100%!');
  console.log('==========================================\n');
}

runOrderInquiryAndAggregationTestSuite().catch((err) => {
  console.error('❌ Order Inquiry Test Suite Failed:', err);
  process.exit(1);
});
