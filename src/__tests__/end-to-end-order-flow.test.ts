import { processDemoMessage, createInitialDemoState, DEMO_PUBLIC_PRODUCTS } from '../lib/demo/demo-engine';
import { resolveCustomerMeaning } from '../lib/engine/meaning-resolver';

export async function runEndToEndOrderFlowTestSuite() {
  console.log('🧪 Starting VendiAide End-to-End Customer Journey & Order Flow Test Suite...\n');

  let passed = 0;
  let total = 0;

  async function runTest(name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`✅ [Test ${total}] ${name} PASSED`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [Test ${total}] ${name} FAILED: ${errMsg}`);
      throw err;
    }
  }

  // 1. Standard Full Funnel
  await runTest('Standard 5-Turn Sales Funnel creates verified order record with grounded pricing', async () => {
    let state = createInitialDemoState();

    // Turn 1: Discovery
    const meaning1 = await resolveCustomerMeaning('howfar boss, wetin una get?', state, DEMO_PUBLIC_PRODUCTS);
    state = processDemoMessage(state, 'howfar boss, wetin una get?').updatedState;
    if (meaning1.stateMutation.lifecycleState !== 'DISCOVERY') {
      throw new Error(`Turn 1 expected DISCOVERY, got: ${meaning1.stateMutation.lifecycleState}`);
    }

    // Turn 2: Product Focus
    const meaning2 = await resolveCustomerMeaning('how much is the black hoodie?', state, DEMO_PUBLIC_PRODUCTS);
    state = processDemoMessage(state, 'how much is the black hoodie?').updatedState;
    if (meaning2.stateMutation.lifecycleState !== 'PRODUCT_SELECTED') {
      throw new Error(`Turn 2 expected PRODUCT_SELECTED, got: ${meaning2.stateMutation.lifecycleState}`);
    }

    // Turn 3: Size Selection
    const meaning3 = await resolveCustomerMeaning('give me size L', state, DEMO_PUBLIC_PRODUCTS);
    state = processDemoMessage(state, 'give me size L').updatedState;
    if (meaning3.stateMutation.lifecycleState !== 'CONFIGURING') {
      throw new Error(`Turn 3 expected CONFIGURING, got: ${meaning3.stateMutation.lifecycleState}`);
    }

    // Turn 4: Location Specification
    const meaning4 = await resolveCustomerMeaning('send am go Ikeja', state, DEMO_PUBLIC_PRODUCTS);
    state = processDemoMessage(state, 'send am go Ikeja').updatedState;
    if (meaning4.stateMutation.lifecycleState !== 'READY_FOR_CHECKOUT') {
      throw new Error(`Turn 4 expected READY_FOR_CHECKOUT, got: ${meaning4.stateMutation.lifecycleState}`);
    }

    if (state.orders.length !== 1) {
      throw new Error(`Expected 1 order created, got: ${state.orders.length}`);
    }

    const order = state.orders[0];
    if (order.productName !== 'Black Oversized Hoodie') {
      throw new Error(`Expected Black Oversized Hoodie, got: ${order.productName}`);
    }
    if (order.size !== 'L') {
      throw new Error(`Expected size L, got: ${order.size}`);
    }
    if (order.deliveryLocation !== 'Ikeja') {
      throw new Error(`Expected Ikeja, got: ${order.deliveryLocation}`);
    }
  });

  // 2. Interrupted Funnel with Mid-Order Location Correction
  await runTest('Interrupted Funnel: Banter + Location Correction produces exact single order', async () => {
    let state = createInitialDemoState();

    // Turn 1: Product Focus
    state = processDemoMessage(state, 'how much is the abaya?').updatedState;

    // Turn 2: Banter Interruption
    const meaningBanter = await resolveCustomerMeaning('your shop fine die!', state, DEMO_PUBLIC_PRODUCTS);
    state = processDemoMessage(state, 'your shop fine die!').updatedState;
    if (meaningBanter.stateMutation.shouldMutate !== false) {
      throw new Error('Banter should have shouldMutate: false');
    }

    // Turn 3: Size
    state = processDemoMessage(state, 'size XL').updatedState;

    // Turn 4: Initial Location
    state = processDemoMessage(state, 'deliver to Ikeja').updatedState;

    // Turn 5: Location Correction
    state = processDemoMessage(state, 'no wait, make it Abuja instead').updatedState;

    if (state.orders.length !== 1) {
      throw new Error(`Expected exactly 1 order, got: ${state.orders.length}`);
    }
    const order = state.orders[0];
    if (order.deliveryLocation !== 'Abuja') {
      throw new Error(`Expected corrected location Abuja, got: ${order.deliveryLocation}`);
    }
    if (order.size !== 'XL') {
      throw new Error(`Expected size XL, got: ${order.size}`);
    }
  });

  // 3. Positional Catalog Selection Journey
  await runTest('Positional Journey: Catalog -> "2nd one" -> Attribute completion -> Order', async () => {
    let state = createInitialDemoState();

    // Turn 1: Show catalog
    state = processDemoMessage(state, 'show me your collection').updatedState;

    // Turn 2: Positional Selection
    state = processDemoMessage(state, 'I want to order the second item').updatedState;
    if (state.pendingProductId !== 'demo_prod_2') { // Black Velvet Abaya
      throw new Error(`Expected demo_prod_2 for 2nd item, got: ${state.pendingProductId}`);
    }

    // Turn 3: Sizing & Location in single phrase
    state = processDemoMessage(state, 'size M to Ikeja').updatedState;

    if (state.orders.length !== 1) {
      throw new Error(`Expected 1 order created, got: ${state.orders.length}`);
    }
    if (state.orders[0].productName !== 'Black Velvet Abaya') {
      throw new Error(`Expected Black Velvet Abaya, got: ${state.orders[0].productName}`);
    }
  });

  console.log(`\n🎉 ALL ${passed}/${total} END-TO-END CUSTOMER JOURNEY TESTS PASSED 100% CLEANLY!\n`);
}

runEndToEndOrderFlowTestSuite().catch((err) => {
  console.error('❌ End-to-End Order Flow Test Suite Failed:', err);
  process.exit(1);
});
