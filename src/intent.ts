import { ParsedIntent } from './lib/engine/types';
import {
  normalizePricePhrases,
  extractSizeFromMessage,
  extractColorFromMessage,
  extractLocationFromMessage,
  isCatalogDiscoveryQueryText,
  PURCHASE_INTENT_PATTERNS,
} from './lib/demo/demo-engine';

/**
 * Audit Logger for sentence comprehension and intent fallthrough tracking.
 */
export function auditComprehensionLog(
  inputText: string,
  detectedIntent: string,
  reason: string = 'Fallback or generic handler triggered'
): void {
  console.warn(
    `[VendiAide Comprehension Audit] Input: "${inputText}" -> Detected Intent: ${detectedIntent} | Reason: ${reason}`
  );
}

/**
 * Robust sentence and language normalizer for informal Nigerian / Pidgin phrasing.
 */
export function normalizeSentenceAndPhrases(msg: string): string {
  let text = normalizePricePhrases(msg).trim();

  // Normalize informal Pidgin greetings & requests
  text = text
    .replace(/\b(?:howfar|hwfar|hw\s+far)\b/gi, 'how far')
    .replace(/\b(?:xup|wassup|whatsup|wgy)\b/gi, 'what is up')
    .replace(/\b(?:wetin\s+una\s+get|wetin\s+una\s+dey\s+sell|una\s+get\s+anything)\b/gi, 'show catalog')
    .replace(/\b(?:i\s+dey\s+look\s+for|i\s+wan\s+buy|i\s+wan\s+get)\b/gi, 'looking for')
    .replace(/\b(?:how\s+much\s+be|na\s+how\s+much|how\s+much\s+e\s+be)\b/gi, 'how much is');

  // Normalize sizing & color inquiries
  text = text
    .replace(/\b(?:you\s+get\s+am\s+for|una\s+get\s+am\s+for|e\s+dey\s+in)\b/gi, 'do you have in')
    .replace(/\b(?:does\s+it\s+come\s+in|is\s+there)\b/gi, 'do you have');

  // Normalize negotiations & price queries
  text = text
    .replace(/\b(?:last\s+price|reduce\s+am|discount\s+dey|cut\s+price)\b/gi, 'discount')
    .replace(/\b(?:how\s+much\s+to|how\s+much\s+for\s+delivery\s+to)\b/gi, 'delivery to');

  return text;
}

const GREETING_PATTERNS = [
  /^\s*h[ie][iy]?\s*[!?👋]*\s*$/i,
  /\b(hello|hey|hi there|hey there|howdy|yo|sup|wassup|whatsup|whatup|howfar|how\s+far|hwfar|hw\s+far|xup|wgy|yoo|heyyy|hola|salut|wagwan)\b/i,
  /\bgood\s+(morning|afternoon|evening|day|night)\b/i,
  /\bmorning\b/i,
  /\bhow are you\b/i,
  /\bhow'?s?\s+it\s+going\b/i,
  /\bwhat'?s?\s+up\b/i,
];

const COMPLIMENT_PATTERNS = [
  /\b(beautiful|lovely|amazing|gorgeous|stunning|fantastic|wonderful|excellent|great|nice|cute|perfect|incredible|dope|fire|clean|sweet|lit|banger|top tier|una\s+clothes\s+fine|collection\s+clean|mad\s+o)\b/i,
  /\b(i love|i like|i adore)\b/i,
  /\byour\s+(products?|collection|store|items?|clothes?|designs?|pieces?|fashion|catalog)\b/i,
];

const THANKS_PATTERNS = [
  /\b(thanks?|thank you|thx|thnx|ty|bless|god bless|appreciate|nagode|ese|oshe)\b/i,
  /\b(that'?s?\s+helpful|that\s+helps?|got it|understood|sounds?\s+good)\b/i,
];

const FAREWELL_PATTERNS = [
  /\b(bye|goodbye|good\s*bye|see\s+you|talk\s+(later|soon)|i'?ll\s+come\s+back|that'?s?\s+all|take\s+care|later)\b/i,
];

export function detectConversationalIntent(msg: string): ParsedIntent | undefined {
  if (FAREWELL_PATTERNS.some((r) => r.test(msg))) return 'FAREWELL';
  if (THANKS_PATTERNS.some((r) => r.test(msg))) return 'THANKS';
  if (GREETING_PATTERNS.some((r) => r.test(msg))) return 'GREETING';
  if (COMPLIMENT_PATTERNS.some((r) => r.test(msg))) return 'COMPLIMENT';
  return undefined;
}

export function detectIntentAndEntities(
  message: string,
  aiResponse: string
): {
  intent: ParsedIntent;
  extractedEntities?: {
    productName?: string;
    quantity?: number;
    size?: string;
    color?: string;
    deliveryLocation?: string;
  };
} {
  const normMessage = normalizeSentenceAndPhrases(message);
  const msg = normMessage.toLowerCase();
  const res = aiResponse.toLowerCase();

  let intent: ParsedIntent = 'GENERAL_QUESTION';

  if (msg.includes('speak to owner') || msg.includes('human') || msg.includes('agent') || msg.includes('call me') || res.includes('alerted our sales team')) {
    intent = 'HUMAN_ESCALATION';
  } else if (/\b(discount|reduce|cheaper price|best price|last price|promo|bargain|deal|cut price)\b/i.test(msg)) {
    intent = 'DISCOUNT_REQUEST';
  } else if (PURCHASE_INTENT_PATTERNS.some((p) => p.test(msg)) || msg.includes('send account')) {
    intent = 'PURCHASE_INTENT';
  } else if (
    isCatalogDiscoveryQueryText(msg) ||
    msg.includes('show catalog') ||
    msg.includes('what do you sell') ||
    msg.includes('wetin una get') ||
    msg.includes('what sizes') ||
    msg.includes('which sizes') ||
    msg.includes('available sizes') ||
    msg.includes('sizes available') ||
    msg.includes('what colors') ||
    msg.includes('what colours') ||
    msg.includes('which colors') ||
    msg.includes('which colours') ||
    msg.includes('available colors') ||
    msg.includes('available colours') ||
    (msg.includes('dresses') && !msg.includes('gucci'))
  ) {
    intent = 'CATALOG_INQUIRY';
  } else if (/\b(how much|price|cost|rate|fee|delivery to|how much for delivery)\b/i.test(msg)) {
    intent = 'PRICE_INQUIRY';
  } else if (msg.includes('available') || msg.includes('stock') || msg.includes('size') || msg.includes('colour') || msg.includes('color') || msg.includes('come in') || msg.includes('do u have') || msg.includes('do you have') || msg.includes('you get am for') || msg.includes('e dey in')) {
    intent = 'AVAILABILITY_INQUIRY';
  } else if (msg.includes('recommend') || msg.includes('suggest') || msg.includes('what should i wear')) {
    intent = 'PRODUCT_RECOMMENDATION';
  } else if (msg.includes('hoodie') || msg.includes('abaya') || msg.includes('sneaker') || msg.includes('dress') || msg.includes('bag')) {
    intent = 'PRODUCT_INQUIRY';
  } else {
    const conversational = detectConversationalIntent(msg);
    if (conversational) intent = conversational;
  }

  // Audit logging for fallthrough or unhandled input
  if (intent === 'GENERAL_QUESTION') {
    auditComprehensionLog(message, intent, 'Fell through to GENERAL_QUESTION fallback');
  }

  // Entity extraction
  let productName: string | undefined;
  if (msg.includes('hoodie')) productName = 'Black Oversized Hoodie';
  else if (msg.includes('abaya')) productName = 'Black Velvet Abaya';
  else if (msg.includes('sneaker') || msg.includes('shoe')) productName = 'White Premium Sneakers';

  let quantity = 1;
  const qtyMatch = msg.match(/\b(1|2|3|4|5|one|two|three|four|five)\b/i);
  if (qtyMatch) {
    const val = qtyMatch[0].toLowerCase();
    if (val === 'two' || val === '2') quantity = 2;
    else if (val === 'three' || val === '3') quantity = 3;
  }

  const size = extractSizeFromMessage(message, productName ? { category: productName.includes('Sneaker') ? 'Sneaker' : 'Clothing' } : null, res.includes('size'));
  const color = extractColorFromMessage(message);

  let deliveryLocation: string | undefined;
  const locRes = extractLocationFromMessage(message, res.includes('deliver') || res.includes('location') || res.includes('address') || res.includes('where'));
  if (locRes) {
    deliveryLocation = locRes.name;
  }

  return {
    intent,
    extractedEntities: {
      productName,
      quantity,
      size,
      color,
      deliveryLocation,
    },
  };
}
