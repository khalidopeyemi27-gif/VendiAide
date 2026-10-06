import { Product, FAQ, Business, AISettings } from '../types/database';

export interface GroundedContext {
  business: Business;
  products: Product[];
  faqs: FAQ[];
  aiSettings: AISettings;
}

export type ParsedIntent =
  | 'GENERAL_GREETING'
  | 'GREETING'
  | 'SMALL_TALK'
  | 'COMPLIMENT'
  | 'THANKS'
  | 'GRATITUDE'
  | 'ACKNOWLEDGEMENT'
  | 'CONFIRMATION'
  | 'DECLINE'
  | 'FAREWELL'
  | 'CATALOG_INQUIRY'
  | 'CATALOG_DISCOVERY'
  | 'CATEGORY_DISCOVERY'
  | 'PRODUCT_INQUIRY'
  | 'PRICE_INQUIRY'
  | 'PRICE_FILTER'
  | 'AVAILABILITY_INQUIRY'
  | 'SIZE_AVAILABILITY_QUERY'
  | 'SIZE_SELECTION'
  | 'COLOR_AVAILABILITY_QUERY'
  | 'COLOR_SELECTION'
  | 'PRODUCT_SELECTION'
  | 'PRODUCT_COMPARISON'
  | 'PRODUCT_RECOMMENDATION'
  | 'PRODUCT_DETAILS'
  | 'FIT_QUERY'
  | 'MATERIAL_QUERY'
  | 'MATERIAL_QUESTION'
  | 'QUALITY_QUERY'
  | 'QUALITY_QUESTION'
  | 'CARE_QUERY'
  | 'AUTHENTICITY_QUERY'
  | 'DELIVERY_QUESTION'
  | 'DELIVERY_LOCATION'
  | 'DELIVERY_RATE_QUERY'
  | 'DELIVERY_TIME_QUERY'
  | 'LOCATION_QUERY'
  | 'POLICY_INQUIRY'
  | 'RETURN_POLICY_QUERY'
  | 'REFUND_POLICY_QUERY'
  | 'EXCHANGE_POLICY_QUERY'
  | 'CANCELLATION_QUERY'
  | 'PAYMENT_QUESTION'
  | 'PAYMENT_METHOD_QUERY'
  | 'DISCOUNT_REQUEST'
  | 'DISCOUNT_QUERY'
  | 'CUSTOMIZATION_QUERY'
  | 'PURCHASE_INTENT'
  | 'ORDER_CREATION'
  | 'ORDER_STATUS_INQUIRY'
  | 'POSITIONAL_SELECTION'
  | 'CORRECTION'
  | 'GENERAL_QUESTION'
  | 'MULTI_QUESTION'
  | 'UNKNOWN'
  | 'OUT_OF_SCOPE'
  | 'NONSENSE'
  | 'UNRELATED_PRODUCT_INQUIRY'
  | 'STORE_LOCATION_INQUIRY'
  | 'ASSISTANT_IDENTITY'
  | 'HUMAN_ESCALATION'
  | 'CASUAL_BROWSING'
  | 'REACTION'
  | 'NIGERIAN_EXPRESSION'
  | 'PRESENCE_CHECK'
  | 'APOLOGY';

export interface ConversationCorrelation {
  isCorrelatedToPrevious: boolean;
  correlationType: 'NEW_TOPIC' | 'ANSWERING_AI_QUESTION' | 'POSITIONAL_SELECTION' | 'CORRECTION' | 'CASUAL_INTERRUPTION' | 'PRODUCT_FOLLOWUP';
  targetQuestionType?: 'SIZE' | 'COLOR' | 'LOCATION' | 'CONFIRMATION' | 'PRODUCT_CHOICE';
  targetProductId?: string | null;
  targetProductIds?: string[];
  interruptionContextToRestore?: {
    pendingProductId?: string;
    pendingSize?: string;
    pendingColor?: string;
    pendingLocation?: string;
    pendingPurchaseIntent?: boolean;
  };
}

export interface SemanticInterpretation {
  intent: ParsedIntent;
  confidence: number;
  entities?: {
    productId?: string | null;
    size?: string | null;
    color?: string | null;
    location?: string | null;
    purchaseIntent?: boolean;
    positionalIndex?: number | null;
  };
  positionalReference?: {
    type: 'POSITIONAL';
    index: number;
    rawKeyword: string;
  } | null;
  correlation?: ConversationCorrelation;
  unrelatedItem?: string | null;
  isNonsense?: boolean;
  isMultiQuestion?: boolean;
  multiQuestions?: SemanticInterpretation[];
  category?: string | null;
  color?: string | null;
  size?: string | null;
  location?: string | null;
  acknowledgement?: boolean;
  productName?: string | null;
  purchaseIntent?: boolean;
  priceFilter?: { maxPrice?: number; minPrice?: number; exactPrice?: number } | null;
}

export type MessageDomainCategory = 'CONVERSATION' | 'ITEM_INQUIRY' | 'TRANSACTION' | 'OTHER';

export type OrderLifecycleState = 
  | 'DISCOVERY'
  | 'PRODUCT_SELECTED'
  | 'CONFIGURING'
  | 'READY_FOR_CHECKOUT'
  | 'CHECKOUT_CONFIRMED'
  | 'ORDER_CREATED';

export type MutationReason = 
  | 'EXPLICIT_PURCHASE_REQUEST'
  | 'EXPLICIT_SELECTION'
  | 'EXPLICIT_CORRECTION'
  | 'NO_AUTHORIZATION';

export interface MeaningResolution {
  originalMessage: string;
  primaryIntent: ParsedIntent;
  secondaryIntents: ParsedIntent[];
  intent: ParsedIntent;
  resolvedIntent: ParsedIntent;
  domainCategory: MessageDomainCategory;
  isItemInquiry: boolean;
  isConversational: boolean;
  isTransactional: boolean;
  correlation: ConversationCorrelation;
  resolvedEntities: {
    productId?: string | null;
    size?: string | null;
    color?: string | null;
    location?: string | null;
    unrelatedItem?: string | null;
    positionalIndex?: number | null;
  };
  stateMutation: {
    shouldMutate: boolean;
    reason: MutationReason;
    lifecycleState: OrderLifecycleState;
    setPendingProduct?: string | null;
    setPendingSize?: string | null;
    setPendingColor?: string | null;
    setPendingLocation?: string | null;
    setPurchaseIntent?: boolean | null;
    clearState?: boolean;
  };
  groundedFacts: {
    productName?: string | null;
    priceNaira?: number | null;
    inStock?: boolean;
    availableSizes?: string[];
    availableColors?: string[];
    deliveryConfirmed?: boolean;
    deliveryFeeNaira?: number | null;
    deliveryTimeframe?: string | null;
  };
  responseDirective?: {
    action: string;
    targetProductId?: string | null;
    suggestedText?: string;
  };
  isPassiveAcknowledgement: boolean;
  isRidiculousQuestion: boolean;
}

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
  semanticInterpretation?: SemanticInterpretation;
  meaningResolution?: MeaningResolution;
}

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
