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
  OrderItem,
  FollowUp,
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
    bank_name: 'Secure Bank Partner',
    account_number: '0000000000',
    account_name: 'VoguePulse Merchant',
  },
  onboarding_completed: true,
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
  {
    id: 'prod-4',
    business_id: 'demo-biz-1',
    name: 'Leather Handbag',
    description: 'Structure genuine leather shoulder handbag with gold zipper accents.',
    price_ngn: 28000,
    in_stock: true,
    category: 'Bags & Accessories',
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
    attributes: { sizes: [], colors: ['Black', 'Brown'] },
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    business_id: 'demo-biz-1',
    name: 'One-Size Chiffon Hijab',
    description: 'Lightweight breathable chiffon hijab wrap suitable for all occasions.',
    price_ngn: 8000,
    in_stock: true,
    category: 'Abaya & Hijab',
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
    attributes: { sizes: [], colors: [] },
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
    answer: 'Official payment details and bank transfer instructions are provided during order checkout. Send your transfer receipt to confirm your order!',
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

// Initial Seed Data for Phase 7 Dashboard CRM
export const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    business_id: 'demo-biz-1',
    name: 'Bisi Adebayo',
    channel: 'whatsapp',
    channel_user_id: '2348031234567',
    phone_number: '+2348031234567',
    notes: 'VIP Customer interested in Abayas',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'cust-2',
    business_id: 'demo-biz-1',
    name: 'Chioma Eze',
    channel: 'web_demo',
    channel_user_id: 'web_demo_882',
    phone_number: '+2348029876543',
    notes: 'Inquired about size 42 sneakers',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'cust-3',
    business_id: 'demo-biz-1',
    name: 'Amina Bello',
    channel: 'instagram',
    channel_user_id: '@amina_bello',
    phone_number: '+2348051112223',
    notes: 'Instagram DM inquiry for Hoodies',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    business_id: 'demo-biz-1',
    customer_id: 'cust-1',
    channel: 'whatsapp',
    last_intent: 'PURCHASE_INTENT',
    status: 'ai_active',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'conv-2',
    business_id: 'demo-biz-1',
    customer_id: 'cust-2',
    channel: 'web_demo',
    last_intent: 'HUMAN_ESCALATION',
    status: 'human_takeover',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

export const DEMO_MESSAGES: Map<string, Message[]> = new Map([
  [
    'conv-1',
    [
      {
        id: 'msg-1-1',
        conversation_id: 'conv-1',
        business_id: 'demo-biz-1',
        sender_type: 'customer',
        content: 'Hi, do you have the Black Velvet Abaya in size L?',
        intent_detected: 'AVAILABILITY_INQUIRY',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'msg-1-2',
        conversation_id: 'conv-1',
        business_id: 'demo-biz-1',
        sender_type: 'ai',
        content: 'Yes! The Black Velvet Abaya is in stock for ₦35,000 in sizes M, L, and XL.',
        intent_detected: 'AVAILABILITY_INQUIRY',
        created_at: new Date(Date.now() - 3600000 * 4.9).toISOString(),
      },
      {
        id: 'msg-1-3',
        conversation_id: 'conv-1',
        business_id: 'demo-biz-1',
        sender_type: 'customer',
        content: 'I want to buy size L. Delivery is to Ikeja, Lagos.',
        intent_detected: 'PURCHASE_INTENT',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'msg-1-4',
        conversation_id: 'conv-1',
        business_id: 'demo-biz-1',
        sender_type: 'ai',
        content: 'Awesome! Your order for the Black Velvet Abaya (Size L) at ₦37,500 (including ₦2,500 Lagos shipping) has been logged. The vendor will share official payment instructions on WhatsApp!',
        intent_detected: 'PURCHASE_INTENT',
        created_at: new Date(Date.now() - 3600000 * 3.9).toISOString(),
      },
    ],
  ],
  [
    'conv-2',
    [
      {
        id: 'msg-2-1',
        conversation_id: 'conv-2',
        business_id: 'demo-biz-1',
        sender_type: 'customer',
        content: 'Do you have size 42 of the White Premium Sneakers?',
        intent_detected: 'AVAILABILITY_INQUIRY',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'msg-2-2',
        conversation_id: 'conv-2',
        business_id: 'demo-biz-1',
        sender_type: 'ai',
        content: 'Yes! Size 42 of the White Premium Sneakers is available in stock for ₦45,000. Would you like to place an order for delivery?',
        intent_detected: 'AVAILABILITY_INQUIRY',
        created_at: new Date(Date.now() - 3600000 * 1.9).toISOString(),
      },
      {
        id: 'msg-2-3',
        conversation_id: 'conv-2',
        business_id: 'demo-biz-1',
        sender_type: 'customer',
        content: 'Can I speak to the human owner of this shop right now?',
        intent_detected: 'HUMAN_ESCALATION',
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
      {
        id: 'msg-2-4',
        conversation_id: 'conv-2',
        business_id: 'demo-biz-1',
        sender_type: 'ai',
        content: 'Thanks for reaching out! I have alerted the vendor team at VoguePulse. A human representative will take over this conversation shortly.',
        intent_detected: 'HUMAN_ESCALATION',
        created_at: new Date(Date.now() - 3600000 * 0.9).toISOString(),
      },
    ],
  ],
]);

export const DEMO_LEADS: Lead[] = [
  {
    id: 'lead-1',
    business_id: 'demo-biz-1',
    customer_id: 'cust-1',
    conversation_id: 'conv-1',
    product_interested: 'Black Velvet Abaya',
    status: 'ORDER_PENDING',
    source: 'whatsapp',
    notes: 'Size L, Color Black',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'lead-2',
    business_id: 'demo-biz-1',
    customer_id: 'cust-2',
    conversation_id: 'conv-2',
    product_interested: 'White Premium Sneakers',
    status: 'INTERESTED',
    source: 'web_demo',
    notes: 'Checked size 42 stock',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'lead-3',
    business_id: 'demo-biz-1',
    customer_id: 'cust-3',
    conversation_id: null,
    product_interested: 'Black Oversized Hoodie',
    status: 'NEW',
    source: 'instagram',
    notes: 'Inquired on Instagram DM about XL',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export const DEMO_ORDERS: Order[] = [
  {
    id: 'ord-1',
    business_id: 'demo-biz-1',
    customer_id: 'cust-1',
    conversation_id: 'conv-1',
    total_amount: 37500,
    delivery_location: 'Ikeja, Lagos',
    payment_status: 'UNPAID',
    order_status: 'PENDING',
    notes: 'Item: Black Velvet Abaya, Size: L, Color: Black',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

export const DEMO_ORDER_ITEMS: OrderItem[] = [
  {
    id: 'item-1',
    order_id: 'ord-1',
    product_id: 'prod-2',
    product_name: 'Black Velvet Abaya',
    quantity: 1,
    unit_price: 35000,
    size: 'L',
    color: 'Black',
    attributes_snapshot: { size: 'L', color: 'Black' },
  },
];

export const DEMO_FOLLOW_UPS: FollowUp[] = [
  {
    id: 'followup-1',
    business_id: 'demo-biz-1',
    customer_id: 'cust-2',
    conversation_id: 'conv-2',
    reason: 'Confirm size 42 sneaker stock and send payment details',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    status: 'PENDING',
    created_at: new Date().toISOString(),
  },
  {
    id: 'followup-2',
    business_id: 'demo-biz-1',
    customer_id: 'cust-1',
    conversation_id: 'conv-1',
    reason: 'Check bank transfer receipt for Abaya order',
    scheduled_at: new Date(Date.now() + 3600000 * 4).toISOString(),
    status: 'PENDING',
    created_at: new Date().toISOString(),
  },
];

class MockStore {
  private businesses: Map<string, Business> = new Map([['demo-biz-1', DEMO_BUSINESS]]);
  private subscriptions: Map<string, Subscription> = new Map([['demo-biz-1', DEMO_SUBSCRIPTION]]);
  private usageStats: Map<string, BusinessUsageStats> = new Map();
  private products: Map<string, Product[]> = new Map([['demo-biz-1', [...DEMO_PRODUCTS]]]);
  private faqs: Map<string, FAQ[]> = new Map([['demo-biz-1', [...DEMO_FAQS]]]);
  private aiSettings: Map<string, AISettings> = new Map([['demo-biz-1', DEMO_AI_SETTINGS]]);
  private customers: Map<string, Customer[]> = new Map([['demo-biz-1', [...DEMO_CUSTOMERS]]]);
  private conversations: Map<string, Conversation[]> = new Map([['demo-biz-1', [...DEMO_CONVERSATIONS]]]);
  private messages: Map<string, Message[]> = DEMO_MESSAGES;
  private leads: Map<string, Lead[]> = new Map([['demo-biz-1', [...DEMO_LEADS]]]);
  private orders: Map<string, Order[]> = new Map([['demo-biz-1', [...DEMO_ORDERS]]]);
  private orderItems: Map<string, OrderItem[]> = new Map([['ord-1', [...DEMO_ORDER_ITEMS]]]);
  private followUps: Map<string, FollowUp[]> = new Map([['demo-biz-1', [...DEMO_FOLLOW_UPS]]]);

  getBusiness(businessId: string): Business | undefined {
    return this.businesses.get(businessId) || DEMO_BUSINESS;
  }

  saveBusiness(business: Business): Business {
    this.businesses.set(business.id, business);
    return business;
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
        conversations_count: 124, // Realistic seed for demo-biz-1
        ai_tokens_used: 48500,
        orders_count: 1,
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
    const prods = this.products.get(businessId);
    if (prods) return prods;
    if (businessId === DEMO_BUSINESS.id) return DEMO_PRODUCTS;
    return [];
  }

  getFaqs(businessId: string): FAQ[] {
    const faqs = this.faqs.get(businessId);
    if (faqs) return faqs;
    if (businessId === DEMO_BUSINESS.id) return DEMO_FAQS;
    return [];
  }

  getAISettings(businessId: string): AISettings {
    return this.aiSettings.get(businessId) || { ...DEMO_AI_SETTINGS, business_id: businessId };
  }

  saveAISettings(settings: AISettings): AISettings {
    this.aiSettings.set(settings.business_id, settings);
    return settings;
  }

  getCustomers(businessId: string): Customer[] {
    return this.customers.get(businessId) || [];
  }

  getConversations(businessId: string): Conversation[] {
    return this.conversations.get(businessId) || [];
  }

  getMessages(conversationId: string): Message[] {
    return this.messages.get(conversationId) || [];
  }

  getLeads(businessId: string): Lead[] {
    return this.leads.get(businessId) || [];
  }

  getOrders(businessId: string): Order[] {
    return this.orders.get(businessId) || [];
  }

  getOrderItems(orderId: string): OrderItem[] {
    return this.orderItems.get(orderId) || [];
  }

  getFollowUps(businessId: string): FollowUp[] {
    return this.followUps.get(businessId) || [];
  }

  saveProduct(product: Product): Product {
    const list = this.products.get(product.business_id) || [];
    const idx = list.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...product };
    } else {
      list.unshift(product);
    }
    this.products.set(product.business_id, list);
    return product;
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
      list.unshift(lead);
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
      list.unshift(order);
    }
    this.orders.set(order.business_id, list);
    return order;
  }

  saveOrderItem(item: OrderItem): OrderItem {
    const list = this.orderItems.get(item.order_id) || [];
    list.push(item);
    this.orderItems.set(item.order_id, list);
    return item;
  }

  saveFollowUp(followUp: FollowUp): FollowUp {
    const list = this.followUps.get(followUp.business_id) || [];
    const idx = list.findIndex((f) => f.id === followUp.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...followUp };
    } else {
      list.unshift(followUp);
    }
    this.followUps.set(followUp.business_id, list);
    return followUp;
  }
}

export const mockStore = new MockStore();
