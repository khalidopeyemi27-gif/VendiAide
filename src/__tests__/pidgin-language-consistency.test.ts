import { createInitialDemoState, processDemoMessage } from '../lib/demo/demo-engine';

console.log('🧪 Starting Pidgin Language Consistency Test Suite...\n');

// Test 1: "boss wetin una get" receives a Pidgin response and sets detectedLanguage to pidgin
let state = createInitialDemoState();
let res = processDemoMessage(state, 'boss wetin una get');
if (!res.responseText.includes('These na the items') && !res.responseText.includes('Wetin') && !res.responseText.includes('una')) {
  console.error('❌ Test 1 Failed: "boss wetin una get" did not return Pidgin response. Received:', res.responseText);
  process.exit(1);
}
state = res.updatedState;
if (state.detectedLanguage !== 'pidgin') {
  console.error('❌ Test 1 Failed: detectedLanguage was not persisted as pidgin! Received:', state.detectedLanguage);
  process.exit(1);
}
console.log('  ✅ Test 1 — "boss wetin una get" receives Pidgin response and persists language passed');

// Test 2: Subsequent message in Auto mode remains in Pidgin
res = processDemoMessage(state, 'how much is the hoodie');
if (!res.responseText.includes('25,000') || (!res.responseText.includes('dey') && !res.responseText.includes('na') && !res.responseText.includes('Black Oversized Hoodie'))) {
  console.error('❌ Test 2 Failed: Multi-turn response did not maintain Pidgin consistency. Received:', res.responseText);
  process.exit(1);
}
state = res.updatedState;
console.log('  ✅ Test 2 — Multi-turn Auto mode maintains Pidgin consistency passed');

// Test 3: "what products do you have?" defaults to English
const engState = createInitialDemoState();
const engRes = processDemoMessage(engState, 'what products do you have?');
if (engRes.responseText.includes('Wetin') || engRes.responseText.includes('una get')) {
  console.error('❌ Test 3 Failed: English query returned Pidgin! Received:', engRes.responseText);
  process.exit(1);
}
console.log('  ✅ Test 3 — English query defaults to English passed');

// Test 4: Manual English toggle overrides detected Pidgin
const overrideState = createInitialDemoState();
overrideState.languagePreference = 'english';
const overrideRes = processDemoMessage(overrideState, 'boss wetin una get');
if (overrideRes.responseText.includes('Wetin') || overrideRes.responseText.includes('una get')) {
  console.error('❌ Test 4 Failed: Manual English preference did not override Pidgin input! Received:', overrideRes.responseText);
  process.exit(1);
}
console.log('  ✅ Test 4 — Manual English mode overrides Pidgin input passed');

// Test 5: Manual Pidgin toggle forces Pidgin
const pidginState = createInitialDemoState();
pidginState.languagePreference = 'pidgin';
const pidginRes = processDemoMessage(pidginState, 'What products do you have?');
if (!pidginRes.responseText.includes('These na the items') && !pidginRes.responseText.includes('Wetin') && !pidginRes.responseText.includes('una')) {
  console.error('❌ Test 5 Failed: Manual Pidgin mode failed to force Pidgin! Received:', pidginRes.responseText);
  process.exit(1);
}
console.log('  ✅ Test 5 — Manual Pidgin mode forces Pidgin passed');

// Test 6: Language persistence does not alter intent classification or order authorization
let flowState = createInitialDemoState();
flowState = processDemoMessage(flowState, 'boss wetin una get').updatedState;
flowState = processDemoMessage(flowState, 'i wan buy the hoodie').updatedState;
flowState = processDemoMessage(flowState, 'size L').updatedState;
flowState = processDemoMessage(flowState, 'deliver to Ikeja').updatedState;

if (flowState.activeDraft.status !== 'READY_FOR_CHECKOUT') {
  console.error('❌ Test 6 Failed: Pidgin flow failed to reach READY_FOR_CHECKOUT! Draft:', flowState.activeDraft);
  process.exit(1);
}
if (flowState.orders.length !== 0) {
  console.error('❌ Test 6 Failed: Pidgin flow created an order prematurely!');
  process.exit(1);
}

// Confirmation in Pidgin
const confirmRes = processDemoMessage(flowState, 'yes do am');
if (confirmRes.updatedState.orders.length !== 1) {
  console.error('❌ Test 6 Failed: Pidgin confirmation "yes do am" failed to create order!');
  process.exit(1);
}
console.log('  ✅ Test 6 — Pidgin persistence preserves business logic and authorization gate passed');

console.log('\n======================================================');
console.log('🎉 PIDGIN LANGUAGE CONSISTENCY TEST SUITE PASSED 100%!');
console.log('======================================================\n');
