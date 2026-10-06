import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { mockStore } from '@/lib/db/mock-store';
import { getUserBusiness } from '@/lib/auth/session';
import { OrderStatus, PaymentStatus } from '@/lib/types/database';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { order_status, payment_status } = body as { order_status?: OrderStatus; payment_status?: PaymentStatus };

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let businessId = 'demo-biz-1';
    if (userId) {
      const biz = await getUserBusiness(userId);
      if (biz) businessId = biz.id;
    }

    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (order_status) updateData.order_status = order_status;
      if (payment_status) updateData.payment_status = payment_status;

      const { data: updated, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .eq('business_id', businessId)
        .select()
        .single();

      if (!error && updated) {
        return NextResponse.json({ success: true, order: updated });
      }
    } catch {
      console.warn('[OrderPATCH] Supabase fallback to mock store');
    }

    const orders = mockStore.getOrders(businessId);
    const idx = orders.findIndex((o) => o.id === id);
    if (idx >= 0) {
      if (order_status) orders[idx].order_status = order_status;
      if (payment_status) orders[idx].payment_status = payment_status;
      orders[idx].updated_at = new Date().toISOString();
      return NextResponse.json({ success: true, order: orders[idx] });
    }

    return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
  } catch (error) {
    console.error('[OrderPATCH Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to update order' }, { status: 500 });
  }
}
