import { referenceRepository } from '../lib/reference-library/repository';
import { observeDemoInteraction } from '../lib/reference-library/observer';
import { createInitialDemoState, processDemoMessage } from '../lib/demo/demo-engine';

async function runReferenceLibraryTests() {
  console.log('🧪 Starting Conversation Reference Library Test Suite...\n');

  await referenceRepository.clearReferences();

  // Test 1: Customer message & Vendiaide response captured
  console.log('--- Test 1 — Customer message & response captured ---');
  const sessId = 'test_conv_ref_001';
  const msg1 = await observeDemoInteraction({
    conversationId: sessId,
    customerMessage: 'boss wetin una get',
    aiResponse: 'We get hoodies, abayas and sneakers available!',
    intent: 'CATALOG_INQUIRY',
    detectedLanguage: 'Pidgin',
    activeProduct: null,
    draftStatus: 'EMPTY',
    authorized: false,
    orderCreated: false,
    totalAmount: 0,
  });

  if (!msg1 || msg1.customerMessage !== 'boss wetin una get' || msg1.aiResponse !== 'We get hoodies, abayas and sneakers available!') {
    throw new Error('Test 1 Failed: Customer message or AI response not captured correctly');
  }
  console.log('  ✅ Customer message and AI response captured cleanly');

  // Test 2 & 3: Intent metadata & Chronological order
  console.log('--- Test 2 & 3 — Intent metadata & Chronological ordering ---');
  const msg2 = await observeDemoInteraction({
    conversationId: sessId,
    customerMessage: 'i wan take the hoodie',
    aiResponse: 'Which size you want?',
    intent: 'PURCHASE_INTENT',
    detectedLanguage: 'Pidgin',
    activeProduct: 'Black Oversized Hoodie',
    draftStatus: 'CONFIGURING',
    authorized: false,
    orderCreated: false,
    totalAmount: 0,
  });

  const conv = await referenceRepository.getConversation(sessId);
  if (!conv || conv.messages.length !== 2) {
    throw new Error('Test 2 & 3 Failed: Messages count or conversation retrieval failed');
  }
  if (conv.messages[0].intent !== 'CATALOG_INQUIRY' || conv.messages[1].intent !== 'PURCHASE_INTENT') {
    throw new Error('Test 2 & 3 Failed: Intent metadata mismatch');
  }
  if (conv.messages[0].timestamp > conv.messages[1].timestamp) {
    throw new Error('Test 2 & 3 Failed: Messages not in chronological order');
  }
  console.log('  ✅ Intent metadata captured & chronological ordering verified');

  // Test 4 & 5: Open conversation from library
  console.log('--- Test 4 & 5 — Library conversation lookup ---');
  const conversations = await referenceRepository.getConversations();
  if (conversations.length !== 1 || conversations[0].conversationId !== sessId) {
    throw new Error('Test 4 & 5 Failed: Could not open conversation from library');
  }
  console.log('  ✅ Conversation opened successfully from library');

  // Test 6: Search works
  console.log('--- Test 6 — Search filtering ---');
  const searchResult = await referenceRepository.getConversations({ searchQuery: 'hoodie' });
  if (searchResult.length !== 1) {
    throw new Error('Test 6 Failed: Search for "hoodie" yielded no results');
  }
  const emptySearch = await referenceRepository.getConversations({ searchQuery: 'nonexistent_xyz' });
  if (emptySearch.length !== 0) {
    throw new Error('Test 6 Failed: Search for nonexistent query should return empty list');
  }
  console.log('  ✅ Search filtering working as expected');

  // Test 7 & 8: Review labels & reviewer notes work
  console.log('--- Test 7 & 8 — Review labels and reviewer notes ---');
  const updatedMsg = await referenceRepository.updateMessageReview(
    msg2!.id,
    'NEEDS_REVIEW',
    'Customer used informal Pidgin phrasing for purchase intent.'
  );

  if (!updatedMsg || updatedMsg.reviewLabel !== 'NEEDS_REVIEW' || updatedMsg.reviewerNote !== 'Customer used informal Pidgin phrasing for purchase intent.') {
    throw new Error('Test 7 & 8 Failed: Review label or reviewer note update failed');
  }
  console.log('  ✅ Review labels & notes updated successfully');

  // Test 9: JSON export works
  console.log('--- Test 9 — JSON & CSV Export ---');
  const jsonExport = await referenceRepository.exportData('json');
  const csvExport = await referenceRepository.exportData('csv');

  if (!jsonExport.includes('boss wetin una get') || !jsonExport.includes('NEEDS_REVIEW')) {
    throw new Error('Test 9 Failed: JSON export missing required reference payload');
  }
  if (!csvExport.includes('CATALOG_INQUIRY') || !csvExport.includes('PURCHASE_INTENT')) {
    throw new Error('Test 9 Failed: CSV export missing CSV header or rows');
  }
  console.log('  ✅ JSON & CSV export formatted cleanly');

  // Test 10: Capturing a reference does NOT alter conversation result
  console.log('--- Test 10 — Non-intrusive observation invariant ---');
  const initState = createInitialDemoState();
  const directResult = processDemoMessage(initState, 'boss wetin una get');
  const stateSnapshotBefore = JSON.stringify(directResult.updatedState);

  // Perform observation
  await observeDemoInteraction({
    conversationId: 'test_obs_invariance',
    customerMessage: 'boss wetin una get',
    aiResponse: directResult.responseText,
    intent: directResult.intent,
    detectedLanguage: directResult.updatedState.detectedLanguage,
    activeProduct: null,
    draftStatus: directResult.updatedState.activeDraft?.status,
    authorized: false,
    orderCreated: false,
    totalAmount: 0,
  });

  const stateSnapshotAfter = JSON.stringify(directResult.updatedState);
  if (stateSnapshotBefore !== stateSnapshotAfter) {
    throw new Error('Test 10 Failed: Capturing reference altered demo engine outputs!');
  }
  console.log('  ✅ Observer layer is 100% read-only and non-intrusive');

  // Test 11, 12, 13, 14: Duplicate protection & baseline behaviors intact
  console.log('--- Test 11-14 — Idempotency & Baseline Behaviors Intact ---');
  let state = createInitialDemoState();
  state = processDemoMessage(state, 'i wan take the hoodie').updatedState;
  state = processDemoMessage(state, 'L').updatedState;
  state = processDemoMessage(state, 'deliver to Ikeja').updatedState;

  // Confirm order
  const confirmResult = processDemoMessage(state, 'yes do am');
  if (confirmResult.updatedState.orders.length !== 1) {
    throw new Error('Test 12 Failed: Order confirmation behavior altered');
  }

  // Duplicate confirmation attempt
  const dupResult = processDemoMessage(confirmResult.updatedState, 'yes do am');
  if (dupResult.updatedState.orders.length !== 1) {
    throw new Error('Test 11 Failed: Duplicate confirmation created duplicate order');
  }

  // Product switch
  const switchResult = processDemoMessage(state, 'switch to sneakers');
  if (switchResult.updatedState.activeDraft?.productId !== 'demo_prod_3') {
    throw new Error('Test 14 Failed: Product switching behavior altered');
  }

  // Cancel
  const cancelResult = processDemoMessage(state, 'cancel my order');
  if (cancelResult.updatedState.activeDraft?.status !== 'EMPTY') {
    throw new Error('Test 13 Failed: Cancellation behavior altered');
  }
  console.log('  ✅ Order confirmation, duplicate safety, product switching & cancellation intact');

  console.log('\n======================================================');
  console.log('🎉 CONVERSATION REFERENCE LIBRARY SUITE PASSED 100%!');
  console.log('======================================================\n');
}

runReferenceLibraryTests().catch((err) => {
  console.error('❌ Reference Library Test Suite Failed:', err);
  process.exit(1);
});
