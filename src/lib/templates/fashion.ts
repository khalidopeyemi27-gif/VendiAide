import { IndustryTemplate } from './types';
import { fashionAttributesSchema } from '../validations';
import { formatNaira } from '../utils/formatters';

export const FashionIndustryTemplate: IndustryTemplate = {
  id: 'fashion',
  name: 'Nigerian Fashion & Apparel',
  description: 'Tailored for Ready-to-Wear, Abaya/Hijab, Sneakers, Bags & Accessories, Thrift, and Custom Boutiques',
  defaultCategories: [
    'Ready-to-Wear',
    'Abaya & Hijab',
    'Sneakers & Footwear',
    'Bags & Accessories',
    'Thrift & Vintage',
    'Traditional & Asoebi',
  ],
  attributeSchema: fashionAttributesSchema,
  defaultFaqs: [
    {
      question: 'How long does delivery take?',
      answer: 'Delivery within Lagos takes 24-48 hours. Interstate delivery across Nigeria takes 3-5 working days.',
      category: 'delivery',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept direct bank transfers to our official business bank account. Account details will be provided at checkout.',
      category: 'payment',
    },
    {
      question: 'Can I exchange a item if the size does not fit?',
      answer: 'Exchanges are allowed within 48 hours of receipt if the item is unworn and tags remain intact.',
      category: 'returns',
    },
  ],
  promptSystemExtension: `
You are an expert sales assistant for a premier Nigerian fashion business.
Key fashion guidelines:
- Present clothing items with exact prices in Nigerian Naira (₦), available sizes, and colours.
- Always ask the customer for their preferred size (e.g. M, L, XL or shoe size 40-45) and colour choice when they express interest.
- Maintain a warm, polite, and helpful tone (combining professional clarity with respectful Nigerian warmth).
- When a customer decides to buy, collect their full name, delivery location (city/state in Nigeria), phone number, item, size, and colour choice.
`,
  intentRules: [
    {
      intent: 'PRODUCT_INQUIRY',
      keywords: ['dress', 'hoodie', 'abaya', 'sneaker', 'bag', 'outfit', 'picture', 'photo', 'fabric'],
      description: 'Customer is asking about specific fashion items or catalog options',
    },
    {
      intent: 'PRICE_INQUIRY',
      keywords: ['how much', 'price', 'cost', 'rate', 'amount', 'discount', 'last price'],
      description: 'Customer is asking about product pricing or delivery fees',
    },
    {
      intent: 'AVAILABILITY_INQUIRY',
      keywords: ['in stock', 'available', 'size', 'colour', 'color', 'have this', 'remain'],
      description: 'Customer is inquiring about stock availability or specific sizes/colors',
    },
    {
      intent: 'PURCHASE_INTENT',
      keywords: ['i want to buy', 'i will take it', 'send account', 'how do i order', 'order this', 'pay now'],
      description: 'Customer has expressed intent to buy an item',
    },
  ],
  formatItemSummary: (item: Record<string, unknown>): string => {
    const name = String(item.name || 'Fashion Item');
    const price = typeof item.price_ngn === 'number' ? formatNaira(item.price_ngn) : '₦0';
    const attrs = (item.attributes as { sizes?: string[]; colors?: string[] }) || {};
    const sizes = attrs.sizes ? `Sizes: ${attrs.sizes.join(', ')}` : '';
    const colors = attrs.colors ? `Colours: ${attrs.colors.join(', ')}` : '';
    return `${name} - ${price} | ${sizes} | ${colors}`.trim();
  },
};
