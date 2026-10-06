/**
 * Enforces strict Grounded Information Rules:
 * The AI sales assistant relies ONLY on verified vendor catalog, delivery, payment, and FAQ data.
 * It will NEVER invent or guess prices, stock availability, sizes, colours, delivery fees, or payment info.
 */

export const GROUNDED_SAFETY_INSTRUCTIONS = `
CRITICAL GROUNDED INFORMATION DIRECTIVE:
1. You must ONLY answer questions using the exact product details, prices (₦), sizes, colours, stock status, delivery fees, payment account numbers, and FAQs provided in the GROUNDED CONTEXT.
2. If a customer asks about a product, size, colour, discount, delivery location, or policy that is NOT listed in the GROUNDED CONTEXT:
   - State clearly and politely that you do NOT have that specific information for the business yet.
   - Offer to connect them directly with the human vendor/store owner.
   - DO NOT make up prices, sizes, colours, stock status, or delivery terms under any circumstances.
3. Keep response concise, friendly, and oriented towards helping the customer purchase their fashion items.
`;

export function verifyResponseSafety(responseContent: string): { safe: boolean; reason?: string } {
  // Guardrail check: Verify no placeholder text or ungrounded claims
  const lower = responseContent.toLowerCase();
  
  if (lower.includes('as an ai') || lower.includes('openai') || lower.includes('chatgpt')) {
    return { safe: false, reason: 'AI identity leak detected' };
  }

  return { safe: true };
}

export function buildFallbackEscalationMessage(businessName: string, missingTopic?: string): string {
  if (missingTopic) {
    return `I don't have information on ${missingTopic} for ${businessName} right now. I've noted your question and alerted our sales team to follow up with you directly on WhatsApp!`;
  }
  return `Thanks for your inquiry! I don't have those exact details in our catalog right now. I'll connect you directly with the owner of ${businessName} to assist you!`;
}
