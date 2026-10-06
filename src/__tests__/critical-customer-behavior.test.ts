import { processDemoMessage, createInitialDemoState } from '../lib/demo/demo-engine';

export async function runCriticalCustomerBehaviorTestSuite() {
  console.log('🧪 Starting Critical Customer Behavior & Security Audit Suite...\n');

  const failures: string[] = [];
  let passed = 0;
  let total = 0;

  function assert(category: string, testName: string, condition: boolean, message: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [${category}] ${testName}`);
    } else {
      const failMsg = `[${category}] ${testName}: ${message}`;
      failures.push(failMsg);
      console.error(`  ❌ ${failMsg}`);
    }
  }

  // ==========================================
  // CATEGORY A: PURCHASE VS INFORMATION
  // ==========================================
  console.log('\n--- Category A: Purchase vs Information ---');

  // "I want to order the abaya" -> PURCHASE_INTENT, no order created yet (needs size/location)
  {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'I want to order the abaya');
    assert('A.1', 'I want to order the abaya intent', res.intent === 'PURCHASE_INTENT', `Expected PURCHASE_INTENT, got ${res.intent}`);
    assert('A.1', 'I want to order the abaya no premature order', res.updatedState.orders.length === 0, `Expected 0 orders, got ${res.updatedState.orders.length}`);
  }

  // "I want the abaya" -> PURCHASE_INTENT, no order created yet
  {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'I want the abaya');
    assert('A.2', 'I want the abaya intent', res.intent === 'PURCHASE_INTENT', `Expected PURCHASE_INTENT, got ${res.intent}`);
    assert('A.2', 'I want the abaya no premature order', res.updatedState.orders.length === 0, `Expected 0 orders, got ${res.updatedState.orders.length}`);
  }

  // "how many things did I order" -> ORDER_STATUS_INQUIRY / non-purchase, 0 orders
  {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'how many things did I order');
    assert('A.3', 'how many things did I order intent', res.intent === 'ORDER_STATUS_INQUIRY', `Expected ORDER_STATUS_INQUIRY, got ${res.intent}`);
    assert('A.3', 'how many things did I order no order created', res.updatedState.orders.length === 0, `Expected 0 orders, got ${res.updatedState.orders.length}`);
  }

  // "what did I order"
  {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'what did I order');
    assert('A.4', 'what did I order intent', res.intent === 'ORDER_STATUS_INQUIRY', `Expected ORDER_STATUS_INQUIRY, got ${res.intent}`);
    assert('A.4', 'what did I order no order created', res.updatedState.orders.length === 0, `Expected 0 orders, got ${res.updatedState.orders.length}`);
  }

  // "show my orders"
  {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'show my orders');
    assert('A.5', 'show my orders intent', res.intent === 'ORDER_STATUS_INQUIRY', `Expected ORDER_STATUS_INQUIRY, got ${res.intent}`);
    assert('A.5', 'show my orders no order created', res.updatedState.orders.length === 0, `Expected 0 orders, got ${res.updatedState.orders.length}`);
  }

  // "where is my order"
  {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'where is my order');
    assert('A.6', 'where is my order intent', res.intent === 'ORDER_STATUS_INQUIRY' || res.intent === 'DELIVERY_TIME_QUERY' || res.intent === 'POLICY_INQUIRY', `Expected non-purchase status intent, got ${res.intent}`);
    assert('A.6', 'where is my order no order created', res.updatedState.orders.length === 0, `Expected 0 orders, got ${res.updatedState.orders.length}`);
  }

  // "order status"
  {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'order status');
    assert('A.7', 'order status intent', res.intent === 'ORDER_STATUS_INQUIRY', `Expected ORDER_STATUS_INQUIRY, got ${res.intent}`);
    assert('A.7', 'order status no order created', res.updatedState.orders.length === 0, `Expected 0 orders, got ${res.updatedState.orders.length}`);
  }

  // "how much is my order"
  {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'how much is my order');
    assert('A.8', 'how much is my order intent', res.intent === 'ORDER_TOTAL_INQUIRY' || res.intent === 'ORDER_STATUS_INQUIRY' || res.intent === 'PRICE_INQUIRY', `Expected ORDER_TOTAL_INQUIRY, ORDER_STATUS_INQUIRY or PRICE_INQUIRY, got ${res.intent}`);
    assert('A.8', 'how much is my order no order created', res.updatedState.orders.length === 0, `Expected 0 orders, got ${res.updatedState.orders.length}`);
  }

  // "cancel my order"
  {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'cancel my order');
    assert('A.9', 'cancel my order intent', res.intent === 'DECLINE', `Expected DECLINE, got ${res.intent}`);
    assert('A.9', 'cancel my order no order created', res.updatedState.orders.length === 0, `Expected 0 orders, got ${res.updatedState.orders.length}`);
  }

  // ==========================================
  // CATEGORY B: ORDER AUTHORIZATION
  // ==========================================
  console.log('\n--- Category B: Order Authorization ---');

  {
    let state = createInitialDemoState();
    
    // Turn 1: product only
    const r1 = processDemoMessage(state, 'I want the hoodie'); state = r1.updatedState;
    assert('B.1', 'Product only -> 0 orders', state.orders.length === 0, `Expected 0 orders, got ${state.orders.length}`);

    // Turn 2: product + size
    const r2 = processDemoMessage(state, 'size L'); state = r2.updatedState;
    assert('B.2', 'Product + size -> 0 orders', state.orders.length === 0, `Expected 0 orders, got ${state.orders.length}`);

    // Turn 3: product + size + location (prompt shown, but NOT authorized yet)
    const r3 = processDemoMessage(state, 'send to Ikeja'); state = r3.updatedState;
    assert('B.3', 'Product + size + location (pre-authorization) -> 0 orders', state.orders.length === 0, `Expected 0 orders, got ${state.orders.length}`);

    // Turn 4: explicit confirmation "yes"
    const r4 = processDemoMessage(state, 'yes'); state = r4.updatedState;
    assert('B.4', 'Product + size + location + yes -> exactly 1 order', state.orders.length === 1, `Expected 1 order, got ${state.orders.length}`);
  }

  // Alternative confirmation phrases
  {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'I want the abaya').updatedState;
    state = processDemoMessage(state, 'size M').updatedState;
    state = processDemoMessage(state, 'Lekki').updatedState;
    assert('B.5', 'Pre-auth abaya -> 0 orders', state.orders.length === 0, `Expected 0 orders, got ${state.orders.length}`);

    state = processDemoMessage(state, 'abeg reserve am').updatedState;
    assert('B.5', 'abeg reserve am -> exactly 1 order', state.orders.length === 1, `Expected 1 order, got ${state.orders.length}`);
  }

  {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'I want the sneakers size 42 to Yaba').updatedState;
    assert('B.6', 'Pre-auth sneakers -> 0 orders', state.orders.length === 0, `Expected 0 orders, got ${state.orders.length}`);

    state = processDemoMessage(state, 'yes do am').updatedState;
    assert('B.6', 'yes do am -> exactly 1 order', state.orders.length === 1, `Expected 1 order, got ${state.orders.length}`);
  }

  // Passive acknowledgement after recommendation/prompt
  {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'I want the hoodie size L send to Ikeja').updatedState;
    assert('B.7', 'Before ack -> 0 orders', state.orders.length === 0, `Expected 0 orders, got ${state.orders.length}`);

    state = processDemoMessage(state, 'okay').updatedState;
    assert('B.7', 'Passive acknowledgement "okay" must NOT authorize order', state.orders.length === 0, `Expected 0 orders after passive ack, got ${state.orders.length}`);
  }

  // Repeated confirmations stay 1 order
  {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'I want the hoodie size L send to Ikeja').updatedState;
    state = processDemoMessage(state, 'yes do am').updatedState;
    assert('B.8', 'First confirm -> 1 order', state.orders.length === 1, `Expected 1 order, got ${state.orders.length}`);

    state = processDemoMessage(state, 'yes do am').updatedState;
    assert('B.8', 'Repeated confirm -> still 1 order', state.orders.length === 1, `Expected 1 order, got ${state.orders.length}`);
  }

  // ==========================================
  // CATEGORY C: STATE MUTATION SAFETY
  // ==========================================
  console.log('\n--- Category C: State Mutation Safety ---');

  const unsafeAcks = ['okay', 'thanks', 'nice', 'alright', 'yes', 'sure', 'cool', 'go ahead'];
  for (const ack of unsafeAcks) {
    let state = createInitialDemoState();
    // Customer asks price of hoodie
    state = processDemoMessage(state, 'how much is the hoodie').updatedState;
    assert('C', `Incomplete context asking "${ack}" no order`, state.orders.length === 0, `Expected 0 orders after "${ack}", got ${state.orders.length}`);

    state = processDemoMessage(state, ack).updatedState;
    assert('C', `After "${ack}" on price inquiry -> 0 orders`, state.orders.length === 0, `Expected 0 orders after "${ack}", got ${state.orders.length}`);
  }

  // ==========================================
  // CATEGORY D: ATTRIBUTE FLIP-FLOPS
  // ==========================================
  console.log('\n--- Category D: Attribute Flip-Flops ---');

  // Size flip-flops: L -> XL -> M
  {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'I want the hoodie size L').updatedState;
    assert('D.1', 'Initial size L', state.pendingSize === 'L', `Expected size L, got ${state.pendingSize}`);

    state = processDemoMessage(state, 'actually make it XL').updatedState;
    assert('D.1', 'Flip size to XL', state.pendingSize === 'XL', `Expected size XL, got ${state.pendingSize}`);

    state = processDemoMessage(state, 'change to size M').updatedState;
    assert('D.1', 'Flip size to M', state.pendingSize === 'M', `Expected size M, got ${state.pendingSize}`);

    state = processDemoMessage(state, 'send to Ikeja').updatedState;
    state = processDemoMessage(state, 'yes confirm').updatedState;
    assert('D.1', 'Final order has size M', state.orders.length === 1 && state.orders[0].size === 'M', `Expected order size M, got ${state.orders[0]?.size}`);
  }

  // Size flip-flops: L -> XL -> "actually S" (S is invalid for hoodie: sizes M, L, XL)
  {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'I want the hoodie size L').updatedState;
    state = processDemoMessage(state, 'actually size S').updatedState;
    // Hoodie doesn't have size S (only M, L, XL), should express availability inquiry and not update size illegally
    assert('D.2', 'Invalid size S rejected or handled safely', state.pendingSize !== 'S', `Expected pendingSize not to be set to invalid size S, got ${state.pendingSize}`);
  }

  // Location flip-flops: Ikeja -> Lekki -> Yaba
  {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'I want the abaya size L send to Ikeja').updatedState;
    assert('D.3', 'Location Ikeja', state.pendingLocation === 'Ikeja', `Expected Ikeja, got ${state.pendingLocation}`);

    state = processDemoMessage(state, 'actually send to Lekki').updatedState;
    assert('D.3', 'Flip location to Lekki', state.pendingLocation === 'Lekki', `Expected Lekki, got ${state.pendingLocation}`);

    state = processDemoMessage(state, 'change delivery to Yaba').updatedState;
    assert('D.3', 'Flip location to Yaba', state.pendingLocation === 'Yaba', `Expected Yaba, got ${state.pendingLocation}`);

    state = processDemoMessage(state, 'yes do am').updatedState;
    assert('D.3', 'Final order has location Yaba', state.orders.length === 1 && state.orders[0].deliveryLocation === 'Yaba', `Expected order location Yaba, got ${state.orders[0]?.deliveryLocation}`);
  }

  // Color flip-flops: Black -> white -> black
  {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'I want the abaya').updatedState;
    state = processDemoMessage(state, 'black color').updatedState;
    assert('D.4', 'Color Black', state.pendingColor === 'Black', `Expected Black, got ${state.pendingColor}`);

    state = processDemoMessage(state, 'is there white?').updatedState;
    // Abaya only comes in Black, asking "is there white?" shouldn't corrupt pending color illegally to white
    assert('D.4', 'Unsupported color inquiry does not set invalid pendingColor', state.pendingColor === 'Black', `Expected pendingColor Black, got ${state.pendingColor}`);
  }

  // ==========================================
  // CATEGORY E: CANCELLATION
  // ==========================================
  console.log('\n--- Category E: Cancellation ---');

  const cancelPhrases = [
    'cancel',
    'stop',
    "don't order",
    "don't create order",
    'abeg no order am',
    "wait don't order"
  ];

  for (const cancelPhrase of cancelPhrases) {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'I want the hoodie size L send to Ikeja').updatedState;
    state = processDemoMessage(state, cancelPhrase).updatedState;
    assert('E', `Cancel with "${cancelPhrase}" clears state`, state.orders.length === 0 && !state.pendingProductId, `Expected 0 orders and cleared pendingProductId after "${cancelPhrase}", got orders=${state.orders.length}, pending=${state.pendingProductId}`);

    // Follow-up sub-messages after cancel
    const followUps = ['okay', 'yes', 'sure', 'thanks'];
    for (const f of followUps) {
      const stateAfterF = processDemoMessage(state, f).updatedState;
      assert('E', `Follow-up "${f}" after cancel "${cancelPhrase}" stays 0 orders`, stateAfterF.orders.length === 0, `Expected 0 orders after "${f}", got ${stateAfterF.orders.length}`);
    }
  }

  // ==========================================
  // CATEGORY F: DELIVERY CONTEXT
  // ==========================================
  console.log('\n--- Category F: Delivery Context ---');

  // Contextual inheritance: Location -> "how much be delivery"
  {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'I live in Ikeja').updatedState;
    let res = processDemoMessage(state, 'how much be delivery');
    assert('F.1', 'Inherits Ikeja delivery rate', res.responseText.includes('2,500') || res.responseText.includes('2500'), `Expected Ikeja rate 2,500 in response, got "${res.responseText}"`);

    state = createInitialDemoState();
    state = processDemoMessage(state, 'send am to Lekki').updatedState;
    res = processDemoMessage(state, 'delivery fee?');
    assert('F.2', 'Inherits Lekki delivery rate', res.responseText.includes('2,500') || res.responseText.includes('2500'), `Expected Lekki rate in response, got "${res.responseText}"`);

    // Change location to Abuja and check fee update
    state = processDemoMessage(state, 'what about Abuja?').updatedState;
    res = processDemoMessage(state, 'how much delivery?');
    assert('F.3', 'Updated location Abuja delivery rate', res.responseText.includes('5,000') || res.responseText.includes('5000'), `Expected Abuja rate 5,000 in response, got "${res.responseText}"`);
  }

  // ==========================================
  // CATEGORY G: FINANCIAL INTEGRITY
  // ==========================================
  console.log('\n--- Category G: Financial Integrity ---');

  {
    // Test Hoodie (25,000) + Ikeja (2,500) = 27,500
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'I want the hoodie size L send to Ikeja').updatedState;
    state = processDemoMessage(state, 'yes confirm').updatedState;
    const order = state.orders[0];
    assert('G.1', 'Hoodie + Ikeja financial math', order && order.totalNaira === 27500, `Expected totalNaira 27500, got ${order?.totalNaira}`);

    // Test Abaya (35,000) + Abuja (5,000) = 40,000
    state = createInitialDemoState();
    state = processDemoMessage(state, 'I want the abaya size M send to Abuja').updatedState;
    state = processDemoMessage(state, 'yes do am').updatedState;
    const order2 = state.orders[0];
    assert('G.2', 'Abaya + Abuja financial math', order2 && order2.totalNaira === 40000, `Expected totalNaira 40000, got ${order2?.totalNaira}`);
  }

  // ==========================================
  // CATEGORY H: CONTEXT CORRUPTION
  // ==========================================
  console.log('\n--- Category H: Context Corruption ---');

  const interruptions = [
    'wetin una get', // catalog inquiry
    'do you sell iPhones?', // unrelated question
    'how far', // greeting
    'how many orders do I have', // order history inquiry
    'how much is delivery to Abuja', // delivery question
    'what about the sneakers' // another product selection
  ];

  for (const interruption of interruptions) {
    let state = createInitialDemoState();
    // Start hoodie conversation
    state = processDemoMessage(state, 'I want the hoodie size L').updatedState;
    // Interrupt
    const res = processDemoMessage(state, interruption);
    const stateInterrupted = res.updatedState;
    
    // Verify no premature order creation during interruption
    assert('H', `Interruption "${interruption}" creates 0 orders`, stateInterrupted.orders.length === 0, `Expected 0 orders, got ${stateInterrupted.orders.length}`);
  }

  // ==========================================
  // CATEGORY I: POSITIONAL SELECTION
  // ==========================================
  console.log('\n--- Category I: Positional Selection ---');

  {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'wetin una get').updatedState; // catalog listed: 1. Hoodie, 2. Abaya, 3. Sneakers

    const r1 = processDemoMessage(state, '1');
    assert('I.1', 'Selection "1" maps to Hoodie', r1.responseText.toLowerCase().includes('hoodie'), `Expected hoodie for 1, got "${r1.responseText}"`);

    const r2 = processDemoMessage(state, '2');
    assert('I.2', 'Selection "2" maps to Abaya', r2.responseText.toLowerCase().includes('abaya'), `Expected abaya for 2, got "${r2.responseText}"`);

    const r3 = processDemoMessage(state, '3');
    assert('I.3', 'Selection "3" maps to Sneakers', r3.responseText.toLowerCase().includes('sneakers') || r3.responseText.toLowerCase().includes('shoe'), `Expected sneakers for 3, got "${r3.responseText}"`);

    const rOpt2 = processDemoMessage(state, 'option 2');
    assert('I.4', 'Selection "option 2" maps to Abaya', rOpt2.responseText.toLowerCase().includes('abaya'), `Expected abaya for option 2, got "${rOpt2.responseText}"`);

    const rSec = processDemoMessage(state, 'the second one');
    assert('I.5', 'Selection "the second one" maps to Abaya', rSec.responseText.toLowerCase().includes('abaya'), `Expected abaya for the second one, got "${rSec.responseText}"`);

    const rNum3 = processDemoMessage(state, 'number 3');
    assert('I.6', 'Selection "number 3" maps to Sneakers', rNum3.responseText.toLowerCase().includes('sneakers') || rNum3.responseText.toLowerCase().includes('shoe'), `Expected sneakers for number 3, got "${rNum3.responseText}"`);

    // Invalid positions
    const r0 = processDemoMessage(state, '0');
    assert('I.7', 'Invalid position 0 does not pick product', !r0.updatedState.pendingProductId || r0.updatedState.pendingProductId === state.pendingProductId, `Position 0 assigned invalid pendingProductId: ${r0.updatedState.pendingProductId}`);

    const r20 = processDemoMessage(state, '20');
    assert('I.8', 'Out-of-bounds position 20 handled gracefully', r20.updatedState.orders.length === 0, `Position 20 created unexpected order`);
  }

  // ==========================================
  // CATEGORY J: DUPLICATION / IDEMPOTENCY
  // ==========================================
  console.log('\n--- Category J: Duplication / Idempotency ---');

  {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'I want the hoodie size L send to Ikeja').updatedState;
    
    // Repeat confirmation 10 times
    for (let i = 0; i < 10; i++) {
      state = processDemoMessage(state, 'yes confirm').updatedState;
    }
    assert('J.1', '10 repeated confirmations result in exactly 1 order', state.orders.length === 1, `Expected exactly 1 order, got ${state.orders.length}`);
  }

  // ==========================================
  // CATEGORY K: LONG / NOISY MESSAGES
  // ==========================================
  console.log('\n--- Category K: Long / Noisy Messages ---');

  {
    const state = createInitialDemoState();
    const noisyMsg = "howfar my brother! hope sales dey go well o 😂 wetin una get in catalog? also wanted to ask if you guys deliver to London or space shuttle lol? anyway what sizes do you have for the hoodie?";
    const res = processDemoMessage(state, noisyMsg);
    assert('K.1', 'Noisy message does not create order', res.updatedState.orders.length === 0, `Expected 0 orders from noisy query, got ${res.updatedState.orders.length}`);
    assert('K.2', 'Noisy message responds to question without breaking engine', res.responseText.length > 0, 'Empty response text on noisy message');
  }

  console.log(`\n==========================================`);
  console.log(`RESULTS: ${passed}/${total} assertions passed.`);
  if (failures.length > 0) {
    console.log(`\nFAILURES (${failures.length}):`);
    failures.forEach((f) => console.log(`  - ${f}`));
    console.log(`==========================================\n`);
    throw new Error(`${failures.length} test assertions failed in critical-customer-behavior suite!`);
  } else {
    console.log(`🎉 ALL ${passed}/${total} CRITICAL CUSTOMER BEHAVIOR TESTS PASSED 100% CLEANLY!\n`);
  }
}

runCriticalCustomerBehaviorTestSuite().catch((err) => {
  console.error('❌ Critical Customer Behavior Test Suite Failed:', err);
  process.exit(1);
});
