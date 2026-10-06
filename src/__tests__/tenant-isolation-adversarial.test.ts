import { mockStore } from '../lib/db/mock-store';
import { Product, Order, Lead, Conversation } from '../lib/types/database';

export async function runTenantIsolationAdversarialTestSuite() {
  console.log('🧪 Starting VendiAide Tenant Isolation & Cross-Tenant Security Adversarial Test Suite...\n');

  let passed = 0;
  let total = 0;

  function runTest(name: string, fn: () => void) {
    total++;
    try {
      fn();
      passed++;
      console.log(`✅ [Test ${total}] ${name} PASSED`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [Test ${total}] ${name} FAILED: ${errMsg}`);
      throw err;
    }
  }

  // Set up mock data for 2 distinct tenants
  const tenantA = 'tenant_a_kulture';
  const tenantB = 'tenant_b_luxe';

  const productA: Product = {
    id: 'prod_a_1',
    business_id: tenantA,
    name: 'Tenant A Hoodie',
    description: 'Black hoodie',
    price_ngn: 25000,
    in_stock: true,
    category: 'Hoodies',
    image_url: null,
    attributes: { sizes: ['M', 'L'], colors: ['Black'] },
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const productB: Product = {
    id: 'prod_b_1',
    business_id: tenantB,
    name: 'Tenant B Silk Dress',
    description: 'Gold dress',
    price_ngn: 80000,
    in_stock: true,
    category: 'Dresses',
    image_url: null,
    attributes: { sizes: ['S', 'M'], colors: ['Gold'] },
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockStore.saveProduct(productA);
  mockStore.saveProduct(productB);

  // 1. Product Catalog Tenant Isolation
  runTest('Tenant A cannot inspect or retrieve Tenant B products', () => {
    const tenantAProducts = mockStore.getProducts(tenantA);

    const hasCrossAccess = tenantAProducts.some((p) => p.name.includes('Tenant B'));
    if (hasCrossAccess) {
      throw new Error('SECURITY VIOLATION: Tenant A accessed Tenant B product catalog!');
    }

    if (tenantAProducts.length === 0) {
      throw new Error('Expected products registered for tenant A');
    }
  });

  // 2. Order Record Tenant Isolation
  runTest('Tenant A cannot view or manipulate Tenant B order records', () => {
    const orderB: Order = {
      id: 'ord_b_123',
      business_id: tenantB,
      customer_id: 'cust_b_1',
      conversation_id: 'conv_b_1',
      total_amount: 85000,
      delivery_location: 'Abuja',
      payment_status: 'UNPAID',
      order_status: 'PENDING',
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockStore.saveOrder(orderB);

    const tenantAOrders = mockStore.getOrders(tenantA);
    const isLeaked = tenantAOrders.some((o) => o.id === orderB.id);
    if (isLeaked) {
      throw new Error('SECURITY VIOLATION: Tenant B order visible in Tenant A order list!');
    }
  });

  // 3. Customer Lead Record Isolation
  runTest('Tenant A cannot view or access Tenant B customer leads', () => {
    const leadB: Lead = {
      id: 'lead_b_1',
      business_id: tenantB,
      customer_id: 'cust_b_1',
      conversation_id: 'conv_b_1',
      product_interested: 'Tenant B Silk Dress',
      status: 'NEW',
      source: 'whatsapp',
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockStore.saveLead(leadB);

    const tenantALeads = mockStore.getLeads(tenantA);
    const isLeadLeaked = tenantALeads.some((l) => l.id === leadB.id);
    if (isLeadLeaked) {
      throw new Error('SECURITY VIOLATION: Tenant B customer lead visible in Tenant A lead list!');
    }
  });

  // 4. Conversation State Isolation
  runTest('Tenant A cannot access Tenant B conversation transcripts', () => {
    const convB: Conversation = {
      id: 'conv_b_1',
      business_id: tenantB,
      customer_id: 'cust_b_1',
      channel: 'whatsapp',
      last_intent: 'PURCHASE_INTENT',
      status: 'ai_active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockStore.saveConversation(convB);

    const tenantAConvs = mockStore.getConversations(tenantA);
    const isConvLeaked = tenantAConvs.some((c) => c.id === convB.id);
    if (isConvLeaked) {
      throw new Error('SECURITY VIOLATION: Tenant B conversation transcript visible to Tenant A!');
    }
  });

  console.log(`\n🎉 ALL ${passed}/${total} TENANT ISOLATION & CROSS-TENANT SECURITY TESTS PASSED 100% CLEANLY!\n`);
}

runTenantIsolationAdversarialTestSuite().catch((err) => {
  console.error('❌ Tenant Isolation Security Test Suite Failed:', err);
  process.exit(1);
});
