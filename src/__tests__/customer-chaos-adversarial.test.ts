import { processDemoMessage, createInitialDemoState } from '../lib/demo/demo-engine';

export async function runCustomerChaosAdversarialTestSuite() {
  console.log('🧪 Starting VendiAide Real Customer Chaos & Adversarial Test Suite...\n');

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

  // 1. Rapid Attribute Flip-Flops
  runTest('Rapid Size Flip-Flops ("size L" -> "nah XL" -> "actually M") resolve to latest size', () => {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'how much is the hoodie?').updatedState;

    state = processDemoMessage(state, 'make it size L').updatedState;
    if (state.pendingSize !== 'L') throw new Error(`Expected size L, got: ${state.pendingSize}`);

    state = processDemoMessage(state, 'nah XL').updatedState;
    if (state.pendingSize !== 'XL') throw new Error(`Expected size XL, got: ${state.pendingSize}`);

    state = processDemoMessage(state, 'actually size M').updatedState;
    if (state.pendingSize !== 'M') throw new Error(`Expected size M, got: ${state.pendingSize}`);

    state = processDemoMessage(state, 'send am go Ikeja').updatedState;
    if (state.orders.length !== 1) throw new Error(`Expected 1 order created, got: ${state.orders.length}`);
    if (state.orders[0].size !== 'M') throw new Error(`Expected final size M in order, got: ${state.orders[0].size}`);
  });

  // 2. Mid-Checkout Location Swaps
  runTest('Location Swaps ("PH" -> "no, Lagos" -> "send to Lekki") resolve to final confirmed location', () => {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'i want to buy the black hoodie size L').updatedState;

    state = processDemoMessage(state, 'how much to PH?').updatedState;
    state = processDemoMessage(state, 'no, Lagos').updatedState;
    state = processDemoMessage(state, 'send to Lekki').updatedState;

    if (state.orders.length !== 1) throw new Error(`Expected 1 order created, got: ${state.orders.length}`);
    if (state.orders[0].deliveryLocation !== 'Lekki') {
      throw new Error(`Expected Lekki as final delivery location, got: ${state.orders[0].deliveryLocation}`);
    }
  });

  // 3. Explicit Order Cancellation Safety
  runTest('Explicit Cancellation ("cancel wait don\'t order") clears purchase intent and blocks order creation', () => {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'i want to buy the hoodie size L').updatedState;

    // Explicit cancellation
    const cancelTurn = processDemoMessage(state, 'cancel wait don\'t create order');
    state = cancelTurn.updatedState;

    if (state.pendingPurchaseIntent !== false) {
      throw new Error(`Expected pendingPurchaseIntent: false on cancellation, got: ${state.pendingPurchaseIntent}`);
    }

    // Subsequent passive acknowledgement
    state = processDemoMessage(state, 'ok fine').updatedState;

    if (state.orders.length !== 0) {
      throw new Error(`Expected 0 orders created after cancellation, got: ${state.orders.length}`);
    }
  });

  // 4. Noise, Typos & Spam Resilience
  runTest('Spam, typos, and long noise strings handle gracefully without crashing or mutating order state', () => {
    const state = createInitialDemoState();

    const turn1 = processDemoMessage(state, 'heyyyyyyyy boss howfar nadikakama 12345 !!!!!!!!');
    if (!turn1.responseText) throw new Error('Engine should provide valid text response for noise');

    const turn2 = processDemoMessage(state, 'yesssssss do am ok fine yeah');
    if (!turn2.responseText) throw new Error('Engine should handle stretched words without crashing');

    if (state.orders.length !== 0) {
      throw new Error(`Noise should produce 0 orders, got: ${state.orders.length}`);
    }
  });

  console.log(`\n🎉 ALL ${passed}/${total} REAL CUSTOMER CHAOS TESTS PASSED 100% CLEANLY!\n`);
}

runCustomerChaosAdversarialTestSuite().catch((err) => {
  console.error('❌ Customer Chaos Test Suite Failed:', err);
  process.exit(1);
});
