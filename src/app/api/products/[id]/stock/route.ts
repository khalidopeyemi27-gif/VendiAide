import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { mockStore } from '@/lib/db/mock-store';
import { getUserBusiness } from '@/lib/auth/session';
import { z } from 'zod';

const stockSchema = z.object({
  in_stock: z.boolean(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { in_stock } = stockSchema.parse(body);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let businessId = 'demo-biz-1';
    if (userId) {
      const biz = await getUserBusiness(userId);
      if (biz) businessId = biz.id;
    }

    try {
      const { data: updated, error } = await supabase
        .from('products')
        .update({ in_stock, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('business_id', businessId)
        .select()
        .single();

      if (!error && updated) {
        return NextResponse.json({ success: true, in_stock, product: updated });
      }
    } catch {
      console.warn('[StockPATCH] Fallback to mock store');
    }

    // Mock store quick stock toggle with tenant scoping
    const products = mockStore.getProducts(businessId);
    const idx = products.findIndex((p) => p.id === id);
    if (idx >= 0) {
      products[idx].in_stock = in_stock;
      products[idx].updated_at = new Date().toISOString();
      return NextResponse.json({ success: true, in_stock, product: products[idx] });
    }

    return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error('[StockPATCH Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to update stock status' }, { status: 500 });
  }
}
