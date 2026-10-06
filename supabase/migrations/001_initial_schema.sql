-- VendiAide AI: Database Schema Migration (Updated for Phase 3)
-- Includes all 15 multi-tenant tables, indexes, RLS policies, and onboarding RPC transaction.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  industry_type TEXT NOT NULL DEFAULT 'fashion',
  description TEXT,
  category TEXT NOT NULL,
  location TEXT,
  phone_number TEXT,
  instagram_handle TEXT,
  whatsapp_number TEXT,
  delivery_info JSONB DEFAULT '{"fee_lagos": 2500, "fee_interstate": 5000, "policy": "Delivery within 24-48 hours in Lagos, 3-5 days interstate."}'::jsonb,
  payment_info JSONB DEFAULT '{"bank_name": "", "account_number": "", "account_name": ""}'::jsonb,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);

-- 3. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'founding_10', -- 'founding_10' | 'starter' | 'growth'
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_business ON subscriptions(business_id);

-- 4. BUSINESS USAGE STATS TABLE
CREATE TABLE IF NOT EXISTS business_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  conversations_count INT DEFAULT 0,
  ai_tokens_used INT DEFAULT 0,
  orders_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_usage_stats_business_month ON business_usage_stats(business_id, month_year);

-- 5. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_ngn NUMERIC(12,2) NOT NULL,
  in_stock BOOLEAN DEFAULT TRUE,
  category TEXT,
  image_url TEXT,
  attributes JSONB DEFAULT '{"sizes":["M","L","XL"], "colors":["Black"]}'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_business_status ON products(business_id, status);

-- 6. FAQS TABLE
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_business ON faqs(business_id);

-- 7. AI SETTINGS TABLE
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  assistant_name TEXT DEFAULT 'Aisha',
  tone TEXT DEFAULT 'friendly_professional',
  greeting_message TEXT DEFAULT 'Welcome to our store! How can I help you choose your outfit today?',
  fallback_message TEXT DEFAULT 'Thanks for reaching out! Our sales team will get back to you shortly.',
  auto_escalate_human BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  channel_user_id TEXT NOT NULL,
  phone_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, channel, channel_user_id)
);

CREATE INDEX IF NOT EXISTS idx_customers_business_channel ON customers(business_id, channel, channel_user_id);

-- 9. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  last_intent TEXT,
  status TEXT DEFAULT 'ai_active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_business_status ON conversations(business_id, status, updated_at DESC);

-- 10. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  content TEXT NOT NULL,
  intent_detected TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);

-- 11. LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  product_interested TEXT,
  status TEXT DEFAULT 'NEW',
  source TEXT DEFAULT 'whatsapp',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_business_status ON leads(business_id, status, created_at DESC);

-- 12. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  delivery_location TEXT,
  payment_status TEXT DEFAULT 'UNPAID',
  order_status TEXT DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_business_status ON orders(business_id, order_status, created_at DESC);

-- 13. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  size TEXT,
  color TEXT,
  attributes_snapshot JSONB
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 14. FOLLOW-UPS TABLE
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_business_status ON follow_ups(business_id, status, scheduled_at ASC);

-- 15. AI INTERACTION LOGS TABLE
CREATE TABLE IF NOT EXISTS ai_interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  model TEXT DEFAULT 'gpt-4o-mini',
  prompt_version TEXT DEFAULT 'v1',
  context_version TEXT DEFAULT 'v1',
  intent_detected TEXT,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  latency_ms INT DEFAULT 0,
  safety_result TEXT DEFAULT 'PASSED',
  escalated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_business ON ai_interaction_logs(business_id, created_at DESC);

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION auth.current_business_id() RETURNS UUID AS $$
  SELECT id FROM businesses WHERE owner_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interaction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self_access ON users FOR ALL USING (id = auth.uid());
CREATE POLICY business_owner_access ON businesses FOR ALL USING (owner_id = auth.uid());
CREATE POLICY subscriptions_tenant_access ON subscriptions FOR ALL USING (business_id = auth.current_business_id());
CREATE POLICY usage_stats_tenant_access ON business_usage_stats FOR ALL USING (business_id = auth.current_business_id());
CREATE POLICY products_tenant_access ON products FOR ALL USING (business_id = auth.current_business_id());
CREATE POLICY faqs_tenant_access ON faqs FOR ALL USING (business_id = auth.current_business_id());
CREATE POLICY ai_settings_tenant_access ON ai_settings FOR ALL USING (business_id = auth.current_business_id());
CREATE POLICY customers_tenant_access ON customers FOR ALL USING (business_id = auth.current_business_id());
CREATE POLICY conversations_tenant_access ON conversations FOR ALL USING (business_id = auth.current_business_id());
CREATE POLICY messages_tenant_access ON messages FOR ALL USING (business_id = auth.current_business_id());
CREATE POLICY leads_tenant_access ON leads FOR ALL USING (business_id = auth.current_business_id());
CREATE POLICY orders_tenant_access ON orders FOR ALL USING (business_id = auth.current_business_id());
CREATE POLICY order_items_tenant_access ON order_items FOR ALL USING (
  order_id IN (SELECT id FROM orders WHERE business_id = auth.current_business_id())
);
CREATE POLICY follow_ups_tenant_access ON follow_ups FOR ALL USING (business_id = auth.current_business_id());
CREATE POLICY ai_logs_tenant_access ON ai_interaction_logs FOR ALL USING (business_id = auth.current_business_id());

--------------------------------------------------------------------------------
-- ATOMIC ONBOARDING TRANSACTION RPC
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION complete_business_onboarding(
  p_business_name TEXT,
  p_slug TEXT,
  p_category TEXT,
  p_whatsapp_number TEXT,
  p_location TEXT,
  p_delivery_info JSONB,
  p_payment_info JSONB,
  p_product_name TEXT,
  p_product_price NUMERIC,
  p_product_sizes JSONB,
  p_product_colors JSONB,
  p_product_in_stock BOOLEAN,
  p_assistant_name TEXT,
  p_assistant_tone TEXT,
  p_greeting_message TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_business_id UUID;
  v_product_id UUID;
  v_ai_settings_id UUID;
  v_sub_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated request';
  END IF;

  -- 1. Create or Update Business
  INSERT INTO businesses (
    owner_id, name, slug, industry_type, category, location, whatsapp_number, delivery_info, payment_info, onboarding_completed
  ) VALUES (
    v_user_id, p_business_name, p_slug, 'fashion', p_category, p_location, p_whatsapp_number, p_delivery_info, p_payment_info, TRUE
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    location = EXCLUDED.location,
    whatsapp_number = EXCLUDED.whatsapp_number,
    delivery_info = EXCLUDED.delivery_info,
    payment_info = EXCLUDED.payment_info,
    onboarding_completed = TRUE,
    updated_at = NOW()
  RETURNING id INTO v_business_id;

  -- 2. Create Initial Product
  INSERT INTO products (
    business_id, name, price_ngn, in_stock, category, attributes
  ) VALUES (
    v_business_id, p_product_name, p_product_price, p_product_in_stock, p_category,
    jsonb_build_object('sizes', p_product_sizes, 'colors', p_product_colors)
  ) RETURNING id INTO v_product_id;

  -- 3. Create AI Settings
  INSERT INTO ai_settings (
    business_id, assistant_name, tone, greeting_message
  ) VALUES (
    v_business_id, COALESCE(p_assistant_name, 'Aisha'), COALESCE(p_assistant_tone, 'friendly_professional'), COALESCE(p_greeting_message, 'Welcome to our store! How can I help you choose your outfit today?')
  )
  ON CONFLICT (business_id) DO UPDATE SET
    assistant_name = EXCLUDED.assistant_name,
    tone = EXCLUDED.tone,
    greeting_message = EXCLUDED.greeting_message,
    updated_at = NOW()
  RETURNING id INTO v_ai_settings_id;

  -- 4. Create Initial Subscription
  INSERT INTO subscriptions (
    business_id, plan, status
  ) VALUES (
    v_business_id, 'founding_10', 'active'
  )
  ON CONFLICT (business_id) DO NOTHING
  RETURNING id INTO v_sub_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'business_id', v_business_id,
    'product_id', v_product_id,
    'ai_settings_id', v_ai_settings_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
