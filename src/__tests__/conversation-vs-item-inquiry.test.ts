import { resolveCustomerMeaning } from '../lib/engine/meaning-resolver';
import { processDemoMessage, createInitialDemoState } from '../engine';
import { DEMO_PUBLIC_PRODUCTS as CUSTOM_CATALOG } from '../lib/demo/demo-engine';

export async function runConversationVsItemInquiryTestSuite() {
  console.log('🧪 Starting VendiAide Conversation vs Item Inquiry Domain Separation Test Suite (25 Tests)...\n');

  let passed = 0;
  let total = 0;

  async function runTest(num: number, name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`✅ [Test ${num}/25] ${name} PASSED`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [Test ${num}/25] ${name} FAILED: ${errMsg}`);
      throw err;
    }
  }

  // 1. General Social Conversation Domain Classification Tests
  await runTest(1, 'Greeting "howfar" classified as CONVERSATION domain', async () => {
    const meaning = await resolveCustomerMeaning('howfar', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'CONVERSATION' || !meaning.isConversational || meaning.isItemInquiry) {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}, isConversational: ${meaning.isConversational}`);
    }
  });

  await runTest(2, 'Small talk "how body?" classified as CONVERSATION domain', async () => {
    const meaning = await resolveCustomerMeaning('how body?', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'CONVERSATION' || !meaning.isConversational || meaning.isItemInquiry) {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}`);
    }
  });

  await runTest(3, 'Compliment "your collection is gorgeous" classified as CONVERSATION domain', async () => {
    const meaning = await resolveCustomerMeaning('your collection is gorgeous', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'CONVERSATION' || !meaning.isConversational || meaning.isItemInquiry) {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}`);
    }
  });

  await runTest(4, 'Gratitude "oshe god bless you" classified as CONVERSATION domain', async () => {
    const meaning = await resolveCustomerMeaning('oshe god bless you', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'CONVERSATION' || !meaning.isConversational || meaning.isItemInquiry) {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}`);
    }
  });

  await runTest(5, 'Passive acknowledgement "ok" classified as CONVERSATION domain', async () => {
    const meaning = await resolveCustomerMeaning('ok', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'CONVERSATION' || !meaning.isConversational || meaning.isItemInquiry) {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}`);
    }
  });

  await runTest(6, 'Assistant identity query "who build you?" classified as CONVERSATION domain', async () => {
    const meaning = await resolveCustomerMeaning('who build you?', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'CONVERSATION' || !meaning.isConversational || meaning.isItemInquiry) {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}`);
    }
  });

  // 2. Item Inquiry Domain Classification Tests
  await runTest(7, 'Item pricing inquiry "how much is the hoodie?" classified as ITEM_INQUIRY domain', async () => {
    const meaning = await resolveCustomerMeaning('how much is the hoodie?', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'ITEM_INQUIRY' || !meaning.isItemInquiry || meaning.isConversational) {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}, isItemInquiry: ${meaning.isItemInquiry}`);
    }
  });

  await runTest(8, 'Category discovery "una get sneakers?" classified as ITEM_INQUIRY domain', async () => {
    const meaning = await resolveCustomerMeaning('una get sneakers?', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'ITEM_INQUIRY' || !meaning.isItemInquiry || meaning.isConversational) {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}`);
    }
  });

  await runTest(9, 'Size query "what sizes do you have?" classified as ITEM_INQUIRY domain', async () => {
    const meaning = await resolveCustomerMeaning('what sizes do you have?', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'ITEM_INQUIRY' || !meaning.isItemInquiry || meaning.isConversational) {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}`);
    }
  });

  await runTest(10, 'Color query "does it come in white?" classified as ITEM_INQUIRY domain', async () => {
    const meaning = await resolveCustomerMeaning('does it come in white?', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'ITEM_INQUIRY' || !meaning.isItemInquiry || meaning.isConversational) {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}`);
    }
  });

  await runTest(11, 'Delivery rate query "how much to send to Ikeja?" classified as ITEM_INQUIRY domain', async () => {
    const meaning = await resolveCustomerMeaning('how much to send to Ikeja?', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'ITEM_INQUIRY' || !meaning.isItemInquiry || meaning.isConversational) {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}`);
    }
  });

  await runTest(12, 'Budget filter "anything under 30k?" classified as ITEM_INQUIRY domain', async () => {
    const meaning = await resolveCustomerMeaning('anything under 30k?', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'ITEM_INQUIRY' || !meaning.isItemInquiry || meaning.isConversational) {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}`);
    }
  });

  await runTest(13, 'Bargain query "wetin be last price?" classified as ITEM_INQUIRY domain', async () => {
    const meaning = await resolveCustomerMeaning('wetin be last price?', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'ITEM_INQUIRY' || !meaning.isItemInquiry || meaning.isConversational) {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}`);
    }
  });

  await runTest(14, 'Payment option query "una dey collect transfer?" classified as ITEM_INQUIRY domain', async () => {
    const meaning = await resolveCustomerMeaning('una dey collect transfer?', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'ITEM_INQUIRY' || !meaning.isItemInquiry || meaning.isConversational) {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}`);
    }
  });

  // 3. Transactional Intent Domain Classification Tests
  await runTest(15, 'Explicit purchase request "I want to buy the hoodie" classified as TRANSACTION domain', async () => {
    const meaning = await resolveCustomerMeaning("I want to buy the hoodie", {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'TRANSACTION' || meaning.isConversational || meaning.isItemInquiry) {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}`);
    }
  });

  await runTest(16, 'Positional item selection "I want the 2nd one" classified as TRANSACTION domain', async () => {
    const meaning = await resolveCustomerMeaning('I want the 2nd one', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'TRANSACTION') {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}`);
    }
  });

  await runTest(17, 'Bargain request "abeg reduce am for me" classified as TRANSACTION domain', async () => {
    const meaning = await resolveCustomerMeaning('abeg reduce am for me', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'TRANSACTION') {
      throw new Error(`Domain mismatch: got ${meaning.domainCategory}`);
    }
  });

  // 4. Context Preservation & Behavioral Differentiation Tests
  await runTest(18, 'General conversation turn does NOT force item checkout', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'how body?');
    if (res.updatedState.pendingProductId !== undefined || res.updatedState.orders.length > 0) {
      throw new Error('General conversation turn created item purchase intent!');
    }
    if (!res.responseText.toLowerCase().includes('fine') && !res.responseText.toLowerCase().includes('doing well')) {
      throw new Error(`General conversation response failed! Got: "${res.responseText}"`);
    }
  });

  await runTest(19, 'Item inquiry turn returns grounded item details', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'how much is the hoodie?');
    if (!res.responseText.includes('25,000') || !res.responseText.toLowerCase().includes('hoodie')) {
      throw new Error(`Item inquiry response failed! Got: "${res.responseText}"`);
    }
  });

  await runTest(20, 'Casual conversation interruption preserves active item context across turns', () => {
    const state = createInitialDemoState();
    const r1 = processDemoMessage(state, 'I want the hoodie');
    const r2 = processDemoMessage(r1.updatedState, 'how is sales going today?'); // Social conversation turn
    if (r2.updatedState.pendingProductId !== 'demo_prod_1') {
      throw new Error('Casual conversation turn wiped out active pending item!');
    }
    const r3 = processDemoMessage(r2.updatedState, 'size L'); // Resume item attribute selection
    if (r3.updatedState.pendingProductId !== 'demo_prod_1' || r3.updatedState.pendingSize !== 'L') {
      throw new Error('Resumed item attribute turn failed!');
    }
  });

  await runTest(21, 'General compliment does not mutate pending item size or location', () => {
    const state = createInitialDemoState();
    const r1 = processDemoMessage(state, 'I want the hoodie');
    const r2 = processDemoMessage(r1.updatedState, 'una clothes fine die!');
    if (r2.updatedState.pendingSize !== undefined || r2.updatedState.pendingLocation !== undefined) {
      throw new Error('Compliment turn mutated item attributes!');
    }
  });

  await runTest(22, 'Out of domain item inquiry handles absence grounded without forcing catalog item', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'do you sell pizza?');
    if (!res.responseText.toLowerCase().includes("don't currently have") && !res.responseText.toLowerCase().includes("don't sell") && !res.responseText.toLowerCase().includes("strictly")) {
      throw new Error(`Out of domain item inquiry failed! Got responseText: "${res.responseText}"`);
    }
  });

  await runTest(23, 'Positional selection transitions from conversation to item selection seamlessly', () => {
    const state = createInitialDemoState();
    const r1 = processDemoMessage(state, 'wetin una get?');
    const r2 = processDemoMessage(r1.updatedState, 'I will take the second one');
    if (r2.updatedState.pendingProductId !== 'demo_prod_2') {
      throw new Error(`Positional item selection failed! Expected demo_prod_2, got ${r2.updatedState.pendingProductId}`);
    }
  });

  await runTest(24, 'Multi-part item inquiry answers item price and delivery fee together', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'how much is the abaya and how much to send to Abuja?');
    if (!res.responseText.includes('35,000') || !res.responseText.includes('5,000')) {
      throw new Error(`Multi-part item inquiry response failed! Got: "${res.responseText}"`);
    }
  });

  await runTest(25, '10-turn conversation vs item inquiry alternating thread preserves perfect state fidelity', () => {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'hello').updatedState; // CONVERSATION
    state = processDemoMessage(state, 'how are you doing?').updatedState; // CONVERSATION
    state = processDemoMessage(state, 'wetin una get?').updatedState; // ITEM_INQUIRY
    state = processDemoMessage(state, 'I want the hoodie').updatedState; // TRANSACTION
    state = processDemoMessage(state, 'you guys are doing great').updatedState; // CONVERSATION
    state = processDemoMessage(state, 'size L').updatedState; // TRANSACTION
    state = processDemoMessage(state, 'how much to Ikeja?').updatedState; // ITEM_INQUIRY
    state = processDemoMessage(state, 'Ikeja').updatedState; // TRANSACTION
    state = processDemoMessage(state, 'correct do am').updatedState; // TRANSACTION

    if (state.orders.length !== 1 || state.orders[0].productName !== 'Black Oversized Hoodie' || state.orders[0].deliveryLocation !== 'Ikeja') {
      throw new Error('Alternating conversation vs item inquiry thread failed!');
    }
  });

  console.log(`\n🎉 ALL ${passed}/${total} CONVERSATION VS ITEM INQUIRY DOMAIN SEPARATION TESTS PASSED 100% CLEANLY!\n`);
}

runConversationVsItemInquiryTestSuite().catch((err) => {
  console.error('❌ Conversation vs Item Inquiry Test Suite Failed:', err);
  process.exit(1);
});
