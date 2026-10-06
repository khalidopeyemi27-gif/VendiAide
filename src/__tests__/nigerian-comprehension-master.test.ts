import { processDemoMessage, createInitialDemoState } from '../engine';
import { resolveCustomerMeaning } from '../lib/engine/meaning-resolver';
import { DEMO_PUBLIC_PRODUCTS as CUSTOM_CATALOG } from '../lib/demo/demo-engine';

export async function runNigerianComprehensionMasterTestSuite() {
  console.log('🧪 Starting VendiAide Master Nigerian Pidgin & Conversational Intelligence Test Suite (30 Scenarios)...\n');

  let passed = 0;
  let total = 0;

  async function assertScenario(num: number, name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`✅ [Scenario ${num}/30] ${name} PASSED`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [Scenario ${num}/30] ${name} FAILED: ${errMsg}`);
      throw err;
    }
  }

  // Scenario 1: Pidgin Greeting
  await assertScenario(1, 'Pidgin Greeting ("howfar boss wetin una get?")', async () => {
    const state = createInitialDemoState();
    const meaning = await resolveCustomerMeaning('howfar boss wetin una get?', state, CUSTOM_CATALOG);
    if (!meaning.intent || (meaning.intent !== 'GREETING' && meaning.intent !== 'GENERAL_GREETING' && meaning.intent !== 'CATALOG_DISCOVERY')) {
      throw new Error(`Expected GREETING or CATALOG_DISCOVERY, got: ${meaning.intent}`);
    }
  });

  // Scenario 2: Pidgin Category Discovery
  await assertScenario(2, 'Pidgin Category Discovery ("una get hoodies?")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'una get hoodies?');
    if (!res.responseText.toLowerCase().includes('hoodie')) {
      throw new Error(`Category query response failed to return hoodie details! Got: "${res.responseText}"`);
    }
  });

  // Scenario 3: Positional Catalog Reference
  await assertScenario(3, 'Positional Catalog Reference ("I want the second one")', () => {
    const state = createInitialDemoState();
    const res1 = processDemoMessage(state, 'show me your collection');
    const res2 = processDemoMessage(res1.updatedState, 'I want the second one');
    if (res2.updatedState.pendingProductId !== 'demo_prod_2') {
      throw new Error(`Positional reference failed: expected demo_prod_2, got "${res2.updatedState.pendingProductId}"`);
    }
  });

  // Scenario 4: Size Selection in Pidgin
  await assertScenario(4, 'Size Selection in Pidgin ("give me L size")', () => {
    const state = createInitialDemoState();
    const res1 = processDemoMessage(state, 'I want the hoodie');
    const res2 = processDemoMessage(res1.updatedState, 'give me L size');
    if (res2.updatedState.pendingSize !== 'L') {
      throw new Error(`Size selection in Pidgin failed: expected L, got "${res2.updatedState.pendingSize}"`);
    }
  });

  // Scenario 5: Location Delivery Inquiry in Pidgin
  await assertScenario(5, 'Location Delivery Inquiry in Pidgin ("abeg how much to send am to Ikeja?")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'abeg how much to send am to Ikeja?');
    if (!res.responseText.includes('2,500') || !res.responseText.includes('Ikeja')) {
      throw new Error(`Pidgin delivery query failed! Got: "${res.responseText}"`);
    }
  });

  // Scenario 6: Port Harcourt Pidgin Location
  await assertScenario(6, 'Port Harcourt Pidgin Location ("bring am come PH")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'bring am come PH');
    if (res.updatedState.pendingLocation !== 'PH') {
      throw new Error(`Pidgin location failed: expected PH, got "${res.updatedState.pendingLocation}"`);
    }
  });

  // Scenario 7: Abuja Pidgin Location
  await assertScenario(7, 'Abuja Pidgin Location ("make una deliver am go Wuse 2 for Abuja")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'make una deliver am go Wuse 2 for Abuja');
    if (!res.responseText.includes('5,000') && !res.responseText.includes('Wuse')) {
      throw new Error(`Abuja location response failed! Got: "${res.responseText}"`);
    }
  });

  // Scenario 8: VI Pidgin Location
  await assertScenario(8, 'VI Pidgin Location ("send am go V.I")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'send am go V.I');
    if (res.updatedState.pendingLocation !== 'VI') {
      throw new Error(`VI location failed: expected VI, got "${res.updatedState.pendingLocation}"`);
    }
  });

  // Scenario 9: Pidgin Discount/Bargain Request
  await assertScenario(9, 'Pidgin Discount/Bargain Request ("abeg reduce am for me")', async () => {
    const state = createInitialDemoState();
    const meaning = await resolveCustomerMeaning('abeg reduce am for me', state, CUSTOM_CATALOG);
    if (meaning.intent !== 'DISCOUNT_REQUEST') {
      throw new Error(`Discount request intent expected DISCOUNT_REQUEST, got ${meaning.intent}`);
    }
  });

  // Scenario 10: Last Price Inquiry
  await assertScenario(10, 'Last Price Inquiry ("wetin be last price?")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'wetin be last price?');
    if (!res.responseText.toLowerCase().includes('price') && !res.responseText.toLowerCase().includes('fixed')) {
      throw new Error(`Last price inquiry response failed! Got: "${res.responseText}"`);
    }
  });

  // Scenario 11: Payment Transfer Question
  await assertScenario(11, 'Payment Transfer Question ("una dey collect transfer?")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'una dey collect transfer?');
    if (!res.responseText.toLowerCase().includes('transfer') && !res.responseText.toLowerCase().includes('payment')) {
      throw new Error(`Payment query failed! Got: "${res.responseText}"`);
    }
  });

  // Scenario 12: Slang Compliment
  await assertScenario(12, 'Slang Compliment ("your clothes fine die!")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'your clothes fine die!');
    if (!res.responseText.toLowerCase().includes('thank')) {
      throw new Error(`Slang compliment response failed! Got: "${res.responseText}"`);
    }
  });

  // Scenario 13: Slang Gratitude
  await assertScenario(13, 'Slang Gratitude ("oshe! god bless you")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'oshe! god bless you');
    if (!res.responseText.toLowerCase().includes('welcome')) {
      throw new Error(`Slang gratitude response failed! Got: "${res.responseText}"`);
    }
  });

  // Scenario 14: Passive Pidgin Acknowledgement
  await assertScenario(14, 'Passive Pidgin Acknowledgement ("na so")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'na so');
    if (res.updatedState.pendingSize || res.updatedState.orders.length > 0) {
      throw new Error('Passive acknowledgement "na so" mutated conversation state!');
    }
  });

  // Scenario 15: Multi-Turn Ordering Thread
  await assertScenario(15, 'Multi-Turn Ordering Thread (Product -> Size -> Location -> Confirmation)', () => {
    const state = createInitialDemoState();
    const r1 = processDemoMessage(state, 'I want the hoodie');
    const r2 = processDemoMessage(r1.updatedState, 'L');
    const r3 = processDemoMessage(r2.updatedState, 'Ikeja');
    const r4 = processDemoMessage(r3.updatedState, 'yes do am');
    if (r4.updatedState.orders.length !== 1 || r4.updatedState.orders[0].deliveryLocation !== 'Ikeja') {
      throw new Error('Multi-turn ordering flow failed to construct complete order!');
    }
  });

  // Scenario 16: Mid-Order Correction
  await assertScenario(16, 'Mid-Order Product Correction ("No, I meant the abaya")', () => {
    const state = createInitialDemoState();
    const r1 = processDemoMessage(state, 'I want the hoodie');
    const r2 = processDemoMessage(r1.updatedState, 'No, I meant the abaya');
    if (r2.updatedState.pendingProductId !== 'demo_prod_2') {
      throw new Error(`Correction failed: expected demo_prod_2, got "${r2.updatedState.pendingProductId}"`);
    }
  });

  // Scenario 17: Mid-Order Location Change
  await assertScenario(17, 'Mid-Order Location Change ("Actually, send it to Lekki instead")', () => {
    const state = createInitialDemoState();
    const r1 = processDemoMessage(state, 'I want the hoodie size L');
    const r2 = processDemoMessage(r1.updatedState, 'Actually, send it to Lekki instead');
    const r3 = processDemoMessage(r2.updatedState, 'yes do am');
    if (r3.updatedState.orders.length !== 1 || r3.updatedState.orders[0].deliveryLocation !== 'Lekki') {
      throw new Error(`Location correction failed: expected order delivery location Lekki, got "${r3.updatedState.orders[0]?.deliveryLocation}"`);
    }
  });

  // Scenario 18: Interrupted Context Restoration
  await assertScenario(18, 'Interrupted Context Restoration (Order -> Banter -> Size)', () => {
    const state = createInitialDemoState();
    const r1 = processDemoMessage(state, 'I want the hoodie');
    const r2 = processDemoMessage(r1.updatedState, 'you guys are doing great');
    const r3 = processDemoMessage(r2.updatedState, 'size L');
    if (r3.updatedState.pendingProductId !== 'demo_prod_1' || r3.updatedState.pendingSize !== 'L') {
      throw new Error('Interrupted context restoration failed!');
    }
  });

  // Scenario 19: Budget Query in Pidgin
  await assertScenario(19, 'Budget Query in Pidgin ("anything under 40k?")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'anything under 40k?');
    if (!res.responseText.includes('Hoodie') || !res.responseText.includes('Abaya')) {
      throw new Error(`Budget query response failed! Got: "${res.responseText}"`);
    }
  });

  // Scenario 20: Out-of-Domain Non-Commerce Inquiry
  await assertScenario(20, 'Out-of-Domain Non-Commerce Inquiry ("do you sell pizza?")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'do you sell pizza?');
    if (!res.responseText.toLowerCase().includes("don't sell") && !res.responseText.toLowerCase().includes("pizza")) {
      throw new Error(`Out of domain inquiry response failed! Got: "${res.responseText}"`);
    }
  });

  // Scenario 21: Store Physical Address Query
  await assertScenario(21, 'Store Physical Address Query ("where unna shop dey?")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'where unna shop dey?');
    if (!res.responseText.toLowerCase().includes('lagos') && !res.responseText.toLowerCase().includes('online')) {
      throw new Error(`Store address query response failed! Got: "${res.responseText}"`);
    }
  });

  // Scenario 22: AI Identity Inquiry
  await assertScenario(22, 'AI Identity Inquiry ("who build you?")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'who build you?');
    if (!res.responseText.includes('VendiAide')) {
      throw new Error(`Identity query response failed! Got: "${res.responseText}"`);
    }
  });

  // Scenario 23: Ambiguous Location Clarification
  await assertScenario(23, 'Ambiguous Location Clarification ("how much to Victoria?")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'how much to Victoria?');
    if (!res.responseText.toLowerCase().includes('victoria island') && !res.responseText.toLowerCase().includes('vgc')) {
      throw new Error(`Ambiguity response failed! Got: "${res.responseText}"`);
    }
  });

  // Scenario 24: Color Availability Query
  await assertScenario(24, 'Color Availability Query ("does it come in white?")', () => {
    const state = createInitialDemoState();
    const r1 = processDemoMessage(state, 'I want the hoodie');
    const r2 = processDemoMessage(r1.updatedState, 'does it come in white?');
    if (!r2.responseText.toLowerCase().includes('black')) {
      throw new Error(`Color availability response failed! Got: "${r2.responseText}"`);
    }
  });

  // Scenario 25: Size Availability Query
  await assertScenario(25, 'Size Availability Query ("what sizes do you have?")', () => {
    const state = createInitialDemoState();
    const r1 = processDemoMessage(state, 'I want the hoodie');
    const r2 = processDemoMessage(r1.updatedState, 'what sizes do you have?');
    if (!r2.responseText.includes('M') || !r2.responseText.includes('L')) {
      throw new Error(`Size availability response failed! Got: "${r2.responseText}"`);
    }
  });

  // Scenario 26: Multi-Question Phrasing
  await assertScenario(26, 'Multi-Question Phrasing ("how much is the hoodie and how much to Abuja?")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'how much is the hoodie and how much to Abuja?');
    if (!res.responseText.includes('25,000') || !res.responseText.includes('5,000')) {
      throw new Error(`Multi-question resolution failed! Got: "${res.responseText}"`);
    }
  });

  // Scenario 27: Compound Address with Pidgin Prefix
  await assertScenario(27, 'Compound Address with Pidgin Prefix ("i dey stay gwarinpa abuja")', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'i dey stay gwarinpa abuja');
    if (res.updatedState.pendingLocation !== 'Gwarinpa') {
      throw new Error(`Compound address failed: expected Gwarinpa, got "${res.updatedState.pendingLocation}"`);
    }
  });

  // Scenario 28: Pidgin Affirmation
  await assertScenario(28, 'Pidgin Affirmation ("correct! do am")', () => {
    const state = createInitialDemoState();
    const r1 = processDemoMessage(state, 'I want the hoodie');
    const r2 = processDemoMessage(r1.updatedState, 'L');
    const r3 = processDemoMessage(r2.updatedState, 'Ikeja');
    const r4 = processDemoMessage(r3.updatedState, 'correct! do am');
    if (r4.updatedState.orders.length !== 1) {
      throw new Error('Pidgin affirmation failed to log order!');
    }
  });

  // Scenario 29: Verbatim Text Preservation
  await assertScenario(29, 'Verbatim Text Preservation ("abeg send am go v.i")', () => {
    const raw = 'abeg send am go v.i';
    const state = createInitialDemoState();
    const res = processDemoMessage(state, raw);
    const lastMsg = res.updatedState.messages.filter((m) => m.sender === 'customer').pop();
    if (!lastMsg || lastMsg.text !== raw) {
      throw new Error(`Verbatim preservation failed: expected "${raw}", got "${lastMsg?.text}"`);
    }
  });

  // Scenario 30: Master End-to-End Sales Walkthrough
  await assertScenario(30, 'Master 10-Turn Sales Walkthrough in Nigerian Pidgin', () => {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'howfar').updatedState;
    state = processDemoMessage(state, 'wetin una get?').updatedState;
    state = processDemoMessage(state, 'I want the second one').updatedState;
    state = processDemoMessage(state, 'give me L size').updatedState;
    state = processDemoMessage(state, 'Ikeja').updatedState;
    state = processDemoMessage(state, 'correct! do am').updatedState;

    if (state.orders.length !== 1 || state.orders[0].deliveryLocation !== 'Ikeja') {
      throw new Error(`Master 10-turn sales walkthrough failed! Orders count: ${state.orders.length}, item: ${state.orders[0]?.productName}, location: ${state.orders[0]?.deliveryLocation}`);
    }
  });

  console.log(`\n🎉 ALL ${passed}/${total} MASTER NIGERIAN COMPREHENSION SCENARIOS PASSED 100% CLEANLY!\n`);
}

runNigerianComprehensionMasterTestSuite().catch((err) => {
  console.error('❌ Master Nigerian Comprehension Test Suite Failed:', err);
  process.exit(1);
});
