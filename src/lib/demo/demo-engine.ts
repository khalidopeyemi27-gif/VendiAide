import { formatNaira } from '../utils/formatters';
import { resolveNigerianLocation, LocationResolution } from '../engine/nigeria-geography';
import { ConversationStateModel, createInitialConversationState as initConversationState } from '../engine/conversation-state-manager';

export interface DemoProduct {
  id: string;
  name: string;
  price_ngn: number;
  sizes: string[];
  colors: string[];
  in_stock: boolean;
  category: string;
  description?: string;
  aliases?: string[];
}

export const DEMO_PUBLIC_PRODUCTS: DemoProduct[] = [
  {
    id: 'demo_prod_1',
    name: 'Black Oversized Hoodie',
    price_ngn: 25000,
    sizes: ['M', 'L', 'XL'],
    colors: ['Black'],
    in_stock: true,
    category: 'Ready-to-Wear',
    description: 'Fleece cotton relaxed fit hoodie for daily wear.',
    aliases: ['hoodie', 'hoodies', 'black hoodie', 'black oversized hoodie', 'relaxed hoodie', 'fleece hoodie'],
  },
  {
    id: 'demo_prod_2',
    name: 'Black Velvet Abaya',
    price_ngn: 35000,
    sizes: ['M', 'L', 'XL'],
    colors: ['Black'],
    in_stock: true,
    category: 'Abaya & Hijab',
    description: 'Premium black velvet modesty abaya with matching Sheila headscarf.',
    aliases: ['abaya', 'abayas', 'black abaya', 'velvet abaya', 'black velvet abaya', 'sheila abaya'],
  },
  {
    id: 'demo_prod_3',
    name: 'White Premium Sneakers',
    price_ngn: 45000,
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['White'],
    in_stock: true,
    category: 'Sneakers & Footwear',
    description: 'Genuine leather handcrafted sneakers with cushioned sole.',
    aliases: ['sneaker', 'sneakers', 'white sneakers', 'white premium sneakers', 'leather sneakers', 'shoes', 'footwear'],
  },
];

export type ActiveDraft = {
  productId: string | null;
  size: string | null;
  color: string | null;
  location: string | null;
  quantity: number;
  status: 'EMPTY' | 'CONFIGURING' | 'READY_FOR_CHECKOUT';
  authorized: boolean;
};

export function createInitialActiveDraft(): ActiveDraft {
  return {
    productId: null,
    size: null,
    color: null,
    location: null,
    quantity: 1,
    status: 'EMPTY',
    authorized: false,
  };
}

export function isSizeCompatibleWithProduct(size: string | null | undefined, product: DemoProduct | null | undefined): boolean {
  if (!size || !product) return false;
  const cleanSize = size.trim().toUpperCase();
  const isFootwearSize = /^\d+$/.test(cleanSize);
  const isClothingSize = /^(S|M|L|XL|XXL|SMALL|MEDIUM|LARGE)$/i.test(cleanSize);
  const isFootwearProduct = product.category.toLowerCase().includes('sneaker') || 
                            product.category.toLowerCase().includes('footwear') || 
                            product.name.toLowerCase().includes('sneaker') || 
                            product.name.toLowerCase().includes('shoe');

  if (isFootwearProduct && isClothingSize) return false;
  if (!isFootwearProduct && isFootwearSize) return false;

  return product.sizes.some(s => s.toUpperCase() === cleanSize);
}

export function sanitizeDraftOnProductSwitch(
  currentDraft: ActiveDraft,
  newProduct: DemoProduct
): ActiveDraft {
  const isSizeValid = isSizeCompatibleWithProduct(currentDraft.size, newProduct);
  const isColorValid = currentDraft.color && newProduct.colors.some(c => c.toLowerCase() === currentDraft.color?.toLowerCase());

  const newSize = isSizeValid ? currentDraft.size : null;
  const newColor = isColorValid ? currentDraft.color : null;
  const requiresSize = newProduct.sizes.length > 0;
  const isComplete = Boolean(currentDraft.location && (!requiresSize || newSize));

  return {
    productId: newProduct.id,
    size: newSize,
    color: newColor,
    location: currentDraft.location,
    quantity: 1,
    status: isComplete ? 'READY_FOR_CHECKOUT' : 'CONFIGURING',
    authorized: false,
  };
}

export type DemoIntent =
  | 'CATALOG_INQUIRY'
  | 'CATALOG_DISCOVERY'
  | 'PRODUCT_INQUIRY'
  | 'PRODUCT_RECOMMENDATION'
  | 'AVAILABILITY_INQUIRY'
  | 'PRICE_INQUIRY'
  | 'SIZE_INQUIRY'
  | 'COLOR_INQUIRY'
  | 'COLOR_AVAILABILITY_QUERY'
  | 'DELIVERY_INQUIRY'
  | 'DELIVERY_TIME_INQUIRY'
  | 'DELIVERY_ZONE_INQUIRY'
  | 'DISCOUNT_INQUIRY'
  | 'PROMOTION_INQUIRY'
  | 'PURCHASE_INTENT'
  | 'EXPLICIT_PRODUCT_SWITCH'
  | 'EXPLICIT_ORDER_CONFIRMATION'
  | 'ORDER_HISTORY_INQUIRY'
  | 'ORDER_TOTAL_INQUIRY'
  | 'ORDER_STATUS_INQUIRY'
  | 'TRACK_ORDER'
  | 'CANCEL'
  | 'DECLINE'
  | 'CONTEXTUAL_REPLY'
  | 'CORRECTION'
  | 'GREETING'
  | 'THANKS'
  | 'THANK_YOU'
  | 'FAREWELL'
  | 'GOODBYE'
  | 'HELP'
  | 'COMPLIMENT'
  | 'SMALL_TALK'
  | 'STORE_LOCATION_INQUIRY'
  | 'ASSISTANT_IDENTITY'
  | 'CASUAL_BROWSING'
  | 'REACTION'
  | 'ACKNOWLEDGEMENT'
  | 'APOLOGY'
  | 'PRESENCE_CHECK'
  | 'GENERAL_QUESTION'
  | 'MATERIAL_INQUIRY'
  | 'CARE_INQUIRY'
  | 'STOCK_INQUIRY'
  | 'CUSTOMIZATION_INQUIRY'
  | 'CHANGE_ORDER'
  | 'COMPLAINT'
  | 'REFUND_INQUIRY'
  | 'EXCHANGE_INQUIRY'
  | 'PAYMENT_INQUIRY'
  | 'PAYMENT_METHOD_INQUIRY'
  | 'HUMAN_HANDOFF'
  | 'HUMAN_ESCALATION'
  | 'OUT_OF_SCOPE'
  | 'ABUSE_OR_UNSAFE'
  | 'AMBIGUOUS'
  | 'UNKNOWN'
  | 'POLICY_INQUIRY'
  | 'UNRELATED_PRODUCT_INQUIRY';

export function isExplicitProductSwitch(message: string): boolean {
  const norm = message.toLowerCase().trim();
  const switchPatterns = [
    /\bswitch\s+(to|my\s+order\s+to|my\s+selection\s+to|it\s+to)\b/i,
    /\bchange\s+(my|the|this)?\s*(order|item|product|choice|selection)?\s*to\b/i,
    /\breplace\b.*\bwith\b/i,
    /\binstead\b/i,
    /\bforget\b.*\b(i\s+want|give\s+me)\b/i,
    /\bmake\s+it\s+(the\s+)?/i,
    /\bi\s+want\s+.*\binstead\b/i,
    /\brather\b/i,
    /\bcancel\s+(that|the\s+previous|my\s+last)\s+(one\s+)?and\s+(give\s+me|get)\b/i,
  ];

  return switchPatterns.some((pattern) => pattern.test(norm));
}

export function isReadOnlyIntent(intent: string): boolean {
  const nonReadOnlyIntents = [
    'PURCHASE_INTENT',
    'EXPLICIT_PRODUCT_SWITCH',
    'EXPLICIT_ORDER_CONFIRMATION',
    'CHANGE_ORDER',
    'CANCEL',
    'CORRECTION',
  ];
  return !nonReadOnlyIntents.includes(intent);
}

export function validateStateTransition(
  previousState: DemoSessionState,
  nextState: DemoSessionState,
  intent: string
): DemoSessionState {
  if (isReadOnlyIntent(intent)) {
    const prevActiveDraft = previousState.activeDraft ? { ...previousState.activeDraft } : createInitialActiveDraft();
    const prevOrders = previousState.orders ? [...previousState.orders] : [];
    return {
      ...nextState,
      activeDraft: prevActiveDraft,
      orders: prevOrders,
      pendingProductId: previousState.pendingProductId,
      pendingPurchaseIntent: previousState.pendingPurchaseIntent,
      pendingSize: previousState.pendingSize,
      pendingColor: previousState.pendingColor,
      pendingLocation: previousState.pendingLocation,
    };
  }
  return nextState;
}

export interface DemoMessage {
  id: string;
  sender: 'customer' | 'ai';
  text: string;
  timestamp: string;
  intent?: string;
}

export interface DemoLead {
  id: string;
  customerName: string;
  productInterest: string;
  status: 'NEW' | 'INTERESTED' | 'ORDER_PENDING' | 'CONVERTED';
  timestamp: string;
}

export interface DemoOrder {
  id: string;
  productId: string;
  productName: string;
  size: string;
  color?: string;
  location: string;
  quantity: number;
  itemPriceNaira: number;
  deliveryFeeNaira: number;
  totalNaira: number;
  authorizationMessage: string;
  status: 'PENDING' | 'CONFIRMED';
  customerName: string;
  timestamp: string;
  createdAt: string;
  deliveryLocation?: string;
  authorizationLanguage?: ResponseLanguage;
  confirmationKey?: string;
}

export type ResponseLanguage = 'english' | 'pidgin';
export type LanguageMode = 'auto' | 'english' | 'pidgin';

export interface LanguageDetection {
  language: ResponseLanguage;
  confidence: number;
  matchedSignals: string[];
}

export interface DemoSessionState {
  sessionId: string;
  messages: DemoMessage[];
  leads: DemoLead[];
  orders: DemoOrder[];
  activeDraft: ActiveDraft;
  conversationStatus: 'AI_ACTIVE' | 'HUMAN_TAKEOVER' | 'ORDER_PENDING';
  lastIntent: string;
  /** Product currently in focus (for multi-turn ordering / attribute collection) */
  pendingProductId?: string;
  /** Active purchase intent flag for pending product */
  pendingPurchaseIntent?: boolean;
  /** Ordered list of product IDs from the most recent catalog response (for positional references) */
  lastProductListIds?: string[];
  /** Pending size collected mid-conversation before product/location confirmed */
  pendingSize?: string;
  /** Pending color collected mid-conversation */
  pendingColor?: string;
  /** Pending delivery location collected mid-conversation */
  pendingLocation?: string;
  /** Previous assistant message text for context evaluation */
  previousAssistantMessage?: string;
  /** Previous assistant question asked (e.g. "What size would you like?") */
  previousAssistantQuestion?: string;
  /** Recently mentioned product IDs across the conversation history */
  recentlyMentionedProductIds?: string[];
  /** Preferred response language style ('auto' matches customer, 'english', or 'pidgin') */
  languagePreference?: LanguageMode;
  /** Alias for languagePreference */
  languageMode?: LanguageMode;
  /** Detected response language persisted across turns */
  detectedLanguage?: ResponseLanguage | null;
  /** Confidence score of automatic language detection (0 to 1) */
  languageConfidence?: number;
  /** List of matched signal names during detection */
  languageSignals?: string[];
  /** Unified Conversation State Model (Milestone B) */
  conversationState?: ConversationStateModel;
}

export function createInitialDemoState(): DemoSessionState {
  return {
    sessionId: 'demo_sess_init',
    messages: [
      {
        id: 'msg_welcome',
        sender: 'ai',
        text: 'Welcome to Kulture Fashion House! 👋 How can I help you choose your outfit today?',
        timestamp: '10:00 AM',
        intent: 'GENERAL_QUESTION',
      },
    ],
    leads: [],
    orders: [],
    activeDraft: createInitialActiveDraft(),
    conversationStatus: 'AI_ACTIVE',
    lastIntent: 'GENERAL_QUESTION',
    pendingProductId: undefined,
    pendingPurchaseIntent: undefined,
    lastProductListIds: undefined,
    pendingSize: undefined,
    pendingColor: undefined,
    pendingLocation: undefined,
    previousAssistantMessage: 'Welcome to Kulture Fashion House! 👋 How can I help you choose your outfit today?',
    previousAssistantQuestion: 'How can I help you choose your outfit today?',
    recentlyMentionedProductIds: [],
    languagePreference: 'auto',
    languageMode: 'auto',
    detectedLanguage: null,
    languageConfidence: 0,
    languageSignals: [],
    conversationState: initConversationState('demo_sess_init'),
  };
}

/**
 * Extracts candidate unlisted item phrase from customer query for clean grounded responses.
 */
function extractUnlistedItemPhrase(msgText: string): string {
  let clean = msgText.toLowerCase();

  // Strip question/category/pidgin wrappers
  clean = clean
    .replace(/\b(?:do\s+you\s+guys?\s+sell|do\s+you\s+sell|do\s+u\s+sell|una\s+dey\s+sell|una\s+get|una\s+dey|wetin\s+una\s+get|are\s+you\s+selling|do\s+you\s+have|do\s+u\s+have|have\s+you\s+got|is\s+there|can\s+i\s+get|i\s+want|looking\s+for)\b/gi, '')
    .replace(/\b(?:or\s+what|or\s+something|or\s+anything|any)\b/gi, '')
    .replace(/[?!.]/g, '')
    .trim();

  // Remove leading articles ("a", "an", "any", "some")
  clean = clean.replace(/^(?:a|an|any|some)\s+/i, '').trim();

  // Prevent treating generic placeholders ("something", "anything", "stuff") or generic buy verbs as product names
  if (/^(something|anything|item|stuff|product|goods)$/i.test(clean) || /^buy\s*(something|anything|item|stuff)?$/i.test(clean)) {
    return 'that item';
  }

  if (clean.length >= 2 && clean.length <= 40) {
    return clean;
  }
  return 'that specific item';
}

export interface ProductMatch {
  kind: 'exact' | 'approved_alias' | 'unknown';
  product?: DemoProduct;
  queryTerm?: string;
}

export function resolveCatalogProduct(
  messageText: string,
  catalog: DemoProduct[] = DEMO_PUBLIC_PRODUCTS
): ProductMatch {
  const norm = messageText.toLowerCase().trim();

  // 1. Exact match against product.name (case insensitive)
  for (const prod of catalog) {
    const pName = prod.name.toLowerCase();
    if (norm === pName || new RegExp(`\\b${pName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(norm)) {
      return { kind: 'exact', product: prod };
    }
  }

  // 2. Approved alias match
  for (const prod of catalog) {
    if (prod.aliases && prod.aliases.length > 0) {
      for (const alias of prod.aliases) {
        const cleanAlias = alias.toLowerCase();
        const regex = new RegExp(`\\b${cleanAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(norm)) {
          return { kind: 'approved_alias', product: prod };
        }
      }
    }
  }

  // 3. Unknown product
  const queryTerm = extractUnlistedItemPhrase(messageText);
  return { kind: 'unknown', queryTerm };
}

// ---------------------------------------------------------------------------
// Nigerian price normalisation utilities
// ---------------------------------------------------------------------------

/**
 * Normalises natural Nigerian price expressions (e.g. "40 thousand naira", "1.5 million")
 * into short tokens ("40k", "1.5m") for simplified parsing.
 */
export function normalizePricePhrases(msg: string): string {
  let clean = msg.toLowerCase();

  // Normalize currency words (naira, NGN, N, ₦) preceded by thousands/millions or digits
  clean = clean.replace(/(\d+(?:\.\d+)?\s*(?:million|millions|thousand|thousands|m|k)?)\s*(NGN|naira)/gi, '$1');

  // Normalize "million" / "millions" / "milli" to "m"
  clean = clean.replace(/(\d+(?:\.\d+)?)\s*(?:million|millions|milli)\b/gi, '$1m');

  // Normalize "thousand" / "thousands" to "k"
  clean = clean.replace(/(\d+(?:\.\d+)?)\s*(?:thousand|thousands)\b/gi, '$1k');

  // Normalize "k" / "m" with spaces (e.g. "40 k" -> "40k")
  clean = clean.replace(/(\d+(?:\.\d+)?)\s+k\b/gi, '$1k');
  clean = clean.replace(/(\d+(?:\.\d+)?)\s+m\b/gi, '$1m');

  return clean;
}

/**
 * Converts a raw token string (e.g. "40k", "40,000", "40000", "1m") to a
 * plain integer in Naira. Returns undefined when the token cannot be parsed.
 */
function parseNairaPrice(token: string): number | undefined {
  // Strip currency prefix (₦, N) and commas
  const cleaned = token.replace(/^[₦N]/i, '').replace(/,/g, '').trim();

  const mK = cleaned.match(/^(\d+(?:\.\d+)?)k$/i);
  if (mK) return Math.round(parseFloat(mK[1]) * 1_000);

  const mM = cleaned.match(/^(\d+(?:\.\d+)?)m$/i);
  if (mM) return Math.round(parseFloat(mM[1]) * 1_000_000);

  const mPlain = cleaned.match(/^(\d+)$/);
  if (mPlain) return parseInt(mPlain[1], 10);

  return undefined;
}

export interface PriceFilter {
  /** Strict upper bound  (price < max) */
  lt?: number;
  /** Inclusive upper bound (price <= max) */
  lte?: number;
  /** Strict lower bound  (price > min) */
  gt?: number;
  /** Inclusive lower bound (price >= min) */
  gte?: number;
  /** Exact match */
  eq?: number;
}

/**
 * Broad regex that fires whenever the message contains ANY price-filter
 * expression. Used only as a boolean gate for isCatalogQuery detection.
 */
export const PRICE_FILTER_PATTERN = new RegExp(
  `(?:under|below|less\\s+than|above|over|more\\s+than|at\\s+least|at\\s+most|between|exactly|for|starting\\s+from|from)\\s+(?:[₦N])?[\\d,.]+(?:k|m)?` +
  `|` +
  `(?:[₦N])?[\\d,.]+(?:k|m)?\\s*(?:\\+|and\\s+above|and\\s+up|and\\s+below|or\\s+less|or\\s+more)`,
  'i'
);

/**
 * Extracts a structured PriceFilter from a lowercased message string.
 * Handles all required natural-language patterns.
 */
export function extractPriceFilter(msg: string): PriceFilter | undefined {
  const normalized = normalizePricePhrases(msg);

  // Prevent budget numbers ("under 40,000", "under 40k") from triggering if explicitly part of a shoe size query ("size 40")
  if (/\bsize\s+\d+\b/i.test(normalized) && !/\b(?:under|below|above|over|between|budget|price|cost|naira|k|m)\b/i.test(normalized)) {
    return undefined;
  }

  // Token pattern: optional ₦/N prefix, digits with optional commas, optional k/m suffix
  const TOK = '(?:[₦N])?[\\d,]+(?:\\.\\d+)?(?:k|m)?';

  // "between X and Y"
  const betweenRe = new RegExp(`between\\s+(${TOK})\\s+and\\s+(${TOK})`, 'i');
  const betweenMatch = normalized.match(betweenRe);
  if (betweenMatch) {
    const lo = parseNairaPrice(betweenMatch[1]);
    const hi = parseNairaPrice(betweenMatch[2]);
    if (lo !== undefined && hi !== undefined) return { gte: lo, lte: hi };
  }

  // "X or less" / "at most X" / "X and below"
  const orLessRe = new RegExp(
    `(${TOK})\\s+or\\s+less|` +
    `at\\s+most\\s+(${TOK})|` +
    `(${TOK})\\s+and\\s+below`,
    'i'
  );
  const orLessMatch = normalized.match(orLessRe);
  if (orLessMatch) {
    const raw = orLessMatch.slice(1).find(val => val !== undefined);
    if (raw) {
      const val = parseNairaPrice(raw);
      if (val !== undefined) return { lte: val };
    }
  }

  // "X or more" / "at least X" / "X and above" / "X and up" / "X+" / "starting from X" / "from X"
  const orMoreRe = new RegExp(
    `(${TOK})\\s+or\\s+more|` +
    `at\\s+least\\s+(${TOK})|` +
    `(${TOK})\\s+and\\s+above|` +
    `(${TOK})\\s+and\\s+up|` +
    `(${TOK})\\+|` +
    `starting\\s+from\\s+(${TOK})|` +
    `from\\s+(${TOK})`,
    'i'
  );
  const orMoreMatch = normalized.match(orMoreRe);
  if (orMoreMatch) {
    const raw = orMoreMatch.slice(1).find(val => val !== undefined);
    if (raw) {
      const val = parseNairaPrice(raw);
      if (val !== undefined) return { gte: val };
    }
  }

  // "under X" / "below X" / "less than X"
  const ltRe = new RegExp(`(?:under|below|less\\s+than)\\s+(${TOK})`, 'i');
  const ltMatch = normalized.match(ltRe);
  if (ltMatch) {
    const val = parseNairaPrice(ltMatch[1]);
    if (val !== undefined) return { lt: val };
  }

  // "above X" / "over X" / "more than X"
  const gtRe = new RegExp(`(?:above|over|more\\s+than)\\s+(${TOK})`, 'i');
  const gtMatch = normalized.match(gtRe);
  if (gtMatch) {
    const val = parseNairaPrice(gtMatch[1]);
    if (val !== undefined) return { gt: val };
  }

  // "exactly X" / "for exactly X" / "for X" (only when no other operator matched)
  const eqRe = new RegExp(`(?:exactly|for\\s+exactly|for)\\s+(${TOK})`, 'i');
  const eqMatch = normalized.match(eqRe);
  if (eqMatch) {
    const val = parseNairaPrice(eqMatch[1]);
    if (val !== undefined) return { eq: val };
  }

  return undefined;
}

/**
 * Filters a product array according to a PriceFilter.
 */
export function applyPriceFilter(products: DemoProduct[], filter: PriceFilter): DemoProduct[] {
  return products.filter((p) => {
    const price = p.price_ngn;
    if (filter.eq !== undefined && price !== filter.eq) return false;
    if (filter.lt !== undefined && !(price < filter.lt)) return false;
    if (filter.lte !== undefined && !(price <= filter.lte)) return false;
    if (filter.gt !== undefined && !(price > filter.gt)) return false;
    if (filter.gte !== undefined && !(price >= filter.gte)) return false;
    return true;
  });
}

function describeFilter(filter: PriceFilter): string {
  if (filter.eq !== undefined) return `exactly ${formatNaira(filter.eq)}`;
  if (filter.lt !== undefined) return `under ${formatNaira(filter.lt)}`;
  if (filter.lte !== undefined && filter.gte !== undefined)
    return `between ${formatNaira(filter.gte)} and ${formatNaira(filter.lte)}`;
  if (filter.lte !== undefined) return `${formatNaira(filter.lte)} or less`;
  if (filter.gt !== undefined) return `above ${formatNaira(filter.gt)}`;
  if (filter.gte !== undefined) return `${formatNaira(filter.gte)} or more`;
  return '';
}

function buildNoPriceMatchResponse(filter: PriceFilter): string {
  return `I don't currently have any listed items ${describeFilter(filter)}.`;
}

function buildPriceIntroLine(filter: PriceFilter): string {
  return `Here are the items currently available ${describeFilter(filter)}:`;
}

/**
 * Formats a string array with commas and an 'and' for the last element.
 */
export function formatListWithAnd(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export interface PidginSignalPattern {
  pattern: RegExp;
  score: number;
  name: string;
}

export const STRONG_PIDGIN_PATTERNS: PidginSignalPattern[] = [
  { pattern: /\byes\s+do\s+am\b/i, score: 5, name: 'yes do am' },
  { pattern: /\bmake\s+we\s+do\s+am\b/i, score: 5, name: 'make we do am' },
  { pattern: /\bconfirm\s+am\b/i, score: 4, name: 'confirm am' },
  { pattern: /\bplace\s+am\b/i, score: 4, name: 'place am' },
  { pattern: /\babeg\s+reserve\s+am\b/i, score: 4, name: 'abeg reserve am' },
  { pattern: /\breserve\s+am\b/i, score: 4, name: 'reserve am' },
  { pattern: /\bwetin\s+(una|you|i|dey|be)\b/i, score: 4, name: 'wetin phrase' },
  { pattern: /\b(una|you)\s+get\b/i, score: 4, name: 'you/una get phrase' },
  { pattern: /\bi\s+dey\b/i, score: 4, name: 'i dey phrase' },
  { pattern: /\bi\s+wan\b/i, score: 4, name: 'i wan phrase' },
  { pattern: /\bhow\s+much\s+be\b/i, score: 4, name: 'how much be phrase' },
  { pattern: /\bhow\s+far\b/i, score: 4, name: 'how far phrase' },
  { pattern: /\bmake\s+we\b/i, score: 4, name: 'make we phrase' },
  { pattern: /\bmake\s+am\b/i, score: 4, name: 'make am phrase' },
  { pattern: /\bno\s+wahala\b/i, score: 4, name: 'no wahala phrase' },
  { pattern: /\babeg\b/i, score: 3, name: 'abeg' },
  { pattern: /\bnko\b/i, score: 3, name: 'nko' },
  { pattern: /\bwetin\b/i, score: 3, name: 'wetin' },
  { pattern: /\buna\b/i, score: 3, name: 'una' },
];

export const WEAK_PIDGIN_PATTERNS: PidginSignalPattern[] = [
  { pattern: /\bdey\b/i, score: 1, name: 'dey' },
  { pattern: /\bwan\b/i, score: 1, name: 'wan' },
  { pattern: /\bna\b/i, score: 1, name: 'na' },
  { pattern: /\bam\b/i, score: 1, name: 'am' },
  { pattern: /\bgo\b/i, score: 1, name: 'go' },
];

export function normalizeLanguageText(message: string): string {
  return message
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[“”''`]/g, "'")
    .replace(/[!?.,;:()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const PIDGIN_THRESHOLD = 3;
export const HIGH_CONFIDENCE_THRESHOLD = 6;

export function suppressRedundantSignals(signals: string[]): string[] {
  const sorted = [...signals].sort((a, b) => b.length - a.length);
  const kept: string[] = [];

  for (const sig of sorted) {
    const isSub = kept.some((k) => k.toLowerCase().includes(sig.toLowerCase()));
    if (!isSub) {
      kept.push(sig);
    }
  }

  return signals.filter((s) => kept.includes(s));
}

export function detectPidginLanguage(message: string): LanguageDetection {
  const normalized = normalizeLanguageText(message);

  let score = 0;
  const matchedSignals: string[] = [];

  for (const signal of STRONG_PIDGIN_PATTERNS) {
    if (signal.pattern.test(normalized)) {
      score += signal.score;
      matchedSignals.push(signal.name);
    }
  }

  for (const signal of WEAK_PIDGIN_PATTERNS) {
    if (
      signal.pattern.test(normalized) &&
      !matchedSignals.includes(signal.name)
    ) {
      score += signal.score;
      matchedSignals.push(signal.name);
    }
  }

  const language: ResponseLanguage = score >= PIDGIN_THRESHOLD ? 'pidgin' : 'english';
  const confidence = Math.min(score / 8, 1);

  return {
    language,
    confidence,
    matchedSignals: suppressRedundantSignals(matchedSignals),
  };
}

/**
 * Checks for strong Nigerian Pidgin keywords in a customer message.
 */
export function containsStrongPidginSignals(msgText: string): boolean {
  const detection = detectPidginLanguage(msgText);
  return detection.language === 'pidgin';
}

/**
 * Resolves whether response should be in English or Nigerian Pidgin, respecting manual preference & persistence.
 */
export function getResponseLanguage(
  state: DemoSessionState,
  message: string
): ResponseLanguage {
  const mode = (state.languageMode && state.languageMode !== 'auto') ? state.languageMode : (state.languagePreference || 'auto');
  if (mode === 'english') return 'english';
  if (mode === 'pidgin') return 'pidgin';

  const detection = detectPidginLanguage(message);
  if (detection.language === 'pidgin') {
    return 'pidgin';
  }
  if (state.detectedLanguage) {
    return state.detectedLanguage;
  }

  return 'english';
}

/**
 * Detects whether customer message or session context is in Nigerian Pidgin / Informal Slang.
 */
export function isPidginMessage(msgText: string, state?: DemoSessionState): boolean {
  const mode = state?.languageMode || state?.languagePreference;
  if (mode === 'pidgin') return true;
  if (mode === 'english') return false;

  const detection = detectPidginLanguage(msgText);
  if (detection.language === 'pidgin') return true;

  if (state?.detectedLanguage === 'pidgin') return true;

  return false;
}

/**
 * Explicit Central Order Creation Guard.
 * Language detection, confidence, or Pidgin phrases MUST NEVER bypass this guard!
 */
export function canCreateOrder(state: DemoSessionState): boolean {
  const draft = state.activeDraft;
  return Boolean(
    draft &&
    draft.productId &&
    draft.size &&
    draft.location &&
    draft.status === 'READY_FOR_CHECKOUT' &&
    draft.authorized === true
  );
}

/**
 * Generates an idempotent confirmation key for draft order.
 */
export function getDraftConfirmationKey(
  draft: ActiveDraft,
  productPrice: number,
  deliveryFee: number
): string {
  return [
    draft.productId,
    draft.size,
    draft.color || 'Black',
    draft.location,
    productPrice + deliveryFee,
  ].join('|');
}

/**
 * Detects whether a message is a short contextual reply (yes/no/size/color/positional).
 */
export function isContextualReply(msg: string): boolean {
  const norm = msg.toLowerCase().trim();

  // Positional or relative references are ALWAYS contextual replies regardless of discovery keywords!
  if (extractPositionalIndex(norm) !== undefined || /\b(that\s+one|this\s+one|the\s+(black|white|red|gold|brown)\s+one)\b/i.test(norm)) {
    return true;
  }

  // If message mentions explicit catalog product names, it's NOT a standalone contextual reply
  if (/\b(hoodie|hoodies|abaya|abayas|sneaker|sneakers|shoes?|gowns?|dress|dresses)\b/i.test(norm)) {
    return false;
  }

  // Color/size availability query on active product ("what sizes does it have?", "do you have another color?", "do you have the white one?", "does it come in white?")
  if (
    /\b(another|other|different|more)\s+(colou?rs?)\b/i.test(norm) ||
    /\b(in|with)\s+(another|other|different)\s+(colou?r)\b/i.test(norm) ||
    /\bany\s+other\s+colou?rs?\b/i.test(norm) ||
    /\bother\s+colou?rs?\b/i.test(norm) ||
    /\b(do\s+you\s+have|is\s+there|does\s+it\s+come\s+in|got)\s+(the\s+)?(white|black|red|blue|gold|green|brown|purple|pink|yellow|orange|grey|gray)(\s+one)?\b/i.test(norm) ||
    /\b(white|black|red|blue|gold|green|brown|purple|pink|yellow|orange|grey|gray)\s+(one|colour|color)\b/i.test(norm) ||
    /\b(what|which)\s+sizes?\b/i.test(norm) ||
    /\bsizes?\s+(does\s+it|do\s+you|are)\b/i.test(norm) ||
    /\b(do\s+you\s+have|is\s+there|does\s+it\s+come\s+in|e\s+dey\s+in|you\s+get)\s+(in\s+)?(size\s+)?\d+\b/i.test(norm) ||
    /\b(size\s+)?\d+\s+(available|dey)\b/i.test(norm) ||
    /^(size\s+)?\d+$/i.test(norm)
  ) {
    return true;
  }

  // Compromise selection / Pidgin acceptance ("manage am", "i go manage", "make i manage am")
  if (/\b(manage\s+am|i\s+go\s+manage|make\s+i\s+manage|we\s+go\s+manage|i\s+fit\s+manage|manage\s+the\s+black)\b/i.test(norm)) {
    return true;
  }

  // Must be reasonably short (<= 8 words)
  const words = msg.trim().split(/\s+/);
  if (words.length > 8) return false;

  // If message contains explicit commercial discovery keywords, it's NOT purely contextual
  if (
    msg.includes('what items') || msg.includes('what products') ||
    msg.includes('how much') || msg.includes('do you have') ||
    PRICE_FILTER_PATTERN.test(msg)
  ) return false;

  return true;
}

/**
 * Passive acknowledgements that must NEVER mutate state into product selection.
 */
function isPassiveAcknowledgement(msg: string): boolean {
  return /^(ok|okay|ok\s+o|okay\s+o|alright|sure|fine|cool|nice|good|understood|no\s+wahala|na\s+so)\.?!?$/i.test(msg.trim());
}

/**
 * Checks if a string looks like an affirmative confirmation ("yes", "yeah", "i go manage am").
 */
function isAffirmative(msg: string): boolean {
  const norm = msg.trim().toLowerCase();
  if (/\b(manage\s+am|i\s+go\s+manage|make\s+i\s+manage|we\s+go\s+manage|i\s+fit\s+manage)\b/i.test(norm)) {
    return true;
  }
  if (/\b(i\s+want\s+take\s+(this\s+one|am)|i\s+wan\s+take\s+(this\s+one|am)|i\s+go\s+collect\s+this\s+one|i'?ll\s+take\s+this|make\s+i\s+buy\s+this\s+one|i\s+dey\s+buy\s+am|let'?s\s+do\s+it|make\s+we\s+run\s+am|i\s+want\s+this\s+one|i'?ll\s+go\s+with\s+this|this\s+one\s+na\s+my\s+choice|make\s+we\s+do\s+am|do\s+am)\b/i.test(norm)) {
    return true;
  }
  return /^(yes|yeah|yep|yup|yes\s+na|yes\s+o|na\s+so|correct|indeed|that'?s?\s+(right|correct)|do\s+am|reserve)\.?!?$/i.test(norm);
}

/**
 * Checks if a string looks like a NO-type rejection.
 */
function isNegative(msg: string): boolean {
  return /^(no|nah|nope|don't\s+want|not\s+interested|cancel|stop)\.?!?$/i.test(msg.trim());
}

/**
 * Extracts a positional ordinal from customer message.
 */
function extractPositionalIndex(msg: string): number | undefined {
  const norm = msg.toLowerCase().trim();

  // CATALOG SCOPE / INVENTORY COUNT GUARD:
  // "is it only the three goods you have?", "na only 3 goods una get", "do you only have 3 items"
  // MUST NOT trigger positional selection!
  if (
    /\b(only|all)\s+(the\s+|these\s+|those\s+)?(\d+|one|two|three|four|five)\s+(goods|items|products|things)\b/i.test(norm) ||
    /\b(is\s+it|na|are\s+these|do\s+you)\s+only\s+.*\b(goods|items|products|things)\b/i.test(norm)
  ) {
    return undefined;
  }

  // SIZE OR EXPLICIT PRODUCT GUARD:
  // Messages referencing explicit clothing/shoe products or sizes (e.g. "size 55", "in size 42", "sneakers size 55")
  // MUST NOT trigger positional selection!
  if (
    /\bsizes?\s*[:\-]?\s*\d+\b/i.test(norm) ||
    /\bin\s+size\b/i.test(norm) ||
    /\b(hoodie|hoodies|abaya|abayas|sneaker|sneakers|shoes?|gowns?|dress|dresses)\b/i.test(norm)
  ) {
    return undefined;
  }

  // Relative/positional: "last one", "the last item", "final one"
  if (/\b(last|final)(\s+(one|item))?\b/i.test(norm)) return -1;

  // Match any digits with explicit or standalone positional context: "1", "2", "6", "10", "12", "option 7", "no. 8", "#15"
  const explicitDigitMatch =
    norm.match(/^(?:number|option|item|no\.?|num\.?|#)?\s*(\d+)\b/i) ||
    norm.match(/\b(?:number|option|item|no\.?|num\.?|#|give\s+me|i\s+want|make\s+it|choose|pick)\s*(\d+)\b/i) ||
    norm.match(/\b(\d+)\s*(?:please|abeg|biko|thanks)?$/i);

  if (explicitDigitMatch) {
    const val = parseInt(explicitDigitMatch[1], 10);
    if (!isNaN(val) && val > 0) {
      return val;
    }
  }

  if (/\b(second|2nd|two)\b/i.test(norm)) return 2;
  if (/\b(third|3rd|three)\b/i.test(norm)) return 3;
  if (/\b(fourth|4th|four)\b/i.test(norm)) return 4;
  if (/\b(fifth|5th|five)\b/i.test(norm)) return 5;
  if (/\b(first|1st|one)\b/i.test(norm)) {
    if (/\b(second|2nd|third|3rd|fourth|4th|fifth|5th|last|final|another|which|black|white|red|blue|gold|green|brown|purple|pink)\s+one\b/i.test(norm)) {
      return undefined;
    }
    return 1;
  }
  return undefined;
}

/**
 * Normalizes size values to standard representation (S, M, L, XL, XXL) or numeric.
 */
export function normalizeSize(sizeStr: string): string {
  const clean = sizeStr.toUpperCase().trim();
  if (clean === 'SMALL' || clean === 'S') return 'S';
  if (clean === 'MEDIUM' || clean === 'M') return 'M';
  if (clean === 'LARGE' || clean === 'L') return 'L';
  if (clean === 'XL') return 'XL';
  if (clean === 'XXL') return 'XXL';
  return clean;
}

/**
 * Extracts and normalizes size values.
 */
export function extractSizeFromMessage(
  msgText: string,
  pendingProduct?: { category: string } | null,
  aiAskedForSize?: boolean
): string | undefined {
  const normalized = msgText.toLowerCase();
  // Strip possessive/contraction suffixes ('s, 'm, 'd, 've, 'll: I'm, what's, let's, it's, I'd) to prevent false single-letter size 'S' or 'M' matching
  const cleanForSize = normalized.replace(/['’](s|m|d|ve|ll)\b/gi, '');

  const xlMatch = cleanForSize.match(/\b(xl|xxl)\b/i);
  if (xlMatch) return xlMatch[1].toUpperCase();

  const namedMatch = cleanForSize.match(/\b(small|medium|large)\b/i);
  if (namedMatch) {
    return normalizeSize(namedMatch[1]);
  }

  // Size suffix: "M size", "L size", "S size"
  const sizeSuffix = cleanForSize.match(/\b([sml])\s+size\b/i);
  if (sizeSuffix) {
    return sizeSuffix[1].toUpperCase();
  }

  // Size prefix or contextual phrase: "size M", "want M", "want the L", "give me M", "make it M", "no the L"
  const sizeWithContext = cleanForSize.match(/\b(?:size|in|take|want|need|get|give|make|choose|pick|go\s+with|change\s+to)?\s*(?:me|it|that|the|a|an)?\s*(?:size)?\s*[:\-]?\s*\b([sml])\b/i);
  if (sizeWithContext) {
    return sizeWithContext[1].toUpperCase();
  }

  const standaloneSML = cleanForSize.trim().match(/^(s|m|l)$/i);
  if (standaloneSML) {
    return standaloneSML[1].toUpperCase();
  }

  // Explicit numeric size phrase: "size 42", "size: 55", "in size 55", "size 30", "e dey in 55", "sizes 44"
  const explicitSizeMatch = normalized.match(/\b(?:size|sizes?|in\s+size|fit|e\s+dey\s+in)\s*[:\-]?\s*(\d+)\b/i);
  if (explicitSizeMatch) {
    return explicitSizeMatch[1];
  }

  const numericMatch = normalized.match(/(?<!\d|,)\b(\d+)\b(?!\d|,|k|m)/i);
  if (numericMatch) {
    const numStr = numericMatch[1];
    const hasExplicitContext = 
      /\b(?:size|sizes?|in|take|fit|e\s+dey\s+in)\s*[:\-]?\s*\b\d+\b/i.test(normalized) ||
      /\bdo you have\b.*\b\d+\b/i.test(normalized) ||
      /\bcome in\b.*\b\d+\b/i.test(normalized) ||
      /\bsneakers?\b.*\b\d+\b/i.test(normalized);

    if (hasExplicitContext) {
      return numStr;
    }

    const isStandalone = normalized.trim() === numStr;
    const isSneakerFocus = pendingProduct && pendingProduct.category.toLowerCase().includes('sneaker');
    if (isStandalone && (aiAskedForSize || isSneakerFocus)) {
      return numStr;
    }
  }

  return undefined;
}

/**
 * Extracts color from message.
 */
export function extractColorFromMessage(msgText: string): string | undefined {
  const colorMap: [RegExp, string][] = [
    // Multi-word / compound colors (matched first to prevent partial word collision)
    [/\brose\s+gold\b/i, 'Rose Gold'],
    [/\bnavy\s+blue\b/i, 'Navy Blue'],
    [/\bsky\s+blue\b/i, 'Sky Blue'],
    [/\bbaby\s+blue\b/i, 'Baby Blue'],
    [/\broyal\s+blue\b/i, 'Royal Blue'],
    [/\bdusty\s+pink\b/i, 'Dusty Pink'],
    [/\bforest\s+green\b/i, 'Forest Green'],
    [/\bolive\s+green\b/i, 'Olive Green'],
    [/\bemerald\s+green\b/i, 'Emerald Green'],
    [/\bmint\s+green\b/i, 'Mint Green'],
    [/\bsilver\s+grey\b/i, 'Silver Grey'],
    [/\bsilver\s+gray\b/i, 'Silver Grey'],
    [/\boff\s*[\-\s]?white\b/i, 'Off-White'],

    // Single-word fashion & commercial colors
    [/\bblack\b/i, 'Black'],
    [/\bwhite\b/i, 'White'],
    [/\bred\b/i, 'Red'],
    [/\bblue\b/i, 'Blue'],
    [/\bgreen\b/i, 'Green'],
    [/\byellow\b/i, 'Yellow'],
    [/\borange\b/i, 'Orange'],
    [/\bpurple\b/i, 'Purple'],
    [/\bpink\b/i, 'Pink'],
    [/\bbrown\b/i, 'Brown'],
    [/\b(grey|gray)\b/i, 'Grey'],
    [/\bgold\b/i, 'Gold'],
    [/\bsilver\b/i, 'Silver'],
    [/\bbronze\b/i, 'Bronze'],
    [/\bcopper\b/i, 'Copper'],
    [/\bchampagne\b/i, 'Champagne'],
    [/\bnavy\b/i, 'Navy'],
    [/\bteal\b/i, 'Teal'],
    [/\bturquoise\b/i, 'Turquoise'],
    [/\bcyan\b/i, 'Cyan'],
    [/\bindigo\b/i, 'Indigo'],
    [/\bolive\b/i, 'Olive'],
    [/\bemerald\b/i, 'Emerald'],
    [/\bmint\b/i, 'Mint'],
    [/\bsage\b/i, 'Sage'],
    [/\bburgundy\b/i, 'Burgundy'],
    [/\bmaroon\b/i, 'Maroon'],
    [/\bwine\b/i, 'Wine'],
    [/\bcrimson\b/i, 'Crimson'],
    [/\bscarlet\b/i, 'Scarlet'],
    [/\bruby\b/i, 'Ruby'],
    [/\bcoral\b/i, 'Coral'],
    [/\bmagenta\b/i, 'Magenta'],
    [/\bfuchsia\b/i, 'Fuchsia'],
    [/\brose\b/i, 'Rose'],
    [/\bblush\b/i, 'Blush'],
    [/\bpeach\b/i, 'Peach'],
    [/\bsalmon\b/i, 'Salmon'],
    [/\blavender\b/i, 'Lavender'],
    [/\blilac\b/i, 'Lilac'],
    [/\bviolet\b/i, 'Violet'],
    [/\bplum\b/i, 'Plum'],
    [/\bmauve\b/i, 'Mauve'],
    [/\baubergine\b/i, 'Aubergine'],
    [/\bmustard\b/i, 'Mustard'],
    [/\blemon\b/i, 'Lemon'],
    [/\bamber\b/i, 'Amber'],
    [/\brust\b/i, 'Rust'],
    [/\btangerine\b/i, 'Tangerine'],
    [/\bterracotta\b/i, 'Terracotta'],
    [/\bbeige\b/i, 'Beige'],
    [/\bnude\b/i, 'Nude'],
    [/\bcream\b/i, 'Cream'],
    [/\bivory\b/i, 'Ivory'],
    [/\btan\b/i, 'Tan'],
    [/\bcamel\b/i, 'Camel'],
    [/\bkhaki\b/i, 'Khaki'],
    [/\btaupe\b/i, 'Taupe'],
    [/\bmocha\b/i, 'Mocha'],
    [/\bcoffee\b/i, 'Coffee'],
    [/\bchocolate\b/i, 'Chocolate'],
    [/\bsand\b/i, 'Sand'],
    [/\bcharcoal\b/i, 'Charcoal'],
    [/\bash\b/i, 'Ash'],
    [/\bslate\b/i, 'Slate'],
  ];

  for (const [re, name] of colorMap) {
    if (re.test(msgText)) return name;
  }
  return undefined;
}

/**
 * Extracts Nigerian delivery location.
 */
export interface ExtractedLocation {
  name: string;
  parsed: string;
  state?: string;
  isState?: boolean;
  isCapital?: boolean;
  isConfirmedCoverage?: boolean;
  deliveryFeeNaira?: number;
  deliveryTimeframe?: string;
  locationAmbiguous?: boolean;
  possibleLocations?: LocationResolution[];
}

export function getVendorDeliveryCoverage(locName: string, locParsed?: string) {
  const normName = locName.toLowerCase();
  const normParsed = (locParsed || '').toLowerCase();

  const lagosKeywords = [
    'lagos', 'ikeja', 'lekki', 'vi', 'victoria island', 'yaba', 'surulere',
    'ikoyi', 'ajah', 'ikorodu', 'festac', 'maryland', 'agege', 'gbagada',
    'ojuelegba', 'oshodi', 'apapa', 'ebute metta', 'mushin', 'epe', 'badagry',
    'sangotedo', 'akoka', 'banana island'
  ];

  const isLagos = normParsed.includes('lagos') || lagosKeywords.includes(normName);

  if (isLagos) {
    return {
      isConfirmedCoverage: true,
      rateNaira: 2500,
      timeframe: '1-2 business days',
      locationName: locName,
    };
  }

  const configuredInterstate = ['abuja', 'port harcourt', 'ph', 'porthacourt', 'ibadan', 'abeokuta'];
  if (configuredInterstate.includes(normName)) {
    return {
      isConfirmedCoverage: true,
      rateNaira: 5000,
      timeframe: '3-5 business days',
      locationName: locName,
    };
  }

  return {
    isConfirmedCoverage: false,
    locationName: locName,
  };
}

export function extractLocationFromMessage(
  msgText: string,
  aiAskedForLocation?: boolean
): ExtractedLocation | undefined {
  const resolved = resolveNigerianLocation(msgText, aiAskedForLocation);
  if (!resolved) return undefined;

  const coverage = getVendorDeliveryCoverage(resolved.name, resolved.parsed);

  return {
    name: resolved.name,
    parsed: resolved.parsed,
    state: resolved.state,
    isState: resolved.isState,
    isCapital: resolved.isCapital,
    isConfirmedCoverage: coverage.isConfirmedCoverage,
    deliveryFeeNaira: coverage.rateNaira,
    deliveryTimeframe: coverage.timeframe,
    locationAmbiguous: resolved.locationAmbiguous,
    possibleLocations: resolved.possibleLocations,
  };
}

interface ContextResolution {
  resolvedProduct?: DemoProduct;
  resolvedSize?: string;
  resolvedColor?: string;
  resolvedLocation?: string;
  isPurchaseYes?: boolean;
  isCatalogYes?: boolean;
  isRejection?: boolean;
  isAttributeReply?: boolean;
  directResponse?: string;
  intent?: string;
}

export function resolveContextualReply(
  msg: string,
  rawMessage: string,
  state: DemoSessionState,
  catalog: DemoProduct[]
): ContextResolution | undefined {
  if (!isContextualReply(msg)) return undefined;

  const words = msg.trim().split(/\s+/);

  const aiMessages = state.messages.filter((m) => m.sender === 'ai');
  const lastAiText = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].text.toLowerCase() : '';

  const aiAskedForSize = /\bwhat size|which size|preferred size|size would you like|size are you\b/i.test(lastAiText);
  const aiAskedForColor = /\bwhat colou?r|which colou?r|preferred colou?r|colou?r would you (like|prefer)\b/i.test(lastAiText);
  const aiAskedForLocation = /\b(deliver|where|location|address)\b/i.test(lastAiText);

  const aiAskedYesNoQuestion =
    /\b(would you like|do you want|shall i|should i|ready to order|want to place|want to order|want the|want one|interested in)\b/i.test(lastAiText) ||
    /\b(would you like|do you want)\b.*\?/i.test(lastAiText);

  const posIndex = extractPositionalIndex(msg);
  const sizeReply = extractSizeFromMessage(rawMessage, state.pendingProductId ? catalog.find(p => p.id === state.pendingProductId) : null, aiAskedForSize || lastAiText.includes('size'));
  const colorReply = extractColorFromMessage(rawMessage);
  const locationReply = extractLocationFromMessage(rawMessage, aiAskedForLocation);
  const affirmative = isAffirmative(msg);
  const passiveAck = isPassiveAcknowledgement(msg);
  const negative = isNegative(msg);

  // Passive Acknowledgements ("okay", "ok", "thanks", "alright")
  if (passiveAck) {
    const explicitPurchase = /\b(i'?ll?\s+take|i\s+want|buy|order|give\s+me|get\s+me|make\s+it)\b/i.test(rawMessage);
    if (!explicitPurchase) {
      const isThanks = /\b(thanks?|thank you|thx|thnx|ty)\b/i.test(rawMessage);
      const resolvedIntent = isThanks ? 'THANKS' : 'CONTEXTUAL_REPLY';
      if (lastAiText.includes('black') && (lastAiText.includes('unavailable') || lastAiText.includes('available'))) {
        return {
          directResponse: "You're welcome! Let me know if you'd like to go with the Black option.",
          intent: resolvedIntent,
        };
      }
      return {
        directResponse: "You're welcome! 😊 Let me know if you'd like help finding anything else.",
        intent: resolvedIntent,
      };
    }
  }

  // --- Color availability inquiry on active product ("do you have another color?", "do you have the mustard one?", "you get am for beige") ---
  const extractedInquiryColor = extractColorFromMessage(rawMessage);
  const isExplicitSelection = /\b(i\s+want|give\s+me|i'?ll\s+take|let'?s\s+go\s+with|prefer|go\s+with)\b/i.test(msg);
  const isColorInquiry =
    !/\bsizes?\b/i.test(msg) &&
    !isExplicitSelection &&
    (
      (Boolean(extractedInquiryColor) && /\b(do\s+you\s+have|is\s+there|does\s+it\s+come\s+in|got|you\s+get\s+am\s+for|e\s+dey\s+in|can\s+i\s+get|is\s+available)\b/i.test(msg)) ||
      /\b(colou?rs?|another|other|different|more|any)\s+(colou?r)?\b/i.test(msg) ||
      /\b(what\s+colou?rs?|which\s+colou?rs?|available\s+colou?rs?)\b/i.test(msg)
    );

  if (isColorInquiry) {
    const queriedColor = extractedInquiryColor ? extractedInquiryColor.toLowerCase() : undefined;
    const activeProductId = state.pendingProductId || (state.recentlyMentionedProductIds && state.recentlyMentionedProductIds.length > 0 ? state.recentlyMentionedProductIds[state.recentlyMentionedProductIds.length - 1] : undefined);
    
    if (activeProductId) {
      const product = catalog.find((p) => p.id === activeProductId);
      if (product) {
        const isPidgin = isPidginMessage(rawMessage, state);
        const colors = product.colors;
        const isOnlyColorQuery = /\b(only\s+black|only\s+in\s+black|is\s+it\s+only|na\s+only|only\s+one\s+colou?r|the\s+only\s+colou?r|only\s+(?:black|white|red|blue|gold|green|brown|pink|purple)|is\s+\w+\s+the\s+only)\b/i.test(msg) || /^(only\s+black\??|is\s+it\s+only\s+black\??|na\s+only\s+black\??)$/i.test(msg.trim());
        const isOtherColorQuery = /\b(any\s+other|another\s+colou?r|other\s+colou?r|different\s+colou?r|other\s+colou?rs?)\b/i.test(msg);

        if (isOnlyColorQuery) {
          const targetColor = queriedColor || colors[0] || 'Black';
          if (colors.length === 1) {
            return {
              directResponse: isPidgin
                ? `Yes o, the ${product.name} dey available only in ${colors[0]} for now.`
                : `Yes, the ${product.name} is currently only available in ${colors[0]}.`,
              intent: 'COLOR_AVAILABILITY_QUERY',
            };
          } else {
            const otherColors = colors.filter(c => c.toLowerCase() !== targetColor.toLowerCase());
            return {
              directResponse: isPidgin
                ? `No o, the ${product.name} dey available in ${formatListWithAnd(colors)}!`
                : `No, the ${product.name} is also available in ${formatListWithAnd(otherColors)}.`,
              intent: 'COLOR_AVAILABILITY_QUERY',
            };
          }
        }

        if (isOtherColorQuery) {
          if (colors.length <= 1) {
            return {
              directResponse: isPidgin
                ? `No o, we no get another color for now — the ${product.name} dey only in ${colors[0] || 'Black'}.`
                : `No, we don't have other colors right now — the ${product.name} is only available in ${colors[0] || 'Black'}.`,
              intent: 'COLOR_AVAILABILITY_QUERY',
            };
          } else {
            const primaryColor = queriedColor || colors[0];
            const otherColors = colors.filter(c => c.toLowerCase() !== primaryColor.toLowerCase());
            return {
              directResponse: isPidgin
                ? `Yes! Apart from ${primaryColor}, we also get am in ${formatListWithAnd(otherColors)}.`
                : `Yes! Besides ${primaryColor}, the ${product.name} is also available in ${formatListWithAnd(otherColors)}.`,
              intent: 'COLOR_AVAILABILITY_QUERY',
            };
          }
        }

        if (queriedColor && queriedColor !== 'color' && queriedColor !== 'colour') {
          const hasColor = product.colors.some(c => c.toLowerCase() === queriedColor);
          if (hasColor) {
            return {
              directResponse: `Yes! The ${product.name} is available in ${queriedColor}. Would you like to check available sizes or place an order?`,
              intent: 'AVAILABILITY_INQUIRY',
            };
          } else {
            const article = /^[aeiou]/i.test(queriedColor) ? 'an' : 'a';
            return {
              directResponse: `The ${product.name} currently comes in ${formatListWithAnd(product.colors)}. We don't currently have ${article} ${queriedColor} version listed in the catalog. Would you like to go with ${formatListWithAnd(product.colors)} or check out our other items?`,
              intent: 'AVAILABILITY_INQUIRY',
            };
          }
        } else {
          return {
            directResponse: `The ${product.name} is available in ${formatListWithAnd(product.colors)}.`,
            intent: 'AVAILABILITY_INQUIRY',
          };
        }
      }
    } else if (state.lastProductListIds && state.lastProductListIds.length > 0) {
      const prods = catalog.filter((p) => state.lastProductListIds!.includes(p.id));
      const distinct = Array.from(new Set(prods.flatMap((p) => p.colors)));
      if (queriedColor && queriedColor !== 'color' && queriedColor !== 'colour') {
        const matchingProd = prods.find(p => p.colors.some(c => c.toLowerCase() === queriedColor));
        if (matchingProd) {
          return {
            directResponse: `Yes! Our ${matchingProd.name} comes in ${queriedColor}. Would you like to check available sizes for it?`,
            intent: 'AVAILABILITY_INQUIRY',
          };
        } else {
          return {
            directResponse: `Our catalog items currently come in ${formatListWithAnd(distinct)}. We don't currently have options in ${queriedColor}.`,
            intent: 'AVAILABILITY_INQUIRY',
          };
        }
      }
      return {
        directResponse: `Our catalog items are currently available in ${formatListWithAnd(distinct)}. Let me know which item or color you would like to check!`,
        intent: 'AVAILABILITY_INQUIRY',
      };
    }
  }

  // --- Size availability inquiry on active product or displayed catalog list ("e dey in L?", "does it come in L?") ---
  if (sizeReply && /\b(e\s+dey\s+in|you\s+get\s+am\s+for|does\s+it\s+come\s+in|is\s+there|available|do\s+you\s+have|got)\b/i.test(msg)) {
    const activeProductId = state.pendingProductId || (state.recentlyMentionedProductIds && state.recentlyMentionedProductIds.length > 0 ? state.recentlyMentionedProductIds[state.recentlyMentionedProductIds.length - 1] : undefined);
    if (activeProductId) {
      const product = catalog.find((p) => p.id === activeProductId);
      if (product) {
        const hasSize = product.sizes.includes(sizeReply);
        if (hasSize) {
          return {
            directResponse: `Yes! The ${product.name} is available in size ${sizeReply}. Would you like to place an order for size ${sizeReply}?`,
            intent: 'AVAILABILITY_INQUIRY',
          };
        } else {
          return {
            directResponse: `The ${product.name} is available, but size ${sizeReply} isn't currently listed. Available sizes are ${formatListWithAnd(product.sizes)}.`,
            intent: 'AVAILABILITY_INQUIRY',
          };
        }
      }
    } else if (state.lastProductListIds && state.lastProductListIds.length > 0) {
      const prods = catalog.filter((p) => state.lastProductListIds!.includes(p.id) && p.sizes.includes(sizeReply));
      if (prods.length > 0) {
        const names = formatListWithAnd(prods.map((p) => p.name));
        return {
          directResponse: `Yes! Our ${names} ${prods.length > 1 ? 'are' : 'is'} available in size ${sizeReply}. Which one would you like to check out?`,
          intent: 'AVAILABILITY_INQUIRY',
        };
      }
    }
  }
  // --- Customer Correction ("no, I meant the abaya", "I meant the hoodie") ---
  const correctionMatch = msg.match(/\b(?:no,?\s+)?(?:i\s+meant|i\s+was\s+referring\s+to|i\s+said|i\s+mean)\s+(?:the\s+)?([a-z\s]+)\b/i);
  if (correctionMatch) {
    const targetName = correctionMatch[1].trim();
    const matched = catalog.find((p) => p.name.toLowerCase().includes(targetName) || targetName.includes(p.name.toLowerCase().replace(/^(black|white)\s+/i, '')));
    if (matched) {
      return {
        resolvedProduct: matched,
        isPurchaseYes: Boolean(state.pendingPurchaseIntent),
        intent: 'CORRECTION',
      };
    }
  }
  if (posIndex !== undefined && state.lastProductListIds && state.lastProductListIds.length > 0) {
    const targetIdx = posIndex === -1 ? state.lastProductListIds.length - 1 : posIndex - 1;
    if (targetIdx >= 0 && targetIdx < state.lastProductListIds.length) {
      const productId = state.lastProductListIds[targetIdx];
      const product = catalog.find((p) => p.id === productId);
      if (product) {
        const isPurchase = /\b(buy|order|i want|take|get|have|pick|go with|give me|i'?ll go with|i'?d like|i need|reserve|send|make it|like)\b/i.test(msg) || /^(the\s+)?(first|1st|second|2nd|third|3rd|fourth|4th|fifth|5th|last|final)(\s+(one|item))?$/i.test(msg.trim()) || /^(?:number|option|item|no\.?|num\.?|#)?\s*\d+$/i.test(msg.trim()) || /^\d+\s*(?:please|abeg|biko|thanks)?$/i.test(msg.trim());
        return { resolvedProduct: product, isPurchaseYes: isPurchase, intent: isPurchase ? 'PURCHASE_INTENT' : 'PRODUCT_INQUIRY' };
      }
    }
  }

  // "that one" / "this one" / "the black one" / natural purchase reference
  if (/\b(that one|this one|the (black|white|red|gold|brown) one|that (item|product)|i('d)? like that|i want that|i want this|i'?ll take this|i'?ll go with this|let'?s?\s+(go\s+with|do|take)|i'?ll?\s+go\s+with|go\s+with|give me this|i'?ll buy it|can i order this|i need this|reserve this|keep this|keep this one|keep am|hold am|hold this|let me get|make it|i'?ll take it)\b/i.test(msg)) {
    if (colorReply && state.lastProductListIds) {
      const matchingProducts = catalog.filter((p) => p.id && state.lastProductListIds!.includes(p.id) && p.colors.some((c) => c.toLowerCase() === colorReply.toLowerCase()));
      if (matchingProducts.length === 1) {
        return { resolvedProduct: matchingProducts[0], resolvedColor: colorReply, isPurchaseYes: true, intent: 'PURCHASE_INTENT' };
      } else if (matchingProducts.length > 1) {
        const optsStr = formatListWithAnd(matchingProducts.map(p => p.name));
        return {
          directResponse: `Sure! Which option would you like to go with? We have ${optsStr}.`,
          intent: 'CONTEXTUAL_REPLY',
        };
      }
    }
    const activeProdId = state.pendingProductId || (state.orders.length > 0 ? catalog.find(p => p.name === state.orders[state.orders.length - 1].productName)?.id : undefined);
    if (activeProdId) {
      const product = catalog.find((p) => p.id === activeProdId);
      const locStr = typeof locationReply === 'object' && locationReply && 'name' in locationReply ? String((locationReply as { name: string }).name) : String(locationReply || '');
      if (product) return { resolvedProduct: product, resolvedColor: colorReply, resolvedSize: sizeReply, resolvedLocation: locStr, isPurchaseYes: true, intent: 'PURCHASE_INTENT' };
    }
    const availableStr = catalog.filter((p) => p.in_stock).map((p) => `- ${p.name} (${formatNaira(p.price_ngn)})`).join('\n');
    return {
      directResponse: `Sure! Which product are you referring to? We currently have:\n${availableStr}`,
      intent: 'CONTEXTUAL_REPLY',
    };
  }

  // "the cheaper one"
  if (/\b(cheaper|more affordable|less expensive|something cheaper|anything cheaper)\b/i.test(msg)) {
    if (state.pendingProductId) {
      const current = catalog.find((p) => p.id === state.pendingProductId);
      if (current) {
        const cheaper = catalog.filter((p) => p.in_stock && p.price_ngn < current.price_ngn).sort((a, b) => a.price_ngn - b.price_ngn);
        if (cheaper.length > 0) {
          const listStr = cheaper.map((p, i) => `${i + 1}. ${p.name} — ${formatNaira(p.price_ngn)}`).join('\n');
          return {
            directResponse: `Here are more affordable options:\n\n${listStr}\n\nWould you like to pick one?`,
            intent: 'CATALOG_INQUIRY',
          };
        } else {
          return {
            directResponse: `The ${current.name} at ${formatNaira(current.price_ngn)} is our most affordable option currently listed.`,
            intent: 'CATALOG_INQUIRY',
          };
        }
      }
    }
    return undefined;
  }

  // "the other one" / "show me something else" / "another one"
  if (/\b(the\s+other\s+one|nah\s+the\s+other\s+one|the\s+other\s+item|which\s+other\s+one|something else|show me another|show me something else|another one|other options|other products)\b/i.test(msg)) {
    const current = state.pendingProductId ? catalog.find((p) => p.id === state.pendingProductId) : undefined;
    const others = catalog.filter((p) => p.in_stock && p.id !== state.pendingProductId);
    if (others.length === 1) {
      return {
        resolvedProduct: others[0],
        intent: 'PRODUCT_INQUIRY',
        directResponse: `Ah! You mean the ${others[0].name} (${formatNaira(others[0].price_ngn)})?`,
      };
    } else if (others.length > 1) {
      const optsStr = formatListWithAnd(others.map((p) => `${p.name} (${formatNaira(p.price_ngn)})`));
      return {
        directResponse: `You mean the other item in our catalog? ${current ? `Apart from ${current.name}, ` : ''}we get ${optsStr}. Which one you mean, boss?`,
        intent: 'CONTEXTUAL_REPLY',
      };
    }
  }

  // Explicit Purchase / Reservation Command
  const isExplicitReserveCommand = /\b(reserve|keep\s+am|keep\s+this|hold\s+am|hold\s+this|do\s+am|confirm|place\s+order)\b/i.test(msg);
  if (isExplicitReserveCommand && state.pendingProductId) {
    const product = catalog.find((p) => p.id === state.pendingProductId);
    if (product) {
      return { isPurchaseYes: true, resolvedProduct: product, intent: 'PURCHASE_INTENT' };
    }
  }
  const isSizePhrase = /\b(size|large|medium|small|xl|xxl|extra large|extra small)\b/i.test(msg) ||
    /\b(i\s+want|i'?ll\s+take|give\s+me|can\s+i\s+get|i'?ll\s+go\s+with|make\s+mine|i\s+need|get\s+me)\b/i.test(msg);

  const isSyntheticMsg = msg.toLowerCase().includes('in size') || msg.toLowerCase().includes('in black') || msg.toLowerCase().includes('in white');
  if (!isSyntheticMsg && !isExplicitReserveCommand && sizeReply && (aiAskedForSize || lastAiText.includes('size') || words.length <= 5 || isSizePhrase)) {
    if (state.pendingProductId) {
      const product = catalog.find((p) => p.id === state.pendingProductId);
      if (product && product.sizes.length > 0 && !product.sizes.includes(sizeReply)) {
        return {
          directResponse: `The ${product.name} is available, but size ${sizeReply} isn't currently listed. Available sizes are ${formatListWithAnd(product.sizes)}.`,
          intent: 'AVAILABILITY_INQUIRY',
        };
      }
    }
    return { resolvedSize: sizeReply, resolvedLocation: locationReply?.name, resolvedColor: colorReply, isAttributeReply: true, intent: 'PURCHASE_INTENT' };
  }

  const isOnlyColorQuery = /\b(only\s+black|only\s+in\s+black|is\s+it\s+only|na\s+only|only\s+one\s+colou?r|the\s+only\s+colou?r|only\s+(?:black|white|red|blue|gold|green|brown|pink|purple)|is\s+\w+\s+the\s+only)\b/i.test(msg) || /^(only\s+black\??|is\s+it\s+only\s+black\??|na\s+only\s+black\??)$/i.test(msg.trim());
  const isOtherColorQuery = /\b(any\s+other\s+colou?r|another\s+colou?r|other\s+colou?rs?|different\s+colou?r|do\s+you\s+have\s+another\s+colou?r|is\s+there\s+any\s+other\s+colou?r)\b/i.test(msg);

  if (isOnlyColorQuery || isOtherColorQuery) {
    return undefined;
  }

  const isColorSelectionPhrase = /\b(let'?s?\s+(go\s+with|do|take)|i'?ll?\s+go\s+with|go\s+with|give\s+me|i\s+want|i'?ll\s+take|make\s+it)\b/i.test(msg) || /\b(black|white|red|blue|gold|green|brown|purple|pink)\b/i.test(lastAiText);
  if (colorReply && (aiAskedForColor || lastAiText.includes('colour') || lastAiText.includes('color') || isColorSelectionPhrase || words.length <= 6)) {
    if (state.pendingProductId) {
      const product = catalog.find((p) => p.id === state.pendingProductId);
      if (product && !product.colors.some((c) => c.toLowerCase() === colorReply.toLowerCase())) {
        return {
          directResponse: `I don't currently have a ${colorReply.toLowerCase()} version of the ${product.name} listed in the catalog. The ${product.name} is available in ${product.colors.join(', ')} for ${formatNaira(product.price_ngn)}.`,
          intent: 'AVAILABILITY_INQUIRY',
        };
      }
    }
    return { resolvedColor: colorReply, isAttributeReply: true, intent: 'PURCHASE_INTENT' };
  }

  const isDeliveryQuestionInquiry = /\b(how\s+much|how\s+long|cost|rate|fee|do\s+you\s+deliver|can\s+you\s+deliver|una\s+dey\s+deliver|you\s+fit\s+deliver|delivery\s+dey\s+reach|delivery\s+to\s+my\s+area)\b/i.test(msg);

  if (locationReply && !isDeliveryQuestionInquiry && !/\b(hoodie|hoodies|abaya|abayas|sneaker|sneakers|shoe|shoes)\b/i.test(msg) && (words.length <= 4 || /\b(?:deliver(?:y|ed)?\s+to|in|at|based\s+in|live\s+in|address\s+is|send\s+(it\s+)?to|going\s+to|location\s+is|i'?m\s+in)\b/i.test(msg))) {
    return { resolvedLocation: locationReply.name, isAttributeReply: true, intent: 'PURCHASE_INTENT' };
  }

  // YES response or Pidgin Compromise / Purchase Selection ("ok i go manage am", "I go take am", "make you reserve am", "abeg reserve am for me", "yes do am")
  const isCompromiseSelection = /\b(manage\s+am|i\s+go\s+manage|make\s+i\s+manage|we\s+go\s+manage|i\s+fit\s+manage|manage\s+the\s+(black|white|one)|i\s+go\s+take\s+am|make\s+you\s+reserve\s+am|reserve\s+am|abeg\s+reserve|abeg\s+reserve\s+am|keep\s+am|hold\s+am|yes\s+do\s+am|do\s+am|confirm|yes|correct)\b/i.test(msg);
  if (affirmative || isCompromiseSelection) {
    if (isCompromiseSelection && state.pendingProductId) {
      const product = catalog.find((p) => p.id === state.pendingProductId);
      if (product) {
        return { isPurchaseYes: true, resolvedProduct: product, intent: 'PURCHASE_INTENT' };
      }
    }
    if (aiAskedYesNoQuestion || isCompromiseSelection || affirmative) {
      if (/\bwould you like to see|shall i show|want to see (what|our|the catalog)/i.test(lastAiText)) {
        return { isCatalogYes: true, intent: 'CATALOG_INQUIRY' };
      }
      if (state.pendingProductId) {
        return { isPurchaseYes: true, resolvedProduct: catalog.find((p) => p.id === state.pendingProductId), intent: 'PURCHASE_INTENT' };
      }
    }
    return {
      directResponse: "Great! 😊 Let me know if you'd like to check any product details or place an order.",
      intent: 'CONTEXTUAL_REPLY',
    };
  }

  // NO response
  if (negative) {
    if (/\b(something else|show me another|not that one|don't like)\b/i.test(rawMessage.toLowerCase())) {
      const others = catalog.filter((p) => p.in_stock && p.id !== state.pendingProductId);
      if (others.length > 0) {
        const listStr = others.map((p, i) => `${i + 1}. ${p.name} — ${formatNaira(p.price_ngn)}`).join('\n');
        return {
          directResponse: `No problem! Here are the other options:\n\n${listStr}\n\nWould you like to pick one?`,
          intent: 'CATALOG_INQUIRY',
        };
      }
    }
    return {
      directResponse: "No worries! 😊 Feel free to let me know if there's anything else I can help you find.",
      intent: 'CONTEXTUAL_REPLY',
    };
  }

  return undefined;
}

export const CATALOG_DISCOVERY_PATTERNS = [
  /\b(what|show|list|see|view|check|get|display|browse)\b.*\b(have|got|collection|catalog|products|items|inventory|stuff|selling|available|in\s+stock|options|selection|store|dresses|clothes|apparel)\b/i,
  /\b(what'?s?|what\s+is)\s+(available|in\s+stock|for\s+sale|listed|on\s+sale|selling)\b/i,
  /\b(what|which)\s+(can\s+i|do\s+you|u|you\s+guys)\s+(buy|order|get|choose\s+from|sell|have)\b/i,
  /\bshow\s+(me\s+)?(your\s+)?(collection|catalog|products|items|stuff|everything|what\s+you\s+have)\b/i,
  /\blet\s+(me\s+)?see\s+(your\s+)?(collection|catalog|products|items|stuff|everything|what\s+you'?ve?\s+got)\b/i,
  /\bwhat\s+(do|are)\s+(you|u|you\s+guys)\s+(have|selling|sell|got)\b/i,
  /\bwhat'?s?\s+your\s+collection\s+like\b/i,
  /\bwhat\s+can\s+i\s+(buy|order|get)\b/i,
];

export const PURCHASE_INTENT_PATTERNS = [
  /\b(i'?ll?\s+take|i\s+will\s+take|take\s+it|i\s+want|i'?d?\s+like|give\s+me|get\s+me|buy|order|purchase|reserve|make\s+it|i'?ll?\s+go\s+with|can\s+i\s+(order|get|buy)|let\s+me\s+get|i\s+wan\s+(buy|get|take)|i\s+go\s+take|make\s+i\s+take|na\s+this\s+one|wan\s+buy|manage\s+am|i\s+go\s+manage|make\s+i\s+manage|we\s+go\s+manage|i\s+fit\s+manage)\b/i,
];

export function isCatalogDiscoveryQueryText(msg: string, hasActiveProduct: boolean = false): boolean {
  const normalized = msg.toLowerCase().trim();
  if (CATALOG_DISCOVERY_PATTERNS.some((pattern) => pattern.test(normalized))) return true;
  if (PRICE_FILTER_PATTERN.test(normalized)) return true;
  if (!hasActiveProduct && /\b(what|which|available)\s+(sizes?|colou?rs?)\b/i.test(normalized)) return true;
  return false;
}

/**
 * VENDIAIDE 5-STAGE PIPELINE ARCHITECTURE:
 * STAGE 1: MESSAGE PRESERVATION (Store verbatim customer text)
 * STAGE 2: INTENT INTERPRETER (Greeting, Catalog, Product, Size, Color, Price, Delivery, Policy, Comparison, Nonsense, Purchase)
 * STAGE 3: CONTEXT / STATE EVALUATION (Active product, Purchase intent, Selected size/color/location, Previous AI question)
 * STAGE 4: GROUNDED RETRIEVAL (Catalog, Inventory, Prices, Sizes, Colors, Delivery rates, Policies)
 * STAGE 5: NATURAL RESPONSE GENERATOR (Natural, Nigerian-friendly, Concise, Sales-oriented, Grounded)
 */
export function processDemoMessage(
  state: DemoSessionState,
  userMessageText: string,
  customCatalog: DemoProduct[] = DEMO_PUBLIC_PRODUCTS
): { updatedState: DemoSessionState; responseText: string; intent: string } {
  let matchedProduct: DemoProduct | undefined;
  // STAGE 1: MESSAGE PRESERVATION
  const msg = normalizePricePhrases(userMessageText);
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const detection = detectPidginLanguage(userMessageText);
  const mode = (state.languageMode && state.languageMode !== 'auto') ? state.languageMode : (state.languagePreference || 'auto');

  let nextDetectedLanguage: ResponseLanguage | null = state.detectedLanguage || null;
  if (mode === 'english') {
    nextDetectedLanguage = 'english';
  } else if (mode === 'pidgin') {
    nextDetectedLanguage = 'pidgin';
  } else {
    if (detection.language === 'pidgin' && detection.confidence >= 0.375) {
      nextDetectedLanguage = 'pidgin';
    } else if (
      detection.language === 'english' &&
      state.detectedLanguage !== 'pidgin'
    ) {
      nextDetectedLanguage = 'english';
    }
  }

  state = {
    ...state,
    languageMode: mode,
    languagePreference: mode,
    detectedLanguage: nextDetectedLanguage,
    languageConfidence: detection.confidence,
    languageSignals: detection.matchedSignals,
  };

  const respLang = getResponseLanguage(state, userMessageText);
  const isPidgin = respLang === 'pidgin';
  let responseText = '';
  let intent = 'GENERAL_QUESTION';
  let newPendingProductId: string | undefined = undefined;
  let newPendingPurchaseIntent: boolean | undefined = undefined;
  let newLastProductListIds: string[] | undefined = undefined;

  // Helper to ensure customer message in state history ALWAYS uses exact userMessageText (STAGE 1 IMMUTABILITY)
  const enforceCustomerFidelity = (res: { updatedState: DemoSessionState; responseText: string; intent: string }) => {
    res.updatedState.detectedLanguage = nextDetectedLanguage;
    res.updatedState.languageConfidence = detection.confidence;
    res.updatedState.languageSignals = detection.matchedSignals;
    const lastCustIdx = res.updatedState.messages.findLastIndex((m) => m.sender === 'customer');
    if (lastCustIdx !== -1) {
      res.updatedState.messages[lastCustIdx] = {
        ...res.updatedState.messages[lastCustIdx],
        text: userMessageText,
      };
    }
    return res;
  };

  // Initialize or copy current active draft
  const currentDraft: ActiveDraft = state.activeDraft ? { ...state.activeDraft } : {
    productId: state.pendingProductId || null,
    size: state.pendingSize || null,
    color: state.pendingColor || null,
    location: state.pendingLocation || null,
    quantity: 1,
    status: state.pendingProductId && state.pendingSize && state.pendingLocation ? 'READY_FOR_CHECKOUT' : state.pendingProductId ? 'CONFIGURING' : 'EMPTY',
    authorized: false,
  };

  // EXPLICIT ORDER CONFIRMATION INTERCEPTOR
  // ONLY fires on clear explicit affirmative commands ("yes", "yes do am", "make we do am", "confirm order", "place order", "go ahead")
  const isExplicitOrderConfirmation =
    /^(yes|yes\s+do\s+am|make\s+we\s+do\s+am|confirm\s+order|place\s+(the\s+)?order|go\s+ahead|correct\s+do\s+am|yes\s+please|yes\s+confirm|yes\s+reserve|do\s+am|confirm\s+it|place\s+it|confirm\s+am|place\s+am)$/i.test(msg.trim()) ||
    /\b(confirm\s+order|place\s+the\s+order|yes\s+do\s+am|make\s+we\s+do\s+am|confirm\s+am|place\s+am|go\s+ahead)\b/i.test(msg) ||
    (state.messages.length > 0 && /reserve this order|confirm your order|place this order|confirm your preferred/i.test(state.messages[state.messages.length - 1].text) && /^(yes|yeah|yup|reserve|confirm|do am|go ahead)$/i.test(msg.trim()));

  if (isExplicitOrderConfirmation && !msg.includes('how much') && !msg.includes('price')) {
    intent = 'EXPLICIT_ORDER_CONFIRMATION';

    if (currentDraft.status === 'READY_FOR_CHECKOUT' && currentDraft.productId) {
      const prod = customCatalog.find(p => p.id === currentDraft.productId);
      if (prod) {
        const locCoverage = currentDraft.location ? getVendorDeliveryCoverage(currentDraft.location) : undefined;
        const deliveryFee = (locCoverage && locCoverage.isConfirmedCoverage && locCoverage.rateNaira) ? locCoverage.rateNaira : 0;
        const totalAmount = prod.price_ngn + deliveryFee;

        const confKey = getDraftConfirmationKey(currentDraft, prod.price_ngn, deliveryFee);
        const existingOrder = state.orders.find((o) => o.confirmationKey === confKey || (o.productId === prod.id && o.size === (currentDraft.size || 'N/A') && o.location === currentDraft.location));

        if (existingOrder) {
          responseText = isPidgin
            ? `Your order don set already! 🎉 Anything else I fit help you find today?`
            : `Your order has already been placed! 🎉 Is there anything else I can help you find today?`;

          const updatedMessages: DemoMessage[] = [
            ...state.messages,
            { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
            { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
          ];

          return {
            updatedState: {
              ...state,
              messages: updatedMessages,
              lastIntent: intent,
            },
            responseText,
            intent,
          };
        }

        const newOrder: DemoOrder = {
          id: `demo_ord_${Date.now()}`,
          productId: prod.id,
          productName: prod.name,
          size: currentDraft.size || 'N/A',
          color: currentDraft.color || prod.colors[0] || 'Black',
          location: currentDraft.location!,
          deliveryLocation: currentDraft.location!,
          quantity: currentDraft.quantity || 1,
          itemPriceNaira: prod.price_ngn,
          deliveryFeeNaira: deliveryFee,
          totalNaira: totalAmount,
          authorizationMessage: userMessageText,
          authorizationLanguage: respLang,
          confirmationKey: confKey,
          status: 'PENDING',
          customerName: 'Demo Customer (WhatsApp)',
          timestamp,
          createdAt: new Date().toISOString(),
        };

        const updatedOrders = [...state.orders, newOrder];
        const emptyDraft = createInitialActiveDraft();
        emptyDraft.authorized = true;

        responseText = isPidgin
          ? `Order don set! 🎉 Your ${prod.name}${currentDraft.size ? `, size ${currentDraft.size}` : ''}, go dey delivered to ${currentDraft.location}. Total na ${formatNaira(totalAmount)}. The vendor go send you payment details.`
          : `Order reserved! 🎉 Your order for ${prod.name}${currentDraft.size ? ` (Size: ${currentDraft.size})` : ''} to ${currentDraft.location} for ${formatNaira(totalAmount)} (Item: ${formatNaira(prod.price_ngn)}${deliveryFee > 0 ? `, Delivery: ${formatNaira(deliveryFee)}` : ''}) is set up. The vendor at Kulture Fashion House will contact you with payment details!`;

        const updatedMessages: DemoMessage[] = [
          ...state.messages,
          { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
          { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
        ];

        return {
          updatedState: {
            ...state,
            messages: updatedMessages,
            orders: updatedOrders,
            activeDraft: emptyDraft,
            conversationStatus: 'ORDER_PENDING',
            lastIntent: intent,
            pendingProductId: undefined,
            pendingPurchaseIntent: false,
            pendingSize: undefined,
            pendingColor: undefined,
            pendingLocation: undefined,
          },
          responseText,
          intent,
        };
      }
    } else {
      // Duplicate prevention or confirmation sent when no READY_FOR_CHECKOUT draft exists
      if (currentDraft.productId && (!currentDraft.size || !currentDraft.location)) {
        responseText = isPidgin
          ? `I still need your size and delivery location before I fit place the order.`
          : `I still need your size and delivery location before I can place the order.`;
      } else if (state.orders.length > 0) {
        responseText = isPidgin
          ? `Your order don set already! 🎉 Anything else I fit help you find today?`
          : `Your order has already been placed! 🎉 Is there anything else I can help you find today?`;
      } else {
        responseText = isPidgin
          ? `No order dey ready for confirmation yet. Which item you wan check?`
          : `Welcome! Which item from our catalog would you like to check out or order today?`;
      }

      const updatedMessages: DemoMessage[] = [
        ...state.messages,
        { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
        { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
      ];

      return {
        updatedState: {
          ...state,
          messages: updatedMessages,
          lastIntent: intent,
        },
        responseText,
        intent,
      };
    }
  }

  // STAGE 2: INTENT INTERPRETER & STAGE 3: CONTEXT / STATE EVALUATION
  // 1. Human Escalation Trigger
  if (msg.includes('human') || msg.includes('speak to owner') || msg.includes('call me') || msg.includes('agent')) {
    intent = 'HUMAN_ESCALATION';
    responseText = 'Thanks for reaching out! I have alerted the vendor team at Kulture Fashion House. A human representative will take over this conversation shortly.';

    const updatedMessages: DemoMessage[] = [
      ...state.messages,
      { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
      { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
    ];

    return {
      updatedState: {
        ...state,
        messages: updatedMessages,
        conversationStatus: 'HUMAN_TAKEOVER',
        lastIntent: intent,
      },
      responseText,
      intent,
    };
  }

  // 1a-2. Explicit Order Cancellation Interceptor
  // Must fire BEFORE purchase intent detection — "abeg no order am" contains "order" which would be misread as purchase.
  const isCancellation =
    // Direct cancel words (including bare "stop")
    /\b(cancel|cancel\s+my\s+order|stop|stop\s+the\s+order|stop\s+it|stop\s+am|never\s+mind|nevermind|forget\s+it|forget\s+that)\b/i.test(msg) ||
    // Pidgin / English negation of order/creation: "abeg no order am", "no create am", "abeg no place am", "no do am", "don't order"
    /\b(abeg\s+no\s+(order|create|place|do|send)\s+(am|it|this|that)|no\s+(create|order|place)\s+(am|it|this|that)|don'?t\s+(create|place|make|do|order)\s*(an?\s+)?(order|am|it)?)\b/i.test(msg) ||
    /\b(don'?t\s+order)\b/i.test(msg) ||
    // Hesitation / immediate reversal: "wait no", "hold on no", "wait wait", "no no no", "wait don't", "wait don't order"
    /\b(wait\s+no|wait\s+wait|hold\s+on\s+no|no\s+no|no\s+no\s+no|wait\s+don'?t|nah\s+nah|nope\s+nope)\b/i.test(msg) ||
    // Scratch / reversal expressions
    /\b(scratch\s+that|scrap\s+that|take\s+that\s+back|nvm|nm|disregard\s+that|ignore\s+that)\b/i.test(msg) ||
    // Change of mind
    /\b(i\s+(changed?|change)\s+my\s+mind|i\s+don'?t\s+want\s+(it|this|that)\s+anymore|actually\s+(no|cancel|stop|don'?t)|on\s+second\s+thought|actually\s+forget\s+it)\b/i.test(msg) ||
    // Pidgin change of mind
    /\b(i\s+don\s+change\s+my\s+mind|abeg\s+cancel|abeg\s+stop|make\s+you\s+cancel|no\s+do\s+am|abeg\s+no\s+do\s+am)\b/i.test(msg);

  if (isCancellation) {
    intent = 'CANCEL';
    // Also remove the most recently created order if it exists — cancellation should undo it
    const ordersAfterCancel = state.orders.length > 0 ? state.orders.slice(0, -1) : [];
    responseText = ordersAfterCancel.length < state.orders.length
      ? 'No problem! Order cancelled. 😊 Let me know if you would like to check other items or start fresh anytime.'
      : 'No problem! Let me know if you would like to check other items or start fresh anytime.';
    const updatedMessages: DemoMessage[] = [
      ...state.messages,
      { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
      { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
    ];
    return {
      updatedState: {
        ...state,
        messages: updatedMessages,
        lastIntent: intent,
        orders: ordersAfterCancel,
        activeDraft: createInitialActiveDraft(),
        pendingPurchaseIntent: false,
        pendingProductId: undefined,
        pendingSize: undefined,
        pendingColor: undefined,
        pendingLocation: undefined,
      },
      responseText,
      intent,
    };
  }

  // 1a-2d. Discount & Promotion Inquiry Interceptor
  // MUST fire BEFORE product matching or unlisted item phrase extraction to prevent "do you do discounts" from being misread as an unlisted item name!
  const isPromoInquiry =
    /\b(promo|promos|promotion|promotions|sales\s+promo|special\s+offer|offers?)\b/i.test(msg) ||
    /\b(do\s+you\s+have|una\s+get|is\s+there\s+any)\s+(promos?|promotions?)\b/i.test(msg);

  const isDiscountInquiry =
    /\b(discount|discounts|bargain|slash\s+price|reduce\s+price|cut\s+the\s+price|cheaper\s+price|best\s+price|last\s+price)\b/i.test(msg) ||
    /\b(do\s+you\s+(do|give|have)|una\s+dey\s+give|is\s+there\s+any|any|can\s+i\s+get\s+a?|give\s+me)\s+(discounts?)\b/i.test(msg) ||
    /\b(discount\s+dey|promo\s+dey)\b/i.test(msg);

  if (isPromoInquiry || isDiscountInquiry) {
    intent = isPromoInquiry ? 'PROMOTION_INQUIRY' : 'DISCOUNT_INQUIRY';
    const isPidgin = isPidginMessage(userMessageText, state);

    if (isPromoInquiry) {
      responseText = isPidgin
        ? `Our prices fix well well to make sure say quality high for everyone! But sometimes we dey do promo. You wan check wetin we get available?`
        : `Our listed prices are fixed to ensure consistent high quality for all customers. However, we occasionally run seasonal promotions! Would you like to check out our available items?`;
    } else {
      responseText = isPidgin
        ? `Our listed prices for Kulture Fashion House fix well well to give everyone fair value and top quality. You wan check our available items or check delivery rate for your area?`
        : `Our listed prices for Kulture Fashion House are fixed to ensure consistent quality and fair value for all customers. Would you like to check our available items or check delivery pricing for your area?`;
    }

    const updatedMessages: DemoMessage[] = [
      ...state.messages,
      { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
      { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
    ];

    const activeProdExists = Boolean(state.activeDraft?.productId || state.pendingProductId);

    return {
      updatedState: {
        ...state,
        messages: updatedMessages,
        lastIntent: intent,
        activeDraft: activeProdExists ? state.activeDraft : (state.activeDraft || createInitialActiveDraft()),
        pendingProductId: activeProdExists ? state.pendingProductId : undefined,
        pendingPurchaseIntent: activeProdExists ? state.pendingPurchaseIntent : false,
        pendingSize: activeProdExists ? state.pendingSize : undefined,
        pendingColor: activeProdExists ? state.pendingColor : undefined,
        pendingLocation: activeProdExists ? state.pendingLocation : undefined,
        previousAssistantMessage: responseText,
        previousAssistantQuestion: responseText.includes('?') ? responseText : undefined,
      },
      responseText,
      intent,
    };
  }

  // 1a-2c. Catalog Scope / Inventory Count Inquiry Interceptor
  // Catches "is it only the three goods you have?", "na only these three goods una get?", "is it only 3 items you have?", "do you only have 3 products?"
  const isCatalogScopeInquiry =
    /\b(is\s+it\s+only|na\s+only|do\s+you\s+only\s+have|are\s+these\s+the\s+only|is\s+this\s+all\s+the|na\s+all\s+the)\s*(the\s+|these\s+|those\s+)?(\d+|one|two|three|four|five)?\s*(goods|items|products|things)\b/i.test(msg) ||
    /\b(only)\s+(the\s+|these\s+)?(\d+|one|two|three|four|five)\s+(goods|items|products|things)\s*(you\s+have|una\s+get|you\s+sell|available)?\b/i.test(msg);

  if (isCatalogScopeInquiry) {
    intent = 'CATALOG_DISCOVERY';
    const isPidgin = isPidginMessage(userMessageText, state);
    const catalogList = customCatalog.map(p => `• ${p.name} — ${formatNaira(p.price_ngn)}`).join('\n');
    responseText = isPidgin
      ? `Yes boss! Na these ${customCatalog.length} main items we currently get available for stock right now:\n\n${catalogList}\n\nWhich of them you go like check or order?`
      : `Yes! Currently, these ${customCatalog.length} featured items are available in stock:\n\n${catalogList}\n\nWhich of these would you like to check or order?`;

    const updatedMessages: DemoMessage[] = [
      ...state.messages,
      { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
      { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
    ];
    return {
      updatedState: {
        ...state,
        messages: updatedMessages,
        lastIntent: intent,
        pendingProductId: undefined,
      },
      responseText,
      intent,
    };
  }

  // 1a-2b. Productless Purchase Intent Interceptor ("i wan buy something", "i want to buy", "abeg i wan buy")
  const isProductlessPurchaseReq =
    /\b(i\s+(wan|want)\s+(to\s+)?(buy|purchase|get|collect)|abeg\s+i\s+wan\s+buy|make\s+i\s+buy)\s*(something|anything|item|stuff)?\.?$/i.test(msg) ||
    /^(i\s+(wan|want)\s+(to\s+)?(buy|purchase|get|collect)|abeg\s+i\s+wan\s+buy|make\s+i\s+buy)$/i.test(msg.trim());

  const containsSpecificProductNoun = customCatalog.some(p => msg.includes(p.name.toLowerCase()) || msg.includes(p.category.toLowerCase()) || (p.name.toLowerCase().includes('hoodie') && msg.includes('hoodie')) || (p.name.toLowerCase().includes('abaya') && msg.includes('abaya')) || (p.name.toLowerCase().includes('sneakers') && (msg.includes('sneaker') || msg.includes('shoe') || msg.includes('kicks'))));

  if (isProductlessPurchaseReq && !containsSpecificProductNoun) {
    intent = 'CATALOG_DISCOVERY';
    const isPidgin = isPidginMessage(userMessageText, state);
    const catalogList = customCatalog.map(p => `• ${p.name} — ${formatNaira(p.price_ngn)}`).join('\n');
    responseText = isPidgin
      ? `Sure boss! Wetin you wan buy? We get:\n\n${catalogList}\n\nWhich one you want?`
      : `Sure! What would you like to buy? We currently have:\n\n${catalogList}\n\nWhich item would you like?`;

    const updatedMessages: DemoMessage[] = [
      ...state.messages,
      { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
      { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
    ];
    return {
      updatedState: {
        ...state,
        messages: updatedMessages,
        lastIntent: intent,
        pendingProductId: undefined,
      },
      responseText,
      intent,
    };
  }

  // 1a-3a. Order Total Aggregation Inquiry Interceptor
  const isOrderTotalInquiry =
    /\b(how\s+much\s+(altogether|be\s+everything|for\s+everything|all\s+of\s+them|are\s+all\s+my\s+orders|do\s+all\s+my\s+orders\s+cost))\b/i.test(msg) ||
    /\b(what('s|\s+is)\s+the\s+total|what('s|\s+is)\s+my\s+total|wetin\s+be\s+everything|total\s+for\s+all\s+my\s+orders|everything\s+na\s+how\s+much)\b/i.test(msg) ||
    /\b(how\s+much\s+is\s+my\s+order|how\s+much\s+is\s+the\s+order)\b/i.test(msg);

  if (isOrderTotalInquiry) {
    const orders = state.orders || [];
    intent = 'ORDER_TOTAL_INQUIRY';

    if (orders.length === 0) {
      responseText = "You haven't placed any orders yet! 😊 Would you like to check out our catalog and pick an item?";
    } else if (orders.length === 1) {
      const o = orders[0];
      responseText = `Your order total for the ${o.productName}${o.size ? ` (Size: ${o.size})` : ''}${o.deliveryLocation ? ` to ${o.deliveryLocation}` : ''} is ${formatNaira(o.totalNaira)}.`;
    } else {
      const grandTotal = orders.reduce((sum, o) => sum + o.totalNaira, 0);
      const breakdown = orders.map((o, i) => `${i + 1}. ${o.productName}${o.size ? ` (Size: ${o.size})` : ''} — ${formatNaira(o.totalNaira)}`).join('\n');
      responseText = `Your ${orders.length} orders come to ${formatNaira(grandTotal)} altogether:\n\n${breakdown}\n\n• Grand Total: ${formatNaira(grandTotal)}`;
    }

    const updatedMessages: DemoMessage[] = [
      ...state.messages,
      { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
      { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
    ];
    return {
      updatedState: {
        ...state,
        messages: updatedMessages,
        lastIntent: intent,
      },
      responseText,
      intent,
    };
  }

  // 1a-3b. Order Status / History Inquiry Interceptor
  // Catches "how many things did i order", "what did i order", "show my orders", "wetin i order" etc.
  // Must fire BEFORE purchase intent detection to prevent "order" from being misclassified as purchase command.
  const isOrderStatusInquiry = /\b(how\s+many\s+(things?|items?|products?|stuff)?\s*(did|have)\s+i\s+order)/i.test(msg) ||
    /\b(what\s+(did|have)\s+i\s+order)/i.test(msg) ||
    /\b(show\s+(me\s+)?my\s+order|my\s+orders\b|my\s+order\s+(status|history|details|summary|list)|order\s+history|order\s+status|check\s+my\s+order)/i.test(msg) ||
    /\b(wetin\s+i\s+order|how\s+many\s+order|i\s+order\s+how\s+many)/i.test(msg) ||
    /\b(did\s+i\s+order\s+anything|have\s+i\s+ordered)/i.test(msg);

  if (isOrderStatusInquiry) {
    intent = 'ORDER_STATUS_INQUIRY';
    const orderCount = state.orders?.length || 0;
    if (orderCount === 0) {
      responseText = "You haven't placed any orders yet! 😊 Would you like to browse our catalog and pick something?";
    } else if (orderCount === 1) {
      const o = state.orders[0];
      responseText = `You have 1 order:\n\n• ${o.productName}${o.size ? ` (Size: ${o.size})` : ''}${o.deliveryLocation ? ` — Delivery to ${o.deliveryLocation}` : ''}\n• Total: ${formatNaira(o.totalNaira)}\n\nWould you like to order anything else?`;
    } else {
      const orderLines = state.orders.map((o, i) =>
        `${i + 1}. ${o.productName}${o.size ? ` (Size: ${o.size})` : ''}${o.deliveryLocation ? ` — ${o.deliveryLocation}` : ''} — ${formatNaira(o.totalNaira)}`
      ).join('\n');
      responseText = `You have ${orderCount} orders:\n\n${orderLines}\n\nWould you like to order anything else?`;
    }
    const updatedMessages: DemoMessage[] = [
      ...state.messages,
      { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
      { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
    ];
    return {
      updatedState: {
        ...state,
        messages: updatedMessages,
        lastIntent: intent,
      },
      responseText,
      intent,
    };
  }

  // 1a-4. Contextual Continuance / Confirmation Interceptor ("bring am like that", "make e remain like this", "leave am like that")
  const isContextualContinuance = /\b(bring\s+am\s+(like\s+that|as\s+e\s+dey|so)|leave\s+am\s+(like\s+that|so)|keep\s+am\s+(like\s+that|so)|make\s+e\s+remain(\s+like\s+this)?|just\s+bring\s+am|send\s+am\s+like\s+that|as\s+e\s+dey|make\s+we\s+use\s+this\s+one)\b/i.test(msg);

  if (isContextualContinuance) {
    const activeProdId = state.pendingProductId || (state.lastProductListIds?.[0]) || (state.orders.length > 0 ? customCatalog.find(p => p.name === state.orders[state.orders.length - 1].productName)?.id : undefined);
    const product = activeProdId ? customCatalog.find(p => p.id === activeProdId) : customCatalog[0];

    intent = 'CONTEXTUAL_REPLY';
    if (product) {
      const isPidgin = isPidginMessage(userMessageText, state);
      const colorStr = product.colors[0] || 'Black';
      responseText = isPidgin
        ? `No P! 😊 I go keep the ${product.name} as e dey in ${colorStr}.`
        : `Got it! I'll keep the ${product.name} as listed in ${colorStr}.`;

      const requiresSize = product.sizes.length > 0;
      const finalSize = state.pendingSize;
      const finalLocation = state.pendingLocation;
      const isComplete = Boolean(finalLocation && (!requiresSize || finalSize));

      if (isComplete) {
        responseText += `\n\nWould you like me to reserve your order for ${product.name}${finalSize ? ` (Size: ${finalSize})` : ''} to ${finalLocation}?`;
      } else if (requiresSize && !finalSize) {
        responseText += ` What size would you like? (${product.sizes.join(', ')})`;
      } else if (!finalLocation) {
        responseText += ` Where should we deliver it to?`;
      }

      const updatedMessages: DemoMessage[] = [
        ...state.messages,
        { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
        { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
      ];
      return {
        updatedState: {
          ...state,
          messages: updatedMessages,
          lastIntent: intent,
          pendingProductId: product.id,
          pendingSize: state.pendingSize,
          pendingColor: state.pendingColor,
          pendingLocation: state.pendingLocation,
        },
        responseText,
        intent,
      };
    }
  }

  // 1b. Out-of-Catalog / Ridiculous Question Domain Boundary Interceptor
  if (
    /\b(fly|marry|edible|cook|rich|wifi|parachute|bluetooth)\b/i.test(msg) ||
    /\b(?:do\s+you\s+sell|can\s+this|can\s+i|do\s+you\s+have|is\s+this|does\s+the|does\s+this)\b.*\b(rice|food|fly|marry|pizza|edible|goats?|cars?|phones?|laptops?|space|rich|cook|model|wifi|parachute|bluetooth)\b/i.test(msg)
  ) {
    intent = 'UNRELATED_PRODUCT_INQUIRY';
    const targetItem = msg.match(/\b(rice|food|fly|marry|pizza|edible|goats?|cars?|phones?|laptops?|space|rich|cook|model|wifi|parachute|bluetooth)\b/i)?.[1]?.toLowerCase() || 'that item';
    if (/\b(fly|marry|edible|cook|rich|wifi|parachute|bluetooth)\b/i.test(targetItem) || /\b(fly|marry|edible|cook|rich|wifi|parachute|bluetooth)\b/i.test(msg)) {
      responseText = "😂 We're strictly fashion over here! I can help you check our clothes, sizes, colours, prices, and delivery options though. Would you like to see what's in stock?";
    } else {
      responseText = `Thanks for asking! We currently focus on fashion items, and I don't currently have any ${targetItem} listed in the Kulture Fashion House catalog. I can help you with the items currently available:\n- Black Oversized Hoodie (${formatNaira(25000)})\n- Black Velvet Abaya (${formatNaira(35000)})\n- White Premium Sneakers (${formatNaira(45000)})`;
    }
    const updatedMessages: DemoMessage[] = [
      ...state.messages,
      { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
      { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
    ];
    return {
      updatedState: {
        ...state,
        messages: updatedMessages,
        lastIntent: intent,
        pendingProductId: state.pendingProductId,
        pendingSize: state.pendingSize,
        pendingColor: state.pendingColor,
        pendingLocation: state.pendingLocation,
        pendingPurchaseIntent: state.pendingPurchaseIntent,
        lastProductListIds: state.lastProductListIds,
      },
      responseText,
      intent,
    };
  }

  // 1a. Pre-purchase / Policy Interceptors (Returns, Payment, Delivery Timeframe, Material, Care, Fit, Comparison)
  if (/\b(return|refund|exchange|cancel my order|change my mind|what if it doesn'?t fit|money back)\b/i.test(msg)) {
    intent = 'POLICY_INQUIRY';
    responseText = "I don't have a confirmed return or refund policy listed for Kulture Fashion House yet. I can connect you directly with the store owner on WhatsApp to assist with return or exchange queries!";
    const updatedMessages: DemoMessage[] = [
      ...state.messages,
      { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
      { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
    ];
    return { updatedState: { ...state, messages: updatedMessages, lastIntent: intent }, responseText, intent };
  }

  if (/\b(how\s+(can|do|should|fit|i)\s+pay|how\s+to\s+pay|pay\s+for|payment\s+methods?|pay\s+cash|accept\s+transfer|pay\s+by\s+transfer|collect\s+transfer|una\s+dey\s+collect|transfer|cod|cash\s+on\s+delivery|cash\s+dey|pos|bank\s+details|account\s+number|how\s+i\s+go\s+pay|how\s+una\s+dey\s+collect)\b/i.test(msg)) {
    intent = 'PAYMENT_INQUIRY';
    responseText = "We accept standard bank transfers and direct payment. The vendor at Kulture Fashion House will share official payment details directly with you on WhatsApp when your order is ready!";
    const updatedMessages: DemoMessage[] = [
      ...state.messages,
      { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
      { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
    ];
    return { updatedState: { ...state, messages: updatedMessages, lastIntent: intent }, responseText, intent };
  }

  if (/\b(how long|how fast|when will|how soon|delivery time|delivery timeframe|arrive|deliver to me)\b/i.test(msg) && !msg.includes('how much') && !msg.includes('fee') && !msg.includes('rate')) {
    intent = 'DELIVERY_INQUIRY';
    responseText = "I don't have the confirmed delivery timeframe for Kulture Fashion House listed yet, but the vendor can confirm estimated delivery timing for your location!";
    const updatedMessages: DemoMessage[] = [
      ...state.messages,
      { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
      { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
    ];
    return { updatedState: { ...state, messages: updatedMessages, lastIntent: intent }, responseText, intent };
  }

  if (/\b(material|fabric|quality|cotton|silk|chiffon|durable|wash|iron|care|authentic|original)\b/i.test(msg) && !msg.includes('how much')) {
    intent = 'PRODUCT_INQUIRY';
    if (msg.includes('hoodie')) {
      responseText = "The Black Oversized Hoodie is crafted from premium fleece cotton designed for maximum comfort and durability. Machine wash cold, tumble dry low.";
    } else {
      responseText = "I don't have the specific fabric composition or care instructions for this item confirmed yet, but I can flag it for the store owner to confirm!";
    }
    const updatedMessages: DemoMessage[] = [
      ...state.messages,
      { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
      { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
    ];
    return { updatedState: { ...state, messages: updatedMessages, lastIntent: intent }, responseText, intent };
  }

  if (/\b(which (one\s+)?is (better|cheaper|more expensive)|compare|difference between)\b/i.test(msg)) {
    intent = 'PRODUCT_INQUIRY';
    responseText = "Here is a comparison based on our catalog:\n• Black Oversized Hoodie: ₦25,000 (Sizes: M, L, XL)\n• Black Velvet Abaya: ₦35,000 (Sizes: M, L, XL)\n• White Premium Sneakers: ₦45,000 (Sizes: 40–44)\n\nLet me know if you would like more details on any of these options!";
    const updatedMessages: DemoMessage[] = [
      ...state.messages,
      { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
      { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
    ];
    return { updatedState: { ...state, messages: updatedMessages, lastIntent: intent }, responseText, intent };
  }

  // 1b. Contextual Reply Resolution
  const contextResolution = resolveContextualReply(msg, userMessageText, state, customCatalog);
  if (contextResolution) {
    if (contextResolution.directResponse) {
      const resolvedIntent = contextResolution.intent || 'CONTEXTUAL_REPLY';
      const updatedMessages: DemoMessage[] = [
        ...state.messages,
        { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
        { id: `msg_ai_${Date.now()}`, sender: 'ai', text: contextResolution.directResponse, timestamp, intent: resolvedIntent },
      ];
      return {
        updatedState: { ...state, messages: updatedMessages, lastIntent: resolvedIntent },
        responseText: contextResolution.directResponse,
        intent: resolvedIntent,
      };
    }

    if (contextResolution.isCatalogYes) {
      const syntheticMsg = 'what items do you have';
      return enforceCustomerFidelity(processDemoMessage({ ...state }, syntheticMsg, customCatalog));
    }

    if (contextResolution.resolvedProduct) {
      const product = contextResolution.resolvedProduct;
      const isSyntheticInput = userMessageText.startsWith('I want to reserve') || userMessageText.startsWith('I want to order') || userMessageText.includes('in size');
      if (isSyntheticInput) {
        matchedProduct = product;
      } else {
        const isPurchase = Boolean(contextResolution.isPurchaseYes || state.pendingPurchaseIntent || state.lastIntent === 'PURCHASE_INTENT');
        const isExplicitReserveVerb = /\b(abeg\s+reserve|reserve|keep\s+am|keep\s+this|hold\s+am|hold\s+this|yes\s+do\s+am|do\s+am|confirm|place\s+order|yes|take\s+am|buy\s+am|take\s+this|buy\s+this|collect|run\s+am|do\s+it|wan\s+take|go\s+collect|my\s+choice|bring\s+am|i\s+want\s+this\s+one|i'?ll\s+go\s+with\s+this)\b/i.test(userMessageText) || /\b(abeg\s+reserve|reserve|keep\s+am|keep\s+this|hold\s+am|hold\s+this|yes\s+do\s+am|do\s+am|confirm|place\s+order|yes|take\s+am|buy\s+am|take\s+this|buy\s+this|collect|run\s+am|do\s+it|wan\s+take|go\s+collect|my\s+choice|bring\s+am|i\s+want\s+this\s+one|i'?ll\s+go\s+with\s+this)\b/i.test(msg);
        let synthetic = `Tell me about the ${product.name}`;
        if (isExplicitReserveVerb) {
          synthetic = `I want to reserve the ${product.name} ${userMessageText}`;
        } else if (isPurchase) {
          synthetic = `I want to order the ${product.name}`;
        }
        const lastOrderForProd = state.orders.length > 0 ? state.orders.slice().reverse().find((o) => o.productName === product.name) : undefined;
        const size = contextResolution.resolvedSize || state.pendingSize || (lastOrderForProd ? lastOrderForProd.size : undefined);
        const color = contextResolution.resolvedColor || state.pendingColor || (lastOrderForProd ? lastOrderForProd.color : undefined);
        const location = contextResolution.resolvedLocation || state.pendingLocation || (lastOrderForProd ? lastOrderForProd.deliveryLocation : undefined);

        if (size) synthetic += ` in size ${size}`;
        if (color) synthetic += ` in ${color}`;
        if (location) synthetic += ` to ${location}`;
        const stateWithProduct = {
          ...state,
          pendingProductId: product.id,
          pendingPurchaseIntent: isPurchase,
          pendingSize: size,
          pendingColor: color,
          pendingLocation: location,
        };
        return enforceCustomerFidelity(processDemoMessage(stateWithProduct, synthetic, customCatalog));
      }
    }

    if (contextResolution.isPurchaseYes && state.pendingProductId) {
      const product = customCatalog.find((p) => p.id === state.pendingProductId);
      if (product) {
        matchedProduct = product;
      }
    }

    if (contextResolution.isRejection) {
      const updatedMessages: DemoMessage[] = [
        ...state.messages,
        { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
        { id: `msg_ai_${Date.now()}`, sender: 'ai', text: contextResolution.directResponse!, timestamp, intent: 'CONTEXTUAL_REPLY' },
      ];
      return {
        updatedState: {
          ...state,
          messages: updatedMessages,
          lastIntent: 'CONTEXTUAL_REPLY',
          pendingPurchaseIntent: false,
        },
        responseText: contextResolution.directResponse!,
        intent: 'CONTEXTUAL_REPLY',
      };
    }

    const isSyntheticMsg = userMessageText.startsWith('I want to reserve') || userMessageText.startsWith('I want to order') || msg.toLowerCase().includes('in size');
    if (!isSyntheticMsg && contextResolution.isAttributeReply) {
      const activeProdId = state.pendingProductId || (state.orders.length > 0 ? customCatalog.find((p) => p.name === state.orders[state.orders.length - 1].productName)?.id : undefined);
      if (activeProdId) {
        const product = customCatalog.find((p) => p.id === activeProdId);
        if (product) {
          const lastOrderForProd = state.orders.length > 0 ? state.orders.slice().reverse().find((o) => o.productName === product.name) : undefined;
          const size = contextResolution.resolvedSize || state.pendingSize || (lastOrderForProd ? lastOrderForProd.size : undefined);
          const color = contextResolution.resolvedColor || state.pendingColor || (lastOrderForProd ? lastOrderForProd.color : undefined);
          const location = contextResolution.resolvedLocation || state.pendingLocation;
          const isExplicitReserveVerb = /\b(abeg\s+reserve|reserve|keep\s+am|keep\s+this|hold\s+am|hold\s+this|yes\s+do\s+am|do\s+am|confirm|place\s+order|yes)\b/i.test(userMessageText) || /\b(abeg\s+reserve|reserve|keep\s+am|keep\s+this|hold\s+am|hold\s+this|yes\s+do\s+am|do\s+am|confirm|place\s+order|yes)\b/i.test(msg);
          const isPurchase = Boolean(isExplicitReserveVerb || state.pendingPurchaseIntent || state.lastIntent === 'PURCHASE_INTENT' || contextResolution.intent === 'PURCHASE_INTENT');
          let synthetic = `${product.name}`;
          if (userMessageText.startsWith('I want to reserve') || userMessageText.startsWith('I want to order')) {
            synthetic = userMessageText;
          } else if (isExplicitReserveVerb) {
            synthetic = `I want to reserve the ${product.name} ${userMessageText}`;
          }
          if (size) synthetic += ` in size ${size}`;
          if (color) synthetic += ` in ${color}`;
          if (location) synthetic += ` to ${location}`;
          const enrichedState = {
            ...state,
            pendingProductId: product.id,
            pendingPurchaseIntent: isPurchase,
            pendingSize: size,
            pendingColor: color,
            pendingLocation: location,
          };
          return enforceCustomerFidelity(processDemoMessage(enrichedState, synthetic, customCatalog));
        }
      }
      const attributeDesc = contextResolution.resolvedSize
        ? `size ${contextResolution.resolvedSize}`
        : contextResolution.resolvedColor
        ? `${contextResolution.resolvedColor}`
        : contextResolution.resolvedLocation
        ? `delivery to ${contextResolution.resolvedLocation}`
        : 'that';
      const locCoverage = contextResolution.resolvedLocation ? extractLocationFromMessage(contextResolution.resolvedLocation, true) : undefined;
      const ackResponse = (locCoverage && !locCoverage.isConfirmedCoverage)
        ? `I recognize ${locCoverage.name}. I don't have a confirmed delivery rate or coverage for ${locCoverage.name} in this store's delivery information yet, so I don't want to guess. I can have the vendor confirm it for you.`
        : `Got it — ${attributeDesc}! Which product are you interested in? I have:\n\n${customCatalog.filter((p) => p.in_stock).map((p, i) => `${i + 1}. ${p.name} — ${formatNaira(p.price_ngn)}`).join('\n')}`;
      const ackIntent = 'CONTEXTUAL_REPLY';
      const updatedMessages: DemoMessage[] = [
        ...state.messages,
        { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
        { id: `msg_ai_${Date.now()}`, sender: 'ai', text: ackResponse, timestamp, intent: ackIntent },
      ];
      return {
        updatedState: {
          ...state,
          messages: updatedMessages,
          lastIntent: ackIntent,
          pendingSize: contextResolution.resolvedSize || state.pendingSize,
          pendingColor: contextResolution.resolvedColor || state.pendingColor,
          pendingLocation: contextResolution.resolvedLocation || state.pendingLocation,
        },
        responseText: ackResponse,
        intent: ackIntent,
      };
    }
  }

/**
 * Helper to detect gibberish, keyboard mashing, or nonsensical customer text.
 */
function isGibberishOrNonsense(msgText: string): boolean {
  const norm = msgText.toLowerCase().trim();

  // Playful/slang nonsense words
  if (/\b(asdfghjkl|qwerty|zxcvbnm|lololol|lmao|rofl|bruh|walahi|echoke|e\s+choke|chiai|shege|gberaga)\b/i.test(norm)) {
    return true;
  }

  // Keyboard mashing (single token > 4 chars, no spaces, repeated chars or keyboard row patterns)
  if (!norm.includes(' ') && norm.length >= 5) {
    if (/(.)\1{3,}/.test(norm)) return true;
    if (!/[aeiouy]/.test(norm)) return true;
    if (/asdf|dfgh|fghj|ghjk|hjkl|qwer|wert|erty|rtyu|tyui|yuio|uiop|zxcv|xcvb|cvbn|vbnm/i.test(norm)) return true;
  }

  return false;
}

  // 1c. Pure Conversational Intents (Greetings, Thanks, Farewells, Compliments, Nonsense)
  const hasCommercialContent =
    msg.includes('what items') || msg.includes('what products') || msg.includes('what do you sell') ||
    msg.includes('what do you have') || msg.includes('what can i') || msg.includes('do you have') ||
    msg.includes('wetin una get') || msg.includes('wetin una dey sell') || msg.includes('wetin dey') ||
    msg.includes('how much') || msg.includes('price') || msg.includes('cost') || msg.includes('buy') ||
    msg.includes('order') || msg.includes('reserve') || msg.includes('keep') || msg.includes('available') || msg.includes('stock') ||
    msg.includes('size') || msg.includes('colour') || msg.includes('color') ||
    msg.includes('delivery') || msg.includes('ship') || msg.includes('hoodie') ||
    msg.includes('abaya') || msg.includes('sneaker') || msg.includes('dress') || msg.includes('bag') ||
    PRICE_FILTER_PATTERN.test(msg);

  if (!hasCommercialContent) {
    if (/\b(bye|goodbye|good\s*bye|see\s+you|talk\s+(later|soon)|take\s+care|that'?s?\s+all|i'?ll\s+come\s+back|good\s+night|have\s+a\s+good\s+(day|one|night)|have\s+a\s+great\s+(day|one)|have\s+a\s+nice\s+day|gotta\s+go|got\s+to\s+go|ttyl|peace\s+out|catch\s+you\s+later|talk\s+to\s+you\s+later|later|see\s+ya|until\s+next\s+time|i('?m| am)\s+out)\b/i.test(msg)) {
      intent = 'FAREWELL';
      responseText = "Take care! 👋 Come back anytime — we're always here for you. Have a great day!";
    } else if (
      /\b(thanks?|thank you|thx|thnx|ty|bless|god bless|appreciate|nagode|ese|oshe)\b/i.test(msg) ||
      /\b(that'?s?\s+helpful|got it|understood|sounds?\s+good)\b/i.test(msg)
    ) {
      intent = 'THANKS';
      responseText = "You're welcome! 😊 Let me know if you'd like help finding anything else.";
    } else if (
      /\b(hi|hello|hey|hi there|hey there|howdy|yo|sup|wassup|whatsup|whatup|what'?s?\s+up|howfar|how\s+far|hwfar|hw\s+far|boss\s+hw\s+far|boss\s+how\s+far|xup|wgy|yoo|heyyy|hola|salut|wagwan)\b/i.test(msg) ||
      /\bgood\s+(morning|afternoon|evening|day)\b/i.test(msg) ||
      /\bhow are you\b/i.test(msg)
    ) {
      intent = 'GREETING';
      const usePidgin = respLang === 'pidgin' || /\b(boss|howfar|how\s+far|hwfar|hw\s+far|wetin|dey|abi)\b/i.test(msg);
      if (usePidgin) {
        responseText = 'Hey boss! 👋 Welcome to Kulture Fashion House. Wetin you dey find today—hoodie, abaya, or sneakers?';
      } else {
        responseText = 'Hey! 👋 Welcome to Kulture Fashion House. What are you shopping for today—hoodies, abayas, or sneakers?';
      }
    } else if (
      /\b(beautiful|lovely|amazing|gorgeous|stunning|fantastic|wonderful|nice|cute|perfect|incredible|dope|fire|clean|sweet|lit|banger|top tier|una\s+clothes\s+fine|clothes\s+fine|collection\s+fine|collection\s+clean|clean\s+collection|una\s+dey\s+try|una\s+kill\s+am|mad\s+o)\b/i.test(msg) ||
      /\b(i love|i like|i adore)\b/i.test(msg)
    ) {
      intent = 'COMPLIMENT';
      responseText = "Thank you! 😊 I'm glad you like it. Would you like to see what's currently available in our catalog?";
    } else if (/\b(how (was|is) (your|the) day|how your day|how body|how work|how business|how life|how e dey go|how things dey go|how far with life|how (are|u) doing|how you doing|you dey sleep|wetin you dey do|hope (sales|business) (fine|good)|how market|hope you dey fine|hope you dey okay|how everything|e dey go|how have you been|how('?s| is) it going|long time no see|what('?s| is) new|what('?s| is) good|how('?s| is) life treating you|how('?s| is) everything|what have you been up to|how('?s| is) things|what('?s| is) happening|what('?s| is) the vibe)\b/i.test(msg)) {
      intent = 'SMALL_TALK';
      responseText = "I'm doing great, thank you for asking! 😊 Business is booming and we're active to help you today. How's your day going?";
    } else if (/\b(do you sleep|do you eat|are you real|what do you do for fun|i('?m| am) bored|that('?s| is) life|life is hard|it is what it is)\b/i.test(msg)) {
      intent = 'SMALL_TALK';
      responseText = "Haha 😄 I'm always here and ready! No sleep, no breaks — just helping customers find great outfits. Can I help you with something today?";
    } else if (/\b(where is (your|the) (store|shop|office|location)|where (your|unna) (shop|store) dey|where (are you|unna) located|physical (store|shop)|address of (your|the) (shop|store))\b/i.test(msg)) {
      intent = 'STORE_LOCATION_INQUIRY';
      responseText = "We're based in Lagos, Nigeria! We operate strictly online with fast doorstep delivery across Lagos and interstate shipping nationwide. Where are you located make I calculate delivery for you?";
    } else if (/\b(who (is|be) (your|the) owner|who build (you|this)|are you (a )?(robot|ai|bot|human)|you be (robot|ai|bot|human)|what is your name|wetin be your name|tell me about yourself|what can you do|what do you do)\b/i.test(msg)) {
      intent = 'ASSISTANT_IDENTITY';
      responseText = "I'm VendiAide, the sharp sales assistant for Kulture Fashion House! 🛍️ I'm here to help you check out our catalog, answer questions, and package your orders smoothly. What outfit can I help you find today?";
    } else if (/\b(weather|rain|cold|traffic|e choke|no cap|wetin dey happen)\b/i.test(msg)) {
      intent = 'SMALL_TALK';
      responseText = "Haha, true talk! 😄 We just have to stay stylish no matter what. Would you like to check out some fresh outfits or cozy hoodies today?";

    // Casual Browsing / Window Shopping (Pidgin + English)
    } else if (/\b(i just dey check|just dey check|i dey check|i just dey look|just dey look|i dey look around|dey look around|na window shopping|window shopping|just checking|just looking|just browsing|i wan see wetin una get|make i see|let me see|i wan look|dey window shop|i('?m| am) just browsing|i('?m| am) just looking|i('?m| am) just checking|looking around|checking things out|just window shopping|browsing around|exploring)\b/i.test(msg)) {
      intent = 'CASUAL_BROWSING';
      responseText = "No problem! 😊 Take your time, browse freely. Here's what we have right now:\n\n" +
        customCatalog.filter((p) => p.in_stock).map((p, i) => `${i + 1}. ${p.name} — ${formatNaira(p.price_ngn)}`).join('\n') +
        "\n\nAnything catch your eye? Just ask!";

    // Exclamations & Reactions (Pidgin + English)
    } else if (/^(na wa o|na wa|chai|omo|God dey|we dey|i dey o?|e go be|na so|wahala|walahi|wallahi|abeg o|haba|kilode|ko le werk|ah ah|eh eh|ehn|true true|for real|on God|swear|i swear|wow|omg|oh my god|oh wow|damn|dang|whoa|no way|seriously|really|that('?s| is) crazy|that('?s| is) wild|that('?s| is) funny|haha that('?s| is) funny|interesting|i see|oh okay|oh|oh nice|oh cool|hmm interesting|fair enough)$/i.test(msg.trim())) {
      intent = 'REACTION';
      responseText = "😄 I feel you! Anything I can help you with today? Check prices, sizes, colours — I'm here for you!";

    // Acknowledgments (Pidgin + English)
    } else if (/^(i hear you|i don hear|sabi|i sabi|okay o|alright o|ehen|okay na|alright na|make we see|we go see|sha|true|tru|word|bet|abi|shebi|se|no worries|that('?s| is) cool|that('?s| is) fine|right|yep|yup|yeah|mhm|uh huh|not much|not really|same|same here|nothing much|i('?m| am) good|all good|we('?re| are) good|sounds good|sounds great|perfect|lol|lmao|haha|😂|🤣)$/i.test(msg.trim())) {
      intent = 'ACKNOWLEDGEMENT';
      responseText = "No problem! 😊 I'm right here whenever you're ready. Let me know if you want to check anything out!";

    // Farewell / Coming Back (Pidgin + English)
    } else if (/\b(i go come back|i dey come back|make i dey go|i wan comot|we go talk later|we go yarn later|i go check back|see you|bye|byebye|goodbye|go well|take care|till next time|make i bounce|i dey go|i dey leave|catch you later|talk to you later|talk later|i('?ll| will) be back|i('?ll| will) come back|have a good day|have a good one|have a great day|have a nice day|good night|gotta go|got to go|ttyl|peace|peace out|see ya|until next time|i('?m| am) out)\b/i.test(msg) &&
        !msg.includes('how much') && !msg.includes('price') && !msg.includes('buy') && !/\border\b/i.test(msg)) {
      intent = 'FAREWELL';
      responseText = "Take care! 👋 Come back anytime — we're always here for you. Have a great day!";

    // Apology / Reassurance (Pidgin + English)
    } else if (/\b(no vex|abeg no vex|sorry o|i no mean am|my bad|pardon|forgive me|e no go happen again|sorry for the delay|sorry for delay|i('?m| am) sorry|so sorry|apologies|i apologize|excuse me|didn('?t| not) mean to|oops)\b/i.test(msg) &&
        !msg.includes('return') && !msg.includes('refund')) {
      intent = 'APOLOGY';
      responseText = "No worries at all! 😊 No need to apologize. How can I help you today?";

    // Presence Check
    } else if (/\b(you there|are you there|are you still there|anyone there|still there|you still dey|you dey online|are you online|can you hear me)\b/i.test(msg) &&
        msg.trim().split(/\s+/).length <= 6) {
      intent = 'PRESENCE_CHECK';
      responseText = "I'm right here! 😊 How can I help you?";

    } else if (isGibberishOrNonsense(userMessageText)) {
      intent = 'GENERAL_QUESTION';
      responseText = "Haha 😄! I'm here to help you browse our fashion catalog and place orders. Let me know what items, sizes, or prices you'd like to check!";
    }

    if (intent !== 'GENERAL_QUESTION' || isGibberishOrNonsense(userMessageText)) {
      const updatedMessages: DemoMessage[] = [
        ...state.messages,
        { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
        { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
      ];
      return {
        updatedState: {
          ...state,
          messages: updatedMessages,
          lastIntent: intent,
          // Explicitly preserve active purchase & selection context across conversational turns
          pendingProductId: state.pendingProductId,
          pendingSize: state.pendingSize,
          pendingColor: state.pendingColor,
          pendingLocation: state.pendingLocation,
          pendingPurchaseIntent: state.pendingPurchaseIntent,
          lastProductListIds: state.lastProductListIds,
        },
        responseText,
        intent,
      };
    }
  }

  // 2. Pre-resolve specific product match (with simple word/synonym coverage or positional index)
  if (!matchedProduct) {
    const posIdx = extractPositionalIndex(msg);
    if (posIdx !== undefined) {
      const list = state.lastProductListIds && state.lastProductListIds.length > 0 ? state.lastProductListIds : customCatalog.map((p) => p.id);
      const targetId = list[posIdx - 1];
      if (targetId) {
        matchedProduct = customCatalog.find((p) => p.id === targetId);
      }
    }
  }

  const productMatch = resolveCatalogProduct(userMessageText, customCatalog);
  if (!matchedProduct) {
    if (productMatch.kind !== 'unknown' && productMatch.product) {
      matchedProduct = productMatch.product;
    }
  }

  const aiMessages = state.messages.filter((m) => m.sender === 'ai');
  const lastAiText = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].text.toLowerCase() : '';
  const aiAskedForSize = /\bwhat size|which size|preferred size|size would you like|size are you\b/i.test(lastAiText);
  let requestedSize = extractSizeFromMessage(userMessageText, matchedProduct || (state.pendingProductId ? customCatalog.find(p => p.id === state.pendingProductId) : null), aiAskedForSize || lastAiText.includes('size'));

  // Fallback to pending active product or recent order product when message asks for attributes, prices, corrections, or purchase instructions
  if (!matchedProduct && (state.pendingProductId || state.orders.length > 0 || contextResolution?.resolvedProduct)) {
    const isSizeOrAttributeToken = requestedSize !== undefined || /^(?:size\s+)?\d+$/i.test(msg.trim()) || /^(s|m|l|xl|xxl)$/i.test(msg.trim());
    const isUnlistedProductQuery = productMatch.kind === 'unknown' && productMatch.queryTerm !== 'that item' && productMatch.queryTerm !== 'that specific item' && productMatch.queryTerm !== 'item' && !isSizeOrAttributeToken;
    if (!isUnlistedProductQuery) {
      const activeProdId = contextResolution?.resolvedProduct?.id || state.pendingProductId || (state.orders.length > 0 ? customCatalog.find((p) => p.name === state.orders[state.orders.length - 1].productName)?.id : undefined);
      const activeProd = customCatalog.find((p) => p.id === activeProdId);
      if (activeProd) {
        const isAttributeOrPurchase = /\b(s|m|l|xl|xxl|small|medium|large|size|sizes|color|colour|colors|colours|only|another|other|different|price|cost|how much|buy|order|take|take it|will take|give me|deliver|delivery|shipping|location|instead|actually|change|switch|reserve|keep|hold|do am|yes|collect|run|run am|do it|my choice|wan take|go collect|want this|go with)\b/i.test(msg) || /^(s|m|l|xl|xxl|\d+)$/i.test(msg.trim()) || Boolean(contextResolution?.isPurchaseYes);
        if (isAttributeOrPurchase) {
          matchedProduct = activeProd;
          if (!requestedSize) {
            requestedSize = extractSizeFromMessage(userMessageText, matchedProduct, aiAskedForSize || lastAiText.includes('size'));
          }
        }
      }
    }
  }

  // Simple Photo / Picture / Image Request Interceptor
  if (/\b(pictures?|pics?|photos?|images?|videos?|show me (a )?(picture|photo|pic|image)|let me see (the )?(picture|photo|pic|image))\b/i.test(msg)) {
    intent = 'PRODUCT_INQUIRY';
    const targetProd = matchedProduct || (state.pendingProductId ? customCatalog.find((p) => p.id === state.pendingProductId) : undefined);
    const prodName = targetProd ? targetProd.name : 'our fashion collection';
    responseText = `All photos and specifications for ${prodName} are displayed live in our catalog showcase! Would you like to check sizes, colors, or delivery pricing?`;
    const updatedMessages: DemoMessage[] = [
      ...state.messages,
      { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
      { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
    ];
    return {
      updatedState: {
        ...state,
        messages: updatedMessages,
        lastIntent: intent,
        pendingProductId: targetProd ? targetProd.id : state.pendingProductId,
        pendingSize: state.pendingSize,
        pendingColor: state.pendingColor,
        pendingLocation: state.pendingLocation,
        pendingPurchaseIntent: state.pendingPurchaseIntent,
        lastProductListIds: state.lastProductListIds,
      },
      responseText,
      intent,
    };
  }

  // 1d. Delivery Rate / Coverage Inquiry Interceptor (yields to multi-question product queries)
  const isDeliveryQuery =
    /\b(delivery|shipping|ship|postage|deliver|how\s+much\s+to|send\s+(it\s+)?to|una\s+dey\s+deliver|you\s+fit\s+deliver|delivery\s+dey\s+reach)\b/i.test(msg) &&
    !(matchedProduct && (msg.includes('size') || msg.includes('color') || msg.includes('colour') || msg.includes('hoodie') || msg.includes('abaya') || msg.includes('sneaker')));

  if (isDeliveryQuery) {
    intent = 'DELIVERY_INQUIRY';
    const locRes = extractLocationFromMessage(userMessageText, true);
    const newLoc = locRes ? locRes.name : (state.pendingLocation || undefined);
    
    if (locRes) {
      if (locRes.locationAmbiguous) {
        responseText = `Did you mean Victoria Island or Victoria Garden City in Lagos? Please let me know your specific location so I can confirm delivery rates for you.`;
      } else if (locRes.isConfirmedCoverage) {
        if (msg.includes('how long') || msg.includes('time') || msg.includes('days')) {
          responseText = `Delivery to ${locRes.name} takes ${locRes.deliveryTimeframe || '1-3 business days'}.`;
        } else if (msg.includes('how much') || msg.includes('price') || msg.includes('cost') || msg.includes('fee') || msg.includes('rate') || /\bhow\s+much\s+to\b/i.test(msg)) {
          responseText = `Delivery to ${locRes.name} is ${formatNaira(locRes.deliveryFeeNaira!)}.`;
        } else {
          responseText = `Yes! We deliver to ${locRes.name}. The delivery fee is ${formatNaira(locRes.deliveryFeeNaira!)} (${locRes.deliveryTimeframe || '1-3 business days'}).`;
        }
      } else {
        responseText = `I recognize ${locRes.name}. I don't have a confirmed delivery rate or coverage for ${locRes.name} in this store's delivery information yet, so I don't want to guess. I can have the vendor confirm it for you.`;
      }
    } else if (newLoc) {
      const coverage = getVendorDeliveryCoverage(newLoc);
      if (coverage.isConfirmedCoverage) {
        responseText = `Delivery to ${newLoc} is ${formatNaira(coverage.rateNaira!)}.`;
      } else {
        responseText = `I recognize ${newLoc}. I don't have a confirmed delivery rate or coverage for ${newLoc} in this store's delivery information yet, so I don't want to guess. I can have the vendor confirm it for you.`;
      }
    } else {
      responseText = `I don't have a confirmed delivery rate or coverage for that location in this store's delivery information. Which city or state in Nigeria would you like us to deliver to?`;
    }

    const updatedMessages: DemoMessage[] = [
      ...state.messages,
      { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
      { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
    ];

    return {
      updatedState: {
        ...state,
        messages: updatedMessages,
        lastIntent: intent,
        pendingProductId: state.pendingProductId,
        pendingPurchaseIntent: state.pendingPurchaseIntent,
        lastProductListIds: state.lastProductListIds,
        pendingSize: state.pendingSize,
        pendingColor: state.pendingColor,
        pendingLocation: newLoc,
      },
      responseText,
      intent,
    };
  }

  // 3. Extract requested attributes (color, size, price, category)
  const requestedColor = extractColorFromMessage(userMessageText);
  if (!requestedSize && matchedProduct) {
    requestedSize = extractSizeFromMessage(userMessageText, matchedProduct, aiAskedForSize || lastAiText.includes('size'));
  }

  // Grounded Catalog Discovery vs Specific Product Match Detection
  const isCategoryDiscoveryQuery =
    isCatalogDiscoveryQueryText(msg, Boolean(matchedProduct || state.pendingProductId)) ||
    /\bwhat\s+(dresses|abayas|hoodies|shoes|sneakers|clothes)\b/i.test(msg) ||
    /\bshow\s+me\s+(dresses|abayas|hoodies|shoes|sneakers|clothes)\b/i.test(msg) ||
    /\b(una\s+get|do\s+you\s+have|do\s+you\s+sell)\s+(hoodie|hoodies|abaya|abayas|sneaker|sneakers|shoe|shoes|gown|gowns|dress|dresses)\b/i.test(msg);

  const isCatalogQuery =
    (
      isCategoryDiscoveryQuery ||
      msg.includes('what items') ||
      msg.includes('what products') ||
      msg.includes('what do you sell') ||
      msg.includes('what do you have') ||
      msg.includes('wetin') ||
      msg.includes('abeg show') ||
      msg.includes('show me your catalog') ||
      msg.includes('show me your products') ||
      msg.includes('show me') ||
      msg.includes('show catalog') ||
      msg.includes("what's available") ||
      msg.includes('what is available') ||
      msg.includes('what can i buy') ||
      msg.includes('what can i order') ||
      msg.includes('what do you currently have') ||
      msg.includes('what fashion items') ||
      msg.includes("what's in stock") ||
      msg.includes('what is in stock') ||
      PRICE_FILTER_PATTERN.test(msg)
    ) &&
    (!matchedProduct || (isCategoryDiscoveryQuery && requestedColor === undefined && requestedSize === undefined)) &&
    !(state.pendingProductId && (msg.includes('size') || msg.includes('color') || msg.includes('colour') || msg.includes('available') || msg.includes('stock') || requestedColor !== undefined));

  const priceFilter = extractPriceFilter(msg);
  const extractedLocation = extractLocationFromMessage(userMessageText, state.lastIntent === 'PURCHASE_INTENT')?.name;

  // 4. Grounded Decision Logic

  // CATALOG DISCOVERY & FILTERING BRANCH
  if (isCatalogQuery) {
    intent = 'CATALOG_INQUIRY';
    const activeCatalog = customCatalog.filter((p) => p.in_stock);

    const isColorRequest = msg.includes('color') || msg.includes('colour') || msg.includes('colors') || msg.includes('colours');
    const isSizeRequest = msg.includes('size') || msg.includes('sizes');

    let filtered = [...activeCatalog];

    if (msg.includes('dress') || msg.includes('dresses')) {
      filtered = filtered.filter((p) => p.category.toLowerCase().includes('abaya') || p.name.toLowerCase().includes('abaya') || p.name.toLowerCase().includes('dress'));
    }
    if (msg.includes('clothing') || msg.includes('clothes') || msg.includes('apparel')) {
      filtered = filtered.filter((p) => p.category !== 'Sneakers & Footwear');
    }
    if (requestedColor) {
      filtered = filtered.filter((p) => p.colors.some((c) => c.toLowerCase() === requestedColor!.toLowerCase()));
    }
    if (requestedSize) {
      filtered = filtered.filter((p) => p.sizes.includes(requestedSize!));
    }
    if (priceFilter) {
      filtered = applyPriceFilter(filtered, priceFilter);
    }

    if (isColorRequest && !requestedColor) {
      const distinctColors = Array.from(new Set(filtered.flatMap((p) => p.colors)));
      responseText = `Our catalog items are currently available in ${formatListWithAnd(distinctColors)}. Let me know if you would like to see products in a specific color!`;
    } else if (isSizeRequest && !requestedSize) {
      const clothingSizes = Array.from(new Set(filtered.filter(p => p.category !== 'Sneakers & Footwear').flatMap(p => p.sizes)));
      const shoeSizes = Array.from(new Set(filtered.filter(p => p.category === 'Sneakers & Footwear').flatMap(p => p.sizes))).sort();
      const clothing = ['S', 'M', 'L', 'XL'].filter(s => clothingSizes.includes(s));
      const shoeStr = shoeSizes.length > 0 ? `Sizes ${shoeSizes[0]}–${shoeSizes[shoeSizes.length - 1]}` : '';

      const parts: string[] = [];
      if (clothing.length > 0) parts.push(`${formatListWithAnd(clothing)} for clothing items`);
      if (shoeStr) parts.push(`${shoeStr} for the sneakers`);

      responseText = `We currently have:\n• ${parts.join('\n• ')}\n\nIf you tell me which product you're interested in, I can check its exact available sizes.`;
    } else {
      if (filtered.length === 0) {
        if (priceFilter && !requestedColor && !requestedSize && !(msg.includes('dress') || msg.includes('dresses'))) {
          responseText = buildNoPriceMatchResponse(priceFilter);
        } else {
          responseText = "I don't currently have any listed products matching that request.";
        }
      } else {
        const productListStr = filtered
          .map((p, i) => `${i + 1}. ${p.name} — ${formatNaira(p.price_ngn)}`)
          .join('\n');
        const isGreetingPresent = /\b(hi|hello|hey|good\s+morning|good\s+afternoon|good\s+evening|howfar|how\s+far|hwfar|hw\s+far|xup|yo|sup|wassup)\b/i.test(msg);
        const greetingPrefix = isGreetingPresent ? (isPidgin ? 'Hey boss! 👋 Welcome to Kulture Fashion House.\n\n' : 'Hey! 👋 Welcome to Kulture Fashion House.\n\n') : '';
        const introLine = priceFilter
          ? buildPriceIntroLine(priceFilter)
          : (isPidgin ? 'These na the items wey dey available:' : 'Here are the items currently available in our catalog:');
        const locRes = extractLocationFromMessage(userMessageText, true);
        const delNote = (locRes && locRes.isConfirmedCoverage) ? `\n\nDelivery to ${locRes.name} is ${formatNaira(locRes.deliveryFeeNaira!)} (${locRes.deliveryTimeframe}).` : '';
        const closingLine = isPidgin
          ? 'Which one you wan check?'
          : 'Let me know if you would like to check sizes, colors, or place an order!';
        responseText = `${greetingPrefix}${introLine}\n\n${productListStr}${delNote}\n\n${closingLine}`;
        newLastProductListIds = filtered.map((p) => p.id);
      }
    }
  }
  // SPECIFIC PRODUCT MATCH BRANCH
  else if (matchedProduct) {
    const isOnlyColorQuery = /\b(only\s+black|only\s+in\s+black|is\s+it\s+only|na\s+only|only\s+one\s+colou?r|the\s+only\s+colou?r|only\s+(?:black|white|red|blue|gold|green|brown|pink|purple)|is\s+\w+\s+the\s+only)\b/i.test(msg) || /^(only\s+black\??|is\s+it\s+only\s+black\??|na\s+only\s+black\??)$/i.test(msg.trim());
    const isOtherColorQuery = /\b(any\s+other|another\s+colou?r|other\s+colou?r|different\s+colou?r|other\s+colou?rs?)\b/i.test(msg);
    const isCorrection = /\b(no,?\s+)?(i\s+meant|i\s+was\s+referring\s+to|i\s+said|i\s+mean|instead|actually|change\s+to|switch\s+to|rather)\b/i.test(msg);
    const isExplicitSwitch = isExplicitProductSwitch(userMessageText) || isExplicitProductSwitch(msg) || isCorrection;
    const isGenericCategoryRequest = /^i\s+want\s+(a|an)\s+(hoodie|abaya|sneaker|shoe|gown|dress|jacket|top|shirt)\b/i.test(msg.trim());
    const isPurePriceOrDeliveryQuery = /\b(how\s+much|what\s+is\s+the\s+(price|cost|rate|fee)|delivery\s+rate|shipping\s+fee)\b/i.test(msg) && !/\b(buy|order|take|give\s+me|reserve)\b/i.test(msg);
    const isAvailabilityPattern = /\b(do\s+you\s+have|you\s+get|una\s+get|is\s+there|do\s+u\s+have|are\s+there|is\s+the\s+\w+\s+available)\b/i.test(msg);

    const isDifferentProduct = Boolean(state.activeDraft?.productId || state.pendingProductId) && (state.activeDraft?.productId || state.pendingProductId) !== matchedProduct.id;
    const isExplicitPurchaseReq = (!isDifferentProduct || isExplicitSwitch) && !isAvailabilityPattern && !isPurePriceOrDeliveryQuery && !isOnlyColorQuery && !isOtherColorQuery && !isGenericCategoryRequest && (isExplicitSwitch || msg.includes('buy') || msg.includes('order') || msg.includes('take it') || msg.includes("i'll take") || msg.includes('give me') || msg.includes('reserve') || /\b(i\s+want\s+take|i\s+wan\s+take|i\s+go\s+collect|i'?ll\s+take|make\s+i\s+buy|i\s+dey\s+buy|let'?s\s+do|make\s+we\s+run|i\s+want\s+this|i'?ll\s+go\s+with|my\s+choice|i\s+go\s+take|i\s+wan\s+buy|make\s+we\s+do\s+am)\b/i.test(msg) || Boolean(requestedSize) || (Boolean(extractedLocation) && !isPurePriceOrDeliveryQuery) || Boolean(state.pendingPurchaseIntent));

    const isInfoOnDifferentProduct = isDifferentProduct && !isExplicitSwitch && !isExplicitPurchaseReq;

    if (isExplicitSwitch && isDifferentProduct && state.activeDraft) {
      const sanitizedDraft = sanitizeDraftOnProductSwitch(state.activeDraft, matchedProduct);
      intent = 'EXPLICIT_PRODUCT_SWITCH';
      newPendingProductId = matchedProduct.id;
      newPendingPurchaseIntent = true;
      const promptLocation = sanitizedDraft.location ? ` for your delivery to ${sanitizedDraft.location}` : '';
      responseText = `Switched to ${matchedProduct.name}! Available sizes: ${formatListWithAnd(matchedProduct.sizes)}. Which size would you like${promptLocation}?`;

      const updatedMessages: DemoMessage[] = [
        ...state.messages,
        { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
        { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
      ];

      return {
        updatedState: {
          ...state,
          messages: updatedMessages,
          activeDraft: sanitizedDraft,
          lastIntent: intent,
          pendingProductId: matchedProduct.id,
          pendingPurchaseIntent: true,
          pendingSize: sanitizedDraft.size || undefined,
          pendingColor: sanitizedDraft.color || undefined,
          pendingLocation: sanitizedDraft.location || undefined,
        },
        responseText,
        intent,
      };
    }

    if (!isInfoOnDifferentProduct) {
      newPendingProductId = matchedProduct.id;
      if (isExplicitPurchaseReq) {
        newPendingPurchaseIntent = true;
      }
    }

    if (!matchedProduct.in_stock) {
      intent = 'AVAILABILITY_INQUIRY';
      responseText = `The ${matchedProduct.name} is currently out of stock. We will notify you as soon as it is restocked!`;
    } else if (isOnlyColorQuery) {
      intent = 'COLOR_AVAILABILITY_QUERY';
      const colors = matchedProduct.colors;
      const targetColor = requestedColor || colors[0] || 'Black';
      const pricePart = (msg.includes('price') || msg.includes('how much')) ? ` (${formatNaira(matchedProduct.price_ngn)})` : '';
      if (colors.length === 1) {
        responseText = isPidgin
          ? `Yes o, the ${matchedProduct.name}${pricePart} dey available only in ${colors[0]} for now.`
          : `Yes, the ${matchedProduct.name}${pricePart} is currently only available in ${colors[0]}.`;
      } else {
        const otherColors = colors.filter(c => c.toLowerCase() !== targetColor.toLowerCase());
        responseText = isPidgin
          ? `No o, the ${matchedProduct.name}${pricePart} dey available in ${formatListWithAnd(colors)}!`
          : `No, the ${matchedProduct.name}${pricePart} is also available in ${formatListWithAnd(otherColors)}.`;
      }
    } else if (/\b(other\s+colou?r|another\s+colou?r|different\s+colou?r|any\s+other|other\s+colou?rs?|any\s+other\s+colou?r)\b/i.test(msg) || isOtherColorQuery) {
      intent = 'COLOR_AVAILABILITY_QUERY';
      const colors = matchedProduct.colors;
      const pricePart = (msg.includes('price') || msg.includes('how much')) ? ` (${formatNaira(matchedProduct.price_ngn)})` : '';
      if (colors.length <= 1) {
        responseText = isPidgin
          ? `No o, we no get another color for now — the ${matchedProduct.name}${pricePart} dey only in ${colors[0] || 'Black'}.`
          : `No, we don't have other colors right now — the ${matchedProduct.name}${pricePart} is only available in ${colors[0] || 'Black'}.`;
      } else {
        const primaryColor = requestedColor || colors[0];
        const otherColors = colors.filter(c => c.toLowerCase() !== primaryColor.toLowerCase());
        responseText = isPidgin
          ? `Yes! Apart from ${primaryColor}, we also get am in ${formatListWithAnd(otherColors)}.`
          : `Yes! Besides ${primaryColor}, the ${matchedProduct.name}${pricePart} is also available in ${formatListWithAnd(otherColors)}.`;
      }
    } else if (isPurePriceOrDeliveryQuery) {
      intent = 'PRICE_INQUIRY';
      const locRes = extractLocationFromMessage(userMessageText, true);
      const locName = locRes ? locRes.name : (extractedLocation ? String(extractedLocation) : undefined);
      const delFeeStr = locName ? formatNaira(getVendorDeliveryCoverage(locName).rateNaira || 5000) : undefined;
      const deliveryPart = delFeeStr && locName ? ` Delivery to ${locName} is ${delFeeStr}.` : '';
      responseText = isPidgin
        ? `The ${matchedProduct.name} na ${formatNaira(matchedProduct.price_ngn)}.${deliveryPart}`
        : `The ${matchedProduct.name} is ${formatNaira(matchedProduct.price_ngn)}.${deliveryPart}`;
    } else if (/\bsizes?\b/i.test(msg) && !requestedSize) {
      intent = 'PRODUCT_INQUIRY';
      const sizeStr = formatListWithAnd(matchedProduct.sizes);
      const locRes = extractLocationFromMessage(userMessageText, true);
      const deliveryPart = locRes ? ` Delivery to ${locRes.name} is ${formatNaira(locRes.parsed.toLowerCase().includes('lagos') ? 2500 : 5000)}.` : '';
      const pricePart = (msg.includes('price') || msg.includes('how much')) ? ` is ${formatNaira(matchedProduct.price_ngn)},` : '';
      responseText = isPidgin
        ? `The ${matchedProduct.name}${pricePart} dey available in sizes ${sizeStr}.${deliveryPart}`
        : `The ${matchedProduct.name}${pricePart} is available in sizes ${sizeStr}.${deliveryPart}`;
    } else if (/\bcolou?rs?\b/i.test(msg) && !requestedColor) {
      intent = 'PRODUCT_INQUIRY';
      const colorStr = formatListWithAnd(matchedProduct.colors);
      responseText = isPidgin
        ? `The ${matchedProduct.name} dey available in ${colorStr}.`
        : `The ${matchedProduct.name} is available in ${colorStr}.`;
    } else if (requestedColor && !matchedProduct.colors.map((c) => c.toLowerCase()).includes(requestedColor.toLowerCase())) {
      intent = 'AVAILABILITY_INQUIRY';
      const article = /^[aeiou]/i.test(requestedColor) ? 'an' : 'a';
      responseText = `I don't currently have ${article} ${requestedColor.toLowerCase()} version of the ${matchedProduct.name} listed in the catalog. The ${matchedProduct.name} is available in ${matchedProduct.colors.join(', ')} for ${formatNaira(matchedProduct.price_ngn)}.`;
    } else if (requestedSize && matchedProduct.sizes.length > 0 && !matchedProduct.sizes.includes(requestedSize)) {
      intent = 'AVAILABILITY_INQUIRY';
      responseText = `The ${matchedProduct.name} is available, but size ${requestedSize} isn't currently listed. Available sizes are ${formatListWithAnd(matchedProduct.sizes)}.`;
    } else if (isExplicitPurchaseReq) {
      intent = 'PURCHASE_INTENT';
      newPendingPurchaseIntent = true;

      const rawLoc = extractedLocation || state.pendingLocation;
      const finalLocation = typeof rawLoc === 'object' && rawLoc && 'name' in rawLoc ? String((rawLoc as { name: string }).name) : (rawLoc as string | undefined);

      const requiresSize = matchedProduct.sizes.length > 0;
      const rawSizeCandidate = requestedSize || state.pendingSize;
      const finalSize = isSizeCompatibleWithProduct(rawSizeCandidate, matchedProduct) ? rawSizeCandidate : undefined;
      const finalColor = requestedColor || state.pendingColor;
      const isComplete = Boolean(finalLocation && (!requiresSize || finalSize));

      const newLeads = [...state.leads];

      const existingLeadIdx = newLeads.findIndex((l) => l.customerName === 'Demo Customer (WhatsApp)');
      if (existingLeadIdx >= 0) {
        newLeads[existingLeadIdx].status = isComplete ? 'ORDER_PENDING' : 'INTERESTED';
        newLeads[existingLeadIdx].productInterest = matchedProduct.name;
      } else {
        newLeads.push({
          id: `demo_lead_${Date.now()}`,
          customerName: 'Demo Customer (WhatsApp)',
          productInterest: matchedProduct.name,
          status: isComplete ? 'ORDER_PENDING' : 'INTERESTED',
          timestamp,
        });
      }

      const updatedDraft: ActiveDraft = {
        productId: matchedProduct.id,
        size: finalSize || null,
        color: finalColor || null,
        location: finalLocation || null,
        quantity: 1,
        status: isComplete ? 'READY_FOR_CHECKOUT' : 'CONFIGURING',
        authorized: false,
      };

      if (isComplete) {
        const locCoverage = finalLocation ? getVendorDeliveryCoverage(finalLocation) : undefined;
        const deliveryFee = (locCoverage && locCoverage.isConfirmedCoverage && locCoverage.rateNaira) ? locCoverage.rateNaira : 0;
        const totalAmount = matchedProduct.price_ngn + deliveryFee;
        const feeStr = deliveryFee > 0 ? `\n• Delivery Fee (${finalLocation}): ${formatNaira(deliveryFee)}` : '';
        responseText = isPidgin
          ? `No wahala! ${matchedProduct.name}${finalSize ? `, size ${finalSize}` : ''} to ${finalLocation}!\n\n• Item Price: ${formatNaira(matchedProduct.price_ngn)}${feeStr}\n• Total: ${formatNaira(totalAmount)}\n\nMake I reserve this order for you?`
          : `Got it — ${matchedProduct.name}${finalSize ? ` (Size: ${finalSize})` : ''} to ${finalLocation}!\n\n• Item Price: ${formatNaira(matchedProduct.price_ngn)}${feeStr}\n• Total: ${formatNaira(totalAmount)}\n\nWould you like me to reserve this order for you?`;
      } else {
        const missing: string[] = [];
        if (requiresSize && !finalSize) missing.push('size');
        if (!finalLocation) missing.push('delivery location');
        if (requestedSize) {
          responseText = isPidgin
            ? `No wahala, size ${requestedSize}! To complete your order for ${matchedProduct.name}, abeg send your preferred ${missing.join(' and ')}.`
            : `Got it, size ${requestedSize}! To complete your order for ${matchedProduct.name}, please confirm your preferred ${missing.join(' and ')}.`;
        } else if (finalSize) {
          responseText = isPidgin
            ? `Correct choice! To complete your order for ${matchedProduct.name} (Size: ${finalSize}), abeg send your preferred ${missing.join(' and ')}.`
            : `Great choice! To complete your order for ${matchedProduct.name} (Size: ${finalSize}), please confirm your preferred ${missing.join(' and ')}.`;
        } else {
          responseText = isPidgin
            ? `Correct choice! To complete your order for ${matchedProduct.name}, abeg send your preferred ${missing.join(' and ')}.`
            : `Great choice! To complete your order for ${matchedProduct.name}, please confirm your preferred ${missing.join(' and ')}.`;
        }
      }

      const updatedMessages: DemoMessage[] = [
        ...state.messages,
        { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
        { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
      ];

      return {
        updatedState: {
          ...state,
          messages: updatedMessages,
          leads: newLeads,
          activeDraft: updatedDraft,
          conversationStatus: isComplete ? 'ORDER_PENDING' : 'AI_ACTIVE',
          lastIntent: intent,
          pendingProductId: matchedProduct.id,
          pendingPurchaseIntent: true,
          lastProductListIds: state.lastProductListIds,
          pendingSize: finalSize,
          pendingColor: finalColor,
          pendingLocation: finalLocation,
        },
        responseText,
        intent,
      };
    } else if (msg.includes('how much') || msg.includes('price') || msg.includes('cost') || msg.includes('rate')) {
      intent = 'PRICE_INQUIRY';
      const locRes = extractLocationFromMessage(userMessageText, true);
      let deliveryDetail = '';
      if (locRes) {
        if (locRes.isConfirmedCoverage) {
          deliveryDetail = ` Delivery to ${locRes.name} is ${formatNaira(locRes.deliveryFeeNaira!)} (${locRes.deliveryTimeframe || '3-5 business days'}).`;
        } else {
          deliveryDetail = ` For delivery to ${locRes.name}, I don't have a confirmed rate in the store's delivery information yet, so I don't want to guess. I can have the vendor confirm it for you.`;
        }
      }
      responseText = `The ${matchedProduct.name} is ${formatNaira(matchedProduct.price_ngn)}${matchedProduct.name.includes('Abaya') ? ' (includes matching Sheila headscarf)' : ''}. Sizes available: ${matchedProduct.sizes.join(', ')}.${deliveryDetail}`;
    } else if (msg.includes('available') || msg.includes('stock') || msg.includes('do you have') || msg.includes('come in') || msg.includes('do u have') || msg.includes('una get')) {
      intent = 'AVAILABILITY_INQUIRY';
      const colorStr = matchedProduct.colors.length > 0 ? ` (Color: ${matchedProduct.colors.join(', ')})` : '';
      const sizeStr = matchedProduct.sizes.length > 0 ? `, Sizes: ${formatListWithAnd(matchedProduct.sizes)}` : '';
      const activeProdName = state.activeDraft?.productId ? customCatalog.find(p => p.id === state.activeDraft.productId)?.name : undefined;
      const promptText = (isInfoOnDifferentProduct && activeProdName)
        ? ` Do you want to replace your current ${activeProdName} selection with the ${matchedProduct.name.toLowerCase().includes('sneakers') ? 'sneakers' : matchedProduct.name}?`
        : ' Would you like to check out this item or place an order?';
      responseText = `Yes! We have the ${matchedProduct.name} available in stock for ${formatNaira(matchedProduct.price_ngn)}${colorStr}${sizeStr}.${promptText}`;
    } else if (/\b(fit|fit me|runs? (small|large)|oversized)\b/i.test(msg)) {
      intent = 'PRODUCT_RECOMMENDATION';
      responseText = `The ${matchedProduct.name} has a relaxed, oversized fit. Available sizes: ${matchedProduct.sizes.join(', ')}. If you prefer a standard fit, we recommend selecting your usual size or one size down!`;
    } else {
      intent = 'PRODUCT_INQUIRY';
      const colorStr = matchedProduct.colors.length > 0 ? ` (Color: ${matchedProduct.colors.join(', ')})` : '';
      const sizeStr = matchedProduct.sizes.length > 0 ? `, Sizes: ${formatListWithAnd(matchedProduct.sizes)}` : '';
      const activeProdName = state.activeDraft?.productId ? customCatalog.find(p => p.id === state.activeDraft.productId)?.name : undefined;
      const promptText = (isInfoOnDifferentProduct && activeProdName)
        ? ` Do you want to replace your current ${activeProdName} selection with the ${matchedProduct.name}?`
        : ' Would you like to check out this item or place an order?';
      responseText = `We have the ${matchedProduct.name} available in stock for ${formatNaira(matchedProduct.price_ngn)}${colorStr}${sizeStr}.${promptText}`;
    }
  } else {
    // 5. NO Catalog Product Match Found
    const itemPhrase = extractUnlistedItemPhrase(userMessageText);
    const availableListStr = customCatalog.map(p => `• ${p.name} (${formatNaira(p.price_ngn)})`).join('\n');
    if (msg.includes('how much') || msg.includes('price') || msg.includes('cost')) {
      intent = 'PRICE_INQUIRY';
      responseText = isPidgin
        ? `We no get ${itemPhrase} for our catalog right now o. See wetin we get available:\n${availableListStr}`
        : `Thanks for asking! We currently focus on fashion items, and I don't currently have any ${itemPhrase} listed in the catalog, so I can't provide a price for it. Here are the items we currently have available:\n${availableListStr}`;
    } else {
      intent = 'GENERAL_QUESTION';
      responseText = isPidgin
        ? `We no get ${itemPhrase} for our catalog right now o. See wetin we get available:\n${availableListStr}`
        : `We don't currently have ${itemPhrase} listed in our catalog. Here are the items we currently have available:\n${availableListStr}`;
    }
  }

  const updatedMessages: DemoMessage[] = [
    ...state.messages,
    { id: `msg_cust_${Date.now()}`, sender: 'customer', text: userMessageText, timestamp },
    { id: `msg_ai_${Date.now()}`, sender: 'ai', text: responseText, timestamp, intent },
  ];

  const targetProductForValidation = matchedProduct || (state.pendingProductId ? customCatalog.find((p) => p.id === state.pendingProductId) : undefined);
  const mentionedIds = [
    ...(state.recentlyMentionedProductIds || []),
    ...(matchedProduct ? [matchedProduct.id] : []),
    ...(newLastProductListIds || []),
  ];

  const isReadOnly = isReadOnlyIntent(intent) && !isExplicitProductSwitch(userMessageText);
  const activeProdExists = Boolean(state.activeDraft?.productId || state.pendingProductId);

  return {
    updatedState: {
      ...state,
      messages: updatedMessages,
      lastIntent: intent,
      activeDraft: (isReadOnly && activeProdExists) ? state.activeDraft : (state.activeDraft || createInitialActiveDraft()),
      pendingProductId: (isReadOnly && activeProdExists) ? state.pendingProductId : (newPendingProductId !== undefined ? newPendingProductId : state.pendingProductId),
      pendingPurchaseIntent: (isReadOnly && activeProdExists) ? state.pendingPurchaseIntent : (newPendingPurchaseIntent !== undefined ? newPendingPurchaseIntent : state.pendingPurchaseIntent),
      lastProductListIds: newLastProductListIds !== undefined ? newLastProductListIds : state.lastProductListIds,
      pendingSize: (isReadOnly && activeProdExists) ? state.pendingSize : ((requestedSize && (!targetProductForValidation || targetProductForValidation.sizes.includes(requestedSize))) ? requestedSize : state.pendingSize),
      pendingColor: (isReadOnly && activeProdExists) ? state.pendingColor : ((requestedColor && (!targetProductForValidation || targetProductForValidation.colors.map((c) => c.toLowerCase()).includes(requestedColor.toLowerCase()))) ? requestedColor : state.pendingColor),
      pendingLocation: (isReadOnly && activeProdExists) ? state.pendingLocation : (extractedLocation || state.pendingLocation),
      previousAssistantMessage: responseText,
      previousAssistantQuestion: responseText.includes('?') ? responseText : undefined,
      recentlyMentionedProductIds: Array.from(new Set(mentionedIds)),
    },
    responseText,
    intent,
  };
}
