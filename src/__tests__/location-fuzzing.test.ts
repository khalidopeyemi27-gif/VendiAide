import { processDemoMessage, createInitialDemoState } from '../engine';
import { resolveNigerianLocation } from '../lib/engine/nigeria-geography';
import { verifyVendorDeliveryCoverage } from '../lib/engine/vendor-delivery';

export async function runLocationFuzzingTestSuite() {
  console.log('🧪 Starting VendiAide Messy Nigerian Location Fuzzing Test Suite...\n');

  // 1. Port Harcourt Noisy Alias & Pidgin Fuzzing
  const phFuzzCases = [
    { text: 'send am PH', expectedCanonical: 'PH', expectedType: 'CITY' },
    { text: 'send am to ph', expectedCanonical: 'PH', expectedType: 'CITY' },
    { text: 'abeg send to ph', expectedCanonical: 'PH', expectedType: 'CITY' },
    { text: 'make una bring am PH', expectedCanonical: 'PH', expectedType: 'CITY' },
    { text: 'I dey PH', expectedCanonical: 'PH', expectedType: 'CITY' },
    { text: 'I dey Port Harcourt', expectedCanonical: 'PH', expectedType: 'CITY' },
    { text: 'porthacourt', expectedCanonical: 'PH', expectedType: 'CITY' },
    { text: 'portharcourt', expectedCanonical: 'PH', expectedType: 'CITY' },
    { text: 'PH city', expectedCanonical: 'PH', expectedType: 'CITY' },
    { text: 'around rumuola', expectedCanonical: 'PH', expectedType: 'DISTRICT' },
  ];

  for (const phCase of phFuzzCases) {
    const resolved = resolveNigerianLocation(phCase.text);
    if (!resolved) {
      throw new Error(`PH location fuzzing failed for "${phCase.text}": returned undefined`);
    }
    if (resolved.canonicalName !== phCase.expectedCanonical) {
      throw new Error(`PH location fuzzing failed for "${phCase.text}": expected canonical "${phCase.expectedCanonical}", got "${resolved.canonicalName}"`);
    }
    if (resolved.regionType !== phCase.expectedType) {
      throw new Error(`PH regionType test failed for "${phCase.text}": expected "${phCase.expectedType}", got "${resolved.regionType}"`);
    }
    const coverage = verifyVendorDeliveryCoverage('kulture_fashion_house', resolved);
    if (coverage.status !== 'CONFIRMED') {
      throw new Error(`PH vendorCoverage test failed for "${phCase.text}": expected CONFIRMED status`);
    }
  }
  console.log('✅ Port Harcourt Fuzzing Passed: All 10 noisy PH Pidgin queries resolved cleanly to Port Harcourt.');

  // 2. Lagos Neighborhood & Alias Fuzzing
  const lagosFuzzCases = [
    { text: 'send to lekki', expectedCanonical: 'Lekki', expectedType: 'NEIGHBORHOOD' },
    { text: 'lekki phase 1', expectedCanonical: 'Lekki', expectedType: 'NEIGHBORHOOD' },
    { text: 'around VI', expectedCanonical: 'VI', expectedType: 'NEIGHBORHOOD' },
    { text: 'V.I', expectedCanonical: 'VI', expectedType: 'NEIGHBORHOOD' },
    { text: 'victoria island', expectedCanonical: 'VI', expectedType: 'NEIGHBORHOOD' },
  ];

  for (const lCase of lagosFuzzCases) {
    const resolved = resolveNigerianLocation(lCase.text);
    if (!resolved) {
      throw new Error(`Lagos location fuzzing failed for "${lCase.text}": returned undefined`);
    }
    if (resolved.canonicalName !== lCase.expectedCanonical) {
      throw new Error(`Lagos location fuzzing failed for "${lCase.text}": expected canonical "${lCase.expectedCanonical}", got "${resolved.canonicalName}"`);
    }
    if (resolved.regionType !== lCase.expectedType) {
      throw new Error(`Lagos regionType test failed for "${lCase.text}": expected "${lCase.expectedType}", got "${resolved.regionType}"`);
    }
    const coverage = verifyVendorDeliveryCoverage('kulture_fashion_house', resolved);
    if (coverage.status !== 'CONFIRMED' || coverage.feeNaira !== 2500) {
      throw new Error(`Lagos vendorCoverage fee test failed for "${lCase.text}": expected ₦2,500 CONFIRMED`);
    }
  }
  console.log('✅ Lagos Neighborhood Fuzzing Passed: Lekki, VI, V.I resolved with ₦2,500 confirmed coverage.');

  // 3. Abuja / FCT Noisy Input Fuzzing
  const abujaFuzzCases = [
    { text: 'abj', expectedCanonical: 'Abuja', expectedType: 'CITY' },
    { text: 'ABJ', expectedCanonical: 'Abuja', expectedType: 'CITY' },
    { text: 'FCT', expectedCanonical: 'Abuja', expectedType: 'CITY' },
    { text: 'around wuse', expectedCanonical: 'Wuse', expectedType: 'DISTRICT' },
    { text: 'wuse 2', expectedCanonical: 'Wuse', expectedType: 'DISTRICT' },
    { text: 'gwarinpa', expectedCanonical: 'Gwarinpa', expectedType: 'NEIGHBORHOOD' },
    { text: 'gwarinpa abuja', expectedCanonical: 'Gwarinpa', expectedType: 'NEIGHBORHOOD' },
  ];

  for (const abjCase of abujaFuzzCases) {
    const resolved = resolveNigerianLocation(abjCase.text);
    if (!resolved) {
      throw new Error(`Abuja location fuzzing failed for "${abjCase.text}": returned undefined`);
    }
    if (resolved.canonicalName !== abjCase.expectedCanonical) {
      throw new Error(`Abuja location fuzzing failed for "${abjCase.text}": expected canonical "${abjCase.expectedCanonical}", got "${resolved.canonicalName}"`);
    }
    if (resolved.regionType !== abjCase.expectedType) {
      throw new Error(`Abuja regionType test failed for "${abjCase.text}": expected "${abjCase.expectedType}", got "${resolved.regionType}"`);
    }
    const coverage = verifyVendorDeliveryCoverage('kulture_fashion_house', resolved);
    if (coverage.status !== 'CONFIRMED' || coverage.feeNaira !== 5000) {
      throw new Error(`Abuja vendorCoverage fee test failed for "${abjCase.text}": expected ₦5,000 CONFIRMED`);
    }
  }
  console.log('✅ Abuja / FCT Fuzzing Passed: ABJ, FCT, Wuse 2, Gwarinpa resolved with ₦5,000 confirmed coverage.');

  // 4. Location Correction Chaining
  const state0 = createInitialDemoState();
  const step1 = processDemoMessage(state0, 'send to Ikeja');
  if (step1.updatedState.pendingLocation !== 'Ikeja') {
    throw new Error(`Correction step 1 failed: expected Ikeja, got "${step1.updatedState.pendingLocation}"`);
  }

  const step2 = processDemoMessage(step1.updatedState, 'actually Lekki');
  if (step2.updatedState.pendingLocation !== 'Lekki') {
    throw new Error(`Correction step 2 failed: expected Lekki, got "${step2.updatedState.pendingLocation}"`);
  }

  const step3 = processDemoMessage(step2.updatedState, 'no sorry, Abuja');
  if (step3.updatedState.pendingLocation !== 'Abuja') {
    throw new Error(`Correction step 3 failed: expected Abuja, got "${step3.updatedState.pendingLocation}"`);
  }

  const step4 = processDemoMessage(step3.updatedState, 'wait, Kano');
  if (step4.updatedState.pendingLocation !== 'Kano') {
    throw new Error(`Correction step 4 failed: expected Kano, got "${step4.updatedState.pendingLocation}"`);
  }
  if (!step4.responseText.includes('recognize Kano') || !step4.responseText.includes('don\'t want to guess')) {
    throw new Error(`Correction step 4 failed: expected unconfirmed vendor disclaimer for Kano, got: "${step4.responseText}"`);
  }

  // Verbatim text preservation checks across correction chain
  const messages = step4.updatedState.messages.filter((m) => m.sender === 'customer');
  if (messages[0].text !== 'send to Ikeja' || messages[1].text !== 'actually Lekki' || messages[2].text !== 'no sorry, Abuja' || messages[3].text !== 'wait, Kano') {
    throw new Error(`Location correction text immutability check failed!`);
  }

  console.log('✅ Multi-Turn Location Correction Chaining Passed: Ikeja -> Lekki -> Abuja -> Kano cleanly resolved with 100% text immutability.');

  console.log('\n🎉 ALL MESSY NIGERIAN LOCATION FUZZING TESTS PASSED CLEANLY WITH 100% FIDELITY!\n');
}

runLocationFuzzingTestSuite().catch((err) => {
  console.error('❌ Location Fuzzing Test Suite Failed:', err);
  process.exit(1);
});
