import { processDemoMessage, createInitialDemoState } from '../engine';
import { resolveCustomerMeaning } from '../lib/engine/meaning-resolver';
import { resolveNigerianLocation } from '../lib/engine/nigeria-geography';
import { verifyVendorDeliveryCoverage } from '../lib/engine/vendor-delivery';
import { DEMO_PUBLIC_PRODUCTS as CUSTOM_CATALOG } from '../lib/demo/demo-engine';

export async function runArchitectureInvariantsTestSuite() {
  console.log('🧪 Starting VendiAide Architectural Invariants Test Suite (18 Invariants)...\n');

  let passed = 0;
  let total = 0;

  async function assertInvariant(num: number, name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`✅ [Invariant ${num}/18] ${name} PASSED`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [Invariant ${num}/18] ${name} FAILED: ${errMsg}`);
      throw err;
    }
  }

  // Invariant 1: MeaningResolution.originalMessage must exactly equal incoming customer text
  await assertInvariant(1, 'MeaningResolution.originalMessage exact equality', async () => {
    const text = '  abeg send am to V.I  ';
    const state = createInitialDemoState();
    const meaning = await resolveCustomerMeaning(text, state, CUSTOM_CATALOG);
    if (meaning.originalMessage !== text) {
      throw new Error(`originalMessage mismatch! Expected "${text}", got "${meaning.originalMessage}"`);
    }
  });

  // Invariant 2: State mutation justification check
  await assertInvariant(2, 'Explicit MeaningResolution.stateMutation justification', async () => {
    const state = createInitialDemoState();
    const meaning = await resolveCustomerMeaning('I want size L', state, CUSTOM_CATALOG);
    if (!meaning.stateMutation || !meaning.stateMutation.shouldMutate) {
      throw new Error('Explicit state mutation justification missing for size selection!');
    }
  });

  // Invariant 3: Response generation cannot introduce an ungrounded product
  await assertInvariant(3, 'No ungrounded product in response generation', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'do you sell Rolex watches?');
    if (res.responseText.includes('Rolex') && !res.responseText.toLowerCase().includes("don't have") && !res.responseText.toLowerCase().includes("don't sell") && !res.responseText.toLowerCase().includes("not listed")) {
      throw new Error(`Ungrounded product 'Rolex' was introduced into response! Got: "${res.responseText}"`);
    }
    if (res.updatedState.pendingProductId) {
      throw new Error('Unknown product Rolex entered pendingProductId!');
    }
  });

  // Invariant 4: Response generation cannot introduce an ungrounded price
  await assertInvariant(4, 'No ungrounded price in response generation', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'how much is the Hoodie?');
    if (res.responseText.includes('₦') && !res.responseText.includes('25,000')) {
      throw new Error(`Ungrounded price was generated for Hoodie! Got: "${res.responseText}"`);
    }
  });

  // Invariant 5: Response generation cannot introduce an unconfirmed delivery fee
  await assertInvariant(5, 'No unconfirmed delivery fee in response generation', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'how much to Kano?');
    if (res.responseText.includes('₦2,500') || res.responseText.includes('₦5,000')) {
      throw new Error(`Fabricated delivery fee was generated for unconfirmed location Kano! Got: "${res.responseText}"`);
    }
  });

  // Invariant 6: Passive acknowledgements cannot mutate state unless answering prompt
  await assertInvariant(6, 'Passive acknowledgements cannot mutate state without explicit prompt', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'okay');
    if (res.updatedState.pendingSize || res.updatedState.pendingColor || res.updatedState.pendingLocation || res.updatedState.orders.length > 0) {
      throw new Error('Passive acknowledgement "okay" mutated conversation state!');
    }
  });

  // Invariant 7: Customer messages remain byte-for-byte verbatim
  await assertInvariant(7, 'Customer messages remain byte-for-byte verbatim', () => {
    const raw = 'abeg send am to Lekki Phase 1';
    const state = createInitialDemoState();
    const res = processDemoMessage(state, raw);
    const lastCustMsg = res.updatedState.messages.filter((m) => m.sender === 'customer').pop();
    if (!lastCustMsg || lastCustMsg.text !== raw) {
      throw new Error(`Verbatim preservation failed! Expected "${raw}", got "${lastCustMsg?.text}"`);
    }
  });

  // Invariant 8: Location resolver cannot independently imply vendor delivery coverage
  await assertInvariant(8, 'Geography resolver domain separation from vendor coverage', () => {
    const loc = resolveNigerianLocation('Kano')!;
    if (!loc) throw new Error('Geography resolution failed for Kano');
    
    // Vendor with NO Kano coverage configured
    const noCoverageVendor = { vendorId: 'vendor_a', rates: { lagos: { rateNaira: 2500 } } };
    const coverage = verifyVendorDeliveryCoverage('vendor_a', loc, noCoverageVendor);
    
    if (coverage.status === 'CONFIRMED') {
      throw new Error('Geographic location independently implied vendor delivery coverage for unconfigured vendor!');
    }
  });

  // Invariant 9: Generic intent classification cannot override contextual correlation
  await assertInvariant(9, 'Contextual correlation overrides generic intent classification', () => {
    const state = createInitialDemoState();
    const res1 = processDemoMessage(state, 'I want the hoodie');
    const res2 = processDemoMessage(res1.updatedState, 'L');
    if (res2.updatedState.pendingSize !== 'L') {
      throw new Error('Contextual correlation for size selection was overridden by generic intent!');
    }
  });

  // Invariant 10: Positional catalog reference resolution against displayed list
  await assertInvariant(10, 'Positional catalog references resolve against displayed product list', () => {
    const state = createInitialDemoState();
    const res1 = processDemoMessage(state, 'show me your products');
    const res2 = processDemoMessage(res1.updatedState, 'I want the first one');
    if (res2.updatedState.pendingProductId !== 'demo_prod_1') {
      throw new Error(`Positional reference "I want the first one" failed to resolve to demo_prod_1! Got: "${res2.updatedState.pendingProductId}"`);
    }
  });

  // Invariant 11: Corrections replace intended entity without creating duplicate orders
  await assertInvariant(11, 'Corrections update entity without duplicate orders', () => {
    const state = createInitialDemoState();
    const res1 = processDemoMessage(state, 'I want the hoodie size M in Ikeja');
    const res2 = processDemoMessage(res1.updatedState, 'actually size L');
    if (res2.updatedState.pendingSize !== 'L') {
      throw new Error('Correction failed to update pendingSize to L!');
    }
    if (res2.updatedState.orders.length > 1) {
      throw new Error('Correction created duplicate orders!');
    }
  });

  // Invariant 12: Casual interruptions preserve active order context
  await assertInvariant(12, 'Casual interruptions preserve active order context', () => {
    const state = createInitialDemoState();
    const res1 = processDemoMessage(state, 'I want the hoodie size L');
    const res2 = processDemoMessage(res1.updatedState, 'you guys are doing great');
    if (res2.updatedState.pendingProductId !== 'demo_prod_1' || res2.updatedState.pendingSize !== 'L') {
      throw new Error('Casual compliment destroyed active order state!');
    }
  });

  // Invariant 13: Out-of-domain questions do not mutate commerce state
  await assertInvariant(13, 'Out-of-domain questions do not mutate commerce state', () => {
    const state = createInitialDemoState();
    const res1 = processDemoMessage(state, 'I want the hoodie');
    const res2 = processDemoMessage(res1.updatedState, 'do you have WiFi in the shop?');
    if (res2.updatedState.pendingProductId !== 'demo_prod_1') {
      throw new Error('Out-of-domain WiFi query mutated active product state!');
    }
  });

  // Invariant 14: Unknown products never enter pendingProductId
  await assertInvariant(14, 'Unknown products never enter pendingProductId', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'I want to buy a Tesla car');
    if (res.updatedState.pendingProductId) {
      throw new Error(`Unknown product 'Tesla car' entered pendingProductId: "${res.updatedState.pendingProductId}"`);
    }
  });

  // Invariant 15: Unknown colors never enter pendingColor
  await assertInvariant(15, 'Unknown colors never enter pendingColor', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'do you have fluorescent neon green hoodie?');
    if (res.updatedState.pendingColor === 'fluorescent neon green') {
      throw new Error('Ungrounded color entered pendingColor!');
    }
  });

  // Invariant 16: Unknown sizes never enter pendingSize
  await assertInvariant(16, 'Unknown sizes never enter pendingSize', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'I want size XXXXXL');
    if (res.updatedState.pendingSize === 'XXXXXL') {
      throw new Error('Ungrounded size XXXXXL entered pendingSize!');
    }
  });

  // Invariant 17: Unknown delivery locations never receive fabricated fees
  await assertInvariant(17, 'Unknown delivery locations never receive fabricated fees', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'how much to Honolulu?');
    if (res.responseText.includes('₦2,500') || res.responseText.includes('₦5,000')) {
      throw new Error('Fabricated delivery fee was generated for Honolulu!');
    }
  });

  // Invariant 18: Response generation consumes MeaningResolution rather than reconstructing intent
  await assertInvariant(18, 'Response generation consumes MeaningResolution', async () => {
    const state = createInitialDemoState();
    const meaning = await resolveCustomerMeaning('abeg show me hoodies', state, CUSTOM_CATALOG);
    if (!meaning || (!meaning.intent && !meaning.resolvedIntent)) {
      throw new Error('MeaningResolution contract incomplete for response generation!');
    }
  });

  console.log(`\n🎉 ALL ${passed}/${total} ARCHITECTURAL INVARIANTS PASSED 100% CLEANLY!\n`);
}

runArchitectureInvariantsTestSuite().catch((err) => {
  console.error('❌ Architectural Invariants Test Suite Failed:', err);
  process.exit(1);
});
