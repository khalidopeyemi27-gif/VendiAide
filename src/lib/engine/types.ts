import { Product, FAQ, Business, AISettings } from '../types/database';

export interface GroundedContext {
  business: Business;
  products: Product[];
  faqs: FAQ[];
  aiSettings: AISettings;
}

export type ParsedIntent =
  | 'GENERAL_QUESTION'
  | 'PRODUCT_INQUIRY'
  | 'PRICE_INQUIRY'
  | 'AVAILABILITY_INQUIRY'
  | 'PURCHASE_INTENT'
  | 'ORDER_CREATION'
  | 'HUMAN_ESCALATION'
  | 'UNHANDLED_INQUIRY';

export interface AIResponsePayload {
  content: string;
  intent: ParsedIntent;
  tokensUsed: { promptTokens: number; completionTokens: number; totalTokens: number };
  latencyMs: number;
  safetyPassed: boolean;
  escalated: boolean;
  extractedEntities?: {
    productName?: string;
    size?: string;
    color?: string;
    quantity?: number;
    deliveryLocation?: string;
    customerName?: string;
  };
}

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
