import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { mockStore } from '@/lib/db/mock-store';
import { getUserBusiness } from '@/lib/auth/session';

export async function GET() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let businessId = 'demo-biz-1';
    if (userId) {
      const biz = await getUserBusiness(userId);
      if (biz) businessId = biz.id;
    }

    try {
      const { data: dbOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (!error && dbOrders) {
        return NextResponse.json({ success: true, orders: dbOrders });
      }
    } catch {
      console.warn('[OrdersAPI] Supabase fallback to mock store');
    }

    const orders = mockStore.getOrders(businessId);
    const customers = mockStore.getCustomers(businessId);

    const enrichedOrders = orders.map((ord) => {
      const customer = customers.find((c) => c.id === ord.customer_id);
      const items = mockStore.getOrderItems(ord.id);
      return {
        ...ord,
        customer,
        items,
      };
    });

    return NextResponse.json({ success: true, orders: enrichedOrders });
  } catch (error) {
    console.error('[OrdersAPI Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch orders' }, { status: 500 });
  }
}
