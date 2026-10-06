import { referenceRepository } from './repository';
import { ReferenceMessage } from './types';

export interface ObserveParams {
  conversationId?: string;
  customerMessage: string;
  aiResponse: string;
  intent: string;
  detectedLanguage?: string | null;
  activeProduct?: string | null;
  draftStatus?: string;
  authorized?: boolean;
  orderCreated?: boolean;
  totalAmount?: number;
}

/**
 * Non-intrusive Observer Layer
 * Captures conversation references without altering any demo engine states, intents, or responses.
 */
export async function observeDemoInteraction(params: ObserveParams): Promise<ReferenceMessage | null> {
  try {
    const reference = await referenceRepository.saveMessageReference({
      conversationId: params.conversationId || 'demo_session_default',
      timestamp: Date.now(),
      customerMessage: params.customerMessage,
      aiResponse: params.aiResponse,
      intent: params.intent || 'GENERAL_QUESTION',
      language: params.detectedLanguage || 'English',
      product: params.activeProduct || null,
      draftStatus: params.draftStatus || 'EMPTY',
      authorized: Boolean(params.authorized),
      orderCreated: Boolean(params.orderCreated),
      totalAmount: params.totalAmount || 0,
    });
    return reference;
  } catch (err) {
    // Non-blocking: failures in reference logging must NEVER disrupt the live user conversation
    console.warn('[ReferenceLibraryObserver] Failed to log reference message:', err);
    return null;
  }
}
