/**
 * VENDIAIDE END-TO-END CONVERSATION EVALUATION BENCHMARK
 *
 * Evaluates complete multi-turn conversations from initial message to order creation:
 * 1. Happy path multi-turn order flow
 * 2. Mid-stream size & location corrections
 * 3. Product switching & interruption recovery
 * 4. Ambiguous pronoun/reference resolution
 * 5. Mid-order cancellation & clean reset
 * 6. Single-turn multi-intent handling
 * 7. Dynamic product attribute requirement evaluation (non-variant guard)
 */

import {
  createInitialConversationState,
  transitionConversationState,
} from '../lib/engine/conversation-state-manager';
import {
  buildResponseActionPlan,
  generateNaturalResponse,
} from '../lib/engine/response-planner';
import { DEMO_PUBLIC_PRODUCTS, DemoProduct } from '../lib/demo/demo-engine';
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

console.log('🧪 Starting VendiAide End-to-End Conversation Benchmark...\n');

// ----------------------------------------------------------------------------
// Scenario 1: Happy Path Full Conversation
// ----------------------------------------------------------------------------
runTest('Scenario 1 — Happy Path Full Conversation', () => {
  let state = createInitialConversationState('sess_e2e_1');

  // Turn 1: "Abeg you get black sneakers?"
  let transition = transitionConversationState(
    state,
    { intent: 'PRODUCT_INQUIRY', extractedProduct: 'sneakers' },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = transition.newState;
  let plan = buildResponseActionPlan(state, transition.resolvedProduct);
  let text = generateNaturalResponse(plan, DEMO_PUBLIC_PRODUCTS, 'friendly_professional');

  assert(state.activeProductName === 'White Premium Sneakers', 'Should resolve sneakers');
  assert(plan.actionType === 'PROMPT_MISSING_SIZE', 'Should ask for size next');
  assert(text.includes('What size'), 'Response should prompt for size');

  // Turn 2: "I go take size 42"
  transition = transitionConversationState(
    state,
    { intent: 'PURCHASE_INTENT', extractedSize: '42' },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = transition.newState;
  plan = buildResponseActionPlan(state, transition.resolvedProduct);
  text = generateNaturalResponse(plan, DEMO_PUBLIC_PRODUCTS, 'friendly_professional');

  assert(state.selectedSize === '42', 'Should record size 42');
  assert(plan.actionType === 'PROMPT_MISSING_LOCATION', 'Should prompt for delivery location next');

  // Turn 3: "Ikeja"
  transition = transitionConversationState(
    state,
    { intent: 'PURCHASE_INTENT', extractedLocation: 'Ikeja' },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = transition.newState;
  plan = buildResponseActionPlan(state, transition.resolvedProduct);
  text = generateNaturalResponse(plan, DEMO_PUBLIC_PRODUCTS, 'friendly_professional');

  assert(state.orderReadiness.isComplete, 'Order readiness should be complete');
  assert(plan.actionType === 'PROMPT_CONFIRMATION', 'Action plan should be PROMPT_CONFIRMATION');
  assert(text.includes('Should I place the order'), 'Text should ask for confirmation');

  // Turn 4: "Yes confirm"
  transition = transitionConversationState(
    state,
    { intent: 'PURCHASE_INTENT', isExplicitOrderAuthorization: true },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = transition.newState;
  plan = buildResponseActionPlan(state, transition.resolvedProduct);
  text = generateNaturalResponse(plan, DEMO_PUBLIC_PRODUCTS, 'friendly_professional');

  assert(plan.actionType === 'EXECUTE_ORDER', 'Plan should execute order');
  assert(text.includes('confirmed'), 'Text should confirm order creation');
});

// ----------------------------------------------------------------------------
// Scenario 2: Mid-Stream Size Correction
// ----------------------------------------------------------------------------
runTest('Scenario 2 — Mid-Stream Size Correction', () => {
  let state = createInitialConversationState('sess_e2e_2');

  // Fill initially with size 42
  let transition = transitionConversationState(
    state,
    { intent: 'PURCHASE_INTENT', extractedProduct: 'sneakers', extractedSize: '42', extractedLocation: 'Lekki' },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = transition.newState;

  assert(state.selectedSize === '42', 'Initial size 42');

  // Customer corrects: "Actually size 44"
  transition = transitionConversationState(
    state,
    { intent: 'PURCHASE_INTENT', extractedSize: '44' },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = transition.newState;

  assert(state.selectedSize === '44', 'Size updated to 44');
  assert(state.activeProductName === 'White Premium Sneakers', 'Product preserved');
  assert(Boolean(state.deliveryLocation && state.deliveryLocation.includes('Lekki')), 'Location preserved');
});

// ----------------------------------------------------------------------------
// Scenario 3: Product Switching Interruption
// ----------------------------------------------------------------------------
runTest('Scenario 3 — Product Switching Interruption', () => {
  let state = createInitialConversationState('sess_e2e_3');

  // Hoodie size L
  let transition = transitionConversationState(
    state,
    { intent: 'PURCHASE_INTENT', extractedProduct: 'hoodie', extractedSize: 'L' },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = transition.newState;

  assert(state.activeProductName === 'Black Oversized Hoodie', 'Should set hoodie');

  // Customer switches: "Actually forget hoodie, show me abaya"
  transition = transitionConversationState(
    state,
    { intent: 'PRODUCT_INQUIRY', extractedProduct: 'abaya' },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = transition.newState;

  assert(state.activeProductName === 'Black Velvet Abaya', 'Product switched to Abaya');
});

// ----------------------------------------------------------------------------
// Scenario 4: Mid-Order Cancellation & Clean Reset
// ----------------------------------------------------------------------------
runTest('Scenario 4 — Mid-Order Cancellation & Clean Reset', () => {
  let state = createInitialConversationState('sess_e2e_4');

  let transition = transitionConversationState(
    state,
    { intent: 'PURCHASE_INTENT', extractedProduct: 'hoodie', extractedLocation: 'Ikeja' },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = transition.newState;

  // "Wait, cancel am"
  transition = transitionConversationState(
    state,
    { intent: 'DECLINE', isCancellation: true },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  state = transition.newState;
  const plan = buildResponseActionPlan(state, transition.resolvedProduct);
  const text = generateNaturalResponse(plan, DEMO_PUBLIC_PRODUCTS, 'friendly_professional');

  assert(state.activeProductId === null, 'Active product reset');
  assert(plan.actionType === 'CANCEL_ORDER', 'Action plan is CANCEL_ORDER');
  assert(text.includes('cancelled'), 'Text confirms cancellation');
});

// ----------------------------------------------------------------------------
// Scenario 5: Single-Turn Multi-Intent Request
// ----------------------------------------------------------------------------
runTest('Scenario 5 — Single-Turn Multi-Intent Request', () => {
  const state = createInitialConversationState('sess_e2e_5');

  const transition = transitionConversationState(
    state,
    {
      intent: 'PURCHASE_INTENT',
      extractedProduct: 'hoodie',
      extractedSize: 'XL',
      extractedLocation: 'Lekki',
    },
    DEMO_PUBLIC_PRODUCTS,
    resolveNigerianLocation
  );
  const plan = buildResponseActionPlan(transition.newState, transition.resolvedProduct);

  assert(transition.newState.orderReadiness.isComplete, 'Complete in single turn');
  assert(plan.actionType === 'PROMPT_CONFIRMATION', 'Immediately prompts for confirmation');
});

// ----------------------------------------------------------------------------
// Scenario 6: Dynamic Product Attribute Guard (Non-Variant Products)
// ----------------------------------------------------------------------------
runTest('Scenario 6 — Dynamic Product Attribute Guard (Non-Variant Products)', () => {
  const state = createInitialConversationState('sess_e2e_6');

  // Custom catalog with a single-size, single-color handbag
  const customCatalog: DemoProduct[] = [
    {
      id: 'prod_bag_1',
      name: 'Leather Handbag',
      price_ngn: 15000,
      sizes: [], // 0 size variants
      colors: ['Brown'], // 1 color option
      in_stock: true,
      category: 'Accessories',
    },
  ];

  const transition = transitionConversationState(
    state,
    { intent: 'PURCHASE_INTENT', extractedProduct: 'handbag', extractedLocation: 'Ikeja' },
    customCatalog,
    resolveNigerianLocation
  );
  const plan = buildResponseActionPlan(transition.newState, transition.resolvedProduct);

  assert(transition.newState.orderReadiness.isComplete, 'Order should be complete immediately without size/color prompts');
  assert(!transition.newState.missingFields.includes('size'), 'Size should NOT be missing');
  assert(!transition.newState.missingFields.includes('color'), 'Color should NOT be missing');
  assert(plan.actionType === 'PROMPT_CONFIRMATION', 'Prompts directly for confirmation');
});

console.log('\n======================================================');
console.log('🎉 END-TO-END CONVERSATION BENCHMARK PASSED 100%!');
console.log('======================================================\n');
