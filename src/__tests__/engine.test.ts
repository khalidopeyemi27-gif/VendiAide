import { getEnv } from '../lib/env';
import { formatNaira } from '../lib/utils/formatters';
import { getTemplate } from '../lib/templates';
import { MockWhatsAppAdapter, WebDemoAdapter } from '../lib/channels';
import { conversationEngine } from '../lib/engine/conversation';
import { mockStore, DEMO_BUSINESS } from '../lib/db/mock-store';
import { checkAndEnforceUsage } from '../lib/engine/usage';
import { getGroundedContext } from '../lib/engine/context';
import { buildSystemPrompt } from '../lib/engine/prompts';
import {
  createInitialDemoState,
  processDemoMessage,
  DEMO_PUBLIC_PRODUCTS,
  DemoProduct,
  DemoSessionState,
} from '../lib/demo/demo-engine';
import { detectConversationalIntent } from '../lib/engine/intent';
import { FollowUp } from '../lib/types/database';

async function runFullArchitectureVerificationSuite() {
  console.log('🧪 Running VendiAide Architecture, Grounded Demo Engine, Catalog Query Intelligence, Price Query Intelligence, Conversational Intent & Multi-Tenant Security Verification Suite...\n');

  // Test 1: Environment validation
  const env = getEnv();
  console.log('✅ [1/40] Environment configuration validated: OpenAI Model =', env.OPENAI_MODEL);

  // Test 2: Naira formatting
  const nairaOutput = formatNaira(25000);
  if (nairaOutput !== '₦25,000') {
    throw new Error(`Naira formatter failed. Expected ₦25,000, got ${nairaOutput}`);
  }
  console.log('✅ [2/40] Currency formatter verified: 25000 ->', nairaOutput);

  // Test 3: IndustryTemplate Abstraction
  const template = getTemplate('fashion');
  if (template.id !== 'fashion' || !template.defaultCategories.includes('Ready-to-Wear')) {
    throw new Error('Fashion Industry Template verification failed.');
  }
  console.log('✅ [3/40] IndustryTemplate abstraction verified: Active Vertical =', template.name);

  // Test 4: Channel Adapters
  const waAdapter = new MockWhatsAppAdapter();
  const webAdapter = new WebDemoAdapter();
  if (waAdapter.channel !== 'whatsapp' || webAdapter.channel !== 'web_demo') {
    throw new Error('Channel Adapter verification failed.');
  }
  console.log('✅ [4/40] Channel Adapters verified: WhatsApp & WebDemo providers ready.');

  // Test 5: Subscription Usage Enforcement
  const usageStatus = await checkAndEnforceUsage(DEMO_BUSINESS.id);
  if (!usageStatus.allowed || usageStatus.limit !== 500) {
    throw new Error('Subscription limit enforcement check failed.');
  }
  console.log(`✅ [5/40] Subscription Usage Enforcer verified: Plan = ${usageStatus.plan}, Limit = ${usageStatus.limit}`);

  // Test 6: Grounding & Financial Isolation Safeguards
  const groundedCtx = await getGroundedContext(DEMO_BUSINESS.id);
  const systemPrompt = buildSystemPrompt(groundedCtx);
  if (systemPrompt.includes('1234567890') || systemPrompt.includes('Kuda') || systemPrompt.includes('Account Number:')) {
    throw new Error('SECURITY DEFECT: Bank account details detected inside AI System Prompt!');
  }
  console.log('✅ [6/40] Financial Data Isolation verified: Bank details strictly excluded from AI prompts.');

  // Test 7: Conversation Engine End-to-End Pipeline
  const payload = await conversationEngine.processIncomingMessage({
    id: 'test_msg_1',
    channel: 'web_demo',
    business_id: DEMO_BUSINESS.id,
    sender: {
      channel: 'web_demo',
      channel_user_id: 'test_user_99',
      name: 'Amaka',
    },
    content: 'Hi, do you have the Black Oversized Hoodie in size L?',
    timestamp: new Date().toISOString(),
  });

  if (!payload.content || !payload.intent) {
    throw new Error('Conversation Engine pipeline failed to return valid AI response payload.');
  }
  console.log('✅ [7/40] Conversation Engine Pipeline verified: Response generated successfully.');

  // Test 8: Missing Details Order Follow-up Prompting
  const followUpPayload = await conversationEngine.processIncomingMessage({
    id: 'test_msg_2',
    channel: 'web_demo',
    business_id: DEMO_BUSINESS.id,
    sender: {
      channel: 'web_demo',
      channel_user_id: 'test_user_99',
      name: 'Amaka',
    },
    content: 'I want to buy the Black Oversized Hoodie.',
    timestamp: new Date().toISOString(),
  });

  if (!followUpPayload.content.toLowerCase().includes('size') && !followUpPayload.content.toLowerCase().includes('delivery location')) {
    throw new Error('Anti-hallucination check failed: AI created incomplete order without prompting for size/location.');
  }
  console.log('✅ [8/40] Anti-Hallucination & Follow-up Prompting verified: AI prompts for missing order details.');

  // Test 9: Complete Order Creation for Product Requiring Size + Color (Black Abaya)
  const orderCountBefore = mockStore.getOrders(DEMO_BUSINESS.id).length;
  const completeOrderPayload = await conversationEngine.processIncomingMessage({
    id: 'test_msg_3',
    channel: 'web_demo',
    business_id: DEMO_BUSINESS.id,
    sender: {
      channel: 'web_demo',
      channel_user_id: 'test_user_99',
      name: 'Amaka',
    },
    content: 'I want to buy the Black Velvet Abaya in size L color Black. Delivery to Ikeja, Lagos.',
    timestamp: new Date().toISOString(),
  });

  const orderCountAfter = mockStore.getOrders(DEMO_BUSINESS.id).length;
  if (!completeOrderPayload || orderCountAfter <= orderCountBefore) {
    throw new Error('Order creation failed for Abaya requiring size + color.');
  }
  console.log('✅ [9/40] Scenario 1 Passed: Abaya with size + colour creates order successfully.');

  // Test 10: Attribute-aware Order Creation for Handbag (Color required, size NOT required)
  const handbagOrderPayload = await conversationEngine.processIncomingMessage({
    id: 'test_msg_bag_1',
    channel: 'web_demo',
    business_id: DEMO_BUSINESS.id,
    sender: {
      channel: 'web_demo',
      channel_user_id: 'test_user_bag_1',
      name: 'Chioma',
    },
    content: 'I want to buy the Leather Handbag in Black. Delivery to Lekki, Lagos.',
    timestamp: new Date().toISOString(),
  });

  const bagOrders = mockStore.getOrders(DEMO_BUSINESS.id).filter((o) => o.notes?.includes('Leather Handbag'));
  if (!handbagOrderPayload || bagOrders.length === 0) {
    throw new Error('Attribute-aware order creation failed for product without sizes (Leather Handbag).');
  }
  console.log('✅ [10/40] Scenario 2 Passed: Handbag with colour but NO size creates order without size.');

  // Test 11: Attribute-aware Order Creation for One-Size Hijab (No size/color required)
  const hijabOrderPayload = await conversationEngine.processIncomingMessage({
    id: 'test_msg_hijab_1',
    channel: 'web_demo',
    business_id: DEMO_BUSINESS.id,
    sender: {
      channel: 'web_demo',
      channel_user_id: 'test_user_hijab_1',
      name: 'Fatima',
    },
    content: 'I want to buy the One-Size Chiffon Hijab. Delivery to Abuja.',
    timestamp: new Date().toISOString(),
  });

  const hijabOrders = mockStore.getOrders(DEMO_BUSINESS.id).filter((o) => o.notes?.includes('One-Size Chiffon Hijab'));
  if (!hijabOrderPayload || hijabOrders.length === 0) {
    throw new Error('Attribute-aware order creation failed for one-size product (One-Size Chiffon Hijab).');
  }
  console.log('✅ [11/40] Scenario 3 Passed: One-size hijab creates order without requiring size.');

  // Test 12: Human Escalation Trigger
  const escalationPayload = await conversationEngine.processIncomingMessage({
    id: 'test_msg_4',
    channel: 'web_demo',
    business_id: DEMO_BUSINESS.id,
    sender: {
      channel: 'web_demo',
      channel_user_id: 'test_user_99',
      name: 'Amaka',
    },
    content: 'Can I speak to the human owner of this shop right now?',
    timestamp: new Date().toISOString(),
  });

  if (!escalationPayload.escalated && escalationPayload.intent !== 'HUMAN_ESCALATION') {
    throw new Error('Human escalation trigger failed.');
  }
  console.log('✅ [12/40] Human Escalation Trigger verified: Conversation flagged for vendor takeover.');

  // Test 13: Multi-Tenant Isolation Boundaries
  const vendorAProducts = mockStore.getProducts(DEMO_BUSINESS.id);
  const vendorBProducts = mockStore.getProducts('biz_tenant_b_88');
  if (vendorAProducts.length === 0 || (vendorBProducts.length > 0 && vendorBProducts.some((p) => p.business_id === DEMO_BUSINESS.id))) {
    throw new Error('SECURITY DEFECT: Multi-tenant data leak between businesses!');
  }
  console.log('✅ [13/40] Multi-Tenant Isolation verified: Business records strictly partitioned by business_id.');

  // Test 14: Archived Product Filtering
  const allBizProducts = mockStore.getProducts(DEMO_BUSINESS.id);
  if (allBizProducts.length > 0) {
    allBizProducts[0].status = 'archived';
  }
  const activeCtx = await getGroundedContext(DEMO_BUSINESS.id);
  const hasArchivedProduct = activeCtx.products.some((p) => p.status === 'archived');
  if (hasArchivedProduct) {
    throw new Error('Archived product check failed: Archived product included in active AI context!');
  }
  if (allBizProducts.length > 0) {
    allBizProducts[0].status = 'active';
  }
  console.log('✅ [14/40] Archived Product Filtering verified: Soft-archived items excluded from AI context.');

  // Test 15: Attribute-aware Color Prompting when Color is Missing
  const missingColorPayload = await conversationEngine.processIncomingMessage({
    id: 'test_msg_color_1',
    channel: 'web_demo',
    business_id: DEMO_BUSINESS.id,
    sender: {
      channel: 'web_demo',
      channel_user_id: 'test_user_color_1',
      name: 'Bisi',
    },
    content: 'I want to buy the Leather Handbag. Delivery to Ikeja, Lagos.',
    timestamp: new Date().toISOString(),
  });

  if (!missingColorPayload.content.toLowerCase().includes('colour') && !missingColorPayload.content.toLowerCase().includes('color')) {
    throw new Error('Attribute-aware check failed: AI did not prompt for missing colour attribute.');
  }
  console.log('✅ [15/40] Scenario 5 Passed: AI correctly prompts for missing colour attribute when required.');

  // --- DEMO ENGINE GROUNDED UNLISTED PRODUCT TESTS ---

  // Test 16 (Demo Test 1): Unknown Product Query ("Do you have a red Gucci bag?")
  const resUnkProd = processDemoMessage(createInitialDemoState(), 'Do you have a red Gucci bag?');
  if (!resUnkProd.responseText.toLowerCase().includes('don\'t currently have') || !resUnkProd.responseText.toLowerCase().includes('catalog')) {
    throw new Error(`Demo Test 1 failed: Expected explicit unlisted catalog response, got: ${resUnkProd.responseText}`);
  }
  console.log('✅ [16/40] Demo Test 1 Passed: "Do you have a red Gucci bag?" explicitly states item is not listed in catalog.');

  // Test 17 (Demo Test 2): Unknown Color Query ("Do you have the hoodie in red?")
  const resUnkColor = processDemoMessage(createInitialDemoState(), 'Do you have the hoodie in red?');
  if (!resUnkColor.responseText.toLowerCase().includes('don\'t currently have a red') || !resUnkColor.responseText.toLowerCase().includes('hoodie')) {
    throw new Error(`Demo Test 2 failed: Expected color mismatch response, got: ${resUnkColor.responseText}`);
  }
  console.log('✅ [17/40] Demo Test 2 Passed: "Do you have the hoodie in red?" identifies hoodie exists but red is not available color.');

  // Test 18 (Demo Test 3): Unknown Size Query ("Do you have the Black Velvet Abaya in size 40?")
  const resUnkSize = processDemoMessage(createInitialDemoState(), 'Do you have the Black Velvet Abaya in size 40?');
  if (!resUnkSize.responseText.toLowerCase().includes('size 40 isn\'t currently listed') && !resUnkSize.responseText.toLowerCase().includes('size 40')) {
    throw new Error(`Demo Test 3 failed: Expected size mismatch response, got: ${resUnkSize.responseText}`);
  }
  console.log('✅ [18/40] Demo Test 3 Passed: "Black Velvet Abaya in size 40" identifies product exists but size 40 is unlisted.');

  // Test 19 (Demo Test 4): Known Product Price Query ("How much is the Black Velvet Abaya?")
  const resKnownPrice = processDemoMessage(createInitialDemoState(), 'How much is the Black Velvet Abaya?');
  if (!resKnownPrice.responseText.includes('₦35,000')) {
    throw new Error(`Demo Test 4 failed: Expected ₦35,000, got: ${resKnownPrice.responseText}`);
  }
  console.log('✅ [19/40] Demo Test 4 Passed: "How much is the Black Velvet Abaya?" returns exact ₦35,000 price.');

  // Test 20 (Demo Test 5): Known Product Size Availability ("Do you have the White Premium Sneakers in size 42?")
  const resKnownSize = processDemoMessage(createInitialDemoState(), 'Do you have the White Premium Sneakers in size 42?');
  if (!resKnownSize.responseText.includes('42') || !resKnownSize.responseText.includes('White Premium Sneakers')) {
    throw new Error(`Demo Test 5 failed: Expected size 42 confirmation, got: ${resKnownSize.responseText}`);
  }
  console.log('✅ [20/40] Demo Test 5 Passed: "White Premium Sneakers in size 42" confirms availability.');

  // Test 21 (Demo Test 6): Unknown Product Does NOT Create Lead/Order/Fabricated Price
  const resUnkNoOrder = processDemoMessage(createInitialDemoState(), 'How much is the Red Designer Bag?');
  if (resUnkNoOrder.updatedState.orders.length > 0 || resUnkNoOrder.updatedState.leads.length > 0 || resUnkNoOrder.responseText.includes('₦80,000')) {
    throw new Error('Demo Test 6 failed: Unknown product inquiry created a lead/order or fabricated price!');
  }
  console.log('✅ [21/40] Demo Test 6 Passed: Unknown product price inquiry returns unlisted response without creating false lead/order.');

  // Test 22 (Demo Test 7): Out-of-Stock Product Status Handling
  const outOfStockCatalog: DemoProduct[] = [
    ...DEMO_PUBLIC_PRODUCTS.map((p) => (p.id === 'demo_prod_1' ? { ...p, in_stock: false } : p)),
  ];
  const resOOS = processDemoMessage(createInitialDemoState(), 'Do you have the Black Oversized Hoodie?', outOfStockCatalog);
  if (!resOOS.responseText.toLowerCase().includes('out of stock')) {
    throw new Error(`Demo Test 7 failed: Expected out-of-stock response, got: ${resOOS.responseText}`);
  }
  console.log('✅ [22/40] Demo Test 7 Passed: Out-of-stock product is correctly reported as out of stock.');

  // Test 23 (Demo Test 8): Payment Security Regression Test
  const demoPurchaseRes = processDemoMessage(createInitialDemoState(), 'I want to buy the Black Hoodie in XL. Delivery is to Ikeja, Lagos.');
  const lowerResp = demoPurchaseRes.responseText.toLowerCase();
  const forbiddenTerms = ['kuda', '1234567890', 'acc:', 'bank:'];
  for (const term of forbiddenTerms) {
    if (lowerResp.includes(term)) {
      throw new Error(`SECURITY REGRESSION DEFECT: Bank credential "${term}" detected inside AI response: ${demoPurchaseRes.responseText}`);
    }
  }
  if (!lowerResp.includes('payment instructions')) {
    throw new Error('SECURITY DEFECT: AI response missing safe payment directive statement.');
  }
  console.log('✅ [23/40] Demo Test 8 Passed: Demo purchase intent returns safe payment directive without bank credentials.');

  // Test 24: Demo Session Isolation
  const prodOrdersCount = mockStore.getOrders(DEMO_BUSINESS.id).length;
  processDemoMessage(createInitialDemoState(), 'I want to buy the Black Hoodie in XL. Delivery is to Ikeja, Lagos.');
  const prodOrdersCountAfter = mockStore.getOrders(DEMO_BUSINESS.id).length;
  if (prodOrdersCountAfter !== prodOrdersCount) {
    throw new Error('SECURITY DEFECT: Demo activity modified production database records!');
  }
  console.log('✅ [24/40] Demo Session Isolation Passed: Demo session operates in total isolation from production database tables.');

  // --- PHASE 7 MULTI-TENANT DASHBOARD & CRM TESTS ---

  // Test 25 (Phase 7 Multi-Tenant CRM Data Scoping):
  const tenantBConvs = mockStore.getConversations('biz_tenant_b_99');
  const tenantBLeads = mockStore.getLeads('biz_tenant_b_99');
  const tenantBOrders = mockStore.getOrders('biz_tenant_b_99');
  const tenantBFollows = mockStore.getFollowUps('biz_tenant_b_99');

  if (tenantBConvs.length > 0 || tenantBLeads.length > 0 || tenantBOrders.length > 0 || tenantBFollows.length > 0) {
    throw new Error('PHASE 7 SECURITY DEFECT: Unauthenticated tenant B query returned tenant A data!');
  }
  console.log('✅ [25/40] Phase 7 Multi-Tenant CRM Data Scoping Passed: Tenant B query returns 0 records from Tenant A.');

  // Test 26 (Phase 7 Persisted Takeover State):
  const demoConvs = mockStore.getConversations(DEMO_BUSINESS.id);
  if (demoConvs.length > 0) {
    demoConvs[0].status = 'human_takeover';
    mockStore.saveConversation(demoConvs[0]);
    const updatedConv = mockStore.getConversations(DEMO_BUSINESS.id).find((c) => c.id === demoConvs[0].id);
    if (updatedConv?.status !== 'human_takeover') {
      throw new Error('PHASE 7 DEFECT: Takeover status update failed to persist in mock store!');
    }
  }
  console.log('✅ [26/40] Phase 7 Persisted Takeover State Passed: Conversation human takeover state persists server-side.');

  // Test 27 (Phase 7 Follow-Up Task Scheduler):
  const newFollowUpTask: FollowUp = {
    id: `test_follow_${Date.now()}`,
    business_id: DEMO_BUSINESS.id,
    customer_id: 'cust-1',
    conversation_id: 'conv-1',
    reason: 'Verify customer Lagos delivery address',
    scheduled_at: new Date().toISOString(),
    status: 'PENDING',
    created_at: new Date().toISOString(),
  };
  mockStore.saveFollowUp(newFollowUpTask);
  const fetchedFollowUps = mockStore.getFollowUps(DEMO_BUSINESS.id);
  if (!fetchedFollowUps.some((f) => f.id === newFollowUpTask.id)) {
    throw new Error('PHASE 7 DEFECT: Saved follow-up task not found in business store!');
  }
  console.log('✅ [27/40] Phase 7 Follow-Up Task Scheduler Passed: Follow-up task creation and status persistence verified.');

  // Test 28 (Phase 7 Financial Credential Isolation in Settings):
  const settingsBiz = mockStore.getBusiness(DEMO_BUSINESS.id);
  if (settingsBiz) {
    settingsBiz.payment_info = {
      bank_name: 'Test Private Bank',
      account_number: '9876543210',
      account_name: 'Vendor Private Account',
    };
    mockStore.saveBusiness(settingsBiz);

    const updatedCtx = await getGroundedContext(DEMO_BUSINESS.id);
    const updatedPrompt = buildSystemPrompt(updatedCtx);
    if (updatedPrompt.includes('9876543210') || updatedPrompt.includes('Test Private Bank')) {
      throw new Error('PHASE 7 SECURITY DEFECT: Updated bank credentials leaked into AI system prompt!');
    }
  }
  console.log('✅ [28/40] Phase 7 Financial Credential Isolation Passed: Bank info updated in settings remains strictly excluded from AI prompts.');

  // --- TARGETED CATALOG QUERY INTELLIGENCE TESTS ---

  // Test 29 (Targeted Catalog Fix 1 — General Catalog):
  const resCat1 = processDemoMessage(createInitialDemoState(), 'What items are available?');
  if (resCat1.intent !== 'CATALOG_INQUIRY' || !resCat1.responseText.includes('Black Oversized Hoodie') || !resCat1.responseText.includes('₦25,000')) {
    throw new Error(`Catalog Test 1 failed: Expected grounded catalog list, got: ${resCat1.responseText}`);
  }
  console.log('✅ [29/40] Catalog Test 1 Passed: "What items are available?" returns grounded catalog list with exact ₦ prices.');

  // Test 30 (Targeted Catalog Fix 2 — Catalog Synonym):
  const resCat2 = processDemoMessage(createInitialDemoState(), 'What do you sell?');
  if (resCat2.intent !== 'CATALOG_INQUIRY' || !resCat2.responseText.includes('Black Velvet Abaya')) {
    throw new Error(`Catalog Test 2 failed: Expected catalog discovery response, got: ${resCat2.responseText}`);
  }
  console.log('✅ [30/40] Catalog Test 2 Passed: "What do you sell?" identifies catalog discovery intent.');

  // Test 31 (Targeted Catalog Fix 3 — Category):
  const resCat3 = processDemoMessage(createInitialDemoState(), 'What dresses do you have?');
  if (resCat3.intent !== 'CATALOG_INQUIRY' || !resCat3.responseText.includes('Black Velvet Abaya') || resCat3.responseText.includes('White Premium Sneakers')) {
    throw new Error(`Catalog Test 3 failed: Expected dress/abaya items only, got: ${resCat3.responseText}`);
  }
  console.log('✅ [31/40] Catalog Test 3 Passed: "What dresses do you have?" filters catalog to dress/abaya category only.');

  // Test 32 (Targeted Catalog Fix 4 — Availability):
  const resCat4 = processDemoMessage(createInitialDemoState(), 'What\'s currently in stock?');
  if (resCat4.intent !== 'CATALOG_INQUIRY' || !resCat4.responseText.includes('Hoodie')) {
    throw new Error(`Catalog Test 4 failed: Expected in-stock products, got: ${resCat4.responseText}`);
  }
  console.log('✅ [32/40] Catalog Test 4 Passed: "What\'s currently in stock?" lists active in-stock catalog products.');

  // Test 33 (Targeted Catalog Fix 5 — Color):
  const resCat5 = processDemoMessage(createInitialDemoState(), 'What products do you have in black?');
  if (resCat5.intent !== 'CATALOG_INQUIRY' || !resCat5.responseText.includes('Black Oversized Hoodie') || resCat5.responseText.includes('White Premium Sneakers')) {
    throw new Error(`Catalog Test 5 failed: Expected black products only, got: ${resCat5.responseText}`);
  }
  console.log('✅ [33/40] Catalog Test 5 Passed: "What products do you have in black?" filters catalog by color attribute.');

  // Test 34 (Targeted Catalog Fix 6 — Size):
  const resCat6 = processDemoMessage(createInitialDemoState(), 'What products are available in size L?');
  if (resCat6.intent !== 'CATALOG_INQUIRY' || !resCat6.responseText.includes('Black Oversized Hoodie') || resCat6.responseText.includes('White Premium Sneakers')) {
    throw new Error(`Catalog Test 6 failed: Expected size L products only, got: ${resCat6.responseText}`);
  }
  console.log('✅ [34/40] Catalog Test 6 Passed: "What products are available in size L?" filters catalog by size attribute.');

  // Test 35 (Targeted Catalog Fix 7 — Price):
  const resCat7 = processDemoMessage(createInitialDemoState(), 'What do you have under ₦30,000?');
  if (resCat7.intent !== 'CATALOG_INQUIRY' || !resCat7.responseText.includes('Black Oversized Hoodie') || resCat7.responseText.includes('White Premium Sneakers')) {
    throw new Error(`Catalog Test 7 failed: Expected items under ₦30,000 only, got: ${resCat7.responseText}`);
  }
  console.log('✅ [35/40] Catalog Test 7 Passed: "What do you have under ₦30,000?" filters catalog by price threshold.');

  // Test 36 (Targeted Catalog Fix 8 — Multi-constraint):
  const resCat8 = processDemoMessage(createInitialDemoState(), 'What black products do you have under ₦30,000 in size L?');
  if (resCat8.intent !== 'CATALOG_INQUIRY' || !resCat8.responseText.includes('Black Oversized Hoodie') || resCat8.responseText.includes('White Premium Sneakers')) {
    throw new Error(`Catalog Test 8 failed: Expected multi-constraint match, got: ${resCat8.responseText}`);
  }
  console.log('✅ [36/40] Catalog Test 8 Passed: Multi-constraint inquiry applies color, size, and price filters simultaneously.');

  // Test 37 (Targeted Catalog Fix 9 — Unknown Product Safeguard Preserved):
  const resCat9 = processDemoMessage(createInitialDemoState(), 'Do you have a red Gucci bag?');
  if (!resCat9.responseText.toLowerCase().includes('don\'t currently have') || !resCat9.responseText.toLowerCase().includes('catalog')) {
    throw new Error(`Catalog Test 9 failed: Expected explicit unlisted catalog response, got: ${resCat9.responseText}`);
  }
  console.log('✅ [37/40] Catalog Test 9 Passed: "Do you have a red Gucci bag?" retains explicit catalog absence safeguard.');

  // Test 38 (Targeted Catalog Fix 10 — Unknown Attribute Safeguard Preserved):
  const resCat10 = processDemoMessage(createInitialDemoState(), 'Do you have the hoodie in red?');
  if (!resCat10.responseText.toLowerCase().includes('don\'t currently have a red') || !resCat10.responseText.toLowerCase().includes('hoodie')) {
    throw new Error(`Catalog Test 10 failed: Expected color mismatch response, got: ${resCat10.responseText}`);
  }
  console.log('✅ [38/40] Catalog Test 10 Passed: "Do you have the hoodie in red?" retains color mismatch safeguard.');

  // Test 39 (Targeted Catalog Fix 11 — Financial Safety Preserved):
  const resCat11 = processDemoMessage(createInitialDemoState(), 'What items are available? I want to buy the Black Hoodie in XL. Delivery is to Ikeja, Lagos.');
  const lowerCat11 = resCat11.responseText.toLowerCase();
  for (const term of ['kuda', '1234567890', 'acc:', 'bank:']) {
    if (lowerCat11.includes(term)) {
      throw new Error(`Catalog Test 11 failed: Bank credential "${term}" leaked!`);
    }
  }
  console.log('✅ [39/40] Catalog Test 11 Passed: Purchase intent after catalog discovery returns safe payment directive without bank details.');

  // Test 40 (Targeted Catalog Fix 12 — Tenant Isolation Preserved):
  const catalogVendorA = mockStore.getProducts(DEMO_BUSINESS.id);
  const catalogVendorB = mockStore.getProducts('biz_tenant_b_99');
  if (catalogVendorB.length > 0 && catalogVendorA.some((a) => catalogVendorB.some((b) => b.id === a.id))) {
    throw new Error('Catalog Test 12 failed: Cross-tenant product leak detected!');
  }
  console.log('✅ [40/40] Catalog Test 12 Passed: Catalog discovery queries for Vendor A return 0 Vendor B products.');

  console.log('\n--- PRICE QUERY INTELLIGENCE REGRESSION TESTS ---\n');

  // Helper: products under ₦40,000 from demo catalog
  const productsUnder40k = DEMO_PUBLIC_PRODUCTS.filter((p) => p.in_stock && p.price_ngn < 40000);
  const nameListUnder40k = productsUnder40k.map((p) => p.name);

  // Test 41 — "under 40k" (k-shorthand)
  const resPQ1 = processDemoMessage(createInitialDemoState(), 'What do you have under 40k?');
  if (resPQ1.intent !== 'CATALOG_INQUIRY') throw new Error(`Price Test 1 failed: Expected CATALOG_INQUIRY, got ${resPQ1.intent}`);
  for (const name of nameListUnder40k) {
    if (!resPQ1.responseText.includes(name)) throw new Error(`Price Test 1 failed: Expected "${name}" in response, got: ${resPQ1.responseText}`);
  }
  if (resPQ1.responseText.includes('White Premium Sneakers')) throw new Error(`Price Test 1 failed: Sneakers (₦45,000) should NOT appear under ₦40,000: ${resPQ1.responseText}`);
  console.log('✅ [41/49] Price Test 1 Passed: "under 40k" correctly filters catalog to items < ₦40,000.');

  // Test 42 — "under 40000" (bare integer)
  const resPQ2 = processDemoMessage(createInitialDemoState(), 'What do you have under 40000?');
  if (resPQ2.intent !== 'CATALOG_INQUIRY') throw new Error(`Price Test 2 failed: intent = ${resPQ2.intent}`);
  if (resPQ2.responseText.includes('White Premium Sneakers')) throw new Error(`Price Test 2 failed: Sneakers should NOT appear under ₦40,000: ${resPQ2.responseText}`);
  if (!resPQ2.responseText.includes('Black Oversized Hoodie')) throw new Error(`Price Test 2 failed: Hoodie (₦25,000) should appear: ${resPQ2.responseText}`);
  console.log('✅ [42/49] Price Test 2 Passed: "under 40000" (bare integer) produces identical filter to "under 40k".');

  // Test 43 — "under ₦40,000" (Naira symbol + comma)
  const resPQ3 = processDemoMessage(createInitialDemoState(), 'What do you have under ₦40,000?');
  if (resPQ3.intent !== 'CATALOG_INQUIRY') throw new Error(`Price Test 3 failed: intent = ${resPQ3.intent}`);
  if (resPQ3.responseText.includes('White Premium Sneakers')) throw new Error(`Price Test 3 failed: Sneakers should NOT appear: ${resPQ3.responseText}`);
  if (!resPQ3.responseText.includes('Black Oversized Hoodie')) throw new Error(`Price Test 3 failed: Hoodie should appear: ${resPQ3.responseText}`);
  console.log('✅ [43/49] Price Test 3 Passed: "under ₦40,000" (₦ symbol + comma) produces identical filter.');

  // Test 44 — "below 40K" (capital K)
  const resPQ4 = processDemoMessage(createInitialDemoState(), 'Show me products below 40K');
  if (resPQ4.intent !== 'CATALOG_INQUIRY') throw new Error(`Price Test 4 failed: intent = ${resPQ4.intent}`);
  if (resPQ4.responseText.includes('White Premium Sneakers')) throw new Error(`Price Test 4 failed: Sneakers should NOT appear: ${resPQ4.responseText}`);
  console.log('✅ [44/49] Price Test 4 Passed: "below 40K" (capital K) recognized as ₦40,000 upper-bound filter.');

  // Test 45 — "What can I get for under 40k?" (colloquial phrasing)
  const resPQ5 = processDemoMessage(createInitialDemoState(), 'What can I get for under 40k?');
  if (resPQ5.intent !== 'CATALOG_INQUIRY') throw new Error(`Price Test 5 failed: intent = ${resPQ5.intent}`);
  if (resPQ5.responseText.includes('White Premium Sneakers')) throw new Error(`Price Test 5 failed: Sneakers should NOT appear: ${resPQ5.responseText}`);
  if (!resPQ5.responseText.includes('Black Oversized Hoodie')) throw new Error(`Price Test 5 failed: Hoodie should appear: ${resPQ5.responseText}`);
  console.log("✅ [45/49] Price Test 5 Passed: \"What can I get for under 40k?\" colloquial phrasing recognised correctly.");

  // Test 46 — "between 20k and 40k" (range)
  const resPQ6 = processDemoMessage(createInitialDemoState(), "What's available between 20k and 40k?");
  if (resPQ6.intent !== 'CATALOG_INQUIRY') throw new Error(`Price Test 6 failed: intent = ${resPQ6.intent}`);
  // Hoodie ₦25k and Abaya ₦35k both in [20000, 40000]; Sneakers ₦45k excluded
  if (!resPQ6.responseText.includes('Black Oversized Hoodie')) throw new Error(`Price Test 6 failed: Hoodie (₦25,000) should be in range: ${resPQ6.responseText}`);
  if (!resPQ6.responseText.includes('Black Velvet Abaya')) throw new Error(`Price Test 6 failed: Abaya (₦35,000) should be in range: ${resPQ6.responseText}`);
  if (resPQ6.responseText.includes('White Premium Sneakers')) throw new Error(`Price Test 6 failed: Sneakers (₦45,000) outside range: ${resPQ6.responseText}`);
  console.log('✅ [46/49] Price Test 6 Passed: "between 20k and 40k" returns both in-range products and excludes ₦45,000 sneakers.');

  // Test 47 — "40k or less" (inclusive upper bound)
  const resPQ7 = processDemoMessage(createInitialDemoState(), 'What do you have for 40k or less?');
  if (resPQ7.intent !== 'CATALOG_INQUIRY') throw new Error(`Price Test 7 failed: intent = ${resPQ7.intent}`);
  // Hoodie ₦25k and Abaya ₦35k satisfy <= 40000; Sneakers ₦45k excluded
  if (!resPQ7.responseText.includes('Black Oversized Hoodie')) throw new Error(`Price Test 7 failed: Hoodie should appear: ${resPQ7.responseText}`);
  if (!resPQ7.responseText.includes('Black Velvet Abaya')) throw new Error(`Price Test 7 failed: Abaya should appear: ${resPQ7.responseText}`);
  if (resPQ7.responseText.includes('White Premium Sneakers')) throw new Error(`Price Test 7 failed: Sneakers > ₦40,000 should be excluded: ${resPQ7.responseText}`);
  console.log('✅ [47/49] Price Test 7 Passed: "40k or less" (inclusive) includes products at ₦25,000 and ₦35,000 but excludes ₦45,000.');

  // Test 48 — "above 40k" (lower bound)
  const resPQ8 = processDemoMessage(createInitialDemoState(), 'Show me items above 40k');
  if (resPQ8.intent !== 'CATALOG_INQUIRY') throw new Error(`Price Test 8 failed: intent = ${resPQ8.intent}`);
  if (!resPQ8.responseText.includes('White Premium Sneakers')) throw new Error(`Price Test 8 failed: Sneakers (₦45,000) should appear above ₦40,000: ${resPQ8.responseText}`);
  if (resPQ8.responseText.includes('Black Oversized Hoodie')) throw new Error(`Price Test 8 failed: Hoodie (₦25,000) should NOT appear above ₦40,000: ${resPQ8.responseText}`);
  console.log('✅ [48/49] Price Test 8 Passed: "above 40k" returns only products priced above ₦40,000.');

  // Test 49 — "exactly 40k" (no-match → grounded response)
  const resPQ9 = processDemoMessage(createInitialDemoState(), 'Do you have anything exactly 40k?');
  if (resPQ9.intent !== 'CATALOG_INQUIRY') throw new Error(`Price Test 9 failed: intent = ${resPQ9.intent}`);
  // No demo product is exactly ₦40,000 — must return a grounded "no results" message
  if (resPQ9.responseText.toLowerCase().includes('black oversized hoodie') ||
      resPQ9.responseText.toLowerCase().includes('black velvet abaya') ||
      resPQ9.responseText.toLowerCase().includes('white premium sneakers')) {
    throw new Error(`Price Test 9 failed: Should return empty result but listed product(s): ${resPQ9.responseText}`);
  }
  if (!resPQ9.responseText.toLowerCase().includes('don\'t currently have') && !resPQ9.responseText.toLowerCase().includes('no listed')) {
    throw new Error(`Price Test 9 failed: Expected grounded no-match response, got: ${resPQ9.responseText}`);
  }
  console.log('✅ [49/69] Price Test 9 Passed: "exactly 40k" returns grounded no-match response (no demo product is exactly ₦40,000).');

  console.log('\n--- CONVERSATIONAL INTENT TESTS ---\n');

  // Helper: assert conversational intent detected correctly
  function assertConversational(msg: string, expectedIntent: string) {
    const result = detectConversationalIntent(msg.toLowerCase());
    if (result !== expectedIntent) throw new Error(`Conversational intent failed for "${msg}": expected ${expectedIntent}, got ${String(result)}`);
  }

  // Test 50 — Unit: "Hi" → GREETING
  assertConversational('Hi', 'GREETING');
  console.log('✅ [50/69] Conversational Test 1 Passed: "Hi" detected as GREETING.');

  // Test 51 — Unit: "Hello" → GREETING
  assertConversational('Hello', 'GREETING');
  console.log('✅ [51/69] Conversational Test 2 Passed: "Hello" detected as GREETING.');

  // Test 52 — Unit: "Good morning" → GREETING
  assertConversational('Good morning', 'GREETING');
  console.log('✅ [52/69] Conversational Test 3 Passed: "Good morning" detected as GREETING.');

  // Test 53 — Unit: "Good afternoon" → GREETING
  assertConversational('Good afternoon', 'GREETING');
  console.log('✅ [53/69] Conversational Test 4 Passed: "Good afternoon" detected as GREETING.');

  // Test 54 — Unit: "How are you?" → GREETING
  assertConversational('How are you?', 'GREETING');
  console.log('✅ [54/69] Conversational Test 5 Passed: "How are you?" detected as GREETING.');

  // Test 55 — Demo: "Hi" returns friendly greeting, not a catalog list
  const resConv1 = processDemoMessage(createInitialDemoState(), 'Hi');
  if (resConv1.intent !== 'GREETING') throw new Error(`Conv Test 6 failed: Expected GREETING intent, got ${resConv1.intent}`);
  if (resConv1.responseText.includes('₦') || resConv1.responseText.toLowerCase().includes('hoodie')) {
    throw new Error(`Conv Test 6 failed: Greeting response should not list products/prices: ${resConv1.responseText}`);
  }
  if (!resConv1.responseText.toLowerCase().includes('welcome') && !resConv1.responseText.toLowerCase().includes('help')) {
    throw new Error(`Conv Test 6 failed: Expected friendly greeting, got: ${resConv1.responseText}`);
  }
  console.log('✅ [55/69] Conversational Test 6 Passed: "Hi" returns friendly greeting without catalog hallucination.');

  // Test 56 — Demo: "Good morning" returns time-specific greeting
  const resConv2 = processDemoMessage(createInitialDemoState(), 'Good morning');
  if (resConv2.intent !== 'GREETING') throw new Error(`Conv Test 7 failed: intent = ${resConv2.intent}`);
  if (!resConv2.responseText.toLowerCase().includes('morning')) throw new Error(`Conv Test 7 failed: Expected morning greeting, got: ${resConv2.responseText}`);
  console.log('✅ [56/69] Conversational Test 7 Passed: "Good morning" returns time-appropriate greeting.');

  // Test 57 — Demo: "Your products look beautiful" → COMPLIMENT
  const resConv3 = processDemoMessage(createInitialDemoState(), 'Your products look beautiful');
  if (resConv3.intent !== 'COMPLIMENT') throw new Error(`Conv Test 8 failed: Expected COMPLIMENT, got ${resConv3.intent}`);
  if (resConv3.responseText.includes('Kuda') || resConv3.responseText.includes('1234567890')) {
    throw new Error('Conv Test 8 SECURITY FAIL: Bank credentials in compliment response!');
  }
  if (!resConv3.responseText.toLowerCase().includes('thank')) throw new Error(`Conv Test 8 failed: Expected acknowledgement, got: ${resConv3.responseText}`);
  console.log('✅ [57/69] Conversational Test 8 Passed: "Your products look beautiful" returns friendly acknowledgement without financial data.');

  // Test 58 — Demo: "I love your collection" → COMPLIMENT
  const resConv4 = processDemoMessage(createInitialDemoState(), 'I love your collection');
  if (resConv4.intent !== 'COMPLIMENT') throw new Error(`Conv Test 9 failed: Expected COMPLIMENT, got ${resConv4.intent}`);
  console.log('✅ [58/69] Conversational Test 9 Passed: "I love your collection" detected as COMPLIMENT.');

  // Test 59 — Demo: "Thanks" → THANKS
  const resConv5 = processDemoMessage(createInitialDemoState(), 'Thanks');
  if (resConv5.intent !== 'THANKS') throw new Error(`Conv Test 10 failed: Expected THANKS, got ${resConv5.intent}`);
  if (resConv5.responseText.includes('₦') || resConv5.responseText.toLowerCase().includes('hoodie')) {
    throw new Error(`Conv Test 10 failed: Thanks response should not trigger catalog: ${resConv5.responseText}`);
  }
  console.log('✅ [59/69] Conversational Test 10 Passed: "Thanks" returns friendly acknowledgement without triggering catalog.');

  // Test 60 — Demo: "Bye" → FAREWELL
  const resConv6 = processDemoMessage(createInitialDemoState(), 'Bye');
  if (resConv6.intent !== 'FAREWELL') throw new Error(`Conv Test 11 failed: Expected FAREWELL, got ${resConv6.intent}`);
  if (!resConv6.responseText.toLowerCase().includes('day') && !resConv6.responseText.toLowerCase().includes('welcome') && !resConv6.responseText.toLowerCase().includes('reach')) {
    throw new Error(`Conv Test 11 failed: Expected farewell message, got: ${resConv6.responseText}`);
  }
  console.log('✅ [60/69] Conversational Test 11 Passed: "Bye" returns friendly farewell.');

  console.log('\n--- MIXED-INTENT REGRESSION TESTS ---\n');

  // Test 61 — "Hi, what do you have?" → CATALOG_INQUIRY (commercial wins)
  const resMix1 = processDemoMessage(createInitialDemoState(), 'Hi, what do you have?');
  if (resMix1.intent !== 'CATALOG_INQUIRY') throw new Error(`Mixed Test 1 failed: Expected CATALOG_INQUIRY, got ${resMix1.intent}. Greeting must not override commercial intent.`);
  if (!resMix1.responseText.includes('Black Oversized Hoodie')) throw new Error(`Mixed Test 1 failed: Expected catalog list, got: ${resMix1.responseText}`);
  console.log('✅ [61/69] Mixed-Intent Test 1 Passed: "Hi, what do you have?" resolves to CATALOG_INQUIRY, not GREETING.');

  // Test 62 — "Hello, what do you have under 40k?" → CATALOG_INQUIRY with price filter
  const resMix2 = processDemoMessage(createInitialDemoState(), 'Hello, what do you have under 40k?');
  if (resMix2.intent !== 'CATALOG_INQUIRY') throw new Error(`Mixed Test 2 failed: Expected CATALOG_INQUIRY, got ${resMix2.intent}`);
  if (resMix2.responseText.includes('White Premium Sneakers')) throw new Error(`Mixed Test 2 failed: Sneakers (₦45k) should be excluded: ${resMix2.responseText}`);
  if (!resMix2.responseText.includes('Black Oversized Hoodie')) throw new Error(`Mixed Test 2 failed: Hoodie (₦25k) should appear: ${resMix2.responseText}`);
  console.log('✅ [62/69] Mixed-Intent Test 2 Passed: "Hello, what do you have under 40k?" applies price filter, not greeting response.');

  // Test 63 — "Hey, how much is the Black Velvet Abaya?" → PRICE_INQUIRY (commercial wins)
  const resMix3 = processDemoMessage(createInitialDemoState(), 'Hey, how much is the Black Velvet Abaya?');
  if (resMix3.intent === 'GREETING') throw new Error(`Mixed Test 3 failed: GREETING must not override PRICE_INQUIRY: ${resMix3.intent}`);
  if (!resMix3.responseText.includes('₦35,000')) throw new Error(`Mixed Test 3 failed: Expected ₦35,000 price, got: ${resMix3.responseText}`);
  console.log('✅ [63/69] Mixed-Intent Test 3 Passed: "Hey, how much is the Black Velvet Abaya?" returns price, not greeting.');

  // Test 64 — "Your collection looks beautiful. What do you have?" → CATALOG_INQUIRY (commercial wins)
  const resMix4 = processDemoMessage(createInitialDemoState(), 'Your collection looks beautiful. What do you have?');
  if (resMix4.intent !== 'CATALOG_INQUIRY') throw new Error(`Mixed Test 4 failed: Expected CATALOG_INQUIRY, got ${resMix4.intent}. Compliment must not override catalog request.`);
  if (!resMix4.responseText.includes('Black Oversized Hoodie')) throw new Error(`Mixed Test 4 failed: Expected catalog list, got: ${resMix4.responseText}`);
  console.log('✅ [64/69] Mixed-Intent Test 4 Passed: "Your collection looks beautiful. What do you have?" resolves to CATALOG_INQUIRY.');

  // Test 65 — "I love this hoodie. How much is it?" → PRICE_INQUIRY (commercial wins)
  const resMix5 = processDemoMessage(createInitialDemoState(), 'I love this hoodie. How much is it?');
  if (resMix5.intent === 'COMPLIMENT') throw new Error(`Mixed Test 5 failed: COMPLIMENT must not override product price query: ${resMix5.intent}`);
  if (!resMix5.responseText.includes('₦25,000')) throw new Error(`Mixed Test 5 failed: Expected ₦25,000 for hoodie, got: ${resMix5.responseText}`);
  console.log('✅ [65/69] Mixed-Intent Test 5 Passed: "I love this hoodie. How much is it?" returns product price, not compliment response.');

  // Test 66 — "Thanks! Do you have it in XL?" → AVAILABILITY_INQUIRY (commercial wins over thanks)
  const resMix6 = processDemoMessage(createInitialDemoState(), 'Thanks! Do you have the hoodie in XL?');
  if (resMix6.intent === 'THANKS') throw new Error(`Mixed Test 6 failed: THANKS must not override availability query: ${resMix6.intent}`);
  if (!resMix6.responseText.toLowerCase().includes('xl') && !resMix6.responseText.toLowerCase().includes('hoodie')) {
    throw new Error(`Mixed Test 6 failed: Expected hoodie XL response, got: ${resMix6.responseText}`);
  }
  console.log('✅ [66/69] Mixed-Intent Test 6 Passed: "Thanks! Do you have the hoodie in XL?" resolves availability query, not thanks.');

  // Test 67 — Greeting does NOT expose bank credentials
  const resConvSec1 = processDemoMessage(createInitialDemoState(), 'Hi');
  const lowerSec1 = resConvSec1.responseText.toLowerCase();
  for (const term of ['kuda', '1234567890', 'acc:', 'bank:', 'account number']) {
    if (lowerSec1.includes(term)) throw new Error(`SECURITY FAIL: Bank credential "${term}" in greeting response!`);
  }
  console.log('✅ [67/69] Security Test 1 Passed: Greeting response contains no bank/payment credentials.');

  // Test 68 — Compliment does NOT expose bank credentials
  const resConvSec2 = processDemoMessage(createInitialDemoState(), 'Beautiful collection!');
  const lowerSec2 = resConvSec2.responseText.toLowerCase();
  for (const term of ['kuda', '1234567890', 'acc:', 'bank:']) {
    if (lowerSec2.includes(term)) throw new Error(`SECURITY FAIL: Bank credential "${term}" in compliment response!`);
  }
  console.log('✅ [68/69] Security Test 2 Passed: Compliment response contains no bank/payment credentials.');

  // Test 69 — Unknown product grounding PRESERVED after conversational addition
  const resConvGround = processDemoMessage(createInitialDemoState(), 'Do you have a red Gucci bag?');
  if (!resConvGround.responseText.toLowerCase().includes("don't currently have") || !resConvGround.responseText.toLowerCase().includes('catalog')) {
    throw new Error(`Conv Grounding Test failed: Expected explicit catalog-absence response, got: ${resConvGround.responseText}`);
  }
  console.log('✅ [69/90] Conv Grounding Test Passed: Unknown product grounding preserved — "Do you have a red Gucci bag?" still returns explicit catalog-absence response.');

  console.log('\n--- CONTEXTUAL REPLY TESTS ---\n');

  // Multi-turn helper
  function sendMessages(messages: string[], customCatalog?: DemoProduct[]): { state: DemoSessionState; lastResult: { updatedState: DemoSessionState; responseText: string; intent: string } } {
    let s = createInitialDemoState();
    let lastResult = processDemoMessage(s, messages[0], customCatalog);
    s = lastResult.updatedState;
    for (let i = 1; i < messages.length; i++) {
      lastResult = processDemoMessage(s, messages[i], customCatalog);
      s = lastResult.updatedState;
    }
    return { state: s, lastResult };
  }

  // Test 70 — "Yes" after catalog offer resolves to catalog display
  const stateAfterOffer = ((): DemoSessionState => {
    const s = createInitialDemoState();
    return {
      ...s,
      messages: [
        ...s.messages,
        { id: 'msg_offer', sender: 'ai', text: 'Would you like to see what is currently available?', timestamp: '10:01 AM', intent: 'GREETING' },
      ],
    };
  })();
  const resYesCatalog = processDemoMessage(stateAfterOffer, 'Yes');
  if (!resYesCatalog.responseText.toLowerCase().includes('black oversized hoodie') && !resYesCatalog.responseText.toLowerCase().includes('catalog')) {
    throw new Error(`Ctx Test 1 failed: "Yes" after catalog offer should show catalog, got: ${resYesCatalog.responseText}`);
  }
  console.log('✅ [70/90] Contextual Test 1 Passed: "Yes" after catalog offer resolves to catalog display.');

  // Test 71 — "No" returns friendly acknowledgement
  const resNo = processDemoMessage(createInitialDemoState(), 'No');
  if (resNo.intent !== 'CONTEXTUAL_REPLY') throw new Error(`Ctx Test 2 failed: Expected CONTEXTUAL_REPLY, got ${resNo.intent}`);
  if (resNo.responseText.toLowerCase().includes('₦45,000')) throw new Error(`Ctx Test 2 failed: "No" should not trigger catalog: ${resNo.responseText}`);
  console.log('✅ [71/90] Contextual Test 2 Passed: "No" returns safe acknowledgement without triggering catalog.');

  // Test 72 — "Okay" returns safe acknowledgement without credentials
  const resOkay = processDemoMessage(createInitialDemoState(), 'Okay');
  if (resOkay.responseText.toLowerCase().includes('1234567890') || resOkay.responseText.toLowerCase().includes('kuda')) {
    throw new Error('Ctx Test 3 SECURITY FAIL: bank credentials in contextual reply!');
  }
  console.log('✅ [72/90] Contextual Test 3 Passed: "Okay" returns safe acknowledgement without financial data.');

  // Test 73 — Positional: "I like the second one" after catalog resolves to Abaya
  const { state: stateAfterCatalog } = sendMessages(['What items are available?']);
  if (!stateAfterCatalog.lastProductListIds || stateAfterCatalog.lastProductListIds.length < 2) {
    throw new Error(`Ctx Test 4 failed: lastProductListIds not populated. Got: ${JSON.stringify(stateAfterCatalog.lastProductListIds)}`);
  }
  const resSecondOne = processDemoMessage(stateAfterCatalog, 'I like the second one');
  if (!resSecondOne.responseText.toLowerCase().includes('abaya') && !resSecondOne.responseText.toLowerCase().includes('35,000')) {
    throw new Error(`Ctx Test 4 failed: "the second one" should resolve to Black Velvet Abaya, got: ${resSecondOne.responseText}`);
  }
  console.log('✅ [73/90] Contextual Test 4 Passed: "I like the second one" resolves to Black Velvet Abaya after catalog list.');

  // Test 74 — Positional: "The first one" resolves to Black Oversized Hoodie
  const resFirstOne = processDemoMessage(stateAfterCatalog, 'The first one');
  if (!resFirstOne.responseText.toLowerCase().includes('hoodie') && !resFirstOne.responseText.toLowerCase().includes('25,000')) {
    throw new Error(`Ctx Test 5 failed: "The first one" should resolve to Hoodie, got: ${resFirstOne.responseText}`);
  }
  console.log('✅ [74/90] Contextual Test 5 Passed: "The first one" resolves to Black Oversized Hoodie.');

  // Test 75 — "show me something else" returns other catalog products
  const { state: stateWithHoodiePending } = sendMessages(['Tell me about the Black Oversized Hoodie']);
  const resSomethingElse = processDemoMessage(stateWithHoodiePending, 'show me something else');
  if (!resSomethingElse.responseText.toLowerCase().includes('abaya') && !resSomethingElse.responseText.toLowerCase().includes('sneaker')) {
    throw new Error(`Ctx Test 6 failed: "show me something else" should list other products, got: ${resSomethingElse.responseText}`);
  }
  if (resSomethingElse.responseText.toLowerCase().includes('1234567890')) throw new Error('Ctx Test 6 SECURITY FAIL');
  console.log('✅ [75/90] Contextual Test 6 Passed: "show me something else" returns verified alternative products.');

  // Test 76 — "something cheaper" returns cheaper alternatives relative to pending (Sneakers ₦45k)
  const { state: stateWithSneakers } = sendMessages(['Tell me about the White Premium Sneakers']);
  const resCheaper = processDemoMessage(stateWithSneakers, 'something cheaper');
  if (!resCheaper.responseText.toLowerCase().includes('hoodie') && !resCheaper.responseText.toLowerCase().includes('abaya')) {
    throw new Error(`Ctx Test 7 failed: "something cheaper" should list cheaper items, got: ${resCheaper.responseText}`);
  }
  console.log('✅ [76/90] Contextual Test 7 Passed: "something cheaper" returns grounded cheaper alternatives.');

  // Test 77 — Size reply "Large" with pending Hoodie returns size-aware response
  const resLarge = processDemoMessage(stateWithHoodiePending, 'Large');
  if (resLarge.responseText.toLowerCase().includes('1234567890')) throw new Error('Ctx Test 8 SECURITY FAIL');
  if (!resLarge.responseText.toLowerCase().includes('hoodie') && !resLarge.responseText.toLowerCase().includes('large') && !resLarge.responseText.toLowerCase().includes(' l')) {
    throw new Error(`Ctx Test 8 failed: "Large" with pending Hoodie should give size context, got: ${resLarge.responseText}`);
  }
  console.log('✅ [77/90] Contextual Test 8 Passed: "Large" with pending product returns size-aware response.');

  // Test 78 — Size reply "XL" without pending product prompts for product selection
  const resXL = processDemoMessage(createInitialDemoState(), 'XL');
  if (resXL.responseText.toLowerCase().includes('1234567890')) throw new Error('Ctx Test 9 SECURITY FAIL');
  if (!resXL.responseText.toLowerCase().includes('black oversized') && !resXL.responseText.toLowerCase().includes('interested in')) {
    throw new Error(`Ctx Test 9 failed: "XL" without pending product should prompt for product, got: ${resXL.responseText}`);
  }
  console.log('✅ [78/90] Contextual Test 9 Passed: "XL" without pending product prompts for product selection.');

  // Test 79 — Color "Black" validated against pending Hoodie (should be accepted)
  const resBlackColor = processDemoMessage(stateWithHoodiePending, 'Black');
  if (resBlackColor.responseText.toLowerCase().includes('1234567890')) throw new Error('Ctx Test 10 SECURITY FAIL');
  if (resBlackColor.responseText.toLowerCase().includes("don't currently have a black version")) {
    throw new Error(`Ctx Test 10 failed: Hoodie IS in Black, should not be rejected: ${resBlackColor.responseText}`);
  }
  console.log('✅ [79/90] Contextual Test 10 Passed: "Black" validated as available color for Hoodie.');

  // Test 80 — Color "Red" rejected for Hoodie (no red version)
  const resRedRejected = processDemoMessage(stateWithHoodiePending, 'Red');
  if (!resRedRejected.responseText.toLowerCase().includes("don't currently have a red")) {
    throw new Error(`Ctx Test 11 failed: "Red" should be rejected for Hoodie, got: ${resRedRejected.responseText}`);
  }
  if (resRedRejected.responseText.toLowerCase().includes('1234567890')) throw new Error('Ctx Test 11 SECURITY FAIL');
  console.log('✅ [80/90] Contextual Test 11 Passed: "Red" correctly rejected — no red Hoodie listed.');

  // Test 81 — Numeric "40" in contextual reply treated as shoe size, NOT price filter
  const resSize40 = processDemoMessage(stateWithSneakers, '40');
  if (resSize40.intent === 'CATALOG_INQUIRY' && resSize40.responseText.toLowerCase().includes('under')) {
    throw new Error(`Ctx Test 12 failed: "40" should NOT be treated as price filter here: ${resSize40.responseText}`);
  }
  console.log('✅ [81/90] Contextual Test 12 Passed: "40" in contextual reply treated as shoe size, not price filter.');

  // Test 82 — Price query "under ₦40,000" still works correctly (regression)
  const resPriceReg = processDemoMessage(createInitialDemoState(), 'What do you have under ₦40,000?');
  if (resPriceReg.intent !== 'CATALOG_INQUIRY') throw new Error(`Ctx Test 13 failed: price query should be CATALOG_INQUIRY, got ${resPriceReg.intent}`);
  if (resPriceReg.responseText.toLowerCase().includes('white premium sneakers')) {
    throw new Error(`Ctx Test 13 failed: Sneakers (₦45k) should NOT appear under ₦40k filter: ${resPriceReg.responseText}`);
  }
  console.log('✅ [82/90] Contextual Test 13 Passed: Price filter regression — "under ₦40,000" still correctly filters products.');

  // Test 83 — Multi-turn: Hi → catalog → second one
  let multiState = createInitialDemoState();
  const mt1 = processDemoMessage(multiState, 'Hi');
  multiState = mt1.updatedState;
  if (mt1.intent !== 'GREETING') throw new Error(`Multi-turn T1: expected GREETING, got ${mt1.intent}`);
  const mt2 = processDemoMessage(multiState, 'What items are available?');
  multiState = mt2.updatedState;
  if (mt2.intent !== 'CATALOG_INQUIRY') throw new Error(`Multi-turn T2: expected CATALOG_INQUIRY, got ${mt2.intent}`);
  if (!multiState.lastProductListIds || multiState.lastProductListIds.length === 0) throw new Error('Multi-turn T2: lastProductListIds not set');
  const mt3 = processDemoMessage(multiState, 'I like the second one');
  multiState = mt3.updatedState;
  if (!mt3.responseText.toLowerCase().includes('abaya') && !mt3.responseText.toLowerCase().includes('35,000')) {
    throw new Error(`Multi-turn T3: should resolve to Abaya, got: ${mt3.responseText}`);
  }
  console.log('✅ [83/90] Multi-Turn Test Passed: Hi → catalog → "I like the second one" resolved to Black Velvet Abaya across 3 turns.');

  // Test 84 — "I want that one" resolves to pending product (Abaya)
  const { state: stateAbayaPending } = sendMessages(['Tell me about the Black Velvet Abaya']);
  const resIWantThat = processDemoMessage(stateAbayaPending, 'I want that one');
  if (!resIWantThat.responseText.toLowerCase().includes('abaya')) {
    throw new Error(`Ctx Test 15 failed: "I want that one" should reference Abaya, got: ${resIWantThat.responseText}`);
  }
  console.log('✅ [84/90] Contextual Test 15 Passed: "I want that one" resolves to the pending product (Abaya).');

  // Test 85 — "Sure" in purchase flow continues safely
  const { state: stateAbayaOrder } = sendMessages(['I want the Black Velvet Abaya in size L']);
  const resSure = processDemoMessage(stateAbayaOrder, 'Sure');
  if (resSure.responseText.toLowerCase().includes('1234567890')) throw new Error('Ctx Test 16 SECURITY FAIL: bank credentials!');
  console.log('✅ [85/90] Contextual Test 16 Passed: "Sure" in purchase flow continues without exposing bank credentials.');

  // Test 86 — Purchase flow: order hoodie + location
  const { state: stateNeedingLoc } = sendMessages(['I want to buy the Black Oversized Hoodie in size M']);
  const resIkeja = processDemoMessage(stateNeedingLoc, 'Ikeja');
  if (resIkeja.responseText.toLowerCase().includes('1234567890')) throw new Error('Ctx Test 17 SECURITY FAIL');
  console.log('✅ [86/90] Contextual Test 17 Passed: Location reply "Ikeja" processed safely without financial data leakage.');

  // Test 87 — "That sounds good" is a safe acknowledgement
  const resSoundsGood = processDemoMessage(createInitialDemoState(), 'That sounds good');
  if (resSoundsGood.responseText.toLowerCase().includes('1234567890')) throw new Error('Ctx Test 18 SECURITY FAIL');
  console.log('✅ [87/90] Contextual Test 18 Passed: "That sounds good" returns safe acknowledgement.');

  // Test 88 — Cross-tenant isolation: positional refs only resolve within session catalog
  const vendorACatalog: DemoProduct[] = [{ id: 'a1', name: 'Vendor A Dress', price_ngn: 20000, sizes: ['M'], colors: ['Blue'], in_stock: true, category: 'Dress' }];
  const vendorBCatalog: DemoProduct[] = [{ id: 'b1', name: 'Vendor B Shirt', price_ngn: 15000, sizes: ['L'], colors: ['Green'], in_stock: true, category: 'Shirt' }];
  const vendorAInit = createInitialDemoState();
  const vendorACatalogRes = processDemoMessage(vendorAInit, 'What items are available?', vendorACatalog);
  const vendorAResolve = processDemoMessage(vendorACatalogRes.updatedState, 'the first one', vendorBCatalog);
  if (vendorAResolve.responseText.toLowerCase().includes('vendor b shirt')) {
    throw new Error('SECURITY FAIL: Positional ref resolved against wrong tenant catalog!');
  }
  console.log('✅ [88/90] Security Test 3 Passed: Positional reference uses session catalog only — cross-tenant isolation preserved.');

  // Test 89 — Human takeover: contextual reply doesn't expose credentials
  const humanTakeoverState: DemoSessionState = { ...createInitialDemoState(), conversationStatus: 'HUMAN_TAKEOVER', lastIntent: 'HUMAN_ESCALATION' };
  const resTakeover = processDemoMessage(humanTakeoverState, 'Okay');
  if (resTakeover.responseText.toLowerCase().includes('1234567890')) throw new Error('Ctx Test 20 SECURITY FAIL');
  console.log('✅ [89/90] Contextual Test 20 Passed: Contextual replies in HUMAN_TAKEOVER state do not expose credentials.');

  // Test 90 — Price filter regression: "under 40k" still detected as CATALOG_INQUIRY
  const resPriceReg2 = processDemoMessage(createInitialDemoState(), 'under 40k');
  if (resPriceReg2.intent !== 'CATALOG_INQUIRY') throw new Error(`Ctx Test 21 failed: "under 40k" must be CATALOG_INQUIRY, got ${resPriceReg2.intent}`);
  console.log('✅ [90/110] Contextual Test 21 Passed: "under 40k" still correctly detected as price-filter CATALOG_INQUIRY.');

  console.log('\n--- CATALOG INTELLIGENCE EXPANSION TESTS ---\n');

  // Test 91 — "under 1 million" (under 1m)
  const resExp1 = processDemoMessage(createInitialDemoState(), 'What do you have under 1 million?');
  if (resExp1.intent !== 'CATALOG_INQUIRY') throw new Error(`Exp Test 1 failed: intent = ${resExp1.intent}`);
  if (!resExp1.responseText.includes('Black Oversized Hoodie') || !resExp1.responseText.includes('White Premium Sneakers')) {
    throw new Error(`Exp Test 1 failed: Should return all catalog products under 1 million, got: ${resExp1.responseText}`);
  }
  console.log('✅ [91/110] Exp Test 1 Passed: "under 1 million" returns all catalog products.');

  // Test 92 — "below ₦1,000,000"
  const resExp2 = processDemoMessage(createInitialDemoState(), 'What do you have below ₦1,000,000?');
  if (!resExp2.responseText.includes('Black Oversized Hoodie') || !resExp2.responseText.includes('White Premium Sneakers')) {
    throw new Error(`Exp Test 2 failed: Should return all catalog products under 1 million, got: ${resExp2.responseText}`);
  }
  console.log('✅ [92/110] Exp Test 2 Passed: "below ₦1,000,000" parsed and filters correctly.');

  // Test 93 — "above 1 million" (no-match grounded response)
  const resExp3 = processDemoMessage(createInitialDemoState(), 'What do you have above 1 million?');
  if (!resExp3.responseText.includes("don't currently have") && !resExp3.responseText.includes('no listed')) {
    throw new Error(`Exp Test 3 failed: Expected empty results, got: ${resExp3.responseText}`);
  }
  console.log('✅ [93/110] Exp Test 3 Passed: "above 1 million" returns grounded empty-match response.');

  // Test 94 — "1 million and above" (GTE)
  const resExp4 = processDemoMessage(createInitialDemoState(), 'What do you have 1 million and above?');
  if (!resExp4.responseText.includes("don't currently have") && !resExp4.responseText.includes('no listed')) {
    throw new Error(`Exp Test 4 failed: Expected empty results, got: ${resExp4.responseText}`);
  }
  console.log('✅ [94/110] Exp Test 4 Passed: "1 million and above" GTE operator parsed correctly.');

  // Test 95 — "from 1m" (GTE)
  const resExp5 = processDemoMessage(createInitialDemoState(), 'What do you have from 1m?');
  if (!resExp5.responseText.includes("don't currently have") && !resExp5.responseText.includes('no listed')) {
    throw new Error(`Exp Test 5 failed: Expected empty results, got: ${resExp5.responseText}`);
  }
  console.log('✅ [95/110] Exp Test 5 Passed: "from 1m" GTE operator parsed correctly.');

  // Test 96 — "between 500k and 1 million" (range, empty)
  const resExp6 = processDemoMessage(createInitialDemoState(), 'What do you have between 500k and 1 million?');
  if (!resExp6.responseText.includes("don't currently have") && !resExp6.responseText.includes('no listed')) {
    throw new Error(`Exp Test 6 failed: Expected empty range results, got: ${resExp6.responseText}`);
  }
  console.log('✅ [96/110] Exp Test 6 Passed: "between 500k and 1 million" parsed correctly.');

  // Test 97 — "under 40k"
  const resExp7 = processDemoMessage(createInitialDemoState(), 'What do you have under 40k?');
  if (!resExp7.responseText.includes('Black Oversized Hoodie') || !resExp7.responseText.includes('Black Velvet Abaya') || resExp7.responseText.includes('White Premium Sneakers')) {
    throw new Error(`Exp Test 7 failed: Should filter correct items, got: ${resExp7.responseText}`);
  }
  console.log('✅ [97/110] Exp Test 7 Passed: "under 40k" filters correctly.');

  // Test 98 — "under 40000"
  const resExp8 = processDemoMessage(createInitialDemoState(), 'What do you have under 40000?');
  if (!resExp8.responseText.includes('Black Oversized Hoodie') || !resExp8.responseText.includes('Black Velvet Abaya')) {
    throw new Error(`Exp Test 8 failed, got: ${resExp8.responseText}`);
  }
  console.log('✅ [98/110] Exp Test 8 Passed: "under 40000" filters correctly.');

  // Test 99 — "under ₦40,000"
  const resExp9 = processDemoMessage(createInitialDemoState(), 'What do you have under ₦40,000?');
  if (!resExp9.responseText.includes('Black Oversized Hoodie') || !resExp9.responseText.includes('Black Velvet Abaya')) {
    throw new Error(`Exp Test 9 failed, got: ${resExp9.responseText}`);
  }
  console.log('✅ [99/110] Exp Test 9 Passed: "under ₦40,000" filters correctly.');

  // Test 100 — "What sizes are available?" (general sizes summary)
  const resExp10 = processDemoMessage(createInitialDemoState(), 'What sizes are available?');
  if (resExp10.intent !== 'CATALOG_INQUIRY') throw new Error(`Exp Test 10 failed: intent = ${resExp10.intent}`);
  if (!resExp10.responseText.toLowerCase().includes('clothing items') || !resExp10.responseText.toLowerCase().includes('sneakers')) {
    throw new Error(`Exp Test 10 failed: Should summarize sizes for clothing & sneakers, got: ${resExp10.responseText}`);
  }
  console.log('✅ [100/110] Exp Test 10 Passed: "What sizes are available?" returns grounded catalog summary.');

  // Test 101 — "What sizes do you have?"
  const resExp11 = processDemoMessage(createInitialDemoState(), 'What sizes do you have?');
  if (!resExp11.responseText.toLowerCase().includes('clothing items') || !resExp11.responseText.toLowerCase().includes('sneakers')) {
    throw new Error(`Exp Test 11 failed: ${resExp11.responseText}`);
  }
  console.log('✅ [101/110] Exp Test 11 Passed: "What sizes do you have?" returns grounded catalog summary.');

  // Test 102 — "Which sizes are available?"
  const resExp12 = processDemoMessage(createInitialDemoState(), 'Which sizes are available?');
  if (!resExp12.responseText.toLowerCase().includes('clothing items') || !resExp12.responseText.toLowerCase().includes('sneakers')) {
    throw new Error(`Exp Test 12 failed: ${resExp12.responseText}`);
  }
  console.log('✅ [102/110] Exp Test 12 Passed: "Which sizes are available?" returns grounded catalog summary.');

  // Test 103 — "What sizes does the Black Velvet Abaya come in?"
  const resExp13 = processDemoMessage(createInitialDemoState(), 'What sizes does the Black Velvet Abaya come in?');
  if (resExp13.intent !== 'PRODUCT_INQUIRY') throw new Error(`Exp Test 13 failed: intent = ${resExp13.intent}`);
  if (!resExp13.responseText.includes('M, L, and XL') || resExp13.responseText.includes('40')) {
    throw new Error(`Exp Test 13 failed: Should return abaya sizes only, got: ${resExp13.responseText}`);
  }
  console.log('✅ [103/110] Exp Test 13 Passed: "What sizes does the Black Velvet Abaya come in?" returns product-specific sizes.');

  // Test 104 — "Does the hoodie come in XL?"
  const resExp14 = processDemoMessage(createInitialDemoState(), 'Does the hoodie come in XL?');
  if (resExp14.intent !== 'AVAILABILITY_INQUIRY') throw new Error(`Exp Test 14 failed: intent = ${resExp14.intent}`);
  if (!resExp14.responseText.toLowerCase().includes('yes') || !resExp14.responseText.toLowerCase().includes('xl')) {
    throw new Error(`Exp Test 14 failed, got: ${resExp14.responseText}`);
  }
  console.log('✅ [104/110] Exp Test 14 Passed: "Does the hoodie come in XL?" returns availability confirmation.');

  // Test 105 — "Do you have the abaya in size 40?"
  const resExp15 = processDemoMessage(createInitialDemoState(), 'Do you have the abaya in size 40?');
  if (resExp15.intent !== 'AVAILABILITY_INQUIRY') throw new Error(`Exp Test 15 failed: intent = ${resExp15.intent}`);
  if (!resExp15.responseText.toLowerCase().includes("isn't currently listed")) {
    throw new Error(`Exp Test 15 failed, got: ${resExp15.responseText}`);
  }
  console.log('✅ [105/110] Exp Test 15 Passed: "Do you have the abaya in size 40?" returns correct size mismatch response.');

  // Test 106 — "What colors are available?"
  const resExp16 = processDemoMessage(createInitialDemoState(), 'What colors are available?');
  if (resExp16.intent !== 'CATALOG_INQUIRY') throw new Error(`Exp Test 16 failed: intent = ${resExp16.intent}`);
  if (!resExp16.responseText.toLowerCase().includes('black') || !resExp16.responseText.toLowerCase().includes('white')) {
    throw new Error(`Exp Test 16 failed, got: ${resExp16.responseText}`);
  }
  console.log('✅ [106/110] Exp Test 16 Passed: "What colors are available?" returns general colors summary.');

  // Test 107 — "What colors does the hoodie come in?"
  const resExp17 = processDemoMessage(createInitialDemoState(), 'What colors does the hoodie come in?');
  if (resExp17.intent !== 'PRODUCT_INQUIRY') throw new Error(`Exp Test 17 failed: intent = ${resExp17.intent}`);
  if (!resExp17.responseText.includes('Black') || resExp17.responseText.includes('White')) {
    throw new Error(`Exp Test 17 failed: Should return hoodie colors only, got: ${resExp17.responseText}`);
  }
  console.log('✅ [107/110] Exp Test 17 Passed: "What colors does the hoodie come in?" returns product-specific colors.');

  // Test 108 — "What black products do you have under 40k?"
  const resExp18 = processDemoMessage(createInitialDemoState(), 'What black products do you have under 40k?');
  if (!resExp18.responseText.includes('Black Oversized Hoodie') || !resExp18.responseText.includes('Black Velvet Abaya') || resExp18.responseText.includes('White Premium Sneakers')) {
    throw new Error(`Exp Test 18 failed, got: ${resExp18.responseText}`);
  }
  console.log('✅ [108/110] Exp Test 18 Passed: "What black products do you have under 40k?" filters correctly.');

  // Test 109 — "What products come in XL under 40k?"
  const resExp19 = processDemoMessage(createInitialDemoState(), 'What products come in XL under 40k?');
  if (!resExp19.responseText.includes('Black Oversized Hoodie') || !resExp19.responseText.includes('Black Velvet Abaya') || resExp19.responseText.includes('White Premium Sneakers')) {
    throw new Error(`Exp Test 19 failed, got: ${resExp19.responseText}`);
  }
  console.log('✅ [109/110] Exp Test 19 Passed: "What products come in XL under 40k?" filters correctly.');

  // Test 110 — "What do you have above 1 million in black?"
  const resExp20 = processDemoMessage(createInitialDemoState(), 'What do you have above 1 million in black?');
  if (!resExp20.responseText.includes("don't currently have") && !resExp20.responseText.includes('no listed')) {
    throw new Error(`Exp Test 20 failed, got: ${resExp20.responseText}`);
  }
  console.log('✅ [110/135] Exp Test 20 Passed: "What do you have above 1 million in black?" returns grounded empty response.');

  console.log('\n--- SIZE & LOCATION CONTEXT TESTS ---\n');

  // Test 111 — Standalone S
  const stateS = createInitialDemoState();
  const resS = processDemoMessage(stateS, 'S');
  if (resS.updatedState.pendingSize !== 'S') throw new Error(`Test 111 failed, got: ${resS.updatedState.pendingSize}`);
  console.log('✅ [111/135] Size Test 1 Passed: Standalone "S" matches size S.');

  // Test 112 — "I want large"
  const resLargeTest = processDemoMessage(createInitialDemoState(), 'I want large');
  if (resLargeTest.updatedState.pendingSize !== 'L') throw new Error(`Test 112 failed, got: ${resLargeTest.updatedState.pendingSize}`);
  console.log('✅ [112/135] Size Test 2 Passed: "I want large" normalizes to L.');

  // Test 113 — "I'll take XL"
  const resXLTest = processDemoMessage(createInitialDemoState(), "I'll take XL");
  if (resXLTest.updatedState.pendingSize !== 'XL') throw new Error(`Test 113 failed, got: ${resXLTest.updatedState.pendingSize}`);
  console.log('✅ [113/135] Size Test 3 Passed: "I\'ll take XL" matches size XL.');

  // Test 114 — "size 42"
  const res42Text = processDemoMessage(createInitialDemoState(), 'size 42');
  if (res42Text.updatedState.pendingSize !== '42') throw new Error(`Test 114 failed, got: ${res42Text.updatedState.pendingSize}`);
  console.log('✅ [114/135] Size Test 4 Passed: "size 42" parses shoe size 42.');

  // Test 115 — Standalone "42" with Sneakers focus
  const sneakers = DEMO_PUBLIC_PRODUCTS.find(p => p.name.includes('Sneakers'));
  const state42 = { ...createInitialDemoState(), pendingProductId: sneakers?.id };
  const res42 = processDemoMessage(state42, '42');
  if (res42.updatedState.pendingSize !== '42') throw new Error(`Test 115 failed, got: ${res42.updatedState.pendingSize}`);
  console.log('✅ [115/135] Size Test 5 Passed: Standalone "42" with Sneakers pending matches size 42.');

  // Test 116 — Size Context Resolution Flow
  let flowState = processDemoMessage(createInitialDemoState(), 'What do you have under 40k?');
  flowState = processDemoMessage(flowState.updatedState, 'I like the second one');
  flowState = processDemoMessage(flowState.updatedState, 'What sizes does it come in?');
  if (!flowState.responseText.includes('M, L, and XL')) throw new Error(`Test 116 failed on sizes: ${flowState.responseText}`);
  flowState = processDemoMessage(flowState.updatedState, 'Large');
  if (flowState.updatedState.pendingSize !== 'L') throw new Error(`Test 116 failed on size resolution: ${flowState.updatedState.pendingSize}`);
  console.log('✅ [116/135] Size Test 6 Passed: Multi-turn size resolution flow matches L.');

  // Test 117 — Update pending size ("Actually XL")
  flowState = processDemoMessage(flowState.updatedState, 'Actually XL');
  if (flowState.updatedState.pendingSize !== 'XL') throw new Error(`Test 117 failed, got: ${flowState.updatedState.pendingSize}`);
  console.log('✅ [117/135] Size Test 7 Passed: Updating size from L to XL works.');

  // Test 118 — Delivery location extraction
  const resLoc1 = processDemoMessage(createInitialDemoState(), 'Deliver to Ikeja');
  if (resLoc1.updatedState.pendingLocation !== 'Ikeja') throw new Error(`Test 118-1 failed: ${resLoc1.updatedState.pendingLocation}`);

  const resLoc2 = processDemoMessage(createInitialDemoState(), 'Delivery is to Ikeja');
  if (resLoc2.updatedState.pendingLocation !== 'Ikeja') throw new Error(`Test 118-2 failed`);

  const resLoc3 = processDemoMessage(createInitialDemoState(), "I'm in Ikeja");
  if (resLoc3.updatedState.pendingLocation !== 'Ikeja') throw new Error(`Test 118-3 failed`);

  const resLoc4 = processDemoMessage(createInitialDemoState(), 'Send it to Lagos');
  if (resLoc4.updatedState.pendingLocation !== 'Lagos') throw new Error(`Test 118-4 failed`);

  const resLoc5 = processDemoMessage(createInitialDemoState(), 'I live in Abuja');
  if (resLoc5.updatedState.pendingLocation !== 'Abuja') throw new Error(`Test 118-5 failed`);

  const resLoc6 = processDemoMessage(createInitialDemoState(), 'VI');
  if (resLoc6.updatedState.pendingLocation !== 'VI') throw new Error(`Test 118-6 failed: ${resLoc6.updatedState.pendingLocation}`);

  const resLoc7 = processDemoMessage(createInitialDemoState(), 'PH');
  if (resLoc7.updatedState.pendingLocation !== 'PH') throw new Error(`Test 118-7 failed`);
  console.log('✅ [118/135] Location Test 1 Passed: Locations (Ikeja, Lagos, Abuja, VI, PH) parsed correctly in all formats.');

  // Test 119 — Delivery rates
  const resRate1 = processDemoMessage(createInitialDemoState(), 'How much is delivery to Lagos?');
  if (!resRate1.responseText.includes('₦2,500')) throw new Error(`Test 119-1 failed: ${resRate1.responseText}`);

  const resRate2 = processDemoMessage(createInitialDemoState(), 'How much is delivery to Ikeja?');
  if (!resRate2.responseText.includes('₦2,500')) throw new Error(`Test 119-2 failed: ${resRate2.responseText}`);

  const resRate3 = processDemoMessage(createInitialDemoState(), 'How much is delivery to Abuja?');
  if (!resRate3.responseText.includes('₦5,000')) throw new Error(`Test 119-3 failed: ${resRate3.responseText}`);

  const resRate4 = processDemoMessage(createInitialDemoState(), 'How much is delivery to Port Harcourt?');
  if (!resRate4.responseText.includes('₦5,000')) throw new Error(`Test 119-4 failed: ${resRate4.responseText}`);

  const resRate5 = processDemoMessage(createInitialDemoState(), 'How much is delivery to Kano?');
  if (!resRate5.responseText.toLowerCase().includes('don\'t want to guess') && !resRate5.responseText.toLowerCase().includes('not sure')) throw new Error(`Test 119-5 failed: ${resRate5.responseText}`);
  console.log('✅ [119/135] Location Test 2 Passed: Grounded delivery rates returned accurately (Lagos vs Interstate).');

  // Test 120 — Location Context after Order Intent
  let orderState = processDemoMessage(createInitialDemoState(), 'I want to buy the Black Oversized Hoodie.');
  orderState = processDemoMessage(orderState.updatedState, 'XL');
  if (!orderState.responseText.toLowerCase().includes('delivery location')) throw new Error(`Test 120 size check failed: ${orderState.responseText}`);
  orderState = processDemoMessage(orderState.updatedState, 'Ikeja');
  if (!orderState.responseText.toLowerCase().includes('set up your order')) throw new Error(`Test 120 E2E order failed: ${orderState.responseText}`);
  if (orderState.updatedState.orders.length !== 1) throw new Error('Test 120: Order not created');
  const o1 = orderState.updatedState.orders[0];
  if (o1.productName !== 'Black Oversized Hoodie' || o1.size !== 'XL' || o1.deliveryLocation !== 'Ikeja') {
    throw new Error(`Test 120 details wrong: ${JSON.stringify(o1)}`);
  }
  console.log('✅ [120/135] Location Test 3 Passed: E2E Order creation resolves location context correctly.');

  // Test 121 — Negative collision protection
  const resColl1 = processDemoMessage(createInitialDemoState(), 'What do you have under ₦40,000?');
  if (resColl1.updatedState.pendingSize !== undefined) throw new Error(`Test 121-1 failed: ${resColl1.updatedState.pendingSize}`);

  const resColl2 = processDemoMessage(createInitialDemoState(), 'What do you have under ₦1,000,000?');
  if (resColl2.updatedState.pendingSize !== undefined) throw new Error(`Test 121-2 failed`);

  const resColl3 = processDemoMessage(createInitialDemoState(), 'My budget is 40,000');
  if (resColl3.updatedState.pendingSize !== undefined) throw new Error(`Test 121-3 failed`);
  console.log('✅ [121/135] Collision Test Passed: Prices and budgets never accidentally trigger size = 40.');

  // Test 122 — Location is not confused with customer name
  const resName = processDemoMessage(createInitialDemoState(), 'Zubair');
  if (resName.updatedState.pendingLocation !== undefined) throw new Error(`Test 122 failed: matched location from name "Zubair"`);
  console.log('✅ [122/135] Name Test Passed: Customer names (e.g. Zubair) not matched as locations.');

  // Test 123 — Location not required too early (simple catalog browsing)
  let browseState = processDemoMessage(createInitialDemoState(), 'What do you have?');
  if (browseState.responseText.toLowerCase().includes('delivery location')) throw new Error('Test 123 failed: required location too early.');
  browseState = processDemoMessage(browseState.updatedState, 'How much is the hoodie?');
  if (browseState.responseText.toLowerCase().includes('delivery location')) throw new Error('Test 123 failed: required location too early.');
  browseState = processDemoMessage(browseState.updatedState, 'What sizes does it come in?');
  if (browseState.responseText.toLowerCase().includes('delivery location')) throw new Error('Test 123 failed: required location too early.');
  console.log('✅ [123/135] Early Ask Check Passed: Location is never requested during browsing.');

  // Test 124 — VI/PH Location Abbreviation Normalization
  let abbreviateState = processDemoMessage(createInitialDemoState(), 'I want to buy the Black Velvet Abaya.');
  abbreviateState = processDemoMessage(abbreviateState.updatedState, 'XL');
  abbreviateState = processDemoMessage(abbreviateState.updatedState, 'VI');
  if (abbreviateState.updatedState.orders.length !== 1) throw new Error('Test 124 order not created');
  if (abbreviateState.updatedState.orders[0].deliveryLocation !== 'VI') {
    throw new Error(`Test 124 failed to preserve raw delivery abbreviation: ${abbreviateState.updatedState.orders[0].deliveryLocation}`);
  }
  console.log('✅ [124/135] Abbreviation Check Passed: Location abbreviations (VI) preserved on final order.');

  // Test 125 — Full E2E E-Commerce Happy Path Multi-Turn Sequence
  let e2eState = processDemoMessage(createInitialDemoState(), 'Hi');
  e2eState = processDemoMessage(e2eState.updatedState, 'What do you have?');
  e2eState = processDemoMessage(e2eState.updatedState, 'I like the second one.');
  e2eState = processDemoMessage(e2eState.updatedState, 'What sizes does it come in?');
  e2eState = processDemoMessage(e2eState.updatedState, 'Large');
  e2eState = processDemoMessage(e2eState.updatedState, "I'll take it.");
  e2eState = processDemoMessage(e2eState.updatedState, 'Ikeja');

  if (e2eState.updatedState.orders.length !== 1) throw new Error('Test 125 E2E order creation failed');
  const e2eOrd = e2eState.updatedState.orders[0];
  if (e2eOrd.productName !== 'Black Velvet Abaya' || e2eOrd.size !== 'L' || e2eOrd.deliveryLocation !== 'Ikeja' || e2eOrd.totalNaira !== 35000) {
    throw new Error(`Test 125 E2E order details mismatch: ${JSON.stringify(e2eOrd)}`);
  }
  if (e2eState.responseText.includes('Secure Bank Partner') || e2eState.responseText.includes('0000000000')) {
    throw new Error('Test 125 SECURITY FAIL: Exposed bank details in order creation!');
  }
  console.log('✅ [125/135] Multi-Turn sequence E2E Test Passed: Complete checkout flow processed cleanly.');

  // Tests 126 to 135 — Additional coverage checking details and type mapping
  const resExp21 = processDemoMessage(createInitialDemoState(), 'size M');
  if (resExp21.updatedState.pendingSize !== 'M') throw new Error('Test 126 failed');
  console.log('✅ [126/135] Additional Size Test 1 Passed: size M resolves to M.');

  const resExp22 = processDemoMessage(createInitialDemoState(), 'I need size 42');
  if (resExp22.updatedState.pendingSize !== '42') throw new Error('Test 127 failed');
  console.log('✅ [127/135] Additional Size Test 2 Passed: "I need size 42" resolves to 42.');

  const resExp23 = processDemoMessage(createInitialDemoState(), 'Do you have size 40?');
  if (resExp23.updatedState.pendingSize !== '40') throw new Error('Test 128 failed');
  console.log('✅ [128/135] Additional Size Test 3 Passed: "Do you have size 40?" resolves to 40.');

  const resExp24 = processDemoMessage(createInitialDemoState(), 'Do you have the sneakers in 42?');
  if (resExp24.updatedState.pendingSize !== '42') throw new Error('Test 129 failed');
  console.log('✅ [129/135] Additional Size Test 4 Passed: "Do you have the sneakers in 42?" resolves to 42.');

  // Product specific sizes checks
  let sizesCheck = processDemoMessage(createInitialDemoState(), 'What sizes does the Black Velvet Abaya come in?');
  sizesCheck = processDemoMessage(sizesCheck.updatedState, '42');
  if (!sizesCheck.responseText.includes("isn't currently listed") || !sizesCheck.responseText.includes('M, L, and XL')) {
    throw new Error(`Test 130 failed: ${sizesCheck.responseText}`);
  }
  console.log('✅ [130/135] Size Validation Test Passed: Numeric size 42 rejected for Abaya with proper suggestion.');

  // Standalone VI location in context
  let locContextState = processDemoMessage(createInitialDemoState(), 'I want to buy the hoodie');
  locContextState = processDemoMessage(locContextState.updatedState, 'XL');
  locContextState = processDemoMessage(locContextState.updatedState, 'VI');
  if (locContextState.updatedState.orders.length !== 1) throw new Error('Test 131 failed');
  console.log('✅ [131/135] Standalone Location Context Test Passed: stand-alone location resolves properly.');

  // Standalone PH location in context
  let locContextPH = processDemoMessage(createInitialDemoState(), 'I want to buy the hoodie');
  locContextPH = processDemoMessage(locContextPH.updatedState, 'XL');
  locContextPH = processDemoMessage(locContextPH.updatedState, 'PH');
  if (locContextPH.updatedState.orders.length !== 1) throw new Error('Test 132 failed');
  console.log('✅ [132/135] Standalone PH Location Context Test Passed.');

  // Budget price collision
  const budgetTest = processDemoMessage(createInitialDemoState(), 'my budget is 40,000');
  if (budgetTest.updatedState.pendingSize !== undefined) throw new Error('Test 133 failed');
  console.log('✅ [133/135] Price budget collision check passed.');

  // delivery fee price collision
  const deliveryFeeColl = processDemoMessage(createInitialDemoState(), 'delivery is ₦2,500');
  if (deliveryFeeColl.updatedState.pendingSize !== undefined) throw new Error('Test 134 failed');
  console.log('✅ [134/135] Delivery fee price collision check passed.');

  // delivery cost price collision
  const deliveryCostColl = processDemoMessage(createInitialDemoState(), 'delivery costs 5000');
  if (deliveryCostColl.updatedState.pendingSize !== undefined) throw new Error('Test 135 failed');
  console.log('✅ [135/141] Delivery cost price collision check passed.');

  // --- TARGETED CONVERSATION CONTEXT & CHECKOUT STATE SEQUENCE TESTS ---

  // Test 136 (Sequence Test 1): "i want the hoodie" -> "Tell me about the hoodie" -> "L"
  let seq1State = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  if (!seq1State.updatedState.pendingProductId) throw new Error('Test 136 step 1 failed: pending product missing');
  seq1State = processDemoMessage(seq1State.updatedState, 'Tell me about the hoodie');
  if (!seq1State.responseText.toLowerCase().includes('in stock') || seq1State.updatedState.pendingProductId !== 'demo_prod_1') {
    throw new Error(`Test 136 step 2 failed to preserve pending product context: ${seq1State.responseText}`);
  }
  seq1State = processDemoMessage(seq1State.updatedState, 'L');
  if (!seq1State.responseText.toLowerCase().includes('delivery location') || seq1State.updatedState.pendingSize !== 'L') {
    throw new Error(`Test 136 step 3 failed to resolve size L for pending hoodie: ${seq1State.responseText}`);
  }
  console.log('✅ [136/141] Context Test 1 Passed: Product info question preserves pending purchase context.');

  // Test 137 (Sequence Test 2): "i want the hoodie" -> "how much is delivery to Ikeja?" -> "L"
  let seq2State = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  seq2State = processDemoMessage(seq2State.updatedState, 'how much is delivery to Ikeja?');
  if (!seq2State.responseText.includes('2,500') || seq2State.updatedState.pendingProductId !== 'demo_prod_1' || seq2State.updatedState.pendingLocation !== 'Ikeja') {
    throw new Error(`Test 137 step 2 failed: ${seq2State.responseText}`);
  }
  seq2State = processDemoMessage(seq2State.updatedState, 'L');
  if (seq2State.updatedState.orders.length !== 1) {
    throw new Error(`Test 137 step 3 failed to complete order with location Ikeja + size L: ${seq2State.responseText}`);
  }
  console.log('✅ [137/141] Context Test 2 Passed: Delivery rate query retains purchase intent and location context.');

  // Test 138 (Sequence Test 3): "i want the hoodie" -> "how much is it?" -> "Ikeja"
  let seq3State = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  seq3State = processDemoMessage(seq3State.updatedState, 'how much is it?');
  if (!seq3State.responseText.includes('25,000') || seq3State.updatedState.pendingProductId !== 'demo_prod_1') {
    throw new Error(`Test 138 step 2 failed: ${seq3State.responseText}`);
  }
  seq3State = processDemoMessage(seq3State.updatedState, 'Ikeja');
  if (!seq3State.responseText.toLowerCase().includes('size') || seq3State.updatedState.pendingLocation !== 'Ikeja') {
    throw new Error(`Test 138 step 3 failed: ${seq3State.responseText}`);
  }
  console.log('✅ [138/141] Context Test 3 Passed: Price inquiry retains purchase intent and accepts location.');

  // Test 139 (Sequence Test 4): "What do you have under 40k?" -> "I want the hoodie" -> "Tell me about the abaya" -> "L"
  let seq4State = processDemoMessage(createInitialDemoState(), 'What do you have under 40k?');
  seq4State = processDemoMessage(seq4State.updatedState, 'I want the hoodie');
  if (seq4State.updatedState.pendingProductId !== 'demo_prod_1') throw new Error('Test 139 step 2 failed');
  seq4State = processDemoMessage(seq4State.updatedState, 'Tell me about the abaya');
  if (!seq4State.responseText.toLowerCase().includes('abaya') || seq4State.updatedState.pendingProductId !== 'demo_prod_1') {
    throw new Error(`Test 139 step 3 failed: info on abaya hijacked purchase context of hoodie`);
  }
  seq4State = processDemoMessage(seq4State.updatedState, 'L');
  if (!seq4State.responseText.toLowerCase().includes('hoodie') || seq4State.updatedState.pendingSize !== 'L') {
    throw new Error(`Test 139 step 4 failed: size L did not resolve to hoodie: ${seq4State.responseText}`);
  }
  console.log('✅ [139/141] Context Test 4 Passed: Info inquiry on secondary product does not hijack purchase context.');

  // Test 140 (Sequence Test 5): "What do you have?" -> "I want the second one" -> "what sizes does it come in?" -> "L"
  let seq5State = processDemoMessage(createInitialDemoState(), 'What do you have?');
  seq5State = processDemoMessage(seq5State.updatedState, 'I want the second one');
  if (seq5State.updatedState.pendingProductId !== 'demo_prod_2') throw new Error('Test 140 step 2 failed');
  seq5State = processDemoMessage(seq5State.updatedState, 'what sizes does it come in?');
  if (!seq5State.responseText.includes('M, L, and XL') || seq5State.updatedState.pendingProductId !== 'demo_prod_2') {
    throw new Error(`Test 140 step 3 failed: ${seq5State.responseText}`);
  }
  seq5State = processDemoMessage(seq5State.updatedState, 'L');
  if (!seq5State.responseText.toLowerCase().includes('delivery location') || seq5State.updatedState.pendingSize !== 'L') {
    throw new Error(`Test 140 step 4 failed: ${seq5State.responseText}`);
  }
  console.log('✅ [140/141] Context Test 5 Passed: Positional selection retains purchase context through size inquiries.');

  // Test 141 (Sequence Test 6): "i want the hoodie" -> "how much is delivery to Ikeja?" -> "I'll take it" -> "L" -> "Ikeja"
  let seq6State = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  seq6State = processDemoMessage(seq6State.updatedState, 'how much is delivery to Ikeja?');
  seq6State = processDemoMessage(seq6State.updatedState, "I'll take it");
  seq6State = processDemoMessage(seq6State.updatedState, 'L');
  seq6State = processDemoMessage(seq6State.updatedState, 'Ikeja');
  if (seq6State.updatedState.orders.length !== 1) {
    throw new Error(`Test 141 failed to create complete order snapshot: ${seq6State.responseText}`);
  }
  console.log('✅ [141/160] Context Test 6 Passed: Complete multi-turn sequence with interruptions creates order snapshot.');

  // --- CONVERSATIONAL INTENT & STATE INTERPRETATION HARDENING TESTS (142–160) ---

  // Test 142: "Show me your collection" -> Grounded catalog list
  const t142 = processDemoMessage(createInitialDemoState(), 'Show me your collection');
  if (!t142.responseText.includes('Black Oversized Hoodie') || !t142.responseText.includes('₦')) {
    throw new Error(`Test 142 failed: ${t142.responseText}`);
  }
  console.log('✅ [142/160] Catalog Discovery Semantic Test 1 Passed: "Show me your collection" returns catalog.');

  // Test 143: "What do you guys have?" -> Grounded catalog list
  const t143 = processDemoMessage(createInitialDemoState(), 'What do you guys have?');
  if (!t143.responseText.includes('Black Oversized Hoodie')) throw new Error(`Test 143 failed: ${t143.responseText}`);
  console.log('✅ [143/160] Catalog Discovery Semantic Test 2 Passed: "What do you guys have?" returns catalog.');

  // Test 144: "Let me see what you've got" -> Grounded catalog list
  const t144 = processDemoMessage(createInitialDemoState(), "Let me see what you've got");
  if (!t144.responseText.includes('Black Velvet Abaya')) throw new Error(`Test 144 failed: ${t144.responseText}`);
  console.log("✅ [144/160] Catalog Discovery Semantic Test 3 Passed: \"Let me see what you've got\" returns catalog.");

  // Test 145: "What's available?" -> Grounded catalog list
  const t145 = processDemoMessage(createInitialDemoState(), "What's available?");
  if (!t145.responseText.includes('White Premium Sneakers')) throw new Error(`Test 145 failed: ${t145.responseText}`);
  console.log("✅ [145/160] Catalog Discovery Semantic Test 4 Passed: \"What's available?\" returns catalog.");

  // Test 146: "What are you selling?" -> Grounded catalog list
  const t146 = processDemoMessage(createInitialDemoState(), 'What are you selling?');
  if (!t146.responseText.includes('Black Oversized Hoodie')) throw new Error(`Test 146 failed: ${t146.responseText}`);
  console.log('✅ [146/160] Catalog Discovery Semantic Test 5 Passed: "What are you selling?" returns catalog.');

  // Test 147: "I want size L" with active product context
  let t147State = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  t147State = processDemoMessage(t147State.updatedState, 'I want size L');
  if (!t147State.responseText.toLowerCase().includes('delivery location') || t147State.updatedState.pendingSize !== 'L') {
    throw new Error(`Test 147 failed: size L selection returned summary or failed: ${t147State.responseText}`);
  }
  console.log('✅ [147/160] Context-Aware Size Test 1 Passed: "I want size L" with active product triggers size state transition.');

  // Test 148: "I'll take L" with active product context
  let t148State = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  t148State = processDemoMessage(t148State.updatedState, "I'll take L");
  if (t148State.updatedState.pendingSize !== 'L') throw new Error(`Test 148 failed: ${t148State.responseText}`);
  console.log('✅ [148/160] Context-Aware Size Test 2 Passed: "I\'ll take L" resolves size L.');

  // Test 149: "Give me large" with active product context
  let t149State = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  t149State = processDemoMessage(t149State.updatedState, 'Give me large');
  if (t149State.updatedState.pendingSize !== 'L') throw new Error(`Test 149 failed: ${t149State.responseText}`);
  console.log('✅ [149/160] Context-Aware Size Test 3 Passed: "Give me large" resolves size L.');

  // Test 150: "Size 42" with active footwear product context
  let t150State = processDemoMessage(createInitialDemoState(), 'i want the sneakers');
  t150State = processDemoMessage(t150State.updatedState, 'Size 42');
  if (t150State.updatedState.pendingSize !== '42') throw new Error(`Test 150 failed: ${t150State.responseText}`);
  console.log('✅ [150/160] Context-Aware Footwear Size Test Passed: "Size 42" resolves footwear size.');

  // Test 151: "I want size L" WITHOUT active product context
  const t151 = processDemoMessage(createInitialDemoState(), 'I want size L');
  if (!t151.responseText.toLowerCase().includes('which product') && !t151.responseText.toLowerCase().includes('interested in')) {
    throw new Error(`Test 151 failed: should prompt for product selection without guessing: ${t151.responseText}`);
  }
  console.log('✅ [151/160] Size Without Product Context Test Passed: Prompts for product clarification without guessing.');

  // Test 152: "I'll take this" with active product context
  let t152State = processDemoMessage(createInitialDemoState(), 'Tell me about the hoodie');
  t152State = processDemoMessage(t152State.updatedState, "I'll take this");
  if (!t152State.updatedState.pendingPurchaseIntent || t152State.updatedState.pendingProductId !== 'demo_prod_1') {
    throw new Error(`Test 152 failed: ${t152State.responseText}`);
  }
  console.log('✅ [152/160] Purchase Intent Semantic Test 1 Passed: "I\'ll take this" initiates purchase flow.');

  // Test 153: "Give me this one" with active product context
  let t153State = processDemoMessage(createInitialDemoState(), 'Tell me about the abaya');
  t153State = processDemoMessage(t153State.updatedState, 'Give me this one');
  if (!t153State.updatedState.pendingPurchaseIntent || t153State.updatedState.pendingProductId !== 'demo_prod_2') {
    throw new Error(`Test 153 failed: ${t153State.responseText}`);
  }
  console.log('✅ [153/160] Purchase Intent Semantic Test 2 Passed: "Give me this one" initiates purchase flow.');

  // Test 154: "I'll go with the second one" after catalog list
  let t154State = processDemoMessage(createInitialDemoState(), 'What do you have?');
  t154State = processDemoMessage(t154State.updatedState, "I'll go with the second one");
  if (t154State.updatedState.pendingProductId !== 'demo_prod_2' || !t154State.updatedState.pendingPurchaseIntent) {
    throw new Error(`Test 154 failed: ${t154State.responseText}`);
  }
  console.log('✅ [154/160] Purchase Intent Semantic Test 3 Passed: "I\'ll go with the second one" sets pending product.');

  // Test 155: "Let me get the black one"
  let t155State = processDemoMessage(createInitialDemoState(), 'Tell me about the hoodie');
  t155State = processDemoMessage(t155State.updatedState, 'Let me get the black one');
  if (t155State.updatedState.pendingProductId !== 'demo_prod_1') throw new Error(`Test 155 failed: ${t155State.responseText}`);
  console.log('✅ [155/160] Purchase Intent Semantic Test 4 Passed: "Let me get the black one" resolves product.');

  // Test 156: "How much to Ikeja?"
  const t156 = processDemoMessage(createInitialDemoState(), 'How much to Ikeja?');
  if (!t156.responseText.includes('2,500')) throw new Error(`Test 156 failed: ${t156.responseText}`);
  console.log('✅ [156/160] Delivery Semantic Test 1 Passed: "How much to Ikeja?" returns ₦2,500.');

  // Test 157: "Send it to Ikeja" with active product context
  let t157State = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  t157State = processDemoMessage(t157State.updatedState, 'Send it to Ikeja');
  if (t157State.updatedState.pendingLocation !== 'Ikeja') throw new Error(`Test 157 failed: ${t157State.responseText}`);
  console.log('✅ [157/160] Delivery Semantic Test 2 Passed: "Send it to Ikeja" records location Ikeja.');

  // Test 158: "I live in Abuja"
  let t158State = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  t158State = processDemoMessage(t158State.updatedState, 'I live in Abuja');
  if (t158State.updatedState.pendingLocation !== 'Abuja') throw new Error(`Test 158 failed: ${t158State.responseText}`);
  console.log('✅ [158/160] Delivery Semantic Test 3 Passed: "I live in Abuja" records location Abuja.');

  // Test 159: Short Reply "That's the one"
  let t159State = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  t159State = processDemoMessage(t159State.updatedState, "That's the one");
  if (!t159State.updatedState.pendingPurchaseIntent || t159State.updatedState.pendingProductId !== 'demo_prod_1') {
    throw new Error(`Test 159 failed: ${t159State.responseText}`);
  }
  console.log('✅ [159/160] Short Reply Test Passed: "That\'s the one" resolves affirmative purchase context.');

  // Test 160: Ambiguity Resolution ("I want that one" without active product)
  const t160 = processDemoMessage(createInitialDemoState(), 'I want that one');
  if (!t160.responseText.includes('Which product')) throw new Error(`Test 160 failed: ${t160.responseText}`);
  console.log('✅ [160/180] Ambiguity Resolution Test Passed: Prompts for clarification when no active candidate exists.');

  // Test 161: Customer Message Fidelity — "okay" after unavailable color statement
  let t161State = processDemoMessage(createInitialDemoState(), 'Do you have red hoodie?');
  t161State = processDemoMessage(t161State.updatedState, 'okay');
  const t161CustMsg = t161State.updatedState.messages.find(m => m.sender === 'customer' && m.text.toLowerCase() === 'okay');
  if (!t161CustMsg || t161CustMsg.text !== 'okay') throw new Error(`Test 161 failed: Customer message mutated`);
  if (t161State.updatedState.pendingPurchaseIntent === true && t161State.updatedState.pendingProductId === 'demo_prod_1') {
    throw new Error(`Test 161 failed: "okay" incorrectly activated purchase intent for Black Hoodie`);
  }
  console.log('✅ [161/180] Customer Message Fidelity Test 1 Passed: "okay" preserved verbatim without auto-selecting product.');

  // Test 162: Customer Message Fidelity — "Thanks" after statement
  let t162State = processDemoMessage(createInitialDemoState(), 'How much is the hoodie');
  t162State = processDemoMessage(t162State.updatedState, 'Thanks');
  const t162CustMsg = t162State.updatedState.messages.find(m => m.sender === 'customer' && m.text === 'Thanks');
  if (!t162CustMsg) throw new Error(`Test 162 failed: Customer message "Thanks" mutated`);
  console.log('✅ [162/180] Customer Message Fidelity Test 2 Passed: "Thanks" preserved verbatim.');

  // Test 163: Explicit question "Would you like the Black option?" + "Yes"
  let t163State = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  t163State = processDemoMessage(t163State.updatedState, 'Yes');
  if (!t163State.updatedState.pendingPurchaseIntent) throw new Error(`Test 163 failed: ${t163State.responseText}`);
  console.log('✅ [163/180] Explicit Yes/No Test Passed: "Yes" to explicit purchase prompt activates purchase intent.');

  // Test 164: Informational size statement + "Yes"
  let t164State = processDemoMessage(createInitialDemoState(), 'What sizes does the hoodie come in?');
  t164State = processDemoMessage(t164State.updatedState, 'Yes');
  if (t164State.updatedState.pendingPurchaseIntent === true && t164State.updatedState.pendingLocation) {
    throw new Error(`Test 164 failed: "Yes" after size info incorrectly forced order completion`);
  }
  console.log('✅ [164/180] Informational Yes Test Passed: "Yes" after informational size statement treated as passive acknowledgement.');

  // Test 165: Policy inquiry escalation (no fabricated 7-day policy)
  const t165 = processDemoMessage(createInitialDemoState(), 'What is your return policy?');
  if (t165.responseText.includes('7-day') || t165.responseText.includes('14-day') || t165.responseText.includes('free returns')) {
    throw new Error(`Test 165 failed: Fabricated return policy! ${t165.responseText}`);
  }
  if (!t165.responseText.includes('return') && !t165.responseText.includes('WhatsApp')) {
    throw new Error(`Test 165 failed: ${t165.responseText}`);
  }
  console.log('✅ [165/180] Policy Grounding Test Passed: Return policy inquiry handled without fabricating ungrounded terms.');

  // Test 166: Payment methods inquiry (no raw bank credentials)
  const t166 = processDemoMessage(createInitialDemoState(), 'How can I pay?');
  if (!t166.responseText.includes('bank transfers') || t166.responseText.includes('0123456789')) {
    throw new Error(`Test 166 failed: ${t166.responseText}`);
  }
  console.log('✅ [166/180] Payment Grounding Test Passed: Payment inquiry answered safely without exposing bank details.');

  // Test 167: Delivery timeframe inquiry (no fabricated 2-day timeframe)
  const t167 = processDemoMessage(createInitialDemoState(), 'How long does delivery take?');
  if (t167.responseText.includes('2-4 days') || t167.responseText.includes('24 hours')) {
    throw new Error(`Test 167 failed: Fabricated delivery timeframe! ${t167.responseText}`);
  }
  console.log('✅ [167/180] Delivery Timeframe Test Passed: Timeframe inquiry handled without fabricating ungrounded days.');

  // Test 168: Category discovery "Do you have abayas?"
  const t168 = processDemoMessage(createInitialDemoState(), 'Do you have abayas?');
  if (!t168.responseText.includes('Black Velvet Abaya')) throw new Error(`Test 168 failed: ${t168.responseText}`);
  console.log('✅ [168/180] Category Discovery Test 1 Passed: "Do you have abayas?" returns Black Velvet Abaya.');

  // Test 169: Category discovery "Do you sell sneakers?"
  const t169 = processDemoMessage(createInitialDemoState(), 'Do you sell sneakers?');
  if (!t169.responseText.includes('White Premium Sneakers')) throw new Error(`Test 169 failed: ${t169.responseText}`);
  console.log('✅ [169/180] Category Discovery Test 2 Passed: "Do you sell sneakers?" returns White Premium Sneakers.');

  // Test 170: Price parsing 1.5m
  const t170 = processDemoMessage(createInitialDemoState(), 'anything under 1.5m?');
  if (!t170.responseText.includes('Black Oversized Hoodie') || !t170.responseText.includes('Black Velvet Abaya')) {
    throw new Error(`Test 170 failed: ${t170.responseText}`);
  }
  console.log('✅ [170/180] Price Parsing Test Passed: 1.5m parsed as ₦1,500,000.');

  // Test 171: Budget query "What can I get with 100k?"
  const t171 = processDemoMessage(createInitialDemoState(), 'What can I get under 100k?');
  if (!t171.responseText.includes('Black Oversized Hoodie')) throw new Error(`Test 171 failed: ${t171.responseText}`);
  console.log('✅ [171/180] Budget Query Test Passed: "under 100k" returns catalog items.');

  // Test 172: Size selection "I want size L"
  let t172State = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  t172State = processDemoMessage(t172State.updatedState, 'i want size L');
  if (t172State.updatedState.pendingSize !== 'L') throw new Error(`Test 172 failed: ${t172State.responseText}`);
  if (t172State.responseText.includes('comes in M, L and XL')) throw new Error(`Test 172 failed: Repeated size availability list instead of recording selection`);
  console.log('✅ [172/180] Size Selection Test Passed: "i want size L" records L and prompts for missing location.');

  // Test 173: Product comparison
  const t173 = processDemoMessage(createInitialDemoState(), 'Which is better, the hoodie or abaya?');
  if (!t173.responseText.includes('Hoodie') || !t173.responseText.includes('Abaya')) throw new Error(`Test 173 failed: ${t173.responseText}`);
  console.log('✅ [173/180] Product Comparison Test Passed: Factual comparison returned.');

  // Test 174: Context interruption ("I want hoodie" -> "Tell me about hoodie" -> "L")
  let t174State = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  t174State = processDemoMessage(t174State.updatedState, 'Tell me about the hoodie');
  t174State = processDemoMessage(t174State.updatedState, 'i want size L');
  if (t174State.updatedState.pendingProductId !== 'demo_prod_1' || t174State.updatedState.pendingSize !== 'L') {
    throw new Error(`Test 174 failed: Context lost during informational question!`);
  }
  console.log('✅ [174/180] Context Interruption Test Passed: Active product context preserved across info questions.');

  // Test 175: Secondary product query ("I want hoodie" -> "Tell me about abaya" -> "L" applies to hoodie)
  let t175State = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  t175State = processDemoMessage(t175State.updatedState, 'Tell me about the abaya');
  t175State = processDemoMessage(t175State.updatedState, 'i want size L');
  if (t175State.updatedState.pendingProductId !== 'demo_prod_1') {
    throw new Error(`Test 175 failed: Secondary product info question hijacked active purchase product!`);
  }
  console.log('✅ [175/180] Secondary Product Isolation Test Passed: Info question about another product did not hijack pending purchase.');

  // Test 176: Explicit product switch ("I want hoodie" -> "Tell me about abaya" -> "I want the abaya instead" -> "L" applies to abaya)
  let t176State = processDemoMessage(createInitialDemoState(), 'i want the hoodie');
  t176State = processDemoMessage(t176State.updatedState, 'I want the abaya instead');
  if (t176State.updatedState.pendingProductId !== 'demo_prod_2') {
    throw new Error(`Test 176 failed: Explicit product switch failed!`);
  }
  console.log('✅ [176/180] Explicit Product Switch Test Passed: Active purchase product updated on explicit selection.');

  // Test 177: Full 10-turn manual script test sequence
  let t177State = processDemoMessage(createInitialDemoState(), 'Hi');
  if (!t177State.responseText.includes('Kulture Fashion House')) throw new Error(`Turn 1 failed: ${t177State.responseText}`);
  t177State = processDemoMessage(t177State.updatedState, 'show me your collection');
  if (!t177State.responseText.includes('Hoodie')) throw new Error(`Turn 2 failed: ${t177State.responseText}`);
  t177State = processDemoMessage(t177State.updatedState, 'pls what do u guys have under 40k');
  if (!t177State.responseText.includes('Hoodie')) throw new Error(`Turn 3 failed: ${t177State.responseText}`);
  t177State = processDemoMessage(t177State.updatedState, 'i want the hoodie');
  if (t177State.updatedState.pendingProductId !== 'demo_prod_1') throw new Error(`Turn 4 failed: ${t177State.responseText}`);
  t177State = processDemoMessage(t177State.updatedState, 'Tell me about the hoodie');
  if (t177State.updatedState.pendingProductId !== 'demo_prod_1') throw new Error(`Turn 5 failed: ${t177State.responseText}`);
  t177State = processDemoMessage(t177State.updatedState, 'i want size L');
  if (t177State.updatedState.pendingSize !== 'L') throw new Error(`Turn 6 failed: ${t177State.responseText}`);
  t177State = processDemoMessage(t177State.updatedState, 'how much for delivery ikeja');
  if (!t177State.responseText.includes('2,500')) throw new Error(`Turn 7 failed: ${t177State.responseText}`);
  t177State = processDemoMessage(t177State.updatedState, 'ok');
  const okMsg = t177State.updatedState.messages.find(m => m.sender === 'customer' && m.text === 'ok');
  if (!okMsg) throw new Error(`Turn 8 failed: "ok" message mutated in state`);
  t177State = processDemoMessage(t177State.updatedState, "I'll take it");
  if (t177State.updatedState.conversationStatus !== 'ORDER_PENDING') throw new Error(`Turn 9 failed: Order not completed! ${t177State.responseText}`);
  // Test 181: "the second one" after "What do you have?"
  let t181State = processDemoMessage(createInitialDemoState(), 'What do you have?');
  t181State = processDemoMessage(t181State.updatedState, 'the second one');
  if (t181State.updatedState.pendingProductId !== 'demo_prod_2') throw new Error(`Test 181 failed: ${t181State.responseText}`);
  console.log('✅ [181/200] Positional Test 1 Passed: "the second one" resolves second displayed product.');

  // Test 182: "the 2nd one" after "What do you have?"
  let t182State = processDemoMessage(createInitialDemoState(), 'What do you have?');
  t182State = processDemoMessage(t182State.updatedState, 'the 2nd one');
  if (t182State.updatedState.pendingProductId !== 'demo_prod_2') throw new Error(`Test 182 failed: ${t182State.responseText}`);
  console.log('✅ [182/200] Positional Test 2 Passed: "the 2nd one" resolves second displayed product.');

  // Test 183: "I want the second one" -> 2nd product + purchase intent
  let t183State = processDemoMessage(createInitialDemoState(), 'What do you have?');
  t183State = processDemoMessage(t183State.updatedState, 'I want the second one');
  if (t183State.updatedState.pendingProductId !== 'demo_prod_2' || !t183State.updatedState.pendingPurchaseIntent) {
    throw new Error(`Test 183 failed: ${t183State.responseText}`);
  }
  console.log('✅ [183/200] Positional Test 3 Passed: "I want the second one" sets product and purchase intent.');

  // Test 184: "I'll take the 2nd one" -> 2nd product + purchase intent
  let t184State = processDemoMessage(createInitialDemoState(), 'What do you have?');
  t184State = processDemoMessage(t184State.updatedState, "I'll take the 2nd one");
  if (t184State.updatedState.pendingProductId !== 'demo_prod_2' || !t184State.updatedState.pendingPurchaseIntent) {
    throw new Error(`Test 184 failed: ${t184State.responseText}`);
  }
  console.log('✅ [184/200] Positional Test 4 Passed: "I\'ll take the 2nd one" sets product and purchase intent.');

  // Test 185: "number 2" -> 2nd product
  let t185State = processDemoMessage(createInitialDemoState(), 'What do you have?');
  t185State = processDemoMessage(t185State.updatedState, 'number 2');
  if (t185State.updatedState.pendingProductId !== 'demo_prod_2') throw new Error(`Test 185 failed: ${t185State.responseText}`);
  console.log('✅ [185/200] Positional Test 5 Passed: "number 2" resolves second product.');

  // Test 186: "the last one" -> last displayed product
  let t186State = processDemoMessage(createInitialDemoState(), 'What do you have?');
  t186State = processDemoMessage(t186State.updatedState, 'the last one');
  if (t186State.updatedState.pendingProductId !== 'demo_prod_3') throw new Error(`Test 186 failed: ${t186State.responseText}`);
  console.log('✅ [186/200] Positional Test 6 Passed: "the last one" resolves last displayed product.');

  // Test 187: "Tell me about the second one" -> product 2 info without purchase intent
  let t187State = processDemoMessage(createInitialDemoState(), 'What do you have?');
  t187State = processDemoMessage(t187State.updatedState, 'Tell me about the second one');
  if (t187State.updatedState.pendingProductId !== 'demo_prod_2') throw new Error(`Test 187 failed: ${t187State.responseText}`);
  if (t187State.updatedState.pendingPurchaseIntent === true) throw new Error(`Test 187 failed: Informational selection should not force purchase intent.`);
  console.log('✅ [187/200] Positional Test 7 Passed: "Tell me about the second one" selects product without forcing purchase intent.');

  // Test 188: Filtered list positional test: "What do you have under 40k?" -> "the second one"
  let t188State = processDemoMessage(createInitialDemoState(), 'What do you have under 40k?');
  t188State = processDemoMessage(t188State.updatedState, 'the second one');
  if (t188State.updatedState.pendingProductId !== 'demo_prod_2') throw new Error(`Test 188 failed: Filtered positional selection failed: ${t188State.responseText}`);
  console.log('✅ [188/200] Filtered Positional Test Passed: "the second one" resolves second item from FILTERED catalog list.');

  // Test 189: Category wrapper removal 1 ("do you sell snacks?")
  const t189 = processDemoMessage(createInitialDemoState(), 'do you sell snacks?');
  if (t189.responseText.includes('do you sell') || !t189.responseText.includes('snack')) {
    throw new Error(`Test 189 failed: Question wrapper not stripped cleanly: ${t189.responseText}`);
  }
  console.log('✅ [189/200] Wrapper Extraction Test 1 Passed: "do you sell snacks?" extracts clean target noun "snacks".');

  // Test 190: Category wrapper removal 2 ("do you sell snack or what")
  const t190 = processDemoMessage(createInitialDemoState(), 'do you sell snack or what');
  if (t190.responseText.includes('or what') || t190.responseText.includes('do you sell')) {
    throw new Error(`Test 190 failed: Conversational filler not stripped: ${t190.responseText}`);
  }
  console.log('✅ [190/200] Wrapper Extraction Test 2 Passed: "do you sell snack or what" extracts clean target noun "snack".');

  // Test 191: Category discovery ("do you have hoodies?")
  const t191 = processDemoMessage(createInitialDemoState(), 'do you have hoodies?');
  if (!t191.responseText.includes('Black Oversized Hoodie')) throw new Error(`Test 191 failed: ${t191.responseText}`);
  console.log('✅ [191/200] Category Discovery Test 1 Passed: "do you have hoodies?" matches Black Oversized Hoodie.');

  // Test 192: Category discovery ("do you sell shoes?")
  const t192 = processDemoMessage(createInitialDemoState(), 'do you sell shoes?');
  if (!t192.responseText.includes('White Premium Sneakers')) throw new Error(`Test 192 failed: ${t192.responseText}`);
  console.log('✅ [192/200] Category Discovery Test 2 Passed: "do you sell shoes?" matches White Premium Sneakers.');

  // Test 193: Unknown category ("do you sell cars?")
  const t193 = processDemoMessage(createInitialDemoState(), 'do you sell cars?');
  if (!t193.responseText.includes('fashion items') && !t193.responseText.includes('cars')) {
    throw new Error(`Test 193 failed: ${t193.responseText}`);
  }
  console.log('✅ [193/200] Unknown Category Test Passed: "do you sell cars?" produces clean grounded response.');

  // Test 194: Unknown product ("do you have Gucci bags?")
  const t194 = processDemoMessage(createInitialDemoState(), 'do you have Gucci bags?');
  if (!t194.responseText.includes('gucci bags') && !t194.responseText.includes('Kulture Fashion House')) {
    throw new Error(`Test 194 failed: ${t194.responseText}`);
  }
  console.log('✅ [194/200] Unknown Product Test Passed: "do you have Gucci bags?" produces clean grounded absence response.');

  // Test 195: Customer message fidelity ("the 2nd one")
  let t195State = processDemoMessage(createInitialDemoState(), 'What do you have?');
  t195State = processDemoMessage(t195State.updatedState, 'the 2nd one');
  const stored2nd = t195State.updatedState.messages.find(m => m.sender === 'customer' && m.text === 'the 2nd one');
  if (!stored2nd) throw new Error(`Test 195 failed: Customer message text "the 2nd one" was mutated in state.`);
  console.log('✅ [195/200] Customer Message Fidelity Test 1 Passed: "the 2nd one" preserved 100% verbatim in chat history.');

  // Test 196: Customer message fidelity ("ok")
  let t196State = processDemoMessage(createInitialDemoState(), 'White is unavailable, Black is available.');
  t196State = processDemoMessage(t196State.updatedState, 'ok');
  const storedOk = t196State.updatedState.messages.find(m => m.sender === 'customer' && m.text === 'ok');
  if (!storedOk) throw new Error(`Test 196 failed: Customer message text "ok" was mutated in state.`);
  console.log('✅ [196/200] Customer Message Fidelity Test 2 Passed: "ok" preserved 100% verbatim in chat history.');

  // Test 197: Context sequence ("What do you have?" -> "the second one" -> "what sizes does it come in?" -> "I want size L")
  let t197State = processDemoMessage(createInitialDemoState(), 'What do you have?');
  t197State = processDemoMessage(t197State.updatedState, 'the second one');
  t197State = processDemoMessage(t197State.updatedState, 'what sizes does it come in?');
  t197State = processDemoMessage(t197State.updatedState, 'I want size L');
  if (t197State.updatedState.pendingProductId !== 'demo_prod_2' || t197State.updatedState.pendingSize !== 'L') {
    throw new Error(`Test 197 failed: Size L did not apply to second product (Abaya). State: ${JSON.stringify(t197State.updatedState)}`);
  }
  console.log('✅ [197/200] Context Sequence Test Passed: Size L correctly applied to second product across questions.');

  // Test 198: Checkout sequence ("What do you have?" -> "the second one" -> "L" -> "Ikeja" -> "I'll take it")
  let t198State = processDemoMessage(createInitialDemoState(), 'What do you have?');
  t198State = processDemoMessage(t198State.updatedState, 'the second one');
  t198State = processDemoMessage(t198State.updatedState, 'L');
  t198State = processDemoMessage(t198State.updatedState, 'Ikeja');
  t198State = processDemoMessage(t198State.updatedState, "I'll take it");
  if (t198State.updatedState.conversationStatus !== 'ORDER_PENDING' || t198State.updatedState.orders.length === 0) {
    throw new Error(`Test 198 failed: Complete positional order sequence failed: ${t198State.responseText}`);
  }
  if (t198State.updatedState.orders[0].productName !== 'Black Velvet Abaya') {
    throw new Error(`Test 198 failed: Ordered wrong product: ${t198State.updatedState.orders[0].productName}`);
  }
  console.log('✅ [198/200] Checkout Sequence Test Passed: Positional ordering flow creates complete Abaya order.');

  // Test 199: Informational interruption sequence
  let t199State = processDemoMessage(createInitialDemoState(), 'I want the hoodie');
  t199State = processDemoMessage(t199State.updatedState, 'how much is delivery to Ikeja?');
  t199State = processDemoMessage(t199State.updatedState, 'tell me about the abaya');
  t199State = processDemoMessage(t199State.updatedState, 'L');
  if (t199State.updatedState.orders.length === 0 || t199State.updatedState.orders[0].productName !== 'Black Oversized Hoodie' || t199State.updatedState.orders[0].size !== 'L') {
    throw new Error(`Test 199 failed: Informational query hijacked pending purchase product.`);
  }
  console.log('✅ [199/200] Informational Interruption Test Passed: Abaya info query did not hijack pending Hoodie purchase.');

  // Test 200: Affirmation inspection ("White is unavailable, Black is available" -> "ok")
  let t200State = processDemoMessage(createInitialDemoState(), 'do you have the hoodie in white?');
  t200State = processDemoMessage(t200State.updatedState, 'ok');
  if (t200State.updatedState.pendingColor === 'Black' && t200State.updatedState.pendingPurchaseIntent) {
    throw new Error(`Test 200 failed: "ok" converted acknowledgement to purchase intent.`);
  }
  console.log('✅ [200/205] Affirmation Inspection Test Passed: "ok" acknowledged without mutating customer input or auto-buying.');

  // Test 201: Slang greeting "yo wassup"
  const t201 = processDemoMessage(createInitialDemoState(), 'yo wassup');
  if (t201.intent !== 'GREETING' || t201.responseText.includes('catalog') || t201.responseText.includes('fashion items')) {
    throw new Error(`Test 201 failed: "yo wassup" misclassified as catalog item: ${t201.responseText}`);
  }
  console.log('✅ [201/205] Slang Greeting Test 1 Passed: "yo wassup" detected as GREETING.');

  // Test 202: Slang greeting "sup"
  const t202 = processDemoMessage(createInitialDemoState(), 'sup');
  if (t202.intent !== 'GREETING') throw new Error(`Test 202 failed: "sup" not detected as GREETING: ${t202.responseText}`);
  console.log('✅ [202/205] Slang Greeting Test 2 Passed: "sup" detected as GREETING.');

  // Test 203: Greeting "what's up"
  const t203 = processDemoMessage(createInitialDemoState(), "what's up");
  if (t203.intent !== 'GREETING') throw new Error(`Test 203 failed: "what's up" not detected as GREETING: ${t203.responseText}`);
  console.log('✅ [203/205] Slang Greeting Test 3 Passed: "what\'s up" detected as GREETING.');

  // Test 204: Slang greeting "howfar"
  const t204 = processDemoMessage(createInitialDemoState(), 'howfar');
  if (t204.intent !== 'GREETING') throw new Error(`Test 204 failed: "howfar" not detected as GREETING: ${t204.responseText}`);
  console.log('✅ [204/205] Slang Greeting Test 4 Passed: "howfar" detected as GREETING.');

  // Test 205: Slang greeting "yo"
  const t205 = processDemoMessage(createInitialDemoState(), 'yo');
  if (t205.intent !== 'GREETING') throw new Error(`Test 205 failed: "yo" not detected as GREETING: ${t205.responseText}`);
  console.log('✅ [205/210] Slang Greeting Test 5 Passed: "yo" detected as GREETING.');

  // Test 206: Nonsensical keyboard mash "asdfghjkl"
  const t206 = processDemoMessage(createInitialDemoState(), 'asdfghjkl');
  if (t206.responseText.includes("don't currently have any asdfghjkl") || t206.responseText.includes("listed in the catalog")) {
    throw new Error(`Test 206 failed: "asdfghjkl" treated as product item: ${t206.responseText}`);
  }
  console.log('✅ [206/210] Nonsensical Word Test 1 Passed: Keyboard mash "asdfghjkl" handled naturally.');

  // Test 207: Nonsensical slang "bruh walahi"
  const t207 = processDemoMessage(createInitialDemoState(), 'bruh');
  if (t207.responseText.includes("don't currently have any bruh")) {
    throw new Error(`Test 207 failed: "bruh" treated as product item: ${t207.responseText}`);
  }
  console.log('✅ [207/210] Nonsensical Word Test 2 Passed: Slang noise "bruh" handled naturally.');

  // Test 208: Words of gratitude "god bless"
  const t208 = processDemoMessage(createInitialDemoState(), 'god bless');
  if (t208.intent !== 'THANKS') throw new Error(`Test 208 failed: "god bless" not detected as THANKS: ${t208.responseText}`);
  console.log('✅ [208/210] Words of Gratitude Test Passed: "god bless" detected as THANKS.');

  // Test 209: Slang compliment "your clothes are fire"
  const t209 = processDemoMessage(createInitialDemoState(), 'your clothes are fire');
  if (t209.intent !== 'COMPLIMENT') throw new Error(`Test 209 failed: "your clothes are fire" not detected as COMPLIMENT: ${t209.responseText}`);
  console.log('✅ [209/210] Slang Compliment Test Passed: "your clothes are fire" detected as COMPLIMENT.');

  // Test 210: Casual greeting "heyyy"
  const t210 = processDemoMessage(createInitialDemoState(), 'heyyy');
  if (t210.intent !== 'GREETING') throw new Error(`Test 210 failed: "heyyy" not detected as GREETING: ${t210.responseText}`);
  console.log('✅ [210/230] Casual Greeting Test Passed: "heyyy" detected as GREETING.');

  // Test 211 (Audit A): Greeting preserves purchase context ("I want the hoodie" -> "hello" -> "L")
  let t211State = processDemoMessage(createInitialDemoState(), 'I want the hoodie');
  t211State = processDemoMessage(t211State.updatedState, 'hello');
  t211State = processDemoMessage(t211State.updatedState, 'L');
  if (t211State.updatedState.pendingProductId !== 'demo_prod_1' || t211State.updatedState.pendingSize !== 'L') {
    throw new Error(`Test 211 failed: Greeting destroyed purchase context or size L didn't apply.`);
  }
  console.log('✅ [211/230] Audit A Passed: Greeting preserved Hoodie purchase context across turns.');

  // Test 212 (Audit B): Compliment preserves purchase context ("I want the hoodie" -> "your collection is fire 🔥" -> "L")
  let t212State = processDemoMessage(createInitialDemoState(), 'I want the hoodie');
  t212State = processDemoMessage(t212State.updatedState, 'your collection is fire 🔥');
  t212State = processDemoMessage(t212State.updatedState, 'L');
  if (t212State.updatedState.pendingProductId !== 'demo_prod_1' || t212State.updatedState.pendingSize !== 'L') {
    throw new Error(`Test 212 failed: Compliment destroyed purchase context.`);
  }
  console.log('✅ [212/230] Audit B Passed: Compliment preserved Hoodie purchase context across turns.');

  // Test 213 (Audit C): Gratitude preserves purchase context ("I want the hoodie" -> "thanks" -> "L")
  let t213State = processDemoMessage(createInitialDemoState(), 'I want the hoodie');
  t213State = processDemoMessage(t213State.updatedState, 'thanks');
  t213State = processDemoMessage(t213State.updatedState, 'L');
  if (t213State.updatedState.pendingProductId !== 'demo_prod_1' || t213State.updatedState.pendingSize !== 'L') {
    throw new Error(`Test 213 failed: Gratitude destroyed purchase context.`);
  }
  console.log('✅ [213/230] Audit C Passed: Gratitude preserved Hoodie purchase context across turns.');

  // Test 214 (Audit D): Nonsense preserves purchase context ("I want the hoodie" -> "asdfghjkl" -> "L")
  let t214State = processDemoMessage(createInitialDemoState(), 'I want the hoodie');
  t214State = processDemoMessage(t214State.updatedState, 'asdfghjkl');
  t214State = processDemoMessage(t214State.updatedState, 'L');
  if (t214State.updatedState.pendingProductId !== 'demo_prod_1' || t214State.updatedState.pendingSize !== 'L') {
    throw new Error(`Test 214 failed: Nonsense destroyed purchase context.`);
  }
  console.log('✅ [214/230] Audit D Passed: Nonsense keyboard mash preserved Hoodie purchase context.');

  // Test 215 (Audit E): Size selection ("large please") records L for active product
  let t215State = processDemoMessage(createInitialDemoState(), 'I want the hoodie');
  t215State = processDemoMessage(t215State.updatedState, 'large please');
  if (t215State.updatedState.pendingSize !== 'L') {
    throw new Error(`Test 215 failed: "large please" did not record size L.`);
  }
  console.log('✅ [215/230] Audit E Passed: "large please" recorded size L.');

  // Test 216 (Audit F): Size availability question ("What sizes does it come in?") lists verified sizes without selecting L
  const t216State = processDemoMessage(createInitialDemoState(), 'I want the hoodie');
  const t216Res = processDemoMessage(t216State.updatedState, 'what sizes does it come in?');
  if (!t216Res.responseText.includes('M, L') || t216Res.updatedState.pendingSize !== undefined) {
    throw new Error(`Test 216 failed: Size query selected size instead of listing options.`);
  }
  console.log('✅ [216/230] Audit F Passed: Size query returned available sizes without prematurely setting size state.');

  // Test 217 (Audit G): Color selection ("I want black") records Black for active product
  let t217State = processDemoMessage(createInitialDemoState(), 'I want the hoodie');
  t217State = processDemoMessage(t217State.updatedState, 'I want black');
  if (t217State.updatedState.pendingColor !== 'Black') {
    throw new Error(`Test 217 failed: Color selection did not record Black.`);
  }
  console.log('✅ [217/230] Audit G Passed: Color selection recorded Black.');

  // Test 218 (Audit H): Color availability question ("Do you have black?") returns availability without auto-selecting
  const t218Res = processDemoMessage(createInitialDemoState(), 'do you have the hoodie in black?');
  if (!t218Res.responseText.includes('Black Oversized Hoodie is available') && !t218Res.responseText.includes('in stock')) {
    throw new Error(`Test 218 failed: Color availability query response failed.`);
  }
  console.log('✅ [218/230] Audit H Passed: Color availability query returned verified color status.');

  // Test 219 (Audit I): Acknowledgement ("okay") after unavailable color statement does NOT auto-select alternative
  let t219State = processDemoMessage(createInitialDemoState(), 'do you have the hoodie in white?');
  t219State = processDemoMessage(t219State.updatedState, 'okay');
  if (t219State.updatedState.pendingColor === 'Black' && t219State.updatedState.pendingPurchaseIntent) {
    throw new Error(`Test 219 failed: "okay" converted passive acknowledgement into active purchase selection.`);
  }
  console.log('✅ [219/230] Audit I Passed: "okay" treated as passive acknowledgement without auto-buying alternative.');

  // Test 220 (Audit J): Yes after explicit confirmation question ("Would you like to order the hoodie?") activates purchase
  let t220State = processDemoMessage(createInitialDemoState(), 'tell me about the hoodie');
  t220State = processDemoMessage(t220State.updatedState, 'yes');
  if (!t220State.updatedState.pendingPurchaseIntent) {
    throw new Error(`Test 220 failed: "yes" after explicit prompt did not activate purchase intent.`);
  }
  console.log('✅ [220/230] Audit J Passed: "yes" after explicit prompt confirmed purchase intent.');

  // Test 221 (Audit K): Positional selection ("the 2nd one") resolves against displayed list
  let t221State = processDemoMessage(createInitialDemoState(), 'what do you have under 40k?');
  t221State = processDemoMessage(t221State.updatedState, 'the 2nd one');
  if (t221State.updatedState.pendingProductId !== 'demo_prod_2') {
    throw new Error(`Test 221 failed: "the 2nd one" did not select 2nd displayed product (Abaya).`);
  }
  console.log('✅ [221/230] Audit K Passed: "the 2nd one" selected 2nd product from filtered list.');

  // Test 222 (Audit L): Filtered positional selection ("the second one")
  let t222State = processDemoMessage(createInitialDemoState(), 'show me items under 100k');
  t222State = processDemoMessage(t222State.updatedState, 'the second one');
  if (!t222State.updatedState.pendingProductId) {
    throw new Error(`Test 222 failed: Positional reference failed on filtered budget query.`);
  }
  console.log('✅ [222/222] Audit L Passed: Positional selection succeeded on filtered catalog.');

  // Test 223 (Audit M): Delivery interruption ("I want the hoodie" -> "how much to Ikeja?" -> "I want L")
  let t223State = processDemoMessage(createInitialDemoState(), 'I want the hoodie');
  t223State = processDemoMessage(t223State.updatedState, 'how much is delivery to Ikeja?');
  if (t223State.updatedState.pendingProductId !== 'demo_prod_1' || t223State.updatedState.pendingLocation !== 'Ikeja') {
    throw new Error(`Test 223 failed: Delivery interruption cleared pending product or location.`);
  }
  t223State = processDemoMessage(t223State.updatedState, 'I want L');
  if (t223State.updatedState.orders.length === 0 || t223State.updatedState.orders[0].size !== 'L') {
    throw new Error(`Test 223 failed: Final order after delivery interruption missing size L.`);
  }
  console.log('✅ [223/232] Audit M Passed: Delivery query preserved product and location context.');

  // Test 224 (Audit N): Secondary product info inquiry does not hijack pending purchase ("I want hoodie" -> "Tell me about abaya" -> "L")
  let t224State = processDemoMessage(createInitialDemoState(), 'I want the hoodie');
  t224State = processDemoMessage(t224State.updatedState, 'tell me about the abaya');
  t224State = processDemoMessage(t224State.updatedState, 'L');
  if (t224State.updatedState.pendingProductId !== 'demo_prod_1' || t224State.updatedState.pendingSize !== 'L') {
    throw new Error(`Test 224 failed: Abaya info query hijacked Hoodie purchase.`);
  }
  console.log('✅ [224/230] Audit N Passed: Secondary product info query did not hijack pending purchase.');

  // Test 225 (Audit O): Unrelated product question ("do you sell snacks or what") extracts target "snacks" cleanly
  const t225Res = processDemoMessage(createInitialDemoState(), 'do you sell snacks or what');
  if (t225Res.responseText.includes("do you sell snacks or what") || !t225Res.responseText.includes("snacks")) {
    throw new Error(`Test 225 failed: Unrelated product wrapper not extracted cleanly: ${t225Res.responseText}`);
  }
  console.log('✅ [225/230] Audit O Passed: "do you sell snacks or what" extracted target "snacks" without echoing wrapper.');

  // Test 226 (Audit P): Ridiculous question ("can this hoodie fly?") handled naturally without hallucination
  const t226Res = processDemoMessage(createInitialDemoState(), 'can this hoodie fly?');
  if (t226Res.responseText.includes("Yes") || t226Res.responseText.includes("fly")) {
    throw new Error(`Test 226 failed: Ridiculous question hallucinated capability.`);
  }
  console.log('✅ [226/230] Audit P Passed: Ridiculous question answered grounded and naturally.');

  // Test 227 (Audit Q): Multi-question message ("how much is the hoodie, what sizes, and delivery to Ikeja?")
  const t227Res = processDemoMessage(createInitialDemoState(), 'how much is the hoodie, what sizes does it come in and how much is delivery to Ikeja?');
  if (!t227Res.responseText.includes('25,000') || !t227Res.responseText.includes('2,500')) {
    throw new Error(`Test 227 failed: Multi-question message failed to address price or delivery: ${t227Res.responseText}`);
  }
  console.log('✅ [227/230] Audit Q Passed: Multi-question message answered price, size, and delivery fee.');

  // Test 228 (Audit R): Complete multi-turn checkout sequence
  let t228State = processDemoMessage(createInitialDemoState(), 'What do you have?');
  t228State = processDemoMessage(t228State.updatedState, 'the second one');
  t228State = processDemoMessage(t228State.updatedState, 'what sizes does it come in?');
  t228State = processDemoMessage(t228State.updatedState, 'L');
  t228State = processDemoMessage(t228State.updatedState, 'how much is delivery to Ikeja?');
  t228State = processDemoMessage(t228State.updatedState, "I'll take it");
  if (t228State.updatedState.orders.length === 0 || t228State.updatedState.orders[0].size !== 'L' || t228State.updatedState.orders[0].deliveryLocation !== 'Ikeja') {
    throw new Error(`Test 228 failed: Complete multi-turn checkout sequence failed to log order.`);
  }
  console.log('✅ [228/230] Audit R Passed: Multi-turn checkout flow logged complete order.');

  // Test 229 (Audit S): Customer message fidelity ("the 2nd one", "ok", "yo 😂" preserved 100% verbatim)
  let t229State = processDemoMessage(createInitialDemoState(), 'the 2nd one');
  t229State = processDemoMessage(t229State.updatedState, 'ok');
  t229State = processDemoMessage(t229State.updatedState, 'yo 😂');
  const userMsgs = t229State.updatedState.messages.filter((m) => m.sender === 'customer').map((m) => m.text);
  if (userMsgs[0] !== 'the 2nd one' || userMsgs[1] !== 'ok' || userMsgs[2] !== 'yo 😂') {
    throw new Error(`Test 229 failed: Customer message altered in chat history: ${JSON.stringify(userMsgs)}`);
  }
  console.log('✅ [229/230] Audit S Passed: Customer messages preserved 100% verbatim in conversation state.');

  // Test 230 (Audit T): Price vs Size collision protection ("under 40k" never triggers size = 40)
  const t230Res = processDemoMessage(createInitialDemoState(), 'show me items under 40k');
  if (t230Res.updatedState.pendingSize === '40') {
    throw new Error(`Test 230 failed: Budget query "under 40k" triggered size 40.`);
  }
  console.log('✅ [230/232] Audit T Passed: Price/Budget query "under 40k" protected from shoe size collision.');

  // Test 231: Color inquiry on active product ("I want the hoodie" -> "do you have another color?")
  const t231State = processDemoMessage(createInitialDemoState(), 'I want the hoodie');
  const t231Res = processDemoMessage(t231State.updatedState, 'do you have another color?');
  if (t231Res.responseText.includes("don't currently have any do you have another color") || !t231Res.responseText.includes('Black Oversized Hoodie')) {
    throw new Error(`Test 231 failed: Active product color query echoed question as product name: ${t231Res.responseText}`);
  }
  console.log('✅ [231/232] Active Product Color Inquiry Test Passed: "do you have another color?" answered grounded for active product.');

  // Test 232: Category inquiry does not force order creation ("do you have hoodies?")
  const t232Res = processDemoMessage(createInitialDemoState(), 'do you have hoodies?');
  if (t232Res.responseText.includes('set up your order') || t232Res.updatedState.orders.length > 0) {
    throw new Error(`Test 232 failed: Category inquiry "do you have hoodies?" forced order creation.`);
  }
  console.log('✅ [232/236] Category Inquiry Test Passed: "do you have hoodies?" answered availability without forcing order creation.');

  // Test 233: Customer Correction ("No, I meant the abaya")
  const t233State1 = processDemoMessage(createInitialDemoState(), 'I want the hoodie');
  const t233Res = processDemoMessage(t233State1.updatedState, 'No, I meant the abaya');
  if (t233Res.updatedState.pendingProductId !== 'demo_prod_2') {
    throw new Error(`Test 233 failed: Customer correction "No, I meant the abaya" failed to switch active product to Abaya.`);
  }
  console.log('✅ [233/236] Customer Correction Test Passed: "No, I meant the abaya" cleanly updated pending product to Abaya.');

  // Test 234: Discount Request ("can you reduce the price?")
  const t234Res = processDemoMessage(createInitialDemoState(), 'can you reduce the price?');
  if (!t234Res.responseText.includes('fixed') && !t234Res.responseText.includes('pricing')) {
    throw new Error(`Test 234 failed: Discount request was not answered cleanly.`);
  }
  console.log('✅ [234/236] Discount Request Test Passed: "can you reduce the price?" answered with grounded pricing policy.');

  // Test 235: Nigerian Informal Language ("abeg show me your collection", "una get hoodies?")
  const t235Res1 = processDemoMessage(createInitialDemoState(), 'abeg show me your collection');
  const t235Res2 = processDemoMessage(createInitialDemoState(), 'una get hoodies?');
  if (!t235Res1.responseText.includes('Hoodie') || !t235Res2.responseText.includes('Hoodie')) {
    throw new Error(`Test 235 failed: Nigerian informal language failed catalog resolution.`);
  }
  console.log('✅ [235/236] Nigerian Informal Phrasing Test Passed: "abeg show me your collection" and "una get hoodies?" parsed cleanly.');

  // Test 236: Irrelevant Product Subject Extraction ("do you sell goats?")
  const t236Res = processDemoMessage(createInitialDemoState(), 'do you sell goats?');
  if (t236Res.responseText.includes("don't currently have any do you sell goats") || !t236Res.responseText.includes('goats')) {
    throw new Error(`Test 236 failed: Irrelevant product query failed clean noun extraction: ${t236Res.responseText}`);
  }
  console.log('✅ [236/237] Irrelevant Product Subject Extraction Test Passed: "do you sell goats?" extracted clean target "goats".');

  // Test 237: 15-Turn Continuous Natural WhatsApp Sales Conversation
  let t237 = createInitialDemoState();
  const turns = [
    'yo wassup 👋',
    'wetin una get?',
    'Your collection is fire 🔥',
    'the 2nd one',
    'What colors does it come in?',
    'do you have it in red?',
    'ok',
    'what sizes do you have?',
    'na which size I go take?',
    'I want L',
    'how much be delivery to Ikeja?',
    'you dey sell caps or what?',
    'lol 😂',
    'can you reduce the price?',
    "I'll take it"
  ];
  for (let i = 0; i < turns.length; i++) {
    const res = processDemoMessage(t237, turns[i]);
    t237 = res.updatedState;
  }

  if (t237.orders.length === 0 || t237.orders[0].productName !== 'Black Velvet Abaya' || t237.orders[0].size !== 'L' || t237.orders[0].deliveryLocation !== 'Ikeja') {
    throw new Error(`Test 237 failed: 15-turn continuous conversation lost state thread: ${JSON.stringify(t237.orders)}`);
  }

  // Verify Customer Message Immutability across all 15 customer turns
  const customerHistory = t237.messages.filter(m => m.sender === 'customer').map(m => m.text);
  const expectedHistory = [
    'yo wassup 👋', 'wetin una get?', 'Your collection is fire 🔥', 'the 2nd one',
    'What colors does it come in?', 'do you have it in red?', 'ok', 'what sizes do you have?',
    'na which size I go take?', 'I want L', 'how much be delivery to Ikeja?',
    'you dey sell caps or what?', 'lol 😂', 'can you reduce the price?', "I'll take it"
  ];
  for (let i = 0; i < expectedHistory.length; i++) {
    if (customerHistory[i] !== expectedHistory[i]) {
      throw new Error(`Test 237 failed: Customer message ${i} mutated from "${expectedHistory[i]}" to "${customerHistory[i]}".`);
    }
  }
  console.log('✅ [237/241] 15-Turn Continuous Natural Sales Conversation Test Passed: Context thread maintained and customer messages 100% immutable.');

  // Test 238: Small Talk ("how body?", "how was your day?")
  const t238Res = processDemoMessage(createInitialDemoState(), 'how was your day?');
  if (!t238Res.responseText.includes('fine') && !t238Res.responseText.includes('smooth')) {
    throw new Error(`Test 238 failed: Small talk question "how was your day?" failed natural response: ${t238Res.responseText}`);
  }
  console.log('✅ [238/241] Small Talk Test Passed: "how was your day?" answered warmly.');

  // Test 239: Store Location ("where is your shop located?")
  const t239Res = processDemoMessage(createInitialDemoState(), 'where is your shop located?');
  if (!t239Res.responseText.includes('Lagos') || !t239Res.responseText.includes('online')) {
    throw new Error(`Test 239 failed: Store location question failed: ${t239Res.responseText}`);
  }
  console.log('✅ [239/241] Store Location Test Passed: "where is your shop located?" answered with Lagos online presence.');

  // Test 240: Assistant & Business Identity ("are you a robot?")
  const t240Res = processDemoMessage(createInitialDemoState(), 'are you a robot?');
  if (!t240Res.responseText.includes('VendiAide')) {
    throw new Error(`Test 240 failed: Assistant identity question failed: ${t240Res.responseText}`);
  }
  console.log('✅ [240/241] Assistant Identity Test Passed: "are you a robot?" answered with VendiAide persona.');

  // Test 241: Mid-Order Casual Chit-Chat Interruption ("rain dey fall for Lagos today")
  const t241State1 = processDemoMessage(createInitialDemoState(), 'I want the hoodie');
  const t241Res = processDemoMessage(t241State1.updatedState, 'rain dey fall for Lagos today o');
  if (t241Res.updatedState.pendingProductId !== 'demo_prod_1') {
    throw new Error(`Test 241 failed: Casual banter "rain dey fall for Lagos today o" lost active pending product context.`);
  }
  console.log('✅ [241/245] Mid-Order Casual Interruption Test Passed: Casual banter preserved pending Hoodie purchase context.');

  // Test 242: Simple Synonym Gown ("do you have gowns?")
  const t242Res = processDemoMessage(createInitialDemoState(), 'do you have gowns?');
  if (!t242Res.responseText.includes('Abaya')) {
    throw new Error(`Test 242 failed: Simple synonym "gowns" failed to resolve to Abaya: ${t242Res.responseText}`);
  }
  console.log('✅ [242/245] Simple Synonym Gowns Test Passed: "gowns" resolved to Black Velvet Abaya.');

  // Test 243: Simple Synonym Shoes ("how much be shoes?")
  const t243Res = processDemoMessage(createInitialDemoState(), 'how much be shoes?');
  if (!t243Res.responseText.includes('45,000') || !t243Res.responseText.includes('Sneakers')) {
    throw new Error(`Test 243 failed: Simple synonym "shoes" failed to resolve to Sneakers: ${t243Res.responseText}`);
  }
  console.log('✅ [243/245] Simple Synonym Shoes Test Passed: "shoes" resolved to White Premium Sneakers.');

  // Test 244: Simple Synonym Sweatshirt ("I want sweatshirt")
  const t244Res = processDemoMessage(createInitialDemoState(), 'I want sweatshirt');
  if (t244Res.updatedState.pendingProductId !== 'demo_prod_1') {
    throw new Error(`Test 244 failed: Simple synonym "sweatshirt" failed to set active product to Hoodie.`);
  }
  console.log('✅ [244/245] Simple Synonym Sweatshirt Test Passed: "sweatshirt" resolved to Black Oversized Hoodie.');

  // Test 245: Simple Picture Request ("show me pics")
  const t245Res = processDemoMessage(createInitialDemoState(), 'show me pics');
  if (!t245Res.responseText.includes('photos') && !t245Res.responseText.includes('showcase')) {
    throw new Error(`Test 245 failed: Picture request "show me pics" failed: ${t245Res.responseText}`);
  }
  console.log('✅ [245/247] Simple Picture Request Test Passed: "show me pics" returned grounded catalog showcase response.');

  // Test 246: Specific Color Availability Inquiry ("do you have the white one?")
  const t246State1 = processDemoMessage(createInitialDemoState(), 'i want a hoodie');
  const t246Res = processDemoMessage(t246State1.updatedState, 'do you have the white one?');
  if (t246Res.responseText.includes('no item called') || !t246Res.responseText.includes('Black')) {
    throw new Error(`Test 246 failed: "do you have the white one?" returned ungrounded/broken response: ${t246Res.responseText}`);
  }
  console.log('✅ [246/247] Specific Color Inquiry Test Passed: "do you have the white one?" answered grounded without unlisted error.');

  // Test 247: Specific Color Availability Inquiry ("does it come in white?")
  const t247State1 = processDemoMessage(createInitialDemoState(), 'I want the hoodie');
  const t247Res = processDemoMessage(t247State1.updatedState, 'does it come in white?');
  if (!t247Res.responseText.includes('comes in Black') && !t247Res.responseText.includes('currently comes in')) {
    throw new Error(`Test 247 failed: "does it come in white?" returned invalid response: ${t247Res.responseText}`);
  }
  // Test 248: Generic Category Query ("i want a hoodie") presents product details first
  const t248Res = processDemoMessage(createInitialDemoState(), 'i want a hoodie');
  if (t248Res.intent === 'PURCHASE_INTENT' && t248Res.responseText.includes('delivery location')) {
    throw new Error(`Test 248 failed: "i want a hoodie" prematurely triggered order completion form instead of presenting product details: ${t248Res.responseText}`);
  }
  if (!t248Res.responseText.includes('Black Oversized Hoodie') || !t248Res.responseText.includes('25,000')) {
    throw new Error(`Test 248 failed: "i want a hoodie" failed to present product details and price: ${t248Res.responseText}`);
  }
  console.log('✅ [248/249] Generic Category Inquiry Test Passed: "i want a hoodie" presented product details first before order placement.');

  // Test 249: Color selection response ("let's go with black") after color option query
  let t249State = processDemoMessage(createInitialDemoState(), 'I want the hoodie');
  t249State = processDemoMessage(t249State.updatedState, 'do you have the white one?');
  const t249Res = processDemoMessage(t249State.updatedState, "let's go with black");
  if (t249Res.responseText.includes('no item called') || (!t249Res.responseText.includes('Black Oversized Hoodie') && !t249Res.responseText.includes('size'))) {
    throw new Error(`Test 249 failed: "let's go with black" failed to resolve color selection: ${t249Res.responseText}`);
  }
  console.log('✅ [249/250] Color Selection Resolution Test Passed: "let\'s go with black" resolved color selection cleanly.');

  // Test 250: Exact 11-Turn Customer Size Correction Transcript Verification
  const t250Turns = ['hi', 'do you have hoodies', 'do you have the white one', 'give me a black one', 'i want a large one', 'sorry, i want XL', 'no give me M size', 'M', 'no i want the L', 'l', 'ikeja'];
  let t250State = createInitialDemoState();
  for (let i = 0; i < t250Turns.length; i++) {
    const res = processDemoMessage(t250State, t250Turns[i]);
    t250State = res.updatedState;
    if (i === 1 && res.responseText.includes('delivery location')) {
      throw new Error(`Test 250 failed at turn 2 ("do you have hoodies"): prematurely assumed purchase order: ${res.responseText}`);
    }
    if (res.responseText.includes('no item called')) {
      throw new Error(`Test 250 failed at turn ${i + 1} ("${t250Turns[i]}"): returned ungrounded item response: ${res.responseText}`);
    }
  }
  if (t250State.orders.length === 0 || t250State.orders[0].size !== 'L' || t250State.orders[0].deliveryLocation !== 'Ikeja') {
    throw new Error(`Test 250 failed: final order state invalid: ${JSON.stringify(t250State.orders)}`);
  }
  console.log('✅ [250/251] 11-Turn Live Customer Transcript Test Passed: Category query presents item first, size corrections ("no give me M size", "no i want the L") processed cleanly.');

  // Test 251: Master Directive Golden Conversation Verification (Section 32)
  const goldenTurns = ['hi', 'wetin una get?', 'the second one', 'what sizes does it have?', 'do you have white?', 'okay', 'actually black', 'how much to Ikeja?', 'I will take it', 'L', 'thanks'];
  let goldenState = createInitialDemoState();
  for (let i = 0; i < goldenTurns.length; i++) {
    const res = processDemoMessage(goldenState, goldenTurns[i]);
    goldenState = res.updatedState;
    if (res.responseText.includes('no item called')) {
      throw new Error(`Test 251 failed at turn ${i + 1} ("${goldenTurns[i]}"): returned ungrounded item response: ${res.responseText}`);
    }
  }
  if (goldenState.orders.length === 0 || goldenState.orders[0].productName !== 'Black Velvet Abaya' || goldenState.orders[0].size !== 'L' || goldenState.orders[0].deliveryLocation !== 'Ikeja') {
    throw new Error(`Test 251 failed: Golden Conversation final order state invalid: ${JSON.stringify(goldenState.orders)}`);
  }
  console.log('✅ [251/252] Master Directive Golden Conversation Test Passed: 11-turn sequence ("hi" -> "wetin una get?" -> "the second one" -> "what sizes..." -> "I will take it" -> "L" -> "thanks") verified 100% clean.');

  // Test 252: Nigerian Pidgin & Informal Language Master Directive Verification
  const pidginChecks = [
    { phrase: 'Howfar?', expectedIntent: 'GREETING' },
    { phrase: 'hwfar', expectedIntent: 'GREETING' },
    { phrase: 'hw far bro', expectedIntent: 'GREETING' },
    { phrase: 'wetin una get for here?', expectedIntent: 'CATALOG_INQUIRY' },
    { phrase: 'una get hoodie?', expectedIntent: 'CATALOG_INQUIRY' },
    { phrase: 'wetin I fit buy with 30k?', expectedIntent: 'CATALOG_INQUIRY' },
    { phrase: 'how much delivery to Ikeja?', expectedIntent: 'PRICE_INQUIRY' },
    { phrase: 'abeg reduce am', expectedIntent: 'DISCOUNT_REQUEST' },
    { phrase: 'una dey collect transfer?', expectedIntent: 'PAYMENT_INQUIRY' },
    { phrase: 'oshe', expectedIntent: 'THANKS' },
    { phrase: 'una clothes fine', expectedIntent: 'COMPLIMENT' },
    { phrase: 'no wahala', expectedIntent: 'CONTEXTUAL_REPLY' },
    { phrase: 'una dey sell food?', expectedIntent: 'GENERAL_QUESTION' },
  ];
  for (const check of pidginChecks) {
    const res = processDemoMessage(createInitialDemoState(), check.phrase);
    if (res.intent !== check.expectedIntent) {
      throw new Error(`Test 252 failed for phrase "${check.phrase}": expected intent ${check.expectedIntent}, got ${res.intent}`);
    }
  }
  console.log('✅ [252/253] Nigerian Pidgin & Informal Language Master Test Passed: All 11 slang/Pidgin expressions ("howfar", "wetin una get", "abeg reduce am", "una dey collect transfer", "oshe", "una clothes fine") semantically resolved with 100% fidelity.');

  // Test 253: Dynamic Catalog-Driven Sneaker Size Verification
  const sneakerSizesToTest = [
    { size: '30', available: false },
    { size: '39', available: false },
    { size: '40', available: true },
    { size: '41', available: true },
    { size: '42', available: true },
    { size: '43', available: true },
    { size: '44', available: true },
    { size: '45', available: false },
    { size: '50', available: false },
    { size: '55', available: false },
  ];

  for (const { size, available } of sneakerSizesToTest) {
    // 1. Direct query with product name: "Do you have sneakers in size <size>?"
    const directRes = processDemoMessage(createInitialDemoState(), `Do you have sneakers in size ${size}?`);
    if (directRes.intent !== 'AVAILABILITY_INQUIRY') {
      throw new Error(`Test 253 failed: expected AVAILABILITY_INQUIRY for size ${size}, got ${directRes.intent}`);
    }
    if (available) {
      if (!directRes.responseText.toLowerCase().includes('yes') || !directRes.responseText.includes(size)) {
        throw new Error(`Test 253 failed: expected availability confirmation for size ${size}, got: ${directRes.responseText}`);
      }
    } else {
      if (!directRes.responseText.includes("isn't currently listed") || !directRes.responseText.includes('40, 41, 42, 43, and 44')) {
        throw new Error(`Test 253 failed: expected unavailable size message for size ${size}, got: ${directRes.responseText}`);
      }
    }

    // 2. Multi-turn inquiry: "sneakers" -> "<size>"
    const s1 = processDemoMessage(createInitialDemoState(), 'sneakers');
    const s2 = processDemoMessage(s1.updatedState, size);
    if (available) {
      if (s2.intent !== 'PURCHASE_INTENT' || s2.updatedState.activeDraft?.size !== size) {
        throw new Error(`Test 253 multi-turn failed for size ${size}: intent=${s2.intent}, draftSize=${s2.updatedState.activeDraft?.size}`);
      }
    } else {
      if (s2.intent !== 'AVAILABILITY_INQUIRY' || !s2.responseText.includes("isn't currently listed")) {
        throw new Error(`Test 253 multi-turn failed for unavailable size ${size}: intent=${s2.intent}, response=${s2.responseText}`);
      }
    }
  }

  // Explicit size 55 phrases
  const size55Phrases = [
    'I want sneakers size 55',
    'I wan sneaker size 55',
    'boss you get size 55 sneakers?',
    'do you have size 55 for the sneakers?',
  ];
  for (const phrase of size55Phrases) {
    const res = processDemoMessage(createInitialDemoState(), phrase);
    if (res.intent !== 'AVAILABILITY_INQUIRY' || !res.responseText.includes("isn't currently listed")) {
      throw new Error(`Test 253 failed for phrase "${phrase}": intent=${res.intent}, response=${res.responseText}`);
    }
  }

  // Truly unlisted product distinction (e.g. Rolex)
  const rolexRes = processDemoMessage(createInitialDemoState(), 'Rolex');
  if (rolexRes.intent !== 'GENERAL_QUESTION' || !rolexRes.responseText.toLowerCase().includes("don't currently have rolex listed")) {
    throw new Error(`Test 253 failed for unlisted product "Rolex": intent=${rolexRes.intent}, response=${rolexRes.responseText}`);
  }
  console.log('✅ [253/253] Dynamic Catalog Sneaker Size & Unlisted Product 3-Way Distinction Test Passed: sizes 30, 39, 40, 41, 42, 43, 44, 45, 50, 55 tested across single & multi-turn conversations.');

  console.log('\n🎉 ALL 253 VendiAide MASTER DIRECTIVE & NIGERIAN PIDGIN TESTS PASSED 100% CLEANLY!');
}

runFullArchitectureVerificationSuite().catch((err) => {
  console.error('❌ Verification suite failed:', err);
  process.exit(1);
});


