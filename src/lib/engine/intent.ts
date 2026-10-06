import { ParsedIntent } from './types';
import {
  normalizePricePhrases,
  extractSizeFromMessage,
  extractColorFromMessage,
  extractLocationFromMessage,
  isCatalogDiscoveryQueryText,
  PURCHASE_INTENT_PATTERNS,
} from '../demo/demo-engine';

// ---------------------------------------------------------------------------
// Conversational intent detection (lowest priority — yields to all commercial intents)
// ---------------------------------------------------------------------------

const GREETING_PATTERNS = [
  /^\s*h[ie][iy]?\s*[!?👋]*\s*$/i,
  /\b(hello|hey|hi there|hey there|howdy|yo|sup|wassup|whatsup|whatup|howfar|how\s+far|xup|wgy|yoo|heyyy|hola|salut|wagwan)\b/i,
  /\bgood\s+(morning|afternoon|evening|day|night)\b/i,
  /\bmorning\b/i,
  /\bhow are you\b/i,
  /\bhow'?s?\s+it\s+going\b/i,
  /\bwhat'?s?\s+up\b/i,
];

const COMPLIMENT_PATTERNS = [
  /\b(beautiful|lovely|amazing|gorgeous|stunning|fantastic|wonderful|excellent|great|nice|cute|perfect|incredible|dope|fire|clean|sweet|lit|banger|top tier)\b/i,
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

/**
 * Detects a pure conversational intent.
 * Returns undefined when the message contains any commercial signal.
 * Priority order: FAREWELL > THANKS > GREETING > COMPLIMENT
 */
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
  const msg = normalizePricePhrases(message);
  const res = aiResponse.toLowerCase();

  let intent: ParsedIntent = 'GENERAL_QUESTION';

  if (msg.includes('speak to owner') || msg.includes('human') || msg.includes('agent') || msg.includes('call me') || res.includes("alerted our sales team")) {
    intent = 'HUMAN_ESCALATION';
  } else if (PURCHASE_INTENT_PATTERNS.some((p) => p.test(msg)) || msg.includes('send account')) {
    intent = 'PURCHASE_INTENT';
  } else if (
    isCatalogDiscoveryQueryText(msg) ||
    msg.includes('show catalog') ||
    msg.includes('what do you sell') ||
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
  } else if (msg.includes('price') || msg.includes('how much') || msg.includes('cost') || msg.includes('rate')) {
    intent = 'PRICE_INQUIRY';
  } else if (msg.includes('available') || msg.includes('stock') || msg.includes('size') || msg.includes('colour') || msg.includes('color') || msg.includes('come in') || msg.includes('do u have') || msg.includes('do you have')) {
    intent = 'AVAILABILITY_INQUIRY';
  } else if (msg.includes('recommend') || msg.includes('suggest') || msg.includes('what should i wear')) {
    intent = 'PRODUCT_RECOMMENDATION';
  } else if (msg.includes('hoodie') || msg.includes('abaya') || msg.includes('sneaker') || msg.includes('dress') || msg.includes('bag')) {
    intent = 'PRODUCT_INQUIRY';
  } else {
    // Lowest priority: conversational intents — only reached when no commercial intent matched
    const conversational = detectConversationalIntent(msg);
    if (conversational) intent = conversational;
  }

  // Entity extraction
  let productName: string | undefined;
  if (msg.includes('hoodie')) productName = 'Black Oversized Hoodie';
  else if (msg.includes('abaya')) productName = 'Black Velvet Abaya';
  else if (msg.includes('sneaker') || msg.includes('shoe')) productName = 'White Premium Sneakers';
  else if (msg.includes('handbag') || (msg.includes('bag') && !msg.includes('abaya'))) productName = 'Leather Handbag';
  else if (msg.includes('hijab')) productName = 'One-Size Chiffon Hijab';

  let quantity = 1;
  const qtyMatch = msg.match(/\b(1|2|3|4|5|one|two|three|four|five)\b/i);
  if (qtyMatch) {
    const val = qtyMatch[0].toLowerCase();
    if (val === 'two' || val === '2') quantity = 2;
    else if (val === 'three' || val === '3') quantity = 3;
    else if (val === 'four' || val === '4') quantity = 4;
    else if (val === 'five' || val === '5') quantity = 5;
  }

  const size = extractSizeFromMessage(message, productName ? { category: productName.includes('Sneaker') ? 'Sneaker' : 'Clothing' } : null, res.includes('size') || res.includes('what size') || res.includes('preferred size'));

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
