import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { mockStore } from '@/lib/db/mock-store';
import { getUserBusiness } from '@/lib/auth/session';
import { productSchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let businessId = 'demo-biz-1';
    if (userId) {
      const biz = await getUserBusiness(userId);
      if (biz) businessId = biz.id;
    }

    // Fetch product with explicit business_id tenant scoping
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('business_id', businessId)
        .single();

      if (!error && product) {
        return NextResponse.json({ success: true, product });
      }
    } catch {
      console.warn('[ProductGET] Fallback to mock store');
    }

    const mockProducts = mockStore.getProducts(businessId);
    const product = mockProducts.find((p) => p.id === id);

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('[ProductGET Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validatedData = productSchema.parse(body);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let businessId = 'demo-biz-1';
    if (userId) {
      const biz = await getUserBusiness(userId);
      if (biz) businessId = biz.id;
    }

    // Update in Supabase with explicit business_id scoping
    try {
      const { data: updated, error } = await supabase
        .from('products')
        .update({
          name: validatedData.name,
          description: validatedData.description || null,
          price_ngn: validatedData.price_ngn,
          in_stock: validatedData.in_stock,
          category: validatedData.category,
          image_url: validatedData.image_url || null,
          attributes: validatedData.attributes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('business_id', businessId)
        .select()
        .single();

      if (!error && updated) {
        return NextResponse.json({ success: true, product: updated });
      }
    } catch {
      console.warn('[ProductPUT] Fallback to mock store');
    }

    // Mock store update with business_id scoping
    const products = mockStore.getProducts(businessId);
    const idx = products.findIndex((p) => p.id === id);
    if (idx >= 0) {
      products[idx] = {
        ...products[idx],
        name: validatedData.name,
        description: validatedData.description || null,
        price_ngn: validatedData.price_ngn,
        in_stock: validatedData.in_stock,
        category: validatedData.category,
        image_url: validatedData.image_url || null,
        attributes: validatedData.attributes,
        updated_at: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, product: products[idx] });
    }

    return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error('[ProductPUT Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to update product' }, { status: 500 });
  }
}

// SOFT ARCHIVAL ENDPOINT (SOFT DELETE)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'archive'; // 'archive' | 'restore'
    const newStatus = action === 'restore' ? 'active' : 'archived';

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
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('business_id', businessId)
        .select()
        .single();

      if (!error && updated) {
        return NextResponse.json({ success: true, action: newStatus, product: updated });
      }
    } catch {
      console.warn('[ProductDELETE] Fallback to mock store');
    }

    // Mock Store soft archival with business_id scoping
    const products = mockStore.getProducts(businessId);
    const idx = products.findIndex((p) => p.id === id);
    if (idx >= 0) {
      products[idx].status = newStatus as 'active' | 'archived';
      products[idx].updated_at = new Date().toISOString();
      return NextResponse.json({ success: true, action: newStatus, product: products[idx] });
    }

    return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
  } catch (error) {
    console.error('[ProductDELETE Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to update product status' }, { status: 500 });
  }
}
