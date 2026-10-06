import {
  detectPidginLanguage,
  createInitialDemoState,
  processDemoMessage,
  DemoSessionState,
} from '../lib/demo/demo-engine';

console.log('🧪 Starting Nigerian Pidgin Response Consistency Master Suite...\n');

const PIDGIN_MARKERS = [
  'wetin',
  'una',
  'dey',
  'wan',
  'abeg',
  'nko',
  'make we',
  'no wahala',
  'don',
  'fit',
  'na ',
  'go be',
  'i dey',
  'i wan',
  'do am',
  'reserve am',
  'boss',
];

const ENGLISH_MARKERS = [
  'the',
  'your',
  'order',
  'available',
  'would you like',
  'please',
  'is',
  'are',
  'has been',
  'welcome',
];

function textOf(result: Record<string, unknown>): string {
  return String(result.responseText || result.response || result.message || result.text || '').toLowerCase();
}

function looksLikePidgin(text: string): boolean {
  const normalized = text.toLowerCase();
  return PIDGIN_MARKERS.some((marker) => normalized.includes(marker));
}

function looksLikeEnglish(text: string): boolean {
  const normalized = text.toLowerCase();
  return ENGLISH_MARKERS.some((marker) => normalized.includes(marker));
}

function emptyState(): DemoSessionState {
  return createInitialDemoState();
}

function readyForCheckoutState(languageMode: 'auto' | 'english' | 'pidgin' = 'auto'): DemoSessionState {
  const state = createInitialDemoState();
  return {
    ...state,
    languageMode,
    languagePreference: languageMode,
    pendingProductId: 'demo_prod_1',
    pendingSize: 'L',
    pendingLocation: 'Ikeja',
    activeDraft: {
      productId: 'demo_prod_1',
      size: 'L',
      color: 'Black',
      location: 'Ikeja',
      quantity: 1,
      status: 'READY_FOR_CHECKOUT',
      authorized: false,
    },
  };
}

function expectPidginResponse(result: Record<string, unknown>, testName: string) {
  const text = textOf(result);
  if (!looksLikePidgin(text)) {
    console.error(`❌ ${testName} Failed: Expected Pidgin response but received: "${text}"`);
    process.exit(1);
  }
}

function expectEnglishResponse(result: Record<string, unknown>, testName: string) {
  const text = textOf(result);
  if (!looksLikeEnglish(text)) {
    console.error(`❌ ${testName} Failed: Expected English response but received: "${text}"`);
    process.exit(1);
  }
}

// ----------------------------------------------------
// SECTION 1: Phrase-Level Nigerian Pidgin Detection
// ----------------------------------------------------
const pidginPhrases = [
  'boss wetin una get',
  'I dey look for a hoodie',
  'abeg how much be delivery',
  'nko what sizes you get',
  'how far show me the products',
  'make we do am',
  'no wahala',
  'wetin I order',
  'I wan buy the sneakers',
  'you get sneakers?',
  'yes do am',
  'abeg reserve am for me',
];

for (const phrase of pidginPhrases) {
  const res = detectPidginLanguage(phrase);
  if (res.language !== 'pidgin' || res.confidence < 0.375) {
    console.error(`❌ Pidgin phrase detection failed for "${phrase}". Result:`, res);
    process.exit(1);
  }
}
console.log('  ✅ 1.1 — Detects strong Pidgin phrases (12/12) passed');

const englishPhrases = [
  'I want to buy the hoodie',
  'Do you have sneakers?',
  'How much is the hoodie?',
  'What sizes are available?',
  'Please show me the products',
  'I would like to order for Ikeja',
  'Please get the hoodie',
  'Can you place the order?',
];

for (const phrase of englishPhrases) {
  const res = detectPidginLanguage(phrase);
  if (res.language !== 'english') {
    console.error(`❌ English phrase misclassified for "${phrase}". Result:`, res);
    process.exit(1);
  }
}
console.log('  ✅ 1.2 — Ordinary English phrases remain English (8/8) passed');

const mixedPhrases = [
  'Please show me wetin una get',
  'I want take the hoodie, abeg',
  'Can you tell me wetin una get?',
  'No wahala, I will take the hoodie',
  'Please reserve am for me',
];

for (const phrase of mixedPhrases) {
  const res = detectPidginLanguage(phrase);
  if (res.language !== 'pidgin') {
    console.error(`❌ Mixed phrase missed Pidgin signal for "${phrase}". Result:`, res);
    process.exit(1);
  }
}
console.log('  ✅ 1.3 — Detects mixed language with strong Pidgin signals (5/5) passed');

const weakOrAmbiguous = [
  'yes',
  'do',
  'am',
  'get the hoodie',
  'go to the store',
  'place the order',
  'confirm the order',
];

for (const phrase of weakOrAmbiguous) {
  const res = detectPidginLanguage(phrase);
  if (res.language !== 'english') {
    console.error(`❌ Weak/ambiguous token misclassified as Pidgin for "${phrase}". Result:`, res);
    process.exit(1);
  }
}
console.log('  ✅ 1.4 — Weak/ambiguous tokens do not classify as Pidgin (7/7) passed');

// Test specific signal matching for "yes do am" and "make we do am"
const yesDoAmRes = detectPidginLanguage('yes do am');
if (yesDoAmRes.language !== 'pidgin' || yesDoAmRes.confidence < 0.4 || !yesDoAmRes.matchedSignals.includes('yes do am')) {
  console.error('❌ "yes do am" signal matching failed:', yesDoAmRes);
  process.exit(1);
}
console.log('  ✅ 1.5 — "yes do am" matched with strong signal score passed');

const punctuationVariations = [
  'YES DO AM',
  'yes, do am',
  'yes   do   am',
  'make we do am!',
  'abeg, reserve am',
];

for (const phrase of punctuationVariations) {
  const res = detectPidginLanguage(phrase);
  if (res.language !== 'pidgin') {
    console.error(`❌ Punctuation variation failed for "${phrase}". Result:`, res);
    process.exit(1);
  }
}
console.log('  ✅ 1.6 — Normalization handles punctuation and spacing variations passed');

// ----------------------------------------------------
// SECTION 2: Pidgin Response-Language Consistency
// ----------------------------------------------------
const r1 = processDemoMessage(emptyState(), 'boss wetin una get');
expectPidginResponse(r1, '2.1 Catalog inquiry');
if (r1.updatedState.detectedLanguage !== 'pidgin') {
  console.error('❌ 2.1 Failed to persist detectedLanguage as pidgin');
  process.exit(1);
}
console.log('  ✅ 2.1 — Responds in Pidgin and persists language state passed');

const r2 = processDemoMessage(emptyState(), 'i wan take the hoodie');
expectPidginResponse(r2, '2.2 Purchase intent');
if (r2.updatedState.activeDraft.authorized || r2.updatedState.orders.length > 0) {
  console.error('❌ 2.2 Purchase intent created an order prematurely!');
  process.exit(1);
}
console.log('  ✅ 2.2 — Responds in Pidgin to purchase intent without authorizing passed');

const r3 = processDemoMessage(emptyState(), 'abeg how much be delivery');
expectPidginResponse(r3, '2.3 Delivery question');
console.log('  ✅ 2.3 — Responds in Pidgin to delivery query passed');

const r4 = processDemoMessage(emptyState(), 'what products do you have?');
expectEnglishResponse(r4, '2.4 English inquiry');
console.log('  ✅ 2.4 — Responds in English to standard English query passed');

const turnA = processDemoMessage(emptyState(), 'boss wetin una get');
const turnB = processDemoMessage(turnA.updatedState, 'how much be the hoodie');
expectPidginResponse(turnB, '2.5 Turn B Pidgin');
console.log('  ✅ 2.5 — Maintains Pidgin response style across multi-turn queries passed');

const turnC = processDemoMessage(turnA.updatedState, 'yes');
expectPidginResponse(turnC, '2.6 Turn C Short Yes');
console.log('  ✅ 2.6 — Maintains Pidgin style after short English affirmative "yes" passed');

// ----------------------------------------------------
// SECTION 3: Manual Language Mode Overrides
// ----------------------------------------------------
const engManual = { ...emptyState(), languageMode: 'english' as const, languagePreference: 'english' as const };
const rEngMan = processDemoMessage(engManual, 'boss wetin una get');
expectEnglishResponse(rEngMan, '3.1 Manual English Override');
console.log('  ✅ 3.1 — Manual English mode overrides Pidgin input passed');

const pidManual = { ...emptyState(), languageMode: 'pidgin' as const, languagePreference: 'pidgin' as const };
const rPidMan = processDemoMessage(pidManual, 'What products do you have?');
expectPidginResponse(rPidMan, '3.2 Manual Pidgin Override');
console.log('  ✅ 3.2 — Manual Pidgin mode forces Pidgin response passed');

const autoCheck = readyForCheckoutState('auto');
const rAutoConf = processDemoMessage(autoCheck, 'yes do am');
expectPidginResponse(rAutoConf, '3.3 Auto Pidgin Confirmation');
if (rAutoConf.updatedState.detectedLanguage !== 'pidgin') {
  console.error('❌ 3.3 Auto mode failed to persist detectedLanguage as pidgin');
  process.exit(1);
}
console.log('  ✅ 3.3 — Auto mode detects & persists Pidgin confirmation language passed');

// ----------------------------------------------------
// SECTION 4: Strict Separation between Language and Authorization
// ----------------------------------------------------
const rReserve = processDemoMessage(readyForCheckoutState(), 'abeg reserve am for me');
expectPidginResponse(rReserve, '4.1 Abeg Reserve Am');
if (rReserve.updatedState.orders.length !== 0 || rReserve.updatedState.activeDraft.authorized) {
  console.error('❌ 4.1 "abeg reserve am for me" authorized an order!');
  process.exit(1);
}
console.log('  ✅ 4.1 — "abeg reserve am for me" does not create an order passed');

const rYesDoAm = processDemoMessage(readyForCheckoutState(), 'yes do am');
expectPidginResponse(rYesDoAm, '4.2 Yes Do Am');
if (rYesDoAm.updatedState.orders.length !== 1) {
  console.error('❌ 4.2 "yes do am" failed to create an order on READY_FOR_CHECKOUT draft!');
  process.exit(1);
}
console.log('  ✅ 4.2 — "yes do am" creates exactly 1 order on complete draft passed');

const incompleteState = emptyState();
incompleteState.activeDraft = {
  productId: 'demo_prod_1',
  size: null,
  color: null,
  location: null,
  quantity: 1,
  status: 'CONFIGURING',
  authorized: false,
};
const rIncomplete = processDemoMessage(incompleteState, 'yes do am');
if (rIncomplete.updatedState.orders.length !== 0 || rIncomplete.updatedState.activeDraft.authorized) {
  console.error('❌ 4.3 "yes do am" authorized an incomplete draft!');
  process.exit(1);
}
console.log('  ✅ 4.3 — "yes do am" does not authorize an incomplete draft passed');

// ----------------------------------------------------
// SECTION 5: Cross-Language Duplicate Prevention
// ----------------------------------------------------
const step1 = processDemoMessage(readyForCheckoutState(), 'confirm order');
const step2 = processDemoMessage(step1.updatedState, 'yes do am');
const step3 = processDemoMessage(step2.updatedState, 'make we do am');

if (step1.updatedState.orders.length !== 1 || step2.updatedState.orders.length !== 1 || step3.updatedState.orders.length !== 1) {
  console.error('❌ 5.1 Cross-language confirmation created duplicate orders!', {
    step1: step1.updatedState.orders.length,
    step2: step2.updatedState.orders.length,
    step3: step3.updatedState.orders.length,
  });
  process.exit(1);
}
console.log('  ✅ 5.1 — Cross-language repeated confirmations are 100% idempotent passed');

const firstOrder = step1.updatedState.orders[0];
if (firstOrder.authorizationMessage !== 'confirm order') {
  console.error('❌ 5.2 First order audit record corrupted');
  process.exit(1);
}
console.log('  ✅ 5.2 — Audit record preserves original confirmation message passed');

const cancelledState = processDemoMessage(readyForCheckoutState(), 'cancel').updatedState;
const postCancel1 = processDemoMessage(cancelledState, 'yes do am');
const postCancel2 = processDemoMessage(postCancel1.updatedState, 'confirm order');

if (postCancel2.updatedState.orders.length !== 0 || postCancel2.updatedState.activeDraft.authorized) {
  console.error('❌ 5.3 Confirmation created order after cancellation!');
  process.exit(1);
}
console.log('  ✅ 5.3 — No confirmation creates an order after draft cancellation passed');

// ----------------------------------------------------
// SECTION 6: Intent vs Language Separation
// ----------------------------------------------------
const infoReq = processDemoMessage(readyForCheckoutState(), 'you get sneakers?');
if (infoReq.updatedState.activeDraft.productId !== 'demo_prod_1' || infoReq.updatedState.orders.length !== 0) {
  console.error('❌ 6.1 Informational Pidgin question modified active draft or created order!');
  process.exit(1);
}
console.log('  ✅ 6.1 — Informational Pidgin questions remain read-only passed');

console.log('\n======================================================');
console.log('🎉 NIGERIAN PIDGIN RESPONSE CONSISTENCY SUITE PASSED 100%!');
console.log('======================================================\n');
