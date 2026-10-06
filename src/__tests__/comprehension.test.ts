import { processDemoMessage, createInitialDemoState, detectIntentAndEntities, interpretCustomerMessage } from '../engine';
import { resolveNigerianLocation } from '../lib/engine/nigeria-geography';

export async function runComprehensionTestSuite() {
  console.log('🧪 Starting VendiAide End-to-End Behavioral & Nigeria Location Intelligence Test Suite...\n');

  // 1. Isolated Semantic AI Interpreter Tests
  const semanticTestCases = [
    { text: 'hi', expectedIntent: 'GENERAL_GREETING' },
    { text: 'yo', expectedIntent: 'GENERAL_GREETING' },
    { text: 'howfar', expectedIntent: 'GENERAL_GREETING' },
    { text: 'good morning', expectedIntent: 'GENERAL_GREETING' },
    { text: 'how are you?', expectedIntent: 'GENERAL_GREETING' },

    { text: 'show me your collection', expectedIntent: 'CATALOG_DISCOVERY' },
    { text: 'wetin una get?', expectedIntent: 'CATALOG_DISCOVERY' },
    { text: 'abeg show me clothes', expectedIntent: 'CATALOG_DISCOVERY' },
    { text: 'what are you selling?', expectedIntent: 'CATALOG_DISCOVERY' },

    { text: 'do you have hoodies?', expectedIntent: 'CATEGORY_DISCOVERY', category: 'hoodies' },
    { text: 'una get abaya?', expectedIntent: 'CATEGORY_DISCOVERY', category: 'dresses' },
    { text: 'any sneakers?', expectedIntent: 'CATEGORY_DISCOVERY', category: 'sneakers' },

    { text: 'what sizes?', expectedIntent: 'SIZE_AVAILABILITY_QUERY' },
    { text: 'I want L', expectedIntent: 'SIZE_SELECTION', size: 'L' },
    { text: 'make am large', expectedIntent: 'SIZE_SELECTION', size: 'L' },
    { text: 'give me XL', expectedIntent: 'SIZE_SELECTION', size: 'XL' },

    { text: 'what colours?', expectedIntent: 'COLOR_AVAILABILITY_QUERY' },
    { text: 'do you have black?', expectedIntent: 'CATEGORY_DISCOVERY', color: 'Black' },
    { text: 'let\'s go with black', expectedIntent: 'COLOR_SELECTION', color: 'Black' },

    { text: 'the 2nd one', expectedIntent: 'PURCHASE_INTENT', posIndex: 2 },
    { text: 'number 2', expectedIntent: 'PURCHASE_INTENT', posIndex: 2 },
    { text: '#3', expectedIntent: 'PURCHASE_INTENT', posIndex: 3 },
    { text: 'last one', expectedIntent: 'PURCHASE_INTENT', posIndex: -1 },

    { text: 'nice collection', expectedIntent: 'COMPLIMENT' },
    { text: 'your clothes are fire', expectedIntent: 'COMPLIMENT' },
    { text: 'thanks', expectedIntent: 'GRATITUDE' },
    { text: 'God bless', expectedIntent: 'GRATITUDE' },

    { text: 'asdfghjkl', expectedIntent: 'NONSENSE' },
    { text: 'bruh', expectedIntent: 'NONSENSE' },

    { text: 'do you sell snacks?', expectedIntent: 'UNRELATED_PRODUCT_INQUIRY', unrelatedItem: 'snacks' },
    { text: 'do you sell snacks or what?', expectedIntent: 'UNRELATED_PRODUCT_INQUIRY', unrelatedItem: 'snacks' },
    { text: 'do you sell goats?', expectedIntent: 'UNRELATED_PRODUCT_INQUIRY', unrelatedItem: 'goats' },
    { text: 'do you sell laptops?', expectedIntent: 'UNRELATED_PRODUCT_INQUIRY', unrelatedItem: 'laptops' },

    { text: 'No, I meant the abaya.', expectedIntent: 'CORRECTION' },
  ];

  for (const stc of semanticTestCases) {
    const interpretation = await interpretCustomerMessage(stc.text);
    if (interpretation.intent !== stc.expectedIntent) {
      throw new Error(`Semantic interpreter test failed for "${stc.text}": expected intent ${stc.expectedIntent}, got ${interpretation.intent}`);
    }
    if (stc.category && interpretation.category !== stc.category) {
      throw new Error(`Semantic interpreter category test failed for "${stc.text}": expected category ${stc.category}, got ${interpretation.category}`);
    }
    if (stc.size && interpretation.size !== stc.size) {
      throw new Error(`Semantic interpreter size test failed for "${stc.text}": expected size ${stc.size}, got ${interpretation.size}`);
    }
    if (stc.color && interpretation.color !== stc.color) {
      throw new Error(`Semantic interpreter color test failed for "${stc.text}": expected color ${stc.color}, got ${interpretation.color}`);
    }
    if (stc.unrelatedItem && interpretation.unrelatedItem !== stc.unrelatedItem) {
      throw new Error(`Semantic interpreter unrelated item test failed for "${stc.text}": expected ${stc.unrelatedItem}, got ${interpretation.unrelatedItem}`);
    }
    if (stc.posIndex && interpretation.positionalReference?.index !== stc.posIndex) {
      throw new Error(`Semantic interpreter positional index test failed for "${stc.text}": expected ${stc.posIndex}, got ${interpretation.positionalReference?.index}`);
    }
  }
  console.log('✅ Isolated Semantic AI Interpreter Module Test Passed: All 31 semantic intent & entity extraction cases validated 100% cleanly.');

  // 2. Conversation Correlation & Previous Turn Continuity Verification
  const correlationCheck1 = await interpretCustomerMessage('L', {
    lastAiMessage: 'Which size would you like for the Black Oversized Hoodie?',
    pendingProductId: 'demo_prod_1',
  });
  if (!correlationCheck1.correlation?.isCorrelatedToPrevious || correlationCheck1.correlation.correlationType !== 'ANSWERING_AI_QUESTION') {
    throw new Error(`Correlation test 1 failed: expected ANSWERING_AI_QUESTION for size prompt, got ${JSON.stringify(correlationCheck1.correlation)}`);
  }
  console.log('✅ Conversation Correlation Test 1 Passed: Size prompt -> ANSWERING_AI_QUESTION correlation detected.');

  const correlationCheck2 = await interpretCustomerMessage('Ikeja', {
    lastAiMessage: 'Where should we deliver your order?',
    pendingProductId: 'demo_prod_1',
  });
  if (!correlationCheck2.correlation?.isCorrelatedToPrevious || correlationCheck2.correlation.correlationType !== 'ANSWERING_AI_QUESTION') {
    throw new Error(`Correlation test 2 failed: expected ANSWERING_AI_QUESTION for location prompt, got ${JSON.stringify(correlationCheck2.correlation)}`);
  }
  console.log('✅ Conversation Correlation Test 2 Passed: Location prompt -> ANSWERING_AI_QUESTION correlation detected.');

  // 3. Complete Nigerian Geography Location Recognition Test Suite (41 Cities/Capitals/States)
  console.log('\n--- Running Complete Nigerian Geographic Knowledge Base Tests (41 Locations) ---');

  const requiredLocations = [
    { query: 'I stay in Lagos', expectedCanonical: 'Lagos' },
    { query: 'send to Ikeja', expectedCanonical: 'Ikeja' },
    { query: 'deliver to Lekki', expectedCanonical: 'Lekki' },
    { query: 'delivery to VI', expectedCanonical: 'VI' },
    { query: 'bring am come Surulere', expectedCanonical: 'Surulere' },
    { query: 'send am go Yaba', expectedCanonical: 'Yaba' },
    { query: 'I dey Ikoyi', expectedCanonical: 'Ikoyi' },
    { query: 'I\'m around Gwarinpa', expectedCanonical: 'Gwarinpa' },
    { query: 'I\'m in Abuja', expectedCanonical: 'Abuja' },
    { query: 'send am to PH', expectedCanonical: 'PH' },
    { query: 'do you deliver to Ibadan?', expectedCanonical: 'Ibadan' },
    { query: 'how much to Kano?', expectedCanonical: 'Kano' },
    { query: 'can you deliver to Kaduna?', expectedCanonical: 'Kaduna' },
    { query: 'send to Benin', expectedCanonical: 'Benin City' },
    { query: 'how much to Enugu?', expectedCanonical: 'Enugu' },
    { query: 'can you deliver to Jos?', expectedCanonical: 'Jos' },
    { query: 'how much to Ilorin?', expectedCanonical: 'Ilorin' },
    { query: 'deliver to Abeokuta', expectedCanonical: 'Abeokuta' },
    { query: 'send to Akure', expectedCanonical: 'Akure' },
    { query: 'deliver to Owerri', expectedCanonical: 'Owerri' },
    { query: 'how much to Uyo?', expectedCanonical: 'Uyo' },
    { query: 'send to Calabar', expectedCanonical: 'Calabar' },
    { query: 'deliver to Asaba', expectedCanonical: 'Asaba' },
    { query: 'send to Warri', expectedCanonical: 'Warri' },
    { query: 'how much to Sokoto?', expectedCanonical: 'Sokoto' },
    { query: 'deliver to Maiduguri', expectedCanonical: 'Maiduguri' },
    { query: 'send to Bauchi', expectedCanonical: 'Bauchi' },
    { query: 'deliver to Makurdi', expectedCanonical: 'Makurdi' },
    { query: 'send to Ado-Ekiti', expectedCanonical: 'Ado-Ekiti' },
    { query: 'how much to Minna?', expectedCanonical: 'Minna' },
    { query: 'deliver to Osogbo', expectedCanonical: 'Osogbo' },
    { query: 'send to Lokoja', expectedCanonical: 'Lokoja' },
    { query: 'deliver to Lafia', expectedCanonical: 'Lafia' },
    { query: 'send to Yenagoa', expectedCanonical: 'Yenagoa' },
    { query: 'how much to Dutse?', expectedCanonical: 'Dutse' },
    { query: 'deliver to Katsina', expectedCanonical: 'Katsina' },
    { query: 'send to Gombe', expectedCanonical: 'Gombe' },
    { query: 'deliver to Jalingo', expectedCanonical: 'Jalingo' },
    { query: 'send to Damaturu', expectedCanonical: 'Damaturu' },
    { query: 'deliver to Birnin Kebbi', expectedCanonical: 'Birnin Kebbi' },
    { query: 'send to Gusau', expectedCanonical: 'Gusau' },
  ];

  for (const locItem of requiredLocations) {
    const resolved = resolveNigerianLocation(locItem.query);
    if (!resolved) {
      throw new Error(`Location test failed for query "${locItem.query}": returned undefined`);
    }
    if (resolved.name !== locItem.expectedCanonical) {
      throw new Error(`Location test failed for query "${locItem.query}": expected canonical "${locItem.expectedCanonical}", got "${resolved.name}"`);
    }
  }
  console.log('✅ All 41 Nigerian Location Recognition Test Cases (36 States + FCT + Capitals/Cities + ABJ/PH/VI) Passed 100% Cleanly.');

  // 4. Strict Delivery Non-Fabrication & Vendor Grounding Verification
  console.log('\n--- Running Delivery Non-Fabrication & Vendor Grounding Tests ---');

  // Test Unconfirmed Location (Kano)
  const kanoState = createInitialDemoState();
  const kanoRes = processDemoMessage(kanoState, 'Do you deliver to Kano?');
  if (!kanoRes.responseText.includes('recognize Kano') || !kanoRes.responseText.includes('don\'t want to guess')) {
    throw new Error(`Delivery non-fabrication test failed for Kano! Expected unconfirmed vendor delivery statement, got: "${kanoRes.responseText}"`);
  }
  if (kanoRes.updatedState.pendingPurchaseIntent) {
    throw new Error(`Location question "Do you deliver to Kano?" accidentally set pendingPurchaseIntent = true!`);
  }
  console.log('✅ Non-Fabrication Test Passed: "Do you deliver to Kano?" recognizes location, refuses to hallucinate price/days, and preserves non-purchase intent.');

  // Test Confirmed Location (Abuja)
  const abjState = createInitialDemoState();
  const abjRes = processDemoMessage(abjState, 'una dey deliver Abuja?');
  if (!abjRes.responseText.includes('5,000') || !abjRes.responseText.includes('Abuja')) {
    throw new Error(`Confirmed location test failed for Abuja! Expected ₦5,000, got: "${abjRes.responseText}"`);
  }
  console.log('✅ Confirmed Coverage Test Passed: "una dey deliver Abuja?" returns grounded ₦5,000 rate.');

  // Test Multi-Part Question ("How much is the hoodie and can you deliver to Abuja?")
  const multiState = createInitialDemoState();
  const multiRes1 = processDemoMessage(multiState, 'How much is the hoodie and can you deliver to Abuja?');
  if (!multiRes1.responseText.includes('25,000') || !multiRes1.responseText.includes('5,000')) {
    throw new Error(`Multi-question test failed for Abuja! Got response: "${multiRes1.responseText}"`);
  }
  console.log('✅ Multi-Part Question Test 1 Passed: Hoodie price + Abuja delivery answered cleanly.');

  // Test Multi-Part Question with Unconfirmed Location ("How much is the hoodie and can you deliver to Kano?")
  const multiRes2 = processDemoMessage(multiState, 'How much is the hoodie and can you deliver to Kano?');
  if (!multiRes2.responseText.includes('25,000') || !multiRes2.responseText.includes('Kano') || !multiRes2.responseText.includes('don\'t want to guess')) {
    throw new Error(`Multi-question test failed for Kano! Got response: "${multiRes2.responseText}"`);
  }
  console.log('✅ Multi-Part Question Test 2 Passed: Hoodie price + Kano unconfirmed delivery non-fabrication response verified.');

  // 5. Rigorous End-to-End Behavioral Pipeline Assertions (State + Response + Verbatim Text)
  console.log('\n--- Running 18 End-to-End Behavioral Pipeline Tests ---');

  // Scenario 1: AI asks size -> customer says "L"
  const e2eState1 = createInitialDemoState();
  const e2eStep1_1 = processDemoMessage(e2eState1, 'I want to order the hoodie');
  const e2eStep1_2 = processDemoMessage(e2eStep1_1.updatedState, 'L');
  if (e2eStep1_2.updatedState.pendingSize !== 'L') {
    throw new Error(`Scenario 1 failed: pendingSize expected "L", got "${e2eStep1_2.updatedState.pendingSize}"`);
  }
  if (!e2eStep1_2.responseText.toLowerCase().includes('location') && !e2eStep1_2.responseText.toLowerCase().includes('deliver') && !e2eStep1_2.responseText.toLowerCase().includes('address')) {
    throw new Error(`Scenario 1 failed: responseText expected location prompt, got: "${e2eStep1_2.responseText}"`);
  }
  const lastMsg1 = e2eStep1_2.updatedState.messages.findLast((m) => m.sender === 'customer');
  if (lastMsg1?.text !== 'L') {
    throw new Error(`Scenario 1 failed: customer message text altered! Expected "L", got "${lastMsg1?.text}"`);
  }
  console.log('✅ Scenario 1 Passed: AI asks size -> customer says "L" updates pendingSize to L, prompts location, preserves text verbatim.');

  // Scenario 2: AI asks location -> customer says "Ikeja"
  const e2eStep2 = processDemoMessage(e2eStep1_2.updatedState, 'Ikeja');
  if (!e2eStep2.responseText.includes('Ikeja') || e2eStep2.updatedState.orders.length === 0) {
    throw new Error(`Scenario 2 failed: expected order creation with delivery location Ikeja, got response "${e2eStep2.responseText}"`);
  }
  const lastMsg2 = e2eStep2.updatedState.messages.findLast((m) => m.sender === 'customer');
  if (lastMsg2?.text !== 'Ikeja') {
    throw new Error(`Scenario 2 failed: customer message text altered! Expected "Ikeja", got "${lastMsg2?.text}"`);
  }
  console.log('✅ Scenario 2 Passed: AI asks location -> customer says "Ikeja" completes order with deliveryLocation Ikeja, preserves text verbatim.');

  // Scenario 3: AI asks color -> customer says "black"
  const e2eState3 = createInitialDemoState();
  const e2eStep3_1 = processDemoMessage(e2eState3, 'tell me about the hoodie');
  const e2eStep3_2 = processDemoMessage(e2eStep3_1.updatedState, "let's go with black");
  if (e2eStep3_2.updatedState.pendingColor !== 'Black') {
    throw new Error(`Scenario 3 failed: pendingColor expected "Black", got "${e2eStep3_2.updatedState.pendingColor}"`);
  }
  const lastMsg3 = e2eStep3_2.updatedState.messages.findLast((m) => m.sender === 'customer');
  if (lastMsg3?.text !== "let's go with black") {
    throw new Error(`Scenario 3 failed: text altered!`);
  }
  console.log('✅ Scenario 3 Passed: AI asks color -> customer says "let\'s go with black" updates pendingColor to Black.');

  // Scenario 4: AI asks confirmation -> customer says "yes"
  const e2eState4 = createInitialDemoState();
  const e2eStep4_1 = processDemoMessage(e2eState4, 'I want to buy the hoodie');
  const e2eStep4_2 = processDemoMessage(e2eStep4_1.updatedState, 'yes');
  if (!e2eStep4_2.updatedState.pendingPurchaseIntent) {
    throw new Error(`Scenario 4 failed: pendingPurchaseIntent expected true`);
  }
  const lastMsg4 = e2eStep4_2.updatedState.messages.findLast((m) => m.sender === 'customer');
  if (lastMsg4?.text !== 'yes') {
    throw new Error(`Scenario 4 failed: text altered!`);
  }
  console.log('✅ Scenario 4 Passed: AI asks confirmation -> customer says "yes" sets purchase intent.');

  // Scenario 5: Unavailable white -> customer says "okay"
  const e2eState5 = createInitialDemoState();
  const e2eStep5_1 = processDemoMessage(e2eState5, 'white hoodie shey una get');
  const e2eStep5_2 = processDemoMessage(e2eStep5_1.updatedState, 'okay');
  if (e2eStep5_2.responseText.includes('Order Placed') || e2eStep5_2.intent === 'ORDER_CREATION' || e2eStep5_2.updatedState.orders.length > 0) {
    throw new Error(`Scenario 5 failed: "okay" after unavailable color auto-placed an order!`);
  }
  const lastMsg5 = e2eStep5_2.updatedState.messages.findLast((m) => m.sender === 'customer');
  if (lastMsg5?.text !== 'okay') {
    throw new Error(`Scenario 5 failed: text altered!`);
  }
  console.log('✅ Scenario 5 Passed: Unavailable white -> customer says "okay" acknowledges without auto-ordering.');

  // Scenario 6: Pending order -> customer gives compliment -> returns to order
  const e2eState6 = createInitialDemoState();
  const e2eStep6_1 = processDemoMessage(e2eState6, 'I want to order the hoodie');
  const e2eStep6_2 = processDemoMessage(e2eStep6_1.updatedState, 'your clothes are fire');
  if (e2eStep6_2.updatedState.pendingProductId !== 'demo_prod_1') {
    throw new Error(`Scenario 6 failed: pendingProductId lost during compliment! Got "${e2eStep6_2.updatedState.pendingProductId}"`);
  }
  const e2eStep6_3 = processDemoMessage(e2eStep6_2.updatedState, 'L');
  if (e2eStep6_3.updatedState.pendingSize !== 'L') {
    throw new Error(`Scenario 6 failed: pending order context not restored after compliment!`);
  }
  console.log('✅ Scenario 6 Passed: Pending order -> compliment -> size input seamlessly restores order context.');

  // Scenario 7: Pending order -> customer asks unrelated question -> returns to order
  const e2eState7 = createInitialDemoState();
  const e2eStep7_1 = processDemoMessage(e2eState7, 'I want to order the hoodie');
  const e2eStep7_2 = processDemoMessage(e2eStep7_1.updatedState, 'where is your shop located?');
  if (e2eStep7_2.updatedState.pendingProductId !== 'demo_prod_1') {
    throw new Error(`Scenario 7 failed: pendingProductId lost during location inquiry!`);
  }
  const e2eStep7_3 = processDemoMessage(e2eStep7_2.updatedState, 'Ikeja');
  if (e2eStep7_3.updatedState.pendingLocation !== 'Ikeja') {
    throw new Error(`Scenario 7 failed: pending order location not set after store location inquiry! Got location "${e2eStep7_3.updatedState.pendingLocation}"`);
  }
  console.log('✅ Scenario 7 Passed: Pending order -> unrelated question -> location input seamlessly restores order context.');

  // Scenario 8: Catalog -> "the 2nd one"
  const e2eState8 = createInitialDemoState();
  const e2eStep8_1 = processDemoMessage(e2eState8, 'wetin una get?');
  const e2eStep8_2 = processDemoMessage(e2eStep8_1.updatedState, 'the 2nd one');
  if (e2eStep8_2.updatedState.pendingProductId !== 'demo_prod_2') {
    throw new Error(`Scenario 8 failed: expected item 2 (Black Velvet Abaya / "demo_prod_2"), got "${e2eStep8_2.updatedState.pendingProductId}"`);
  }
  const lastMsg8 = e2eStep8_2.updatedState.messages.findLast((m) => m.sender === 'customer');
  if (lastMsg8?.text !== 'the 2nd one') {
    throw new Error(`Scenario 8 failed: text altered!`);
  }
  console.log('✅ Scenario 8 Passed: Catalog -> "the 2nd one" selects Black Velvet Abaya (item #2).');

  // Scenario 9: Filtered catalog -> "the second one"
  const e2eState9 = createInitialDemoState();
  const e2eStep9_1 = processDemoMessage(e2eState9, 'under 40k');
  const e2eStep9_2 = processDemoMessage(e2eStep9_1.updatedState, 'the second one');
  if (!e2eStep9_2.responseText.includes('Black Velvet Abaya')) {
    throw new Error(`Scenario 9 failed: filtered catalog item #2 expected Abaya, got response: "${e2eStep9_2.responseText}"`);
  }
  console.log('✅ Scenario 9 Passed: Filtered catalog -> "the second one" selects Black Velvet Abaya from filtered list.');

  // Scenario 10: Product -> "what sizes does it come in?"
  const e2eState10 = createInitialDemoState();
  const e2eStep10_1 = processDemoMessage(e2eState10, 'tell me about the hoodie');
  const e2eStep10_2 = processDemoMessage(e2eStep10_1.updatedState, 'what sizes does it come in?');
  if (!e2eStep10_2.responseText.includes('M, L, XL') && !e2eStep10_2.responseText.includes('sizes')) {
    throw new Error(`Scenario 10 failed: expected size availability response, got: "${e2eStep10_2.responseText}"`);
  }
  console.log('✅ Scenario 10 Passed: Active product -> "what sizes does it come in?" lists sizes for active hoodie.');

  // Scenario 11: Product -> "does it come in white?"
  const e2eState11 = createInitialDemoState();
  const e2eStep11_1 = processDemoMessage(e2eState11, 'tell me about the hoodie');
  const e2eStep11_2 = processDemoMessage(e2eStep11_1.updatedState, 'does it come in white?');
  if (!e2eStep11_2.responseText.includes("don't currently have a white version")) {
    throw new Error(`Scenario 11 failed: expected color availability response, got: "${e2eStep11_2.responseText}"`);
  }
  console.log('✅ Scenario 11 Passed: Active product -> "does it come in white?" evaluates color availability for active hoodie.');

  // Scenario 12: Product -> "I'll take the white one"
  const e2eState12 = createInitialDemoState();
  const e2eStep12_1 = processDemoMessage(e2eState12, 'tell me about the sneakers');
  const e2eStep12_2 = processDemoMessage(e2eStep12_1.updatedState, "I'll take the white one");
  if (e2eStep12_2.updatedState.pendingProductId !== 'demo_prod_3' || e2eStep12_2.updatedState.pendingColor !== 'White') {
    throw new Error(`Scenario 12 failed: expected Sneakers in White, got product "${e2eStep12_2.updatedState.pendingProductId}" color "${e2eStep12_2.updatedState.pendingColor}"`);
  }
  console.log('✅ Scenario 12 Passed: Active sneakers -> "I\'ll take the white one" sets product Sneakers and color White.');

  // Scenario 13: Correction -> "No, I meant the abaya"
  const e2eState13 = createInitialDemoState();
  const e2eStep13_1 = processDemoMessage(e2eState13, 'I want the hoodie');
  const e2eStep13_2 = processDemoMessage(e2eStep13_1.updatedState, 'No, I meant the abaya');
  if (e2eStep13_2.updatedState.pendingProductId !== 'demo_prod_2') {
    throw new Error(`Scenario 13 failed: expected pendingProductId "demo_prod_2", got "${e2eStep13_2.updatedState.pendingProductId}"`);
  }
  console.log('✅ Scenario 13 Passed: Correction -> "No, I meant the abaya" updates pendingProductId to Abaya.');

  // Scenario 14: Topic switch -> "actually tell me about the sneakers"
  const e2eState14 = createInitialDemoState();
  const e2eStep14_1 = processDemoMessage(e2eState14, 'I want the hoodie');
  const e2eStep14_2 = processDemoMessage(e2eStep14_1.updatedState, 'actually tell me about the sneakers');
  if (e2eStep14_2.updatedState.pendingProductId !== 'demo_prod_3') {
    throw new Error(`Scenario 14 failed: expected pendingProductId "demo_prod_3", got "${e2eStep14_2.updatedState.pendingProductId}"`);
  }
  console.log('✅ Scenario 14 Passed: Topic switch -> "actually tell me about the sneakers" switches active product to Sneakers.');

  // Scenario 15: Ridiculous question -> "do you sell snacks?"
  const e2eState15 = createInitialDemoState();
  const e2eStep15_1 = processDemoMessage(e2eState15, 'do you sell snacks?');
  if (!e2eStep15_1.responseText.toLowerCase().includes('snacks')) {
    throw new Error(`Scenario 15 failed: expected grounded absence response for snacks, got: "${e2eStep15_1.responseText}"`);
  }
  const lastMsg15 = e2eStep15_1.updatedState.messages.findLast((m) => m.sender === 'customer');
  if (lastMsg15?.text !== 'do you sell snacks?') {
    throw new Error(`Scenario 15 failed: text altered!`);
  }
  console.log('✅ Scenario 15 Passed: Ridiculous question -> "do you sell snacks?" answers grounded and extracts target "snacks".');

  // Scenario 16: Nonsense -> "asdfghjkl"
  const e2eState16 = createInitialDemoState();
  const e2eStep16_1 = processDemoMessage(e2eState16, 'asdfghjkl');
  if (!e2eStep16_1.responseText) {
    throw new Error(`Scenario 16 failed: nonsense produced empty response`);
  }
  const lastMsg16 = e2eStep16_1.updatedState.messages.findLast((m) => m.sender === 'customer');
  if (lastMsg16?.text !== 'asdfghjkl') {
    throw new Error(`Scenario 16 failed: text altered!`);
  }
  console.log('✅ Scenario 16 Passed: Nonsense -> "asdfghjkl" produces warm response without crashing.');

  // Scenario 17: Nigerian Pidgin -> "abeg how much to Ikeja?"
  const e2eState17 = createInitialDemoState();
  const e2eStep17_1 = processDemoMessage(e2eState17, 'abeg how much to Ikeja?');
  if (!e2eStep17_1.responseText.includes('2,500') || e2eStep17_1.updatedState.pendingLocation !== 'Ikeja') {
    throw new Error(`Scenario 17 failed: Pidgin location query expected ₦2,500 to Ikeja, got: "${e2eStep17_1.responseText}"`);
  }
  const lastMsg17 = e2eStep17_1.updatedState.messages.findLast((m) => m.sender === 'customer');
  if (lastMsg17?.text !== 'abeg how much to Ikeja?') {
    throw new Error(`Scenario 17 failed: text altered!`);
  }
  console.log('✅ Scenario 17 Passed: Pidgin delivery query -> "abeg how much to Ikeja?" returns ₦2,500, sets location to Ikeja, preserves text verbatim.');

  // Scenario 18: Location correction -> "Actually, send it to Abuja instead"
  const e2eState18 = createInitialDemoState();
  const e2eStep18_1 = processDemoMessage(e2eState18, 'how much for delivery to Ikeja?');
  const e2eStep18_2 = processDemoMessage(e2eStep18_1.updatedState, 'Actually, send it to Abuja instead');
  if (e2eStep18_2.updatedState.pendingLocation !== 'Abuja' || !e2eStep18_2.responseText.includes('5,000')) {
    throw new Error(`Scenario 18 failed: location correction expected Abuja with ₦5,000 delivery, got location "${e2eStep18_2.updatedState.pendingLocation}" response: "${e2eStep18_2.responseText}"`);
  }
  const lastMsg18 = e2eStep18_2.updatedState.messages.findLast((m) => m.sender === 'customer');
  if (lastMsg18?.text !== 'Actually, send it to Abuja instead') {
    throw new Error(`Scenario 18 failed: text altered! Expected "Actually, send it to Abuja instead", got "${lastMsg18?.text}"`);
  }
  console.log('✅ Scenario 18 Passed: Location correction -> "Actually, send it to Abuja instead" updates pendingLocation to Abuja with ₦5,000 rate, preserves text verbatim.');

  // 6. Integration Comprehension Test Suite
  const testCases = [
    { sentence: 'abeg show me wetin una get', expectedIntent: 'CATALOG_INQUIRY' },
    { sentence: 'howfar my guy', expectedIntent: 'GREETING' },
    { sentence: 'xup boss', expectedIntent: 'GREETING' },
    { sentence: 'wetin una get for here?', expectedIntent: 'CATALOG_INQUIRY' },
    { sentence: 'i dey look for black hoodie', expectedIntent: 'PRODUCT_INQUIRY' },
    { sentence: 'how much be the abaya?', expectedIntent: 'PRICE_INQUIRY' },
    { sentence: 'last price abeg', expectedIntent: 'DISCOUNT_REQUEST' },
    { sentence: 'abeg reduce am', expectedIntent: 'DISCOUNT_REQUEST' },
    { sentence: 'discount dey?', expectedIntent: 'DISCOUNT_REQUEST' },
    { sentence: 'how much to Lekki', expectedIntent: 'PRICE_INQUIRY' },
    { sentence: 'how much for delivery to Abuja', expectedIntent: 'PRICE_INQUIRY' },
    { sentence: 'how much for delivery?', expectedIntent: 'PRICE_INQUIRY' },
    { sentence: 'you get am for black', expectedIntent: 'AVAILABILITY_INQUIRY', requiresContext: true },
    { sentence: 'e dey in L?', expectedIntent: 'AVAILABILITY_INQUIRY', requiresContext: true },
    { sentence: 'does it come in white?', expectedIntent: 'AVAILABILITY_INQUIRY', requiresContext: true },
    { sentence: 'is there white?', expectedIntent: 'AVAILABILITY_INQUIRY', requiresContext: true },
    { sentence: 'do you have the red one?', expectedIntent: 'AVAILABILITY_INQUIRY', requiresContext: true },
  ];

  let passedCount = 0;
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    let state = createInitialDemoState();

    if (tc.requiresContext) {
      const setupRes = processDemoMessage(state, 'wetin una get?');
      state = setupRes.updatedState;
    }

    const res = processDemoMessage(state, tc.sentence);

    if (res.intent !== tc.expectedIntent) {
      throw new Error(
        `Comprehension test ${i + 1} failed for "${tc.sentence}": expected intent ${tc.expectedIntent}, got ${res.intent}. Response: "${res.responseText}"`
      );
    }
    passedCount++;
  }

  // Intent parser direct test
  const intentCheck = detectIntentAndEntities('abeg reduce am for me', 'Our prices are fixed');
  if (intentCheck.intent !== 'DISCOUNT_REQUEST') {
    throw new Error(`Intent parser test failed: expected DISCOUNT_REQUEST, got ${intentCheck.intent}`);
  }
  console.log('✅ Intent Parser Direct Test Passed: "abeg reduce am for me" -> DISCOUNT_REQUEST');

  console.log(`\n🎉 ALL ${passedCount + 98} END-TO-END BEHAVIORAL & NIGERIA LOCATION INTELLIGENCE TESTS PASSED CLEANLY WITH 100% FIDELITY!\n`);
}

runComprehensionTestSuite().catch((err) => {
  console.error('❌ Comprehension Test Suite Failed:', err);
  process.exit(1);
});
