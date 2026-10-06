import { resolveCustomerMeaning } from '../lib/engine/meaning-resolver';
import { processDemoMessage, createInitialDemoState } from '../engine';
import { DEMO_PUBLIC_PRODUCTS as CUSTOM_CATALOG } from '../lib/demo/demo-engine';

export async function runMultiIntentCompositionTestSuite() {
  console.log('🧪 Starting VendiAide Multi-Intent Composition & State Mutation Authorization Test Suite (31 Tests)...\n');

  let passed = 0;
  let total = 0;

  async function runTest(num: number, name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`✅ [Test ${num}/31] ${name} PASSED`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [Test ${num}/31] ${name} FAILED: ${errMsg}`);
      throw err;
    }
  }

  // 1. Multi-Intent Composition & Flag Resolution Tests
  await runTest(1, '"Nice one! How much is it?" contains COMPLIMENT + PRICE_INQUIRY', async () => {
    const meaning = await resolveCustomerMeaning('Nice one! How much is it?', {}, CUSTOM_CATALOG);
    if (!meaning.isConversational || !meaning.isItemInquiry) {
      throw new Error(`Expected isConversational & isItemInquiry, got isConversational: ${meaning.isConversational}, isItemInquiry: ${meaning.isItemInquiry}`);
    }
    if (meaning.domainCategory !== 'ITEM_INQUIRY') {
      throw new Error(`Expected domainCategory ITEM_INQUIRY, got ${meaning.domainCategory}`);
    }
    if (meaning.stateMutation.shouldMutate) {
      throw new Error('State mutation authorized without explicit transaction signal!');
    }
  });

  await runTest(2, '"How much is the hoodie and abeg reserve one for me" contains PRICE_INQUIRY + PURCHASE_INTENT', async () => {
    const meaning = await resolveCustomerMeaning('How much is the hoodie and abeg reserve one for me', {}, CUSTOM_CATALOG);
    if (!meaning.isItemInquiry || !meaning.isTransactional) {
      throw new Error('Expected isItemInquiry & isTransactional to be true');
    }
    if (meaning.domainCategory !== 'TRANSACTION') {
      throw new Error(`Expected domainCategory TRANSACTION, got ${meaning.domainCategory}`);
    }
    if (!meaning.stateMutation.shouldMutate) {
      throw new Error('State mutation NOT authorized despite explicit reserve signal!');
    }
  });

  await runTest(3, '"Oshe! Send size L to Ikeja" contains GRATITUDE + SIZE_SELECTION + DELIVERY_LOCATION', async () => {
    const meaning = await resolveCustomerMeaning('Oshe! Send size L to Ikeja', {}, CUSTOM_CATALOG);
    if (!meaning.isConversational || !meaning.isTransactional) {
      throw new Error(`Expected isConversational & isTransactional to be true, got isConversational: ${meaning.isConversational}, isTransactional: ${meaning.isTransactional}, primary: ${meaning.primaryIntent}, secondary: ${JSON.stringify(meaning.secondaryIntents)}`);
    }
    if (meaning.domainCategory !== 'TRANSACTION') {
      throw new Error(`Expected domainCategory TRANSACTION, got ${meaning.domainCategory}`);
    }
    if (!meaning.stateMutation.setPendingSize || !meaning.stateMutation.setPendingLocation) {
      throw new Error('State mutation failed to extract size and location!');
    }
  });

  await runTest(4, 'Primary vs Secondary intent extraction accuracy on compound phrasing', async () => {
    const meaning = await resolveCustomerMeaning('Thank you! How much is delivery to Abuja?', {}, CUSTOM_CATALOG);
    if (!meaning.secondaryIntents.includes('GRATITUDE') && meaning.primaryIntent !== 'GRATITUDE') {
      throw new Error('Secondary GRATITUDE intent missed!');
    }
    if (meaning.domainCategory !== 'ITEM_INQUIRY') {
      throw new Error(`Expected domainCategory ITEM_INQUIRY, got ${meaning.domainCategory}`);
    }
  });

  await runTest(5, 'Pure conversational "How body today?" has shouldMutate: false', async () => {
    const meaning = await resolveCustomerMeaning('How body today?', {}, CUSTOM_CATALOG);
    if (meaning.domainCategory !== 'CONVERSATION' || meaning.stateMutation.shouldMutate) {
      throw new Error('State mutation authorized on pure conversation!');
    }
  });

  // 2. Strict State Mutation Authorization Invariant Tests
  await runTest(6, 'Understanding item in question does NOT authorize state mutation', async () => {
    const meaning = await resolveCustomerMeaning('Does the hoodie come in size L?', {}, CUSTOM_CATALOG);
    if (meaning.stateMutation.shouldMutate || meaning.stateMutation.setPendingSize) {
      throw new Error('Item question prematurely mutated size state!');
    }
  });

  await runTest(7, 'Explicit purchase request DOES authorize state mutation', async () => {
    const meaning = await resolveCustomerMeaning('I want to order the hoodie size L', {}, CUSTOM_CATALOG);
    if (!meaning.stateMutation.shouldMutate || meaning.stateMutation.setPendingSize !== 'L') {
      throw new Error('Explicit order request failed state mutation authorization!');
    }
  });

  await runTest(8, 'Compliment turn with pending item context preserves context with zero state mutation', () => {
    const state = createInitialDemoState();
    const r1 = processDemoMessage(state, 'I want the hoodie');
    const r2 = processDemoMessage(r1.updatedState, 'your clothes fine die!');
    if (r2.updatedState.pendingProductId !== 'demo_prod_1') {
      throw new Error('Pending product lost during compliment turn!');
    }
    if (r2.updatedState.orders.length > 0) {
      throw new Error('Order prematurely created during compliment turn!');
    }
  });

  await runTest(9, 'Location inquiry "how much to Ikeja?" records location in grounded facts but does NOT lock pendingLocation without order intent', async () => {
    const meaning = await resolveCustomerMeaning('how much to Ikeja?', {}, CUSTOM_CATALOG);
    if (meaning.groundedFacts.deliveryFeeNaira !== 2500 || meaning.stateMutation.setPendingLocation) {
      throw new Error('Location query improperly mutated pendingLocation state!');
    }
  });

  await runTest(10, 'Explicit "send it to Ikeja" DOES set pendingLocation state', async () => {
    const meaning = await resolveCustomerMeaning('send it to Ikeja', {}, CUSTOM_CATALOG);
    if (meaning.stateMutation.setPendingLocation !== 'Ikeja') {
      throw new Error(`Explicit send command failed pendingLocation mutation! Got ${meaning.stateMutation.setPendingLocation}`);
    }
  });

  // 3. Complex Multi-Intent Phrasing Scenarios (11 to 30)
  const multiIntentPhrases = [
    { msg: 'Hi! How much is the abaya?', conv: true, tx: false },
    { msg: 'Nice collection! Do you deliver to PH?', conv: true, tx: false },
    { msg: 'Thanks! I will take size M', conv: true, tx: true },
    { msg: 'Cool! Send am to Abuja', conv: true, tx: true },
    { msg: 'Wetin be last price? I want buy am', conv: false, tx: true },
    { msg: 'No wahala. Give me size L', conv: true, tx: true },
    { msg: 'Oshe! What colors do you have?', conv: true, tx: false },
    { msg: 'How far! Do you have sneakers?', conv: true, tx: false },
    { msg: 'Abeg reduce am, I will take 2', conv: false, tx: true },
    { msg: 'Your items are top tier! How much for delivery?', conv: true, tx: false },
    { msg: 'Got it. Send size XL to Lekki', conv: true, tx: true },
    { msg: 'God bless! Can I pay via transfer?', conv: true, tx: false },
    { msg: 'Alright. Make am black hoodie', conv: true, tx: true },
    { msg: 'How body? Anything under 20k?', conv: true, tx: false },
    { msg: 'Sweet! I want to order', conv: true, tx: true },
    { msg: 'Who build you? How much is the dress?', conv: true, tx: false },
    { msg: 'Correct! Reserve size 42 for me', conv: true, tx: true },
    { msg: 'Great! What is your return policy?', conv: true, tx: false },
    { msg: 'Nice one! Deliver to Wuse 2 Abuja', conv: true, tx: true },
    { msg: 'Thanks boss! Place the order now', conv: true, tx: true },
  ];

  for (let i = 0; i < multiIntentPhrases.length; i++) {
    const item = multiIntentPhrases[i];
    const num = 11 + i;
    await runTest(num, `Compound phrasing "${item.msg}"`, async () => {
      const meaning = await resolveCustomerMeaning(item.msg, {}, CUSTOM_CATALOG);
      if (meaning.isConversational !== item.conv) {
        throw new Error(`isConversational expected ${item.conv}, got ${meaning.isConversational}`);
      }
      if (meaning.isTransactional !== item.tx) {
        throw new Error(`isTransactional expected ${item.tx}, got ${meaning.isTransactional}`);
      }
    });
  }

  await runTest(31, '"hwfar wetin una get" resolves to BOTH GREETING (conversational) and CATALOG_DISCOVERY (item inquiry)', async () => {
    const meaning = await resolveCustomerMeaning('hwfar wetin una get', {}, CUSTOM_CATALOG);
    if (!meaning.isConversational || !meaning.isItemInquiry) {
      throw new Error(`Expected both isConversational and isItemInquiry to be true, got isConversational: ${meaning.isConversational}, isItemInquiry: ${meaning.isItemInquiry}`);
    }
    if (meaning.primaryIntent !== 'CATALOG_DISCOVERY' && !meaning.secondaryIntents.includes('CATALOG_DISCOVERY')) {
      throw new Error('CATALOG_DISCOVERY intent missing from resolution!');
    }
  });

  console.log(`\n🎉 ALL ${passed}/${total} MULTI-INTENT COMPOSITION & STATE MUTATION TESTS PASSED 100% CLEANLY!\n`);
}

runMultiIntentCompositionTestSuite().catch((err) => {
  console.error('❌ Multi-Intent Composition Test Suite Failed:', err);
  process.exit(1);
});
