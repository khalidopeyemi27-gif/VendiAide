import { processDemoMessage, createInitialDemoState, DEMO_PUBLIC_PRODUCTS } from '../lib/demo/demo-engine';

export async function runOrderIntegrityIdempotencyTestSuite() {
  console.log('🧪 Starting VendiAide Order Integrity & Idempotency Test Suite...\n');

  let passed = 0;
  let total = 0;

  function runTest(name: string, fn: () => void) {
    total++;
    try {
      fn();
      passed++;
      console.log(`✅ [Test ${total}] ${name} PASSED`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [Test ${total}] ${name} FAILED: ${errMsg}`);
      throw err;
    }
  }

  // 1. Single Confirmation Guarantee (No Duplicate Orders)
  runTest('Multiple consecutive confirmation messages ("yes do am" x 5) produce exactly 1 order', () => {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'how much is the black hoodie?').updatedState;
    state = processDemoMessage(state, 'size L').updatedState;
    state = processDemoMessage(state, 'deliver to Ikeja').updatedState;

    if (state.orders.length !== 0) {
      throw new Error(`Expected 0 orders created before explicit confirmation, got: ${state.orders.length}`);
    }

    state = processDemoMessage(state, 'yes do am').updatedState;

    if (state.orders.length !== 1) {
      throw new Error(`Expected 1 order created after explicit confirmation, got: ${state.orders.length}`);
    }

    // Repeat confirmation messages 5 times
    const confirmPhrases = ['yes do am', 'yes do am', 'confirm order', 'yes please', 'do am'];
    for (const phrase of confirmPhrases) {
      state = processDemoMessage(state, phrase).updatedState;
    }

    if (state.orders.length !== 1) {
      throw new Error(`Expected strictly 1 order after repeat confirmations, got: ${state.orders.length}`);
    }
  });

  // 2. Exact Financial Grounding Invariant
  runTest('Order totalNaira matches product price + confirmed vendor delivery fee exactly', () => {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'I want to buy the Black Velvet Abaya size M to Ikeja').updatedState;
    state = processDemoMessage(state, 'yes do am').updatedState;

    if (state.orders.length !== 1) {
      throw new Error(`Expected 1 order created, got: ${state.orders.length}`);
    }

    const order = state.orders[0];
    const product = DEMO_PUBLIC_PRODUCTS.find((p) => p.name === 'Black Velvet Abaya');
    if (!product) throw new Error('Product Black Velvet Abaya not found in public catalog');

    // Abaya (35,000) + Ikeja delivery (2,500) = 37,500
    if (order.totalNaira !== product.price_ngn + 2500) {
      throw new Error(`Expected order total ${product.price_ngn + 2500} NGN, got: ${order.totalNaira}`);
    }
  });

  // 3. Webhook Execution Idempotency
  runTest('Duplicate webhook payload executions maintain strict state idempotency', () => {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'buy black hoodie size L to Ikeja').updatedState;

    // Simulate 5 duplicate webhook deliveries of explicit confirmation
    for (let i = 0; i < 5; i++) {
      state = processDemoMessage(state, 'yes confirm order').updatedState;
    }

    if (state.orders.length !== 1) {
      throw new Error(`Expected exactly 1 order from 5 duplicate webhooks, got: ${state.orders.length}`);
    }
  });

  console.log(`\n🎉 ALL ${passed}/${total} ORDER INTEGRITY & IDEMPOTENCY TESTS PASSED 100% CLEANLY!\n`);
}

runOrderIntegrityIdempotencyTestSuite().catch((err) => {
  console.error('❌ Order Integrity Test Suite Failed:', err);
  process.exit(1);
});
