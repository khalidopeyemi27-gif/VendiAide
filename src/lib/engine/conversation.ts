import { IncomingMessage, OutgoingMessage } from '../channels/types';
import { getChannelAdapter } from '../channels/registry';
import { getGroundedContext } from './context';
import { buildSystemPrompt } from './prompts';
import { generateAIResponse } from './ai';
import { detectIntentAndEntities } from './intent';
import { checkAndEnforceUsage, recordUsageIncrement } from './usage';
import { verifyResponseSafety, buildFallbackEscalationMessage } from './safety';
import { mockStore } from '../db/mock-store';
import { ConversationTurn, AIResponsePayload } from './types';
import { Customer, Conversation, OrderItem } from '../types/database';

export class ConversationEngine {
  /**
   * Main pipeline flow:
   * Channel Adapter -> Usage Enforcement -> Grounded Context Retrieval -> AI Engine -> Intent Parser -> Recording Engine -> Channel Adapter Response
   */
  async processIncomingMessage(incoming: IncomingMessage): Promise<AIResponsePayload> {
    const { business_id, sender, content, channel } = incoming;

    // 1. Subscription & Usage Enforcement Check BEFORE OpenAI Call
    const usageCheck = await checkAndEnforceUsage(business_id);
    if (!usageCheck.allowed) {
      const limitNotice = usageCheck.message || 'Monthly AI limit reached. Your message has been forwarded to the vendor.';
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
        intent: 'HUMAN_ESCALATION',
        tokensUsed: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        latencyMs: 10,
        safetyPassed: true,
        escalated: true,
      };
    }

    // 2. Save or Retrieve Customer Record (Scoped by business_id + channel + channel_user_id)
    const customer: Customer = mockStore.saveCustomer({
      id: `cust_${Date.now()}_${sender.channel_user_id}`,
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
      id: `conv_${Date.now()}_${customer.id}`,
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

    // 4. Retrieve Grounded Vendor Business Context (Filters out archived products)
    const groundedContext = await getGroundedContext(business_id);

    // 5. Build System Prompt & Conversation History
    const systemPrompt = buildSystemPrompt(groundedContext);
    const history: ConversationTurn[] = [
      { role: 'user', content: 'What items do you have available?' },
      { role: 'assistant', content: groundedContext.aiSettings.greeting_message },
    ];

    // 6. Generate AI Response
    const aiResult = await generateAIResponse(systemPrompt, history, content);

    // 7. Safety Verification & Human Escalation Boundary Check
    const safetyCheck = verifyResponseSafety(aiResult.content);
    let finalResponseContent = aiResult.content;
    let isEscalated = false;

    if (!safetyCheck.safe) {
      finalResponseContent = buildFallbackEscalationMessage(groundedContext.business.name);
      isEscalated = true;
    }

    // 8. Intent & Entity Recognition
    const { intent, extractedEntities } = detectIntentAndEntities(content, finalResponseContent);

    // Handle Explicit Human Escalation
    if (intent === 'HUMAN_ESCALATION' || isEscalated) {
      conversation.status = 'human_takeover';
      finalResponseContent = buildFallbackEscalationMessage(groundedContext.business.name);
    }

    // 9. Lead & Order Action Pipeline
    if (intent === 'PURCHASE_INTENT' || intent === 'PRODUCT_INQUIRY') {
      const existingLeads = mockStore.getLeads(business_id).filter((l) => l.customer_id === customer.id);
      const leadStatus = intent === 'PURCHASE_INTENT' ? 'ORDER_PENDING' : 'INTERESTED';

      if (existingLeads.length === 0) {
        mockStore.saveLead({
          id: `lead_${Date.now()}`,
          business_id,
          customer_id: customer.id,
          conversation_id: conversation.id,
          product_interested: extractedEntities?.productName || 'Fashion Apparel',
          status: leadStatus,
          source: channel,
          notes: `Size: ${extractedEntities?.size || 'N/A'}, Color: ${extractedEntities?.color || 'N/A'}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        const lead = existingLeads[0];
        lead.status = leadStatus;
        if (extractedEntities?.productName) lead.product_interested = extractedEntities.productName;
        lead.updated_at = new Date().toISOString();
        mockStore.saveLead(lead);
      }
    }

    // Attribute-Aware Order Creation Rule:
    const matchedProduct = extractedEntities?.productName
      ? groundedContext.products.find(
          (p) => p.name.toLowerCase().includes(extractedEntities.productName!.toLowerCase())
        ) || groundedContext.products[0]
      : groundedContext.products[0];

    const productAttrs = (matchedProduct?.attributes || {}) as { sizes?: string[]; colors?: string[] };
    const requiresSize = Boolean(productAttrs.sizes && productAttrs.sizes.length > 0);
    const requiresColor = Boolean(productAttrs.colors && productAttrs.colors.length > 0);

    const sizeProvided = Boolean(extractedEntities?.size);
    const colorProvided = Boolean(extractedEntities?.color);
    const hasLocation = Boolean(extractedEntities?.deliveryLocation);
    const hasProduct = Boolean(extractedEntities?.productName);
    const hasPurchaseIntent = intent === 'PURCHASE_INTENT';

    const isSizeSatisfied = !requiresSize || sizeProvided;
    const isColorSatisfied = !requiresColor || colorProvided;
    const isOrderComplete = hasPurchaseIntent && hasProduct && hasLocation && isSizeSatisfied && isColorSatisfied;

    if (isOrderComplete) {
      // Check Idempotency: avoid duplicate orders for same conversation within last 60 seconds
      const existingOrders = mockStore.getOrders(business_id).filter((o) => o.conversation_id === conversation.id);
      const isDuplicate = existingOrders.some(
        (o) => Date.now() - new Date(o.created_at).getTime() < 60000
      );

      if (!isDuplicate) {
        const unitPrice = matchedProduct ? matchedProduct.price_ngn : 25000;
        const qty = extractedEntities?.quantity || 1;

        const newOrder = mockStore.saveOrder({
          id: `ord_${Date.now()}`,
          business_id,
          customer_id: customer.id,
          conversation_id: conversation.id,
          total_amount: unitPrice * qty,
          delivery_location: extractedEntities!.deliveryLocation!,
          payment_status: 'UNPAID',
          order_status: 'PENDING',
          notes: `Item: ${matchedProduct?.name || extractedEntities?.productName}, Size: ${extractedEntities?.size || 'N/A'}, Color: ${extractedEntities?.color || 'N/A'}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Create Snapshot Order Item (Immutable)
        const orderItem: OrderItem = {
          id: `item_${Date.now()}`,
          order_id: newOrder.id,
          product_id: matchedProduct?.id || 'prod_snapshot',
          product_name: matchedProduct?.name || extractedEntities!.productName!,
          quantity: qty,
          unit_price: unitPrice,
          size: extractedEntities?.size || null,
          color: extractedEntities?.color || null,
          attributes_snapshot: {
            size: extractedEntities?.size,
            color: extractedEntities?.color,
          },
        };
        mockStore.saveOrderItem(orderItem);
      }
    } else if (hasPurchaseIntent && hasProduct) {
      // Prompt ONLY for the missing attributes required by this specific product
      const missingFields: string[] = [];
      if (requiresSize && !sizeProvided) missingFields.push('size');
      if (requiresColor && !colorProvided) missingFields.push('colour');
      if (!hasLocation) missingFields.push('delivery location');

      if (missingFields.length > 0) {
        finalResponseContent = `Got it! To place your order for ${matchedProduct?.name || extractedEntities?.productName}, please tell us your preferred ${missingFields.join(' and ')}.`;
      }
    }

    // Update conversation state
    conversation.last_intent = intent;
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

    // 10. Record Monthly Token Usage Increment
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
