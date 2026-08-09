import { ParsedIntent } from './types';

export function detectIntentAndEntities(
  message: string,
  aiResponse: string
): {
  intent: ParsedIntent;
  extractedEntities?: {
    productName?: string;
    size?: string;
    color?: string;
    deliveryLocation?: string;
  };
} {
  const msg = message.toLowerCase();
  const res = aiResponse.toLowerCase();

  let intent: ParsedIntent = 'GENERAL_QUESTION';

  if (msg.includes('buy') || msg.includes('order') || msg.includes('pay') || msg.includes('take it') || msg.includes('send account')) {
    intent = 'PURCHASE_INTENT';
  } else if (msg.includes('price') || msg.includes('how much') || msg.includes('cost') || msg.includes('rate')) {
    intent = 'PRICE_INQUIRY';
  } else if (msg.includes('available') || msg.includes('stock') || msg.includes('size') || msg.includes('colour') || msg.includes('color')) {
    intent = 'AVAILABILITY_INQUIRY';
  } else if (msg.includes('hoodie') || msg.includes('abaya') || msg.includes('sneaker') || msg.includes('dress') || msg.includes('bag')) {
    intent = 'PRODUCT_INQUIRY';
  } else if (msg.includes('speak to owner') || msg.includes('human') || msg.includes('call me') || res.includes("alerted our sales team")) {
    intent = 'HUMAN_ESCALATION';
  }

  // Simple entity extraction logic
  let productName: string | undefined;
  if (msg.includes('hoodie')) productName = 'Black Oversized Hoodie';
  else if (msg.includes('abaya')) productName = 'Black Velvet Abaya';
  else if (msg.includes('sneaker') || msg.includes('shoe')) productName = 'White Premium Sneakers';

  let size: string | undefined;
  const sizeMatch = msg.match(/\b(small|medium|large|s|m|l|xl|xxl|38|39|40|41|42|43|44|45)\b/i);
  if (sizeMatch) size = sizeMatch[0].toUpperCase();

  let color: string | undefined;
  if (msg.includes('black')) color = 'Black';
  else if (msg.includes('white')) color = 'White';
  else if (msg.includes('gold')) color = 'Gold';

  return {
    intent,
    extractedEntities: {
      productName,
      size,
      color,
    },
  };
}
