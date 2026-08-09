import { z } from 'zod';

export const deliveryInfoSchema = z.object({
  fee_lagos: z.number().min(0, 'Fee cannot be negative'),
  fee_interstate: z.number().min(0, 'Fee cannot be negative'),
  policy: z.string().min(5, 'Delivery policy must be at least 5 characters'),
});

export const paymentInfoSchema = z.object({
  bank_name: z.string().min(2, 'Bank name is required'),
  account_number: z.string().min(10, 'Account number must be 10 digits').max(10),
  account_name: z.string().min(3, 'Account name is required'),
});

export const businessProfileSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  category: z.string().min(2, 'Category is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  phone_number: z.string().optional(),
  instagram_handle: z.string().optional(),
  whatsapp_number: z.string().optional(),
  delivery_info: deliveryInfoSchema,
  payment_info: paymentInfoSchema,
});

export const fashionAttributesSchema = z.object({
  sizes: z.array(z.string()).min(1, 'At least one size is required'),
  colors: z.array(z.string()).min(1, 'At least one color is required'),
  fabric: z.string().optional(),
  care_instructions: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  description: z.string().optional(),
  price_ngn: z.number().positive('Price must be greater than zero'),
  in_stock: z.boolean().default(true),
  category: z.string().min(2, 'Category is required'),
  image_url: z.string().url().optional().or(z.literal('')),
  attributes: fashionAttributesSchema,
});

export const faqSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters'),
  answer: z.string().min(5, 'Answer must be at least 5 characters'),
  category: z.string().default('general'),
});

export const aiSettingsSchema = z.object({
  assistant_name: z.string().min(2, 'Assistant name is required'),
  tone: z.enum(['friendly_professional', 'warm_nigerian_pinyin', 'formal']),
  greeting_message: z.string().min(5, 'Greeting message is required'),
  fallback_message: z.string().min(5, 'Fallback message is required'),
  auto_escalate_human: z.boolean().default(true),
});

export const customerSchema = z.object({
  name: z.string().nullable().optional(),
  channel: z.enum(['whatsapp', 'instagram', 'web_demo']),
  channel_user_id: z.string().min(1, 'Channel user ID is required'),
  phone_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const orderItemSchema = z.object({
  product_id: z.string().nullable().optional(),
  product_name: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  size: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

export const orderSchema = z.object({
  customer_id: z.string().uuid(),
  conversation_id: z.string().uuid().nullable().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  delivery_location: z.string().optional(),
  notes: z.string().optional(),
});
