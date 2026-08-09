import {
  Business,
  Product,
  FAQ,
  AISettings,
  Customer,
  Conversation,
  Message,
  Lead,
  Order,
  Subscription,
  BusinessUsageStats,
  SUBSCRIPTION_CONVERSATION_LIMITS,
} from '../types/database';
import { getCurrentMonthYear } from '../utils/formatters';

export const DEMO_BUSINESS: Business = {
  id: 'demo-biz-1',
  owner_id: 'user-demo-1',
  name: 'VoguePulse Nigerian Fashion',
  slug: 'voguepulse-demo',
  industry_type: 'fashion',
  description: 'Premium Nigerian Ready-to-Wear, Abayas & Streetwear Accessories.',
  category: 'Ready-to-Wear',
  location: 'Ikeja, Lagos, Nigeria',
  phone_number: '+2348012345678',
  instagram_handle: '@voguepulse_ng',
  whatsapp_number: '+2348012345678',
  delivery_info: {
    fee_lagos: 2500,
    fee_interstate: 5000,
    policy: 'Standard delivery takes 24-48 hours in Lagos, and 3-5 working days across Nigeria.',
  },
  payment_info: {
    bank_name: 'Kuda Bank',
    account_number: '1234567890',
    account_name: 'VoguePulse Fashion NG',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_SUBSCRIPTION: Subscription = {
  id: 'sub-demo-1',
  business_id: 'demo-biz-1',
  plan: 'founding_10',
  status: 'active',
  started_at: new Date().toISOString(),
  expires_at: null,
  created_at: new Date().toISOString(),
};

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    business_id: 'demo-biz-1',
    name: 'Black Oversized Hoodie',
    description: 'Heavyweight 100% cotton street-style hoodie with ribbed cuffs.',
    price_ngn: 25000,
    in_stock: true,
    category: 'Ready-to-Wear',
    image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
    attributes: { sizes: ['M', 'L', 'XL'], colors: ['Black', 'Navy Blue'] },
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    business_id: 'demo-biz-1',
    name: 'Black Velvet Abaya',
    description: 'Luxurious embroidered black velvet abaya with matching Sheila headscarf.',
    price_ngn: 35000,
    in_stock: true,
    category: 'Abaya & Hijab',
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
    attributes: { sizes: ['M', 'L', 'XL'], colors: ['Black', 'Gold Trim'] },
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    business_id: 'demo-biz-1',
    name: 'White Premium Sneakers',
    description: 'Clean minimalist leather sneakers suitable for casual & streetwear outfits.',
    price_ngn: 45000,
    in_stock: true,
    category: 'Sneakers & Footwear',
    image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
    attributes: { sizes: ['40', '41', '42', '43', '44', '45'], colors: ['White', 'White/Black Accent'] },
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEMO_FAQS: FAQ[] = [
  {
    id: 'faq-1',
    business_id: 'demo-biz-1',
    question: 'How do I pay for my order?',
    answer: 'We accept direct bank transfers to Kuda Bank: Account Number 1234567890 (Account Name: VoguePulse Fashion NG). Please send receipt after transfer!',
    category: 'payment',
    created_at: new Date().toISOString(),
  },
  {
    id: 'faq-2',
    business_id: 'demo-biz-1',
    question: 'What are your delivery fees?',
    answer: 'Delivery within Lagos is ₦2,500. Delivery to other Nigerian states is ₦5,000.',
    category: 'delivery',
    created_at: new Date().toISOString(),
  },
];

export const DEMO_AI_SETTINGS: AISettings = {
  id: 'ai-set-1',
  business_id: 'demo-biz-1',
  assistant_name: 'VoguePulse Sales Bot',
  tone: 'friendly_professional',
  greeting_message: 'Welcome to VoguePulse Fashion! How can I help you choose your outfit today?',
  fallback_message: 'Thanks for reaching out! Our team will connect with you shortly on WhatsApp.',
  auto_escalate_human: true,
  updated_at: new Date().toISOString(),
};

class MockStore {
  private businesses: Map<string, Business> = new Map([['demo-biz-1', DEMO_BUSINESS]]);
  private subscriptions: Map<string, Subscription> = new Map([['demo-biz-1', DEMO_SUBSCRIPTION]]);
  private usageStats: Map<string, BusinessUsageStats> = new Map();
  private products: Map<string, Product[]> = new Map([['demo-biz-1', [...DEMO_PRODUCTS]]]);
  private faqs: Map<string, FAQ[]> = new Map([['demo-biz-1', [...DEMO_FAQS]]]);
  private aiSettings: Map<string, AISettings> = new Map([['demo-biz-1', DEMO_AI_SETTINGS]]);
  private customers: Map<string, Customer[]> = new Map();
  private conversations: Map<string, Conversation[]> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private leads: Map<string, Lead[]> = new Map();
  private orders: Map<string, Order[]> = new Map();

  getBusiness(businessId: string): Business | undefined {
    return this.businesses.get(businessId) || DEMO_BUSINESS;
  }

  getSubscription(businessId: string): Subscription {
    return this.subscriptions.get(businessId) || DEMO_SUBSCRIPTION;
  }

  getUsageStats(businessId: string): BusinessUsageStats {
    const monthYear = getCurrentMonthYear();
    const key = `${businessId}_${monthYear}`;
    if (!this.usageStats.has(key)) {
      this.usageStats.set(key, {
        id: `usage-${Date.now()}`,
        business_id: businessId,
        month_year: monthYear,
        conversations_count: 0,
        ai_tokens_used: 0,
        orders_count: 0,
        updated_at: new Date().toISOString(),
      });
    }
    return this.usageStats.get(key)!;
  }

  incrementUsage(businessId: string, tokensUsed: number): { allowed: boolean; currentCount: number; limit: number } {
    const sub = this.getSubscription(businessId);
    const limit = SUBSCRIPTION_CONVERSATION_LIMITS[sub.plan] || 500;
    const stats = this.getUsageStats(businessId);

    if (stats.conversations_count >= limit) {
      return { allowed: false, currentCount: stats.conversations_count, limit };
    }

    stats.conversations_count += 1;
    stats.ai_tokens_used += tokensUsed;
    stats.updated_at = new Date().toISOString();

    return { allowed: true, currentCount: stats.conversations_count, limit };
  }

  getProducts(businessId: string): Product[] {
    return this.products.get(businessId) || DEMO_PRODUCTS;
  }

  getFaqs(businessId: string): FAQ[] {
    return this.faqs.get(businessId) || DEMO_FAQS;
  }

  getAISettings(businessId: string): AISettings {
    return this.aiSettings.get(businessId) || DEMO_AI_SETTINGS;
  }

  getCustomers(businessId: string): Customer[] {
    return this.customers.get(businessId) || [];
  }

  getConversations(businessId: string): Conversation[] {
    return this.conversations.get(businessId) || [];
  }

  getLeads(businessId: string): Lead[] {
    return this.leads.get(businessId) || [];
  }

  getOrders(businessId: string): Order[] {
    return this.orders.get(businessId) || [];
  }

  saveCustomer(customer: Customer): Customer {
    const list = this.customers.get(customer.business_id) || [];
    const idx = list.findIndex((c) => c.channel_user_id === customer.channel_user_id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...customer };
    } else {
      list.push(customer);
    }
    this.customers.set(customer.business_id, list);
    return customer;
  }

  saveConversation(conv: Conversation): Conversation {
    const list = this.conversations.get(conv.business_id) || [];
    const idx = list.findIndex((c) => c.id === conv.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...conv };
    } else {
      list.push(conv);
    }
    this.conversations.set(conv.business_id, list);
    return conv;
  }

  saveMessage(msg: Message): Message {
    const list = this.messages.get(msg.conversation_id) || [];
    list.push(msg);
    this.messages.set(msg.conversation_id, list);
    return msg;
  }

  saveLead(lead: Lead): Lead {
    const list = this.leads.get(lead.business_id) || [];
    const idx = list.findIndex((l) => l.id === lead.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...lead };
    } else {
      list.push(lead);
    }
    this.leads.set(lead.business_id, list);
    return lead;
  }

  saveOrder(order: Order): Order {
    const list = this.orders.get(order.business_id) || [];
    const idx = list.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...order };
    } else {
      list.push(order);
    }
    this.orders.set(order.business_id, list);
    return order;
  }
}

export const mockStore = new MockStore();
