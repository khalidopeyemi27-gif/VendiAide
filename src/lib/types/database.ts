// Database Entity Types for VendorPulse AI (Multi-Tenant Architecture)

export type IndustryType = 'fashion' | 'restaurant' | 'real_estate';
export type ChannelType = 'whatsapp' | 'instagram' | 'web_demo';
export type SubscriptionPlan = 'founding_10' | 'starter' | 'growth';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'ORDER_PENDING' | 'CONVERTED' | 'LOST';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'REFUNDED';
export type SenderType = 'customer' | 'ai' | 'vendor';
export type ConversationStatus = 'ai_active' | 'human_takeover' | 'resolved';
export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface DeliveryInfo {
  fee_lagos: number;
  fee_interstate: number;
  policy: string;
}

export interface PaymentInfo {
  bank_name: string;
  account_number: string;
  account_name: string;
}

export interface FashionAttributes {
  sizes: string[];
  colors: string[];
  fabric?: string;
  care_instructions?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  industry_type: IndustryType;
  description: string | null;
  category: string;
  location: string | null;
  phone_number: string | null;
  instagram_handle: string | null;
  whatsapp_number: string | null;
  delivery_info: DeliveryInfo;
  payment_info: PaymentInfo;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  created_at: string;
}

export interface BusinessUsageStats {
  id: string;
  business_id: string;
  month_year: string; // 'YYYY-MM'
  conversations_count: number;
  ai_tokens_used: number;
  orders_count: number;
  updated_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price_ngn: number;
  in_stock: boolean;
  category: string | null;
  image_url: string | null;
  attributes: FashionAttributes;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  business_id: string;
  question: string;
  answer: string;
  category: string;
  created_at: string;
}

export interface AISettings {
  id: string;
  business_id: string;
  assistant_name: string;
  tone: 'friendly_professional' | 'warm_nigerian_pinyin' | 'formal';
  greeting_message: string;
  fallback_message: string;
  auto_escalate_human: boolean;
  updated_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string | null;
  channel: ChannelType;
  channel_user_id: string;
  phone_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  business_id: string;
  customer_id: string;
  channel: ChannelType;
  last_intent: string | null;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  business_id: string;
  sender_type: SenderType;
  content: string;
  intent_detected: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  business_id: string;
  customer_id: string;
  conversation_id: string | null;
  product_interested: string | null;
  status: LeadStatus;
  source: ChannelType;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  business_id: string;
  customer_id: string;
  conversation_id: string | null;
  total_amount: number;
  delivery_location: string | null;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  size: string | null;
  color: string | null;
  attributes_snapshot: Record<string, unknown> | null;
}

export interface FollowUp {
  id: string;
  business_id: string;
  customer_id: string;
  conversation_id: string | null;
  reason: string;
  scheduled_at: string;
  status: FollowUpStatus;
  created_at: string;
}

export interface AIInteractionLog {
  id: string;
  business_id: string;
  conversation_id: string | null;
  model: string;
  prompt_version: string;
  context_version: string;
  intent_detected: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  safety_result: string;
  escalated: boolean;
  created_at: string;
}

// Subscription Limits Configuration
export const SUBSCRIPTION_CONVERSATION_LIMITS: Record<SubscriptionPlan, number> = {
  founding_10: 500, // Founding 10 cohort gets Starter limit initially
  starter: 500,
  growth: 2000,
};
