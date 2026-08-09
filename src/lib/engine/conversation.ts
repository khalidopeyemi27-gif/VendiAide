import { IncomingMessage, OutgoingMessage } from '../channels/types';
import { getChannelAdapter } from '../channels/registry';
import { getGroundedContext } from './context';
import { buildSystemPrompt } from './prompts';
import { generateAIResponse, getActiveModelName } from './ai';
import { detectIntentAndEntities } from './intent';
import { checkAndEnforceUsage, recordUsageIncrement } from './usage';
import { verifyResponseSafety, buildFallbackEscalationMessage } from './safety';
import { mockStore } from '../db/mock-store';
import { ConversationTurn, AIResponsePayload } from './types';
import { Customer, Conversation, Message, Lead, Order } from '../types/database';

export class ConversationEngine {
  /**
   * Main pipeline flow:
   * Channel Adapter -> Usage Enforcement -> Grounded Context Retrieval -> AI Engine -> Intent Parser -> Recording Engine -> Channel Adapter Response
   */
  async processIncomingMessage(incoming: IncomingMessage): Promise<AIResponsePayload> {
    const { business_id, sender, content, channel } = incoming;

    // 1. Subscription & Usage Enforcement Check
    const usageCheck = await checkAndEnforceUsage(business_id);
    if (!usageCheck.allowed) {
      const limitNotice = usageCheck.message || 'Monthly AI limit reached. Please contact support or upgrade your subscription.';
      const adapter = getChannelAdapter(channel);
      await adapter.sendMessage({
        id: `limit_msg_${Date.now()}`,
        channel,
        recipient: sender,
        content: limitNotice,
        timestamp: new Date().toISOString(),
      });

      return {
        content: limitNotice,
        intent: 'UNHANDLED_INQUIRY',
        tokensUsed: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        latencyMs: 10,
        safetyPassed: true,
        escalated: true,
      };
    }

    // 2. Save or Retrieve Customer Record
    const customer: Customer = mockStore.saveCustomer({
      id: `cust_${Date.now()}`,
      business_id,
      name: sender.name || null,
      channel,
      channel_user_id: sender.channel_user_id,
      phone_number: sender.phone_number || null,
      notes: null,
      created_at: new Date().toISOString(),
    });

    // 3. Save or Retrieve Active Conversation
    const conversation: Conversation = mockStore.saveConversation({
      id: `conv_${Date.now()}`,
      business_id,
      customer_id: customer.id,
      channel,
      last_intent: null,
      status: 'ai_active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Save Customer Message
    mockStore.saveMessage({
      id: `msg_cust_${Date.now()}`,
      conversation_id: conversation.id,
      business_id,
      sender_type: 'customer',
      content,
      intent_detected: null,
      created_at: new Date().toISOString(),
    });

    // 4. Retrieve Grounded Vendor Business Context
    const groundedContext = await getGroundedContext(business_id);

    // 5. Build System Prompt & History
    const systemPrompt = buildSystemPrompt(groundedContext);
    const history: ConversationTurn[] = [
      { role: 'user', content: 'What products do you have available?' },
      { role: 'assistant', content: groundedContext.aiSettings.greeting_message },
    ];

    // 6. Generate AI Response
    const aiResult = await generateAIResponse(systemPrompt, history, content);

    // 7. Safety Verification
    const safetyCheck = verifyResponseSafety(aiResult.content, groundedContext);
    let finalResponseContent = aiResult.content;
    let isEscalated = false;

    if (!safetyCheck.safe) {
      finalResponseContent = buildFallbackEscalationMessage(groundedContext.business.name);
      isEscalated = true;
    }

    // 8. Intent & Entity Recognition
    const { intent, extractedEntities } = detectIntentAndEntities(content, finalResponseContent);

    // 9. Auto-create Lead / Order when Purchase Intent is detected
    if (intent === 'PURCHASE_INTENT' || intent === 'ORDER_CREATION') {
      // Record Lead
      mockStore.saveLead({
        id: `lead_${Date.now()}`,
        business_id,
        customer_id: customer.id,
        conversation_id: conversation.id,
        product_interested: extractedEntities?.productName || 'Fashion Item Inquiry',
        status: 'ORDER_PENDING',
        source: channel,
        notes: `Extracted Size: ${extractedEntities?.size || 'N/A'}, Color: ${extractedEntities?.color || 'N/A'}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Record Draft Order
      mockStore.saveOrder({
        id: `ord_${Date.now()}`,
        business_id,
        customer_id: customer.id,
        conversation_id: conversation.id,
        total_amount: 25000, // Default estimate from catalog
        delivery_location: extractedEntities?.deliveryLocation || 'Pending confirmation',
        payment_status: 'UNPAID',
        order_status: 'PENDING',
        notes: `Product: ${extractedEntities?.productName || 'Fashion Item'}, Size: ${extractedEntities?.size || 'Default'}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Update conversation state
    conversation.last_intent = intent;
    if (intent === 'HUMAN_ESCALATION' || isEscalated) {
      conversation.status = 'human_takeover';
    }
    mockStore.saveConversation(conversation);

    // Save AI Response Message
    mockStore.saveMessage({
      id: `msg_ai_${Date.now()}`,
      conversation_id: conversation.id,
      business_id,
      sender_type: 'ai',
      content: finalResponseContent,
      intent_detected: intent,
      created_at: new Date().toISOString(),
    });

    // 10. Record Monthly Usage Increment
    const totalTokens = aiResult.promptTokens + aiResult.completionTokens;
    await recordUsageIncrement(business_id, totalTokens);

    // 11. Send Outgoing Message via Channel Adapter
    const adapter = getChannelAdapter(channel);
    const outgoing: OutgoingMessage = {
      id: `out_msg_${Date.now()}`,
      channel,
      recipient: sender,
      content: finalResponseContent,
      intent_detected: intent,
      timestamp: new Date().toISOString(),
    };
    await adapter.sendMessage(outgoing);

    return {
      content: finalResponseContent,
      intent,
      tokensUsed: {
        promptTokens: aiResult.promptTokens,
        completionTokens: aiResult.completionTokens,
        totalTokens,
      },
      latencyMs: aiResult.latencyMs,
      safetyPassed: safetyCheck.safe,
      escalated: isEscalated || intent === 'HUMAN_ESCALATION',
      extractedEntities,
    };
  }
}

export const conversationEngine = new ConversationEngine();
