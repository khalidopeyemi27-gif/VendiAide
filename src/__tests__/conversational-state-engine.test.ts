/**
 * VENDIAIDE CONVERSATIONAL STATE ENGINE — MULTI-TURN TEST SUITE (MILESTONE B)
 *
 * Verifies end-to-end multi-turn conversation intelligence:
 * 1. Slot filling & missing information tracking
 * 2. Single-turn multi-intent handling
 * 3. Mid-stream corrections & slot preservation
 * 4. Product switching & interruption repair
 * 5. Explicit purchase authorization gate
 * 6. Cancellation & clean state reset
 * 7. Nigerian Pidgin & informal phrasing support
 */

import {
  createInitialConversationState,
  transitionConversationState,
} from '../lib/engine/conversation-state-manager';
import { DEMO_PUBLIC_PRODUCTS, processDemoMessage, createInitialDemoState } from '../lib/demo/demo-engine';
import { resolveNigerianLocation } from '../lib/engine/nigeria-geography';

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name} passed`);
  } catch (err: unknown) {
    console.error(`  ❌ ${name} FAILED:`, (err as Error).message);
    process.exit(1);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

console.log('🧪 Starting Conversational State Engine & Multi-Turn Suite...\n');

// ----------------------------------------------------------------------------
// Test 1: Multi-Turn Slot Filling Happy Path
// ----------------------------------------------------------------------------
runTest('Test 1 — Multi-Turn Slot Filling Happy Path', () => {
  let state = createInitialConversationState('session_test_1');

  // Turn 1: Product selection ("I want to buy white sneakers")
  let res = transitionConversationState(
    state,
    {
      intent: 'PURCHASE_INTENT',
      extractedProduct: 'white sneakers',
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = res.newState;

  assert(state.activeProductName === 'White Premium Sneakers', 'Active product should be White Premium Sneakers');
  assert(state.missingFields.includes('size'), 'Missing fields should include size');
  assert(state.missingFields.includes('location'), 'Missing fields should include location');
  assert(res.actionDirective === 'PROMPT_MISSING_SLOT', 'Directive should prompt missing slot');

  // Turn 2: Size selection ("size 42")
  res = transitionConversationState(
    state,
    {
      intent: 'PURCHASE_INTENT',
      extractedSize: '42',
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = res.newState;

  assert(state.selectedSize === '42', 'Selected size should be 42');
  assert(!state.missingFields.includes('size'), 'Size should no longer be missing');
  assert(state.missingFields.includes('location'), 'Location should still be missing');

  // Turn 3: Location selection ("Lekki")
  res = transitionConversationState(
    state,
    {
      intent: 'PURCHASE_INTENT',
      extractedLocation: 'Lekki',
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = res.newState;

  assert(Boolean(state.deliveryLocation && state.deliveryLocation.includes('Lekki')), 'Delivery location should include Lekki');
  assert(state.orderReadiness.isComplete, 'Order readiness should be complete');
  assert(state.orderReadiness.totalNaira === 47500, 'Total should be 45,000 + 2,500 = 47,500');
  assert(state.confirmationStatus === 'PENDING_USER_CONFIRMATION', 'Should await user confirmation');
  assert(res.actionDirective === 'PROMPT_CONFIRMATION', 'Directive should prompt confirmation');

  // Turn 4: Explicit Authorization ("yes confirm")
  res = transitionConversationState(
    state,
    {
      intent: 'PURCHASE_INTENT',
      isExplicitOrderAuthorization: true,
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = res.newState;

  assert(state.confirmationStatus === 'USER_CONFIRMED', 'Confirmation status should be USER_CONFIRMED');
  assert(res.actionDirective === 'CREATE_ORDER', 'Directive should trigger CREATE_ORDER');
});

// ----------------------------------------------------------------------------
// Test 2: Single-Turn Multi-Intent Message
// ----------------------------------------------------------------------------
runTest('Test 2 — Single-Turn Multi-Intent Message', () => {
  const state = createInitialConversationState('session_test_2');

  // Single message containing product + size + location
  const res = transitionConversationState(
    state,
    {
      intent: 'PURCHASE_INTENT',
      extractedProduct: 'black hoodie',
      extractedSize: 'XL',
      extractedLocation: 'Ikeja',
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );

  assert(res.newState.activeProductName === 'Black Oversized Hoodie', 'Should extract product');
  assert(res.newState.selectedSize === 'XL', 'Should extract size XL');
  assert(Boolean(res.newState.deliveryLocation && res.newState.deliveryLocation.includes('Ikeja')), 'Should extract location Ikeja');
  assert(res.newState.orderReadiness.isComplete, 'Order readiness should be complete in 1 turn');
  assert(res.newState.orderReadiness.totalNaira === 27500, 'Total should be 25,000 + 2,500 = 27,500');
  assert(res.actionDirective === 'PROMPT_CONFIRMATION', 'Should immediately prompt for confirmation');
});

// ----------------------------------------------------------------------------
// Test 3: Mid-Stream Correction & Slot Preservation
// ----------------------------------------------------------------------------
runTest('Test 3 — Mid-Stream Correction & Slot Preservation', () => {
  let state = createInitialConversationState('session_test_3');

  // Set initial complete state (Sneakers, 42, Lekki)
  let res = transitionConversationState(
    state,
    {
      intent: 'PURCHASE_INTENT',
      extractedProduct: 'white sneakers',
      extractedSize: '42',
      extractedLocation: 'Lekki',
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = res.newState;

  assert(state.selectedSize === '42', 'Initial size should be 42');

  // Customer corrects size: "actually make it 44"
  res = transitionConversationState(
    state,
    {
      intent: 'PURCHASE_INTENT',
      extractedSize: '44',
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = res.newState;

  assert(state.selectedSize === '44', 'Size should update to 44');
  assert(state.activeProductName === 'White Premium Sneakers', 'Product should be preserved');
  assert(Boolean(state.deliveryLocation && state.deliveryLocation.includes('Lekki')), 'Location should be preserved');
  assert(state.orderReadiness.isComplete, 'Order readiness should remain complete');
});

// ----------------------------------------------------------------------------
// Test 4: Product Switch & Interruption Repair
// ----------------------------------------------------------------------------
runTest('Test 4 — Product Switch & Interruption Repair', () => {
  let state = createInitialConversationState('session_test_4');

  // Turn 1: Hoodie in size L
  let res = transitionConversationState(
    state,
    {
      intent: 'PURCHASE_INTENT',
      extractedProduct: 'black hoodie',
      extractedSize: 'L',
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = res.newState;

  assert(state.activeProductName === 'Black Oversized Hoodie', 'Should set hoodie');

  // Turn 2: Customer switches product ("wait show me abaya instead")
  res = transitionConversationState(
    state,
    {
      intent: 'PRODUCT_INQUIRY',
      extractedProduct: 'black velvet abaya',
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = res.newState;

  assert(state.activeProductName === 'Black Velvet Abaya', 'Active product should switch to Abaya');
  assert(state.selectedSize === 'L', 'Size L exists on Abaya so preserved');
});

// ----------------------------------------------------------------------------
// Test 5: Explicit Authorization Safety Gate
// ----------------------------------------------------------------------------
runTest('Test 5 — Explicit Authorization Safety Gate', () => {
  let state = createInitialConversationState('session_test_5');

  // Fill all slots
  let res = transitionConversationState(
    state,
    {
      intent: 'PURCHASE_INTENT',
      extractedProduct: 'black hoodie',
      extractedSize: 'M',
      extractedLocation: 'Lagos',
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = res.newState;

  assert(state.orderReadiness.isComplete, 'State is complete');
  assert(res.actionDirective !== 'CREATE_ORDER', 'Must NOT create order before explicit user confirmation');

  // Customer expresses uncertainty
  res = transitionConversationState(
    state,
    {
      intent: 'GENERAL_QUESTION',
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = res.newState;

  assert(state.confirmationStatus !== 'USER_CONFIRMED', 'Must not confirm on generic question');
  assert(res.actionDirective !== 'CREATE_ORDER', 'Must NOT create order without explicit yes');

  // Customer explicitly confirms
  res = transitionConversationState(
    state,
    {
      intent: 'PURCHASE_INTENT',
      isExplicitOrderAuthorization: true,
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = res.newState;

  assert(state.confirmationStatus === 'USER_CONFIRMED', 'Should confirm upon explicit yes');
  assert(res.actionDirective === 'CREATE_ORDER', 'Directive should trigger CREATE_ORDER');
});

// ----------------------------------------------------------------------------
// Test 6: Cancellation & Clean State Reset
// ----------------------------------------------------------------------------
runTest('Test 6 — Cancellation & Clean State Reset', () => {
  let state = createInitialConversationState('session_test_6');

  // Turn 1: Add product & location
  let res = transitionConversationState(
    state,
    {
      intent: 'PURCHASE_INTENT',
      extractedProduct: 'black hoodie',
      extractedLocation: 'Ikeja',
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = res.newState;

  // Turn 2: Customer cancels ("abeg cancel am")
  res = transitionConversationState(
    state,
    {
      intent: 'DECLINE',
      isCancellation: true,
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = res.newState;

  assert(state.activeProductId === null, 'Active product should be reset to null');
  assert(state.deliveryLocation === null, 'Delivery location should be reset to null');
  assert(state.cancellationStatus === 'CANCELLED', 'Cancellation status should be CANCELLED');
  assert(res.actionDirective === 'CANCEL_ORDER', 'Directive should be CANCEL_ORDER');
});

// ----------------------------------------------------------------------------
// Test 7: Realistic Nigerian Slang & Pidgin Phrasing
// ----------------------------------------------------------------------------
runTest('Test 7 — Realistic Nigerian Slang & Pidgin Phrasing', () => {
  let state = createInitialConversationState('session_test_7');

  // "abeg make you keep that black one for me"
  let res = transitionConversationState(
    state,
    {
      intent: 'PURCHASE_INTENT',
      extractedProduct: 'black hoodie',
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = res.newState;

  assert(state.activeProductName === 'Black Oversized Hoodie', 'Should recognize hoodie');

  // "I go manage size L"
  res = transitionConversationState(
    state,
    {
      intent: 'PURCHASE_INTENT',
      extractedSize: 'L',
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = res.newState;

  assert(state.selectedSize === 'L', 'Should accept size L');
});

// ----------------------------------------------------------------------------
// Test 8: Informational Product Questions & Read-Only Draft Preservation
// ----------------------------------------------------------------------------
runTest('Test 8 — Informational Product Questions & Read-Only Draft Preservation', () => {
  let state = createInitialDemoState();
  state = processDemoMessage(state, 'I want to buy the Black Oversized Hoodie size L to Lekki').updatedState;

  assert(state.activeDraft.productId === 'demo_prod_1', 'Draft product should be hoodie');
  assert(state.activeDraft.size === 'L', 'Draft size should be L');
  assert(state.activeDraft.location === 'Lekki', 'Draft location should be Lekki');
  assert(state.activeDraft.status === 'READY_FOR_CHECKOUT', 'Draft status should be READY_FOR_CHECKOUT');
  assert(state.activeDraft.authorized === false, 'Authorized should be false');
  assert(state.orders.length === 0, 'Orders count should be 0');

  // Case 8.1: Availability question ("you get sneakers?")
  let res = processDemoMessage(state, 'you get sneakers?');
  assert(res.updatedState.activeDraft.productId === 'demo_prod_1', 'Availability question must not switch product');
  assert(res.updatedState.activeDraft.size === 'L', 'Availability question must preserve size L');
  assert(res.updatedState.activeDraft.location === 'Lekki', 'Availability question must preserve location Lekki');
  assert(res.updatedState.orders.length === 0, 'Orders count must remain 0');

  // Case 8.2: Price question ("how much are the sneakers?")
  res = processDemoMessage(state, 'how much are the sneakers?');
  assert(res.updatedState.activeDraft.productId === 'demo_prod_1', 'Price question must not switch product');
  assert(res.updatedState.activeDraft.size === 'L', 'Price question must preserve size L');
  assert(res.updatedState.orders.length === 0, 'Orders count must remain 0');

  // Case 8.3: Product name alone ("sneakers")
  res = processDemoMessage(state, 'sneakers');
  assert(res.updatedState.activeDraft.productId === 'demo_prod_1', 'Product name alone must not switch active draft product');
  assert(res.updatedState.orders.length === 0, 'Orders count must remain 0');

  // Case 8.4: Explicit switch ("switch to sneakers")
  res = processDemoMessage(state, 'switch to sneakers');
  assert(res.updatedState.activeDraft.productId === 'demo_prod_3', 'Explicit switch must set product to sneakers');
  assert(res.updatedState.activeDraft.size === null, 'Incompatible clothing size L must be cleared for sneakers');
  assert(res.updatedState.activeDraft.location === 'Lekki', 'Location Lekki must be preserved');
  assert(res.updatedState.activeDraft.authorized === false, 'Authorized must remain false');
  assert(res.updatedState.orders.length === 0, 'Orders count must remain 0');
});

console.log('\n======================================================');
console.log('🎉 MULTI-TURN CONVERSATIONAL STATE SUITE PASSED 100%!');
console.log('======================================================\n');
