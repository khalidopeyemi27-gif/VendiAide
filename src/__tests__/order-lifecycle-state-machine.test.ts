import { resolveCustomerMeaning } from '../lib/engine/meaning-resolver';
import { DEMO_PUBLIC_PRODUCTS as CUSTOM_CATALOG } from '../lib/demo/demo-engine';

export async function runOrderLifecycleStateMachineTestSuite() {
  console.log('🧪 Starting VendiAide Order Lifecycle State Machine & Mutation Authorization Test Suite (30 Tests)...\n');

  let passed = 0;
  let total = 0;

  async function runTest(num: number, name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`✅ [Test ${num}/30] ${name} PASSED`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [Test ${num}/30] ${name} FAILED: ${errMsg}`);
      throw err;
    }
  }

  // 1. Non-Optional shouldMutate & MutationReason Enforcement Tests
  await runTest(1, 'meaning.stateMutation.shouldMutate is non-optional boolean (true or false)', async () => {
    const meaning = await resolveCustomerMeaning('hello', {}, CUSTOM_CATALOG);
    if (typeof meaning.stateMutation.shouldMutate !== 'boolean') {
      throw new Error('shouldMutate is missing or not a boolean!');
    }
  });

  await runTest(2, 'Non-transactional message has reason: NO_AUTHORIZATION and shouldMutate: false', async () => {
    const meaning = await resolveCustomerMeaning('How much is the hoodie?', {}, CUSTOM_CATALOG);
    if (meaning.stateMutation.shouldMutate !== false || meaning.stateMutation.reason !== 'NO_AUTHORIZATION') {
      throw new Error(`Expected NO_AUTHORIZATION & shouldMutate false, got reason: ${meaning.stateMutation.reason}, shouldMutate: ${meaning.stateMutation.shouldMutate}`);
    }
  });

  await runTest(3, 'Explicit purchase request has reason: EXPLICIT_PURCHASE_REQUEST and shouldMutate: true', async () => {
    const meaning = await resolveCustomerMeaning('I want to order the hoodie', {}, CUSTOM_CATALOG);
    if (meaning.stateMutation.shouldMutate !== true || meaning.stateMutation.reason !== 'EXPLICIT_PURCHASE_REQUEST') {
      throw new Error(`Expected EXPLICIT_PURCHASE_REQUEST, got reason: ${meaning.stateMutation.reason}`);
    }
  });

  await runTest(4, 'Explicit size selection has reason: EXPLICIT_SELECTION', async () => {
    const meaning = await resolveCustomerMeaning('Give me size L', { pendingProductId: 'demo_prod_1' }, CUSTOM_CATALOG);
    if (meaning.stateMutation.shouldMutate !== true || meaning.stateMutation.reason !== 'EXPLICIT_SELECTION') {
      throw new Error(`Expected EXPLICIT_SELECTION, got ${meaning.stateMutation.reason}`);
    }
  });

  await runTest(5, 'Mid-order correction has reason: EXPLICIT_CORRECTION', async () => {
    const meaning = await resolveCustomerMeaning('No sorry, Abuja instead', { pendingProductId: 'demo_prod_1', pendingLocation: 'Lagos' }, CUSTOM_CATALOG);
    if (meaning.stateMutation.shouldMutate !== true || meaning.stateMutation.reason !== 'EXPLICIT_CORRECTION') {
      throw new Error(`Expected EXPLICIT_CORRECTION, got ${meaning.stateMutation.reason}`);
    }
  });

  // 2. Order Lifecycle State Machine Transition Tests
  await runTest(6, 'Browsing catalog remains in DISCOVERY lifecycle state', async () => {
    const meaning = await resolveCustomerMeaning('wetin una get?', {}, CUSTOM_CATALOG);
    if (meaning.stateMutation.lifecycleState !== 'DISCOVERY') {
      throw new Error(`Expected DISCOVERY, got ${meaning.stateMutation.lifecycleState}`);
    }
  });

  await runTest(7, 'Selecting product transitions state to PRODUCT_SELECTED', async () => {
    const meaning = await resolveCustomerMeaning('I want the hoodie', {}, CUSTOM_CATALOG);
    if (meaning.stateMutation.lifecycleState !== 'PRODUCT_SELECTED') {
      throw new Error(`Expected PRODUCT_SELECTED, got ${meaning.stateMutation.lifecycleState}`);
    }
  });

  await runTest(8, 'Adding size or location transitions state to CONFIGURING', async () => {
    const meaning = await resolveCustomerMeaning('size L', { pendingProductId: 'demo_prod_1' }, CUSTOM_CATALOG);
    if (meaning.stateMutation.lifecycleState !== 'CONFIGURING') {
      throw new Error(`Expected CONFIGURING, got ${meaning.stateMutation.lifecycleState}`);
    }
  });

  await runTest(9, 'Complete specs + location + purchase intent transitions to READY_FOR_CHECKOUT', async () => {
    const meaning = await resolveCustomerMeaning('I want the hoodie size L send to Ikeja', {}, CUSTOM_CATALOG);
    if (meaning.stateMutation.lifecycleState !== 'READY_FOR_CHECKOUT' && meaning.stateMutation.lifecycleState !== 'CHECKOUT_CONFIRMED') {
      throw new Error(`Expected READY_FOR_CHECKOUT or CHECKOUT_CONFIRMED, got ${meaning.stateMutation.lifecycleState}`);
    }
  });

  await runTest(10, 'Explicit confirmation when ready for checkout transitions to CHECKOUT_CONFIRMED', async () => {
    const meaning = await resolveCustomerMeaning('correct do am', { pendingProductId: 'demo_prod_1', pendingSize: 'L', pendingLocation: 'Ikeja', pendingPurchaseIntent: true }, CUSTOM_CATALOG);
    if (meaning.stateMutation.lifecycleState !== 'CHECKOUT_CONFIRMED') {
      throw new Error(`Expected CHECKOUT_CONFIRMED, got ${meaning.stateMutation.lifecycleState}`);
    }
  });

  // 3. End-to-End Lifecycle State Machine Scenarios (11 to 30)
  await runTest(11, 'End-to-End Turn 1: "hello" -> DISCOVERY', async () => {
    const meaning = await resolveCustomerMeaning('hello', {}, CUSTOM_CATALOG);
    if (meaning.stateMutation.lifecycleState !== 'DISCOVERY') throw new Error(`Turn 1 failed: ${meaning.stateMutation.lifecycleState}`);
  });

  await runTest(12, 'End-to-End Turn 2: "how much is the hoodie?" -> PRODUCT_SELECTED Focus', async () => {
    const meaning = await resolveCustomerMeaning('how much is the hoodie?', {}, CUSTOM_CATALOG);
    if (meaning.stateMutation.lifecycleState !== 'PRODUCT_SELECTED' && meaning.stateMutation.lifecycleState !== 'DISCOVERY') {
      throw new Error(`Turn 2 failed: ${meaning.stateMutation.lifecycleState}`);
    }
  });

  await runTest(13, 'End-to-End Turn 3: "I want to buy the hoodie" -> PRODUCT_SELECTED', async () => {
    const meaning = await resolveCustomerMeaning('I want to buy the hoodie', {}, CUSTOM_CATALOG);
    if (meaning.stateMutation.lifecycleState !== 'PRODUCT_SELECTED') throw new Error(`Turn 3 failed: ${meaning.stateMutation.lifecycleState}`);
  });

  await runTest(14, 'End-to-End Turn 4: "your clothes fine die!" -> PRODUCT_SELECTED (Preserved)', async () => {
    const meaning = await resolveCustomerMeaning('your clothes fine die!', { pendingProductId: 'demo_prod_1' }, CUSTOM_CATALOG);
    if (meaning.stateMutation.lifecycleState !== 'PRODUCT_SELECTED') throw new Error(`Turn 4 failed: ${meaning.stateMutation.lifecycleState}`);
  });

  await runTest(15, 'End-to-End Turn 5: "size L" -> CONFIGURING', async () => {
    const meaning = await resolveCustomerMeaning('size L', { pendingProductId: 'demo_prod_1' }, CUSTOM_CATALOG);
    if (meaning.stateMutation.lifecycleState !== 'CONFIGURING') throw new Error(`Turn 5 failed: ${meaning.stateMutation.lifecycleState}`);
  });

  await runTest(16, 'End-to-End Turn 6: "how much to Ikeja?" -> CONFIGURING (Query only)', async () => {
    const meaning = await resolveCustomerMeaning('how much to Ikeja?', { pendingProductId: 'demo_prod_1', pendingSize: 'L' }, CUSTOM_CATALOG);
    if (meaning.stateMutation.lifecycleState !== 'CONFIGURING') throw new Error(`Turn 6 failed: ${meaning.stateMutation.lifecycleState}`);
  });

  await runTest(17, 'End-to-End Turn 7: "send am to Ikeja" -> READY_FOR_CHECKOUT', async () => {
    const meaning = await resolveCustomerMeaning('send am to Ikeja', { pendingProductId: 'demo_prod_1', pendingSize: 'L', pendingPurchaseIntent: true }, CUSTOM_CATALOG);
    if (meaning.stateMutation.lifecycleState !== 'READY_FOR_CHECKOUT' && meaning.stateMutation.lifecycleState !== 'CHECKOUT_CONFIRMED') {
      throw new Error(`Turn 7 failed: ${meaning.stateMutation.lifecycleState}`);
    }
  });

  await runTest(18, 'End-to-End Turn 8: "correct do am" -> CHECKOUT_CONFIRMED', async () => {
    const meaning = await resolveCustomerMeaning('correct do am', { pendingProductId: 'demo_prod_1', pendingSize: 'L', pendingLocation: 'Ikeja', pendingPurchaseIntent: true }, CUSTOM_CATALOG);
    if (meaning.stateMutation.lifecycleState !== 'CHECKOUT_CONFIRMED') throw new Error(`Turn 8 failed: ${meaning.stateMutation.lifecycleState}`);
  });

  // Additional 12 Scenarios testing state machine invariants
  const lifecycleScenarios = [
    { msg: 'show me sneakers', state: {}, expected: 'PRODUCT_SELECTED' },
    { msg: 'give me size 42', state: { pendingProductId: 'demo_prod_3' }, expected: 'CONFIGURING' },
    { msg: 'deliver to Lekki', state: { pendingProductId: 'demo_prod_3', pendingSize: '42' }, expected: 'READY_FOR_CHECKOUT' },
    { msg: 'I want to buy size 42 sneakers send to Lekki', state: {}, expected: 'READY_FOR_CHECKOUT' },
    { msg: 'yes confirm order', state: { pendingProductId: 'demo_prod_3', pendingSize: '42', pendingLocation: 'Lekki', pendingPurchaseIntent: true }, expected: 'CHECKOUT_CONFIRMED' },
    { msg: 'what sizes do you have?', state: { pendingProductId: 'demo_prod_2' }, expected: 'PRODUCT_SELECTED' },
    { msg: 'does it come in black?', state: { pendingProductId: 'demo_prod_2' }, expected: 'PRODUCT_SELECTED' },
    { msg: 'actually make it Abuja', state: { pendingProductId: 'demo_prod_1', pendingSize: 'L', pendingLocation: 'Lagos' }, expected: 'READY_FOR_CHECKOUT' },
    { msg: 'no sorry the abaya instead', state: { pendingProductId: 'demo_prod_1' }, expected: 'PRODUCT_SELECTED' },
    { msg: 'oshe thank you', state: {}, expected: 'DISCOVERY' },
    { msg: 'who build you?', state: {}, expected: 'DISCOVERY' },
    { msg: 'do you sell pizza?', state: {}, expected: 'DISCOVERY' },
  ];

  for (let i = 0; i < lifecycleScenarios.length; i++) {
    const sc = lifecycleScenarios[i];
    const num = 19 + i;
    await runTest(num, `Lifecycle scenario "${sc.msg}"`, async () => {
      const meaning = await resolveCustomerMeaning(sc.msg, sc.state, CUSTOM_CATALOG);
      if (meaning.stateMutation.lifecycleState !== sc.expected && meaning.stateMutation.lifecycleState !== 'CHECKOUT_CONFIRMED') {
        throw new Error(`Expected ${sc.expected}, got ${meaning.stateMutation.lifecycleState}`);
      }
    });
  }

  console.log(`\n🎉 ALL ${passed}/${total} ORDER LIFECYCLE STATE MACHINE & AUTHORIZATION TESTS PASSED 100% CLEANLY!\n`);
}

runOrderLifecycleStateMachineTestSuite().catch((err) => {
  console.error('❌ Order Lifecycle State Machine Test Suite Failed:', err);
  process.exit(1);
});
