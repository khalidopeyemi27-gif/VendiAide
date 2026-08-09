import { getEnv } from '../lib/env';
import { formatNaira } from '../lib/utils/formatters';
import { FashionIndustryTemplate, getTemplate } from '../lib/templates';
import { MockWhatsAppAdapter, WebDemoAdapter } from '../lib/channels';
import { conversationEngine } from '../lib/engine/conversation';
import { mockStore, DEMO_BUSINESS } from '../lib/db/mock-store';
import { checkAndEnforceUsage } from '../lib/engine/usage';

async function runPhase1VerificationSuite() {
  console.log('🧪 Running Phase 1 Architecture Verification Suite...\n');

  // Test 1: Environment validation
  const env = getEnv();
  console.log('✅ [1/7] Environment configuration validated: OpenAI Model =', env.OPENAI_MODEL);

  // Test 2: Naira formatting
  const nairaOutput = formatNaira(25000);
  if (nairaOutput !== '₦25,000') {
    throw new Error(`Naira formatter failed. Expected ₦25,000, got ${nairaOutput}`);
  }
  console.log('✅ [2/7] Currency formatter verified: 25000 ->', nairaOutput);

  // Test 3: IndustryTemplate Abstraction
  const template = getTemplate('fashion');
  if (template.id !== 'fashion' || !template.defaultCategories.includes('Ready-to-Wear')) {
    throw new Error('Fashion Industry Template verification failed.');
  }
  console.log('✅ [3/7] IndustryTemplate abstraction verified: Active Vertical =', template.name);

  // Test 4: Channel Adapters
  const waAdapter = new MockWhatsAppAdapter();
  const webAdapter = new WebDemoAdapter();
  if (waAdapter.channel !== 'whatsapp' || webAdapter.channel !== 'web_demo') {
    throw new Error('Channel Adapter verification failed.');
  }
  console.log('✅ [4/7] Channel Adapters verified: WhatsApp & WebDemo providers ready.');

  // Test 5: Subscription Usage Enforcement
  const usageStatus = await checkAndEnforceUsage(DEMO_BUSINESS.id);
  if (!usageStatus.allowed || usageStatus.limit !== 500) {
    throw new Error('Subscription limit enforcement check failed.');
  }
  console.log(`✅ [5/7] Subscription Usage Enforcer verified: Plan = ${usageStatus.plan}, Limit = ${usageStatus.limit}`);

  // Test 6: Conversation Engine End-to-End Pipeline
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
  console.log('✅ [6/7] Conversation Engine Pipeline verified: Response generated successfully.');
  console.log('   🤖 AI Response Snippet:', payload.content.substring(0, 100) + '...');
  console.log('   🎯 Intent Detected:', payload.intent);
  console.log('   ⏱️ Latency:', payload.latencyMs, 'ms');

  // Test 7: Intent & Lead Capture Verification
  const purchasePayload = await conversationEngine.processIncomingMessage({
    id: 'test_msg_2',
    channel: 'web_demo',
    business_id: DEMO_BUSINESS.id,
    sender: {
      channel: 'web_demo',
      channel_user_id: 'test_user_99',
      name: 'Amaka',
    },
    content: 'I want to buy the Black Oversized Hoodie size L in Black. Send account details.',
    timestamp: new Date().toISOString(),
  });

  const leads = mockStore.getLeads(DEMO_BUSINESS.id);
  const orders = mockStore.getOrders(DEMO_BUSINESS.id);
  if (leads.length === 0 || orders.length === 0) {
    throw new Error('Lead or Order auto-recording failed upon purchase intent detection.');
  }
  console.log('✅ [7/7] Intent Engine & Recording Module verified: Lead & Order captured.');
  console.log('   📋 Total Leads Captured:', leads.length);
  console.log('   📦 Total Orders Recorded:', orders.length);

  console.log('\n🎉 ALL PHASE 1 ARCHITECTURE VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runPhase1VerificationSuite().catch((err) => {
  console.error('❌ Verification suite failed:', err);
  process.exit(1);
});
