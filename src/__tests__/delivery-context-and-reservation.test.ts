import { processDemoMessage, createInitialDemoState } from '../lib/demo/demo-engine';

export async function runDeliveryContextAndReservationTestSuite() {
  console.log('🧪 Starting VendiAide Delivery Context, Reservation Phrasing & Premature Order Elimination Test Suite...\n');

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

  // 1. Fix #1 — Context-aware delivery queries without location in current message
  runTest('Delivery rate query without location in message inherits pendingLocation from active context', () => {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'howfar boss wetin una get').updatedState;
    state = processDemoMessage(state, 'the second one').updatedState;
    state = processDemoMessage(state, 'give me L').updatedState;
    state = processDemoMessage(state, 'ikeja').updatedState;

    // Subsequent delivery rate query without location
    const deliveryTurn = processDemoMessage(state, 'how much be delivery');

    if (!deliveryTurn.responseText.includes('Delivery to Ikeja is ₦2,500')) {
      throw new Error(`Expected grounded response for Ikeja delivery (₦2,500), got: "${deliveryTurn.responseText}"`);
    }
  });

  // 2. Fix #2 — Nigerian reservation phrasing intent recognition (Transitions draft to READY_FOR_CHECKOUT, explicit confirmation creates order)
  runTest('Explicit Nigerian reservation phrasing ("abeg reserve am for me", "reserve am", "keep this one for me") transitions draft to READY_FOR_CHECKOUT and confirmation creates order', () => {
    const reservationPhrases = [
      'abeg reserve am for me',
      'reserve am',
      'abeg keep am for me',
      'keep this one for me',
      'hold am for me',
      'reserve this one',
    ];

    for (const phrase of reservationPhrases) {
      let state = createInitialDemoState();
      state = processDemoMessage(state, 'i want to buy the black hoodie size L').updatedState;
      state = processDemoMessage(state, 'deliver to Ikeja').updatedState;

      // Ensure no order created yet before reservation phrase
      if (state.orders.length !== 0) {
        throw new Error('Order was created prematurely before explicit reservation!');
      }

      const reserveTurn = processDemoMessage(state, phrase);
      if (reserveTurn.updatedState.orders.length !== 0) {
        throw new Error(`Reservation phrase "${phrase}" created an order prematurely without explicit confirmation!`);
      }
      if (reserveTurn.updatedState.activeDraft.status !== 'READY_FOR_CHECKOUT') {
        throw new Error(`Expected draft status READY_FOR_CHECKOUT, got: ${reserveTurn.updatedState.activeDraft.status}`);
      }

      const confirmTurn = processDemoMessage(reserveTurn.updatedState, 'yes do am');
      if (confirmTurn.updatedState.orders.length !== 1) {
        throw new Error(`Explicit confirmation phrase failed to create order. Orders count: ${confirmTurn.updatedState.orders.length}`);
      }

      const order = confirmTurn.updatedState.orders[0];
      if (order.totalNaira !== 27500) { // Hoodie 25,000 + Ikeja 2,500
        throw new Error(`Expected total ₦27,500 for hoodie + Ikeja delivery, got: ₦${order.totalNaira}`);
      }
    }
  });

  // 3. Fix #3 — Elimination of premature order creation before explicit confirmation
  runTest('Specifying product + size + location displays calculated total breakdown and asks for confirmation without creating order record', () => {
    let state = createInitialDemoState();
    state = processDemoMessage(state, 'howfar boss wetin una get').updatedState;
    state = processDemoMessage(state, 'the second one').updatedState;
    state = processDemoMessage(state, 'give me L').updatedState;
    const turn4 = processDemoMessage(state, 'ikeja');

    // Verify 0 orders created after supplying product, size, and location
    if (turn4.updatedState.orders.length !== 0) {
      throw new Error(`Expected 0 orders created immediately after location entry, got: ${turn4.updatedState.orders.length}`);
    }

    // Verify response contains item price, delivery fee, total, and asks for reservation confirmation
    if (!turn4.responseText.includes('Item Price: ₦35,000')) {
      throw new Error('Response missing item price breakdown');
    }
    if (!turn4.responseText.includes('Delivery Fee (Ikeja): ₦2,500')) {
      throw new Error('Response missing Ikeja delivery fee breakdown');
    }
    if (!turn4.responseText.includes('Total: ₦37,500')) {
      throw new Error('Response missing calculated total ₦37,500');
    }
    if (!turn4.responseText.includes('Would you like me to reserve this order for you?')) {
      throw new Error('Response missing explicit reservation prompt');
    }
  });

  // 4. Master 7-Turn Sales Conversation End-to-End Test
  runTest('Master 7-Turn Conversation creates strictly 1 order with exact product, size, location, item price, delivery fee, and total amount', () => {
    let state = createInitialDemoState();

    // Turn 1: Catalog Discovery + Greeting
    const turn1 = processDemoMessage(state, 'howfar boss wetin una get');
    state = turn1.updatedState;
    if (!turn1.responseText.includes('Welcome to Kulture Fashion House') || !turn1.responseText.includes('1. Black Oversized Hoodie')) {
      throw new Error(`Turn 1 failed to return both greeting and catalog list. Got: "${turn1.responseText}"`);
    }

    // Turn 2: Positional Product Selection
    const turn2 = processDemoMessage(state, 'the second one');
    state = turn2.updatedState;

    // Turn 3: Size Selection
    const turn3 = processDemoMessage(state, 'give me L');
    state = turn3.updatedState;

    // Turn 4: Location Selection (Displays breakdown, 0 orders)
    const turn4 = processDemoMessage(state, 'ikeja');
    state = turn4.updatedState;
    if (state.orders.length !== 0) {
      throw new Error(`Master Test Failure: Expected 0 orders at Turn 4, got: ${state.orders.length}`);
    }

    // Turn 5: Context-Aware Delivery Rate Query (Uses Ikeja, 0 orders)
    const turn5 = processDemoMessage(state, 'how much be delivery');
    state = turn5.updatedState;
    if (!turn5.responseText.includes('Delivery to Ikeja is ₦2,500')) {
      throw new Error(`Master Test Failure: Delivery query failed context resolution to Ikeja. Response: "${turn5.responseText}"`);
    }
    if (state.orders.length !== 0) {
      throw new Error(`Master Test Failure: Expected 0 orders at Turn 5, got: ${state.orders.length}`);
    }

    // Turn 6: Nigerian Reservation Phrasing (Draft ready for checkout, 0 orders)
    const turn6 = processDemoMessage(state, 'abeg reserve am for me');
    state = turn6.updatedState;
    if (state.orders.length !== 0) {
      throw new Error(`Master Test Failure: Expected 0 orders after Turn 6 reservation request, got: ${state.orders.length}`);
    }

    // Turn 7: Confirmation (Creates Order #1)
    const turn7 = processDemoMessage(state, 'yes do am');
    state = turn7.updatedState;
    if (state.orders.length !== 1) {
      throw new Error(`Master Test Failure: Expected strictly 1 order after Turn 7 confirmation, got: ${state.orders.length}`);
    }

    // Inspect final database order record
    const finalOrder = state.orders[0];
    if (finalOrder.productName !== 'Black Velvet Abaya') {
      throw new Error(`Expected product "Black Velvet Abaya", got: "${finalOrder.productName}"`);
    }
    if (finalOrder.size !== 'L') {
      throw new Error(`Expected size "L", got: "${finalOrder.size}"`);
    }
    if (finalOrder.deliveryLocation !== 'Ikeja') {
      throw new Error(`Expected delivery location "Ikeja", got: "${finalOrder.deliveryLocation}"`);
    }
    if (finalOrder.totalNaira !== 37500) {
      throw new Error(`Expected totalNaira 37500 (35000 + 2500), got: ${finalOrder.totalNaira}`);
    }
  });

  console.log(`\n🎉 ALL ${passed}/${total} DELIVERY CONTEXT, RESERVATION & MASTER CONVERSATION TESTS PASSED 100% CLEANLY!\n`);
}

runDeliveryContextAndReservationTestSuite().catch((err) => {
  console.error('❌ Delivery Context & Reservation Test Suite Failed:', err);
  process.exit(1);
});
