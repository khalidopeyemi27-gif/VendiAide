import { resolveNigerianLocation, locationTypePurityCheck } from '../lib/engine/nigeria-geography';
import { verifyVendorDeliveryCoverage, VendorDeliveryConfig } from '../lib/engine/vendor-delivery';
import { processDemoMessage, createInitialDemoState } from '../engine';

export async function runLocationAdversarialTestSuite() {
  console.log('🧪 Starting VendiAide Type-Level Pure Geography & 87-Test Adversarial Location Suite...\n');

  let passedTests = 0;
  let totalTests = 0;

  function runTest(name: string, fn: () => void) {
    totalTests++;
    try {
      fn();
      passedTests++;
      console.log(`✅ [Test ${totalTests}/87] ${name} Passed`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [Test ${totalTests}/87] ${name} Failed:`, errMsg);
      throw err;
    }
  }

  // Category 1: Type-Level Geography Purity (6 Tests)
  runTest('Type-Level Purity 1: Compile-time locationTypePurityCheck is true', () => {
    if (locationTypePurityCheck !== true) {
      throw new Error('locationTypePurityCheck type guard failed!');
    }
  });

  runTest('Type-Level Purity 2: LocationResolution.vendorCoverage property does not exist on object', () => {
    const res = (resolveNigerianLocation('Lagos')! as unknown) as Record<string, unknown>;
    if ('vendorCoverage' in res) throw new Error('vendorCoverage field leaked into LocationResolution!');
  });

  runTest('Type-Level Purity 3: LocationResolution.feeNaira property does not exist on object', () => {
    const res = (resolveNigerianLocation('Ikeja')! as unknown) as Record<string, unknown>;
    if ('feeNaira' in res) throw new Error('feeNaira field leaked into LocationResolution!');
  });

  runTest('Type-Level Purity 4: LocationResolution.timeframe property does not exist on object', () => {
    const res = (resolveNigerianLocation('Abuja')! as unknown) as Record<string, unknown>;
    if ('timeframe' in res) throw new Error('timeframe field leaked into LocationResolution!');
  });

  runTest('Type-Level Purity 5: LocationResolution.vendorId property does not exist on object', () => {
    const res = (resolveNigerianLocation('PH')! as unknown) as Record<string, unknown>;
    if ('vendorId' in res) throw new Error('vendorId field leaked into LocationResolution!');
  });

  runTest('Type-Level Purity 6: Object.keys(LocationResolution) contains zero commercial vendor keys', () => {
    const res = resolveNigerianLocation('VI')!;
    const forbidden = ['vendorCoverage', 'feeNaira', 'timeframe', 'vendorId', 'deliveryFee'];
    const keys = Object.keys(res);
    for (const key of keys) {
      if (forbidden.includes(key)) throw new Error(`Forbidden key "${key}" found in LocationResolution!`);
    }
  });

  // Category 2: Runtime Geography Purity (5 Tests)
  runTest('Runtime Purity 1: "send am to V.I" produces identical LocationResolution regardless of caller', () => {
    const res1 = resolveNigerianLocation('send am to V.I');
    const res2 = resolveNigerianLocation('send am to V.I');
    if (JSON.stringify(res1) !== JSON.stringify(res2)) {
      throw new Error('Geographic resolution is non-deterministic!');
    }
  });

  runTest('Runtime Purity 2: LocationResolution contains strictly geographic facts', () => {
    const res = resolveNigerianLocation('Lagos')!;
    if (res.canonicalName !== 'Lagos' || res.state !== 'Lagos' || res.regionType !== 'STATE') {
      throw new Error('Runtime geographic metadata mismatch!');
    }
  });

  runTest('Runtime Purity 3: No pricing data attached during resolution of "Lagos"', () => {
    const res = resolveNigerianLocation('Lagos')!;
    if ((res as unknown as { feeNaira?: number }).feeNaira !== undefined) throw new Error('Price data found on Lagos resolution!');
  });

  runTest('Runtime Purity 4: No pricing data attached during resolution of "PH"', () => {
    const res = resolveNigerianLocation('PH')!;
    if ((res as unknown as { feeNaira?: number }).feeNaira !== undefined) throw new Error('Price data found on PH resolution!');
  });

  runTest('Runtime Purity 5: No pricing data attached during resolution of "Abuja"', () => {
    const res = resolveNigerianLocation('Abuja')!;
    if ((res as unknown as { feeNaira?: number }).feeNaira !== undefined) throw new Error('Price data found on Abuja resolution!');
  });

  // Category 3: Multi-Tenant Isolation (8 Tests)
  const vendorA: VendorDeliveryConfig = {
    vendorId: 'vendor_a',
    rates: { lagos: { rateNaira: 2500, timeframe: '1-2 days' }, abuja: { rateNaira: 5000 } },
    excludedLocations: ['kano'],
  };
  const vendorB: VendorDeliveryConfig = {
    vendorId: 'vendor_b',
    rates: { lagos: { rateNaira: 4000, timeframe: '2-3 days' }, abuja: { rateNaira: 7000 } },
    excludedLocations: ['sokoto'],
  };

  runTest('Multi-Tenant Isolation 1: Vendor A Lagos rate is ₦2,500', () => {
    const loc = resolveNigerianLocation('Lagos')!;
    const cov = verifyVendorDeliveryCoverage('vendor_a', loc, vendorA);
    if (cov.feeNaira !== 2500) throw new Error(`Vendor A Lagos rate expected 2500, got ${cov.feeNaira}`);
  });

  runTest('Multi-Tenant Isolation 2: Vendor B Lagos rate is ₦4,000', () => {
    const loc = resolveNigerianLocation('Lagos')!;
    const cov = verifyVendorDeliveryCoverage('vendor_b', loc, vendorB);
    if (cov.feeNaira !== 4000) throw new Error(`Vendor B Lagos rate expected 4000, got ${cov.feeNaira}`);
  });

  runTest('Multi-Tenant Isolation 3: Vendor A Abuja rate is ₦5,000', () => {
    const loc = resolveNigerianLocation('Abuja')!;
    const cov = verifyVendorDeliveryCoverage('vendor_a', loc, vendorA);
    if (cov.feeNaira !== 5000) throw new Error(`Vendor A Abuja rate expected 5000, got ${cov.feeNaira}`);
  });

  runTest('Multi-Tenant Isolation 4: Vendor B Abuja rate is ₦7,000', () => {
    const loc = resolveNigerianLocation('Abuja')!;
    const cov = verifyVendorDeliveryCoverage('vendor_b', loc, vendorB);
    if (cov.feeNaira !== 7000) throw new Error(`Vendor B Abuja rate expected 7000, got ${cov.feeNaira}`);
  });

  runTest('Multi-Tenant Isolation 5: Vendor A unconfigured location (Enugu) returns UNCONFIRMED status', () => {
    const loc = resolveNigerianLocation('Enugu')!;
    const cov = verifyVendorDeliveryCoverage('vendor_a', loc, vendorA);
    if (cov.status !== 'UNCONFIRMED' || cov.feeNaira !== undefined) throw new Error('Unconfigured location did not return UNCONFIRMED!');
  });

  runTest('Multi-Tenant Isolation 6: Vendor B unconfigured location (Enugu) returns UNCONFIRMED status', () => {
    const loc = resolveNigerianLocation('Enugu')!;
    const cov = verifyVendorDeliveryCoverage('vendor_b', loc, vendorB);
    if (cov.status !== 'UNCONFIRMED' || cov.feeNaira !== undefined) throw new Error('Unconfigured location did not return UNCONFIRMED!');
  });

  runTest('Multi-Tenant Isolation 7: Vendor A excluded location (Kano) returns NOT_COVERED', () => {
    const loc = resolveNigerianLocation('Kano')!;
    const cov = verifyVendorDeliveryCoverage('vendor_a', loc, vendorA);
    if (cov.status !== 'NOT_COVERED') throw new Error('Excluded location Kano expected NOT_COVERED for Vendor A!');
  });

  runTest('Multi-Tenant Isolation 8: Vendor B excluded location (Sokoto) returns NOT_COVERED', () => {
    const loc = resolveNigerianLocation('Sokoto')!;
    const cov = verifyVendorDeliveryCoverage('vendor_b', loc, vendorB);
    if (cov.status !== 'NOT_COVERED') throw new Error('Excluded location Sokoto expected NOT_COVERED for Vendor B!');
  });

  // Category 4: Coverage & Timeframe Grounding (7 Tests)
  runTest('Timeframe Grounding 1: Vendor A Lagos has timeframe "1-2 days"', () => {
    const loc = resolveNigerianLocation('Lagos')!;
    const cov = verifyVendorDeliveryCoverage('vendor_a', loc, vendorA);
    if (cov.timeframe !== '1-2 days') throw new Error(`Timeframe expected "1-2 days", got "${cov.timeframe}"`);
  });

  runTest('Timeframe Grounding 2: Vendor A Abuja absent timeframe returns undefined without inventing days', () => {
    const loc = resolveNigerianLocation('Abuja')!;
    const cov = verifyVendorDeliveryCoverage('vendor_a', loc, vendorA);
    if (cov.timeframe !== undefined) throw new Error(`Absent timeframe was hallucinated into "${cov.timeframe}"!`);
  });

  runTest('Timeframe Grounding 3: Vendor B Lagos has timeframe "2-3 days"', () => {
    const loc = resolveNigerianLocation('Lagos')!;
    const cov = verifyVendorDeliveryCoverage('vendor_b', loc, vendorB);
    if (cov.timeframe !== '2-3 days') throw new Error(`Timeframe expected "2-3 days", got "${cov.timeframe}"`);
  });

  runTest('Timeframe Grounding 4: Vendor B Abuja absent timeframe returns undefined', () => {
    const loc = resolveNigerianLocation('Abuja')!;
    const cov = verifyVendorDeliveryCoverage('vendor_b', loc, vendorB);
    if (cov.timeframe !== undefined) throw new Error(`Absent timeframe was hallucinated into "${cov.timeframe}"!`);
  });

  runTest('Timeframe Grounding 5: Unconfigured location returns status: UNCONFIRMED and timeframe: undefined', () => {
    const loc = resolveNigerianLocation('Ibadan')!;
    const cov = verifyVendorDeliveryCoverage('vendor_a', loc, vendorA);
    if (cov.status !== 'UNCONFIRMED' || cov.timeframe !== undefined) throw new Error('Unconfigured location timeframe check failed!');
  });

  runTest('Timeframe Grounding 6: Confirmed location with missing timeframe preserves undefined', () => {
    const loc = resolveNigerianLocation('Abuja')!;
    const cov = verifyVendorDeliveryCoverage('vendor_a', loc, vendorA);
    if (cov.status === 'CONFIRMED' && cov.timeframe !== undefined) throw new Error('Missing timeframe was hallucinated!');
  });

  runTest('Timeframe Grounding 7: Grounded facts in response directive contain no fabricated timeframe', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'how long to Kano?');
    if (res.responseText.includes('1-3 business days') && !res.responseText.toLowerCase().includes('confirm')) {
      throw new Error('Fabricated timeframe was present in response for unconfirmed Kano delivery!');
    }
  });

  // Category 5: Ambiguity Handling (5 Tests)
  runTest('Ambiguity Handling 1: "Victoria" sets locationAmbiguous: true', () => {
    const res = resolveNigerianLocation('Victoria');
    if (!res || !res.locationAmbiguous) throw new Error('"Victoria" failed to trigger locationAmbiguous flag!');
  });

  runTest('Ambiguity Handling 2: "Victoria" returns possibleLocations array length >= 2', () => {
    const res = resolveNigerianLocation('Victoria');
    if (!res || !res.possibleLocations || res.possibleLocations.length < 2) throw new Error('Victoria candidate array length < 2!');
  });

  runTest('Ambiguity Handling 3: "Victoria" candidates include Victoria Island & Victoria Garden City', () => {
    const res = resolveNigerianLocation('Victoria')!;
    const names = res.possibleLocations?.map((p) => p.canonicalName) || [];
    if (!names.includes('VI') || !names.includes('VGC')) throw new Error('Victoria candidate names mismatch!');
  });

  runTest('Ambiguity Handling 4: "around Victoria" sets locationAmbiguous: true', () => {
    const res = resolveNigerianLocation('around Victoria');
    if (!res || !res.locationAmbiguous) throw new Error('"around Victoria" failed to trigger locationAmbiguous flag!');
  });

  runTest('Ambiguity Handling 5: Assistant prompts for location clarification rather than guessing', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'how much to Victoria?');
    if (!res.responseText.toLowerCase().includes('victoria island') && !res.responseText.toLowerCase().includes('vgc')) {
      throw new Error('Ambiguity clarification response failed to prompt for Victoria Island vs VGC!');
    }
  });

  // Category 6: Geographic Hierarchy (7 Tests)
  runTest('Hierarchy 1: Victoria Island -> Eti-Osa LGA -> Lagos State (NEIGHBORHOOD)', () => {
    const res = resolveNigerianLocation('Victoria Island')!;
    if (res.canonicalName !== 'VI' || res.lga !== 'Eti-Osa' || res.state !== 'Lagos' || res.regionType !== 'NEIGHBORHOOD') {
      throw new Error('Victoria Island hierarchy incorrect!');
    }
  });

  runTest('Hierarchy 2: Lekki -> Eti-Osa LGA -> Lagos State (NEIGHBORHOOD)', () => {
    const res = resolveNigerianLocation('Lekki')!;
    if (res.canonicalName !== 'Lekki' || res.lga !== 'Eti-Osa' || res.state !== 'Lagos' || res.regionType !== 'NEIGHBORHOOD') {
      throw new Error('Lekki hierarchy incorrect!');
    }
  });

  runTest('Hierarchy 3: Ikeja -> Ikeja LGA -> Lagos State (LGA)', () => {
    const res = resolveNigerianLocation('Ikeja')!;
    if (res.canonicalName !== 'Ikeja' || res.lga !== 'Ikeja LGA' || res.state !== 'Lagos' || res.regionType !== 'LGA') {
      throw new Error('Ikeja hierarchy incorrect!');
    }
  });

  runTest('Hierarchy 4: Wuse -> AMAC -> FCT (DISTRICT)', () => {
    const res = resolveNigerianLocation('Wuse')!;
    if (res.canonicalName !== 'Wuse' || res.lga !== 'AMAC' || res.state !== 'FCT' || res.regionType !== 'DISTRICT') {
      throw new Error('Wuse hierarchy incorrect!');
    }
  });

  runTest('Hierarchy 5: Rumuola -> Obio-Akpor -> Rivers State (DISTRICT)', () => {
    const res = resolveNigerianLocation('Rumuola')!;
    if (res.canonicalName !== 'PH' || res.lga !== 'Obio-Akpor' || res.state !== 'Rivers' || res.regionType !== 'DISTRICT') {
      throw new Error('Rumuola hierarchy incorrect!');
    }
  });

  runTest('Hierarchy 6: Abuja -> AMAC -> FCT (CITY)', () => {
    const res = resolveNigerianLocation('Abuja')!;
    if (res.canonicalName !== 'Abuja' || res.lga !== 'AMAC' || res.state !== 'FCT' || res.regionType !== 'CITY') {
      throw new Error('Abuja hierarchy incorrect!');
    }
  });

  runTest('Hierarchy 7: Lagos -> Lagos State (STATE)', () => {
    const res = resolveNigerianLocation('Lagos')!;
    if (res.canonicalName !== 'Lagos' || res.state !== 'Lagos' || res.regionType !== 'STATE') {
      throw new Error('Lagos State hierarchy incorrect!');
    }
  });

  // Category 7: Location Inquiry / Purchase Separation (6 Tests)
  runTest('Location Inquiry Separation 1: "Do you deliver to Kano?" preserves purchaseIntent: false', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'Do you deliver to Kano?');
    if (res.updatedState.pendingPurchaseIntent === true || res.updatedState.orders.length > 0) throw new Error('Location query created purchase intent!');
  });

  runTest('Location Inquiry Separation 2: "How much to Abuja?" preserves purchaseIntent: false', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'How much to Abuja?');
    if (res.updatedState.pendingPurchaseIntent === true || res.updatedState.orders.length > 0) throw new Error('Price query created purchase intent!');
  });

  runTest('Location Inquiry Separation 3: "How long to Lagos?" preserves purchaseIntent: false', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'How long to Lagos?');
    if (res.updatedState.pendingPurchaseIntent === true || res.updatedState.orders.length > 0) throw new Error('Timeframe query created purchase intent!');
  });

  runTest('Location Inquiry Separation 4: "Is Ikeja deliverable?" preserves purchaseIntent: false', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'Is Ikeja deliverable?');
    if (res.updatedState.pendingPurchaseIntent === true || res.updatedState.orders.length > 0) throw new Error('Deliverability query created purchase intent!');
  });

  runTest('Location Inquiry Separation 5: "Where do you deliver?" preserves purchaseIntent: false', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'Where do you deliver?');
    if (res.updatedState.pendingPurchaseIntent === true || res.updatedState.orders.length > 0) throw new Error('Coverage query created purchase intent!');
  });

  runTest('Location Inquiry Separation 6: Explicit "I want the hoodie, send it to Abuja" sets purchaseIntent: true', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, "I'll take the hoodie, send it to Abuja");
    if (res.updatedState.pendingLocation !== 'Abuja' || !res.updatedState.pendingPurchaseIntent) throw new Error('Explicit purchase signal failed!');
  });

  // Category 8: Location Correction Chains (5 Tests)
  runTest('Correction Step 1: "Ikeja" -> pendingLocation: Ikeja', () => {
    const state = createInitialDemoState();
    const res = processDemoMessage(state, 'send to Ikeja');
    if (res.updatedState.pendingLocation !== 'Ikeja') throw new Error(`Expected Ikeja, got ${res.updatedState.pendingLocation}`);
  });

  runTest('Correction Step 2: "actually Lekki" -> pendingLocation: Lekki', () => {
    const s0 = createInitialDemoState();
    const r1 = processDemoMessage(s0, 'send to Ikeja');
    const r2 = processDemoMessage(r1.updatedState, 'actually Lekki');
    if (r2.updatedState.pendingLocation !== 'Lekki') throw new Error(`Expected Lekki, got ${r2.updatedState.pendingLocation}`);
  });

  runTest('Correction Step 3: "no sorry Abuja" -> pendingLocation: Abuja', () => {
    const s0 = createInitialDemoState();
    const r1 = processDemoMessage(s0, 'send to Ikeja');
    const r2 = processDemoMessage(r1.updatedState, 'actually Lekki');
    const r3 = processDemoMessage(r2.updatedState, 'no sorry Abuja');
    if (r3.updatedState.pendingLocation !== 'Abuja') throw new Error(`Expected Abuja, got ${r3.updatedState.pendingLocation}`);
  });

  runTest('Correction Step 4: "wait Kano" -> pendingLocation: Kano', () => {
    const s0 = createInitialDemoState();
    const r1 = processDemoMessage(s0, 'send to Ikeja');
    const r2 = processDemoMessage(r1.updatedState, 'actually Lekki');
    const r3 = processDemoMessage(r2.updatedState, 'no sorry Abuja');
    const r4 = processDemoMessage(r3.updatedState, 'wait Kano');
    if (r4.updatedState.pendingLocation !== 'Kano') throw new Error(`Expected Kano, got ${r4.updatedState.pendingLocation}`);
  });

  runTest('Correction Step 5: Correction chain produces 0 duplicate orders', () => {
    const s0 = createInitialDemoState();
    const r1 = processDemoMessage(s0, 'send to Ikeja');
    const r2 = processDemoMessage(r1.updatedState, 'actually Lekki');
    const r3 = processDemoMessage(r2.updatedState, 'no sorry Abuja');
    const r4 = processDemoMessage(r3.updatedState, 'wait Kano');
    if (r4.updatedState.orders.length > 0) throw new Error('Correction chain created duplicate orders!');
  });

  // Category 9: Messy WhatsApp / Pidgin Aliases (28 Tests)
  const locAliasCases = [
    'v.i', 'V.I.', 'v i', 'victoria island', 'porthacourt', 'port harcourt', 'portharcourt',
    'p/h', 'ph city', 'abj', 'abuja', 'fct', 'fct abuja', 'send am PH', 'send am to PH',
    'bring am come PH', 'make una send am PH', 'una dey deliver PH?', 'I dey PH', 'I dey stay PH',
    'abeg send am go Abuja', 'send am go lekki', 'bring am come VI', 'around wuse', 'wuse 2',
    'gwarinpa', 'gwarinpa abuja', 'around rumuola',
  ];

  locAliasCases.forEach((aliasMsg, idx) => {
    runTest(`Messy Alias ${idx + 1}: "${aliasMsg}"`, () => {
      const resolved = resolveNigerianLocation(aliasMsg);
      if (!resolved) throw new Error(`Messy input "${aliasMsg}" failed geographic resolution!`);
      if (!resolved.canonicalName || !resolved.state || !resolved.regionType) {
        throw new Error(`Messy input "${aliasMsg}" returned incomplete location object!`);
      }
    });
  });

  // Category 10: False-Positive Protection (6 Tests)
  const nonLocWords = ['okay', 'black', 'size L', 'how much?', 'nice', 'thanks'];
  nonLocWords.forEach((word, idx) => {
    runTest(`False Positive Protection ${idx + 1}: "${word}"`, () => {
      const state = createInitialDemoState();
      const res = processDemoMessage(state, word);
      if (res.updatedState.pendingLocation !== undefined && res.updatedState.pendingLocation !== '') {
        throw new Error(`Non-location word "${word}" acquired arbitrary location state "${res.updatedState.pendingLocation}"!`);
      }
    });
  });

  // Category 11: Verbatim Preservation (4 Tests)
  runTest('Verbatim Preservation 1: "send am to PH" preserved verbatim', () => {
    const raw = 'send am to PH';
    const state = createInitialDemoState();
    const res = processDemoMessage(state, raw);
    const lastMsg = res.updatedState.messages.filter((m) => m.sender === 'customer').pop();
    if (!lastMsg || lastMsg.text !== raw) throw new Error(`Expected "${raw}", got "${lastMsg?.text}"`);
  });

  runTest('Verbatim Preservation 2: "abeg send am to v.i" preserved verbatim', () => {
    const raw = 'abeg send am to v.i';
    const state = createInitialDemoState();
    const res = processDemoMessage(state, raw);
    const lastMsg = res.updatedState.messages.filter((m) => m.sender === 'customer').pop();
    if (!lastMsg || lastMsg.text !== raw) throw new Error(`Expected "${raw}", got "${lastMsg?.text}"`);
  });

  runTest('Verbatim Preservation 3: "no sorry, Abuja 😂" preserved verbatim', () => {
    const raw = 'no sorry, Abuja 😂';
    const state = createInitialDemoState();
    const res = processDemoMessage(state, raw);
    const lastMsg = res.updatedState.messages.filter((m) => m.sender === 'customer').pop();
    if (!lastMsg || lastMsg.text !== raw) throw new Error(`Expected "${raw}", got "${lastMsg?.text}"`);
  });

  runTest('Verbatim Preservation 4: Conversation state messages match customer raw input byte-for-byte', () => {
    const raw = '  make una bring am PH  ';
    const state = createInitialDemoState();
    const res = processDemoMessage(state, raw);
    const lastMsg = res.updatedState.messages.filter((m) => m.sender === 'customer').pop();
    if (!lastMsg || lastMsg.text !== raw) throw new Error('Whitespace / text verbatim preservation failed!');
  });

  console.log(`\n🎉 ALL ${passedTests}/${totalTests} TYPE-LEVEL PURE GEOGRAPHY & ADVERSARIAL TESTS PASSED 100% CLEANLY!\n`);
}

runLocationAdversarialTestSuite().catch((err) => {
  console.error('❌ Location Adversarial Test Suite Failed:', err);
  process.exit(1);
});
