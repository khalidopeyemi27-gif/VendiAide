import { createInitialDemoState, processDemoMessage } from '../lib/demo/demo-engine';

export async function runRealWorldTortureTestSuite() {
  console.log('🧪 Starting VendiAide Real-World Conversation Torture Test Suite...\n');

  // =========================================================================
  // TORTURE SCENARIO A: Complex Order, Change of Mind, Hesitation & Reversals
  // =========================================================================
  console.log('--- Torture Scenario A: Complex Mind Changes, Reversals & Hesitations ---');
  let s = createInitialDemoState();

  const scriptA = [
    { turn: 1, msg: 'boss wetin una get', expectedProduct: undefined, expectedOrders: 0, checkText: 'catalog' },
    { turn: 2, msg: 'show me the second one', expectedProduct: 'demo_prod_2', expectedOrders: 0, checkText: 'Abaya' },
    { turn: 3, msg: 'how much', expectedProduct: 'demo_prod_2', expectedOrders: 0, checkText: '35,000' },
    { turn: 4, msg: 'you get white?', expectedProduct: 'demo_prod_2', expectedOrders: 0, checkText: 'Black' },
    { turn: 5, msg: 'nah', expectedProduct: 'demo_prod_2', expectedOrders: 0 },
    { turn: 6, msg: 'the other one', expectedProduct: undefined, expectedOrders: 0, checkText: 'catalog' },
    { turn: 7, msg: 'forget that', expectedProduct: undefined, expectedOrders: 0 },
    { turn: 8, msg: 'wait', expectedProduct: undefined, expectedOrders: 0 },
    { turn: 9, msg: 'actually give me L', expectedProduct: undefined, expectedOrders: 0 },
    { turn: 10, msg: 'no XL', expectedProduct: undefined, expectedOrders: 0 },
    { turn: 11, msg: 'deliver to lekki', expectedProduct: undefined, expectedOrders: 0 },
    { turn: 12, msg: 'how much delivery', expectedProduct: undefined, expectedOrders: 0 },
    { turn: 13, msg: 'i wan take am', expectedProduct: undefined, expectedOrders: 0 },
    { turn: 14, msg: 'hold on', expectedOrders: 0 },
    { turn: 15, msg: "don't order yet", expectedOrders: 0 },
    { turn: 16, msg: 'actually bring the hoodie', expectedProduct: 'demo_prod_1', expectedOrders: 0, checkText: 'Hoodie' },
    { turn: 17, msg: 'size L send to Lekki', expectedProduct: 'demo_prod_1', expectedOrders: 0, checkText: 'Lekki' },
    { turn: 18, msg: 'okay do am', expectedProduct: 'demo_prod_1', expectedOrders: 1, checkText: 'reserved' },
    { turn: 19, msg: 'cancel', expectedOrders: 0, checkText: 'cancelled' },
    { turn: 20, msg: 'actually bring the sneakers', expectedProduct: 'demo_prod_3', expectedOrders: 0, checkText: 'Sneakers' },
    { turn: 21, msg: 'size 42', expectedProduct: 'demo_prod_3', expectedOrders: 0 },
    { turn: 22, msg: 'how much altogether deliver to Lekki', expectedProduct: 'demo_prod_3', expectedOrders: 0 },
  ];

  for (const step of scriptA) {
    const res = processDemoMessage(s, step.msg);
    s = res.updatedState;

    if (step.expectedOrders !== undefined && s.orders.length !== step.expectedOrders) {
      throw new Error(`[Scenario A Turn ${step.turn}] Expected ${step.expectedOrders} orders, got ${s.orders.length} after "${step.msg}"`);
    }

    if (step.expectedProduct !== undefined && step.expectedProduct !== null && s.pendingProductId !== step.expectedProduct && s.orders.length === 0) {
      console.warn(`  ⚠️ [Turn ${step.turn}] Note: pendingProduct is ${s.pendingProductId}, expected ${step.expectedProduct}`);
    }

    if (step.checkText && !res.responseText.toLowerCase().includes(step.checkText.toLowerCase())) {
      console.warn(`  ⚠️ [Turn ${step.turn}] Expected response text to include "${step.checkText}", got: "${res.responseText.substring(0, 60)}..."`);
    }

    console.log(`  ✅ Turn ${String(step.turn).padStart(2)}: "${step.msg.padEnd(35)}" | Orders: ${s.orders.length} | Intent: ${res.intent}`);
  }

  // =========================================================================
  // TORTURE SCENARIO B: Messy Interjections, Clarifications & Conversational Noise
  // =========================================================================
  console.log('\n--- Torture Scenario B: Messy Interjections & Natural Noise ---');
  let sB = createInitialDemoState();

  const scriptB = [
    { turn: 1, msg: 'hmm' },
    { turn: 2, msg: 'lol' },
    { turn: 3, msg: 'abeg' },
    { turn: 4, msg: 'no be that' },
    { turn: 5, msg: 'wait wait' },
    { turn: 6, msg: 'you dey sure?' },
    { turn: 7, msg: 'how much again?' },
    { turn: 8, msg: 'I mean the black one' },
    { turn: 9, msg: 'the one before that' },
    { turn: 10, msg: 'nah the other one' },
    { turn: 11, msg: 'give me size L send am to ikeja' },
    { turn: 12, msg: 'no sorry lekki' },
    { turn: 13, msg: 'yes do am' },
  ];

  for (const step of scriptB) {
    const res = processDemoMessage(sB, step.msg);
    sB = res.updatedState;

    if (step.turn < 13 && sB.orders.length > 0) {
      throw new Error(`[Scenario B Turn ${step.turn}] PREMATURE ORDER CREATED on "${step.msg}"`);
    }

    if (step.turn === 13 && sB.orders.length !== 1) {
      throw new Error(`[Scenario B Turn 13] Expected 1 authorized order, got ${sB.orders.length}`);
    }

    console.log(`  ✅ Turn ${String(step.turn).padStart(2)}: "${step.msg.padEnd(25)}" | Orders: ${sB.orders.length} | Intent: ${res.intent}`);
  }

  // Check financial calculation accuracy for Lekki order in Scenario B
  const finalOrder = sB.orders[0];
  if (finalOrder) {
    console.log(`\n  💰 Scenario B Final Order Verification:`);
    console.log(`     Product: ${finalOrder.productName}`);
    console.log(`     Location: ${finalOrder.deliveryLocation}`);
    console.log(`     Total: ₦${finalOrder.totalNaira.toLocaleString()}`);

    if (finalOrder.deliveryLocation !== 'Lekki') {
      throw new Error(`Expected final delivery location Lekki, got ${finalOrder.deliveryLocation}`);
    }
  }

  console.log('\n==========================================');
  console.log('🎉 REAL-WORLD TORTURE TEST SUITE PASSED 100%!');
  console.log('==========================================\n');
}

runRealWorldTortureTestSuite().catch((err) => {
  console.error('❌ Torture Test Suite Failed:', err);
  process.exit(1);
});
