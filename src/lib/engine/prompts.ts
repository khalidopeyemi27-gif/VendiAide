import { GroundedContext } from './types';
import { getTemplate } from '../templates';
import { GROUNDED_SAFETY_INSTRUCTIONS } from './safety';
import { formatNaira } from '../utils/formatters';

export function buildSystemPrompt(context: GroundedContext): string {
  const { business, products, faqs, aiSettings } = context;
  const template = getTemplate(business.industry_type);

  const productCatalogText = products
    .map((p) => {
      const attrs = p.attributes as { sizes?: string[]; colors?: string[] };
      const sizesStr = attrs?.sizes ? `Sizes: [${attrs.sizes.join(', ')}]` : '';
      const colorsStr = attrs?.colors ? `Colours: [${attrs.colors.join(', ')}]` : '';
      const stockStr = p.in_stock ? 'In Stock' : 'Out of Stock';
      return `- Product ID: ${p.id} | Name: ${p.name} | Price: ${formatNaira(p.price_ngn)} | Category: ${p.category} | ${sizesStr} | ${colorsStr} | Status: ${stockStr} | Description: ${p.description || 'N/A'}`;
    })
    .join('\n');

  const faqsText = faqs.map((f) => `- Q: ${f.question} | A: ${f.answer}`).join('\n');

  const deliveryText = business.delivery_info
    ? `Lagos Delivery: ${formatNaira(business.delivery_info.fee_lagos)} | Interstate Delivery: ${formatNaira(business.delivery_info.fee_interstate)} | Policy: ${business.delivery_info.policy}`
    : 'Contact vendor for delivery rates.';

  const paymentText = business.payment_info
    ? `Bank: ${business.payment_info.bank_name} | Account Number: ${business.payment_info.account_number} | Account Name: ${business.payment_info.account_name}`
    : 'Contact vendor for bank account details.';

  return `
You are "${aiSettings.assistant_name}", an AI sales assistant for "${business.name}" (${business.category}).
Assistant Tone: ${aiSettings.tone}

${GROUNDED_SAFETY_INSTRUCTIONS}

${template.promptSystemExtension}

=== VERIFIED GROUNDED BUSINESS CONTEXT ===
Business Name: ${business.name}
Location: ${business.location || 'Nigeria'}
WhatsApp Contact: ${business.whatsapp_number || 'N/A'}

=== PRODUCT CATALOG ===
${productCatalogText || 'No active products loaded.'}

=== DELIVERY INFORMATION ===
${deliveryText}

=== PAYMENT INFORMATION ===
${paymentText}

=== BUSINESS FAQS ===
${faqsText || 'No custom FAQs loaded.'}
==========================================

When responding:
1. Always be polite, helpful, and concise.
2. If customer shows purchase intent, request their Name, Delivery Location, preferred Item, Size, and Colour.
3. Keep response under 150 words.
`;
}
