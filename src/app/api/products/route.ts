import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { mockStore } from '@/lib/db/mock-store';
import { getUserBusiness } from '@/lib/auth/session';
import { productSchema } from '@/lib/validations';
import { z } from 'zod';
import { Product } from '@/lib/types/database';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active'; // 'active' | 'archived' | 'all'
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const inStock = searchParams.get('in_stock');

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let businessId = 'demo-biz-1';
    if (userId) {
      const biz = await getUserBusiness(userId);
      if (biz) businessId = biz.id;
    }

    // Fetch Products with Explicit Tenant Scoping
    try {
      let query = supabase.from('products').select('*').eq('business_id', businessId);

      if (status !== 'all') {
        query = query.eq('status', status);
      }
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      if (inStock !== null && inStock !== undefined && inStock !== 'all') {
        query = query.eq('in_stock', inStock === 'true');
      }
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data: dbProducts, error } = await query;
      if (!error && dbProducts) {
        return NextResponse.json({ success: true, products: dbProducts });
      }
    } catch {
      console.warn('[ProductsAPI] Supabase fallback to mock store');
    }

    // Mock store fallback with tenant filtering
    let products: Product[] = mockStore.getProducts(businessId);
    if (status !== 'all') {
      products = products.filter((p) => p.status === status);
    }
    if (category && category !== 'all') {
      products = products.filter((p) => p.category === category);
    }
    if (inStock !== null && inStock !== undefined && inStock !== 'all') {
      const isStockBool = inStock === 'true';
      products = products.filter((p) => p.in_stock === isStockBool);
    }
    if (search) {
      const queryLower = search.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(queryLower));
    }

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('[ProductsAPI GET Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = productSchema.parse(body);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let businessId = 'demo-biz-1';
    if (userId) {
      const biz = await getUserBusiness(userId);
      if (biz) businessId = biz.id;
    }

    const newProduct: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      business_id: businessId,
      name: validatedData.name,
      description: validatedData.description || null,
      price_ngn: validatedData.price_ngn,
      in_stock: validatedData.in_stock,
      category: validatedData.category,
      image_url: validatedData.image_url || null,
      attributes: validatedData.attributes,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Attempt Supabase insert with explicit business_id
    try {
      const { data: inserted, error } = await supabase.from('products').insert({
        business_id: businessId,
        name: newProduct.name,
        description: newProduct.description,
        price_ngn: newProduct.price_ngn,
        in_stock: newProduct.in_stock,
        category: newProduct.category,
        image_url: newProduct.image_url,
        attributes: newProduct.attributes,
        status: 'active',
      }).select().single();

      if (!error && inserted) {
        return NextResponse.json({ success: true, product: inserted });
      }
    } catch {
      console.warn('[ProductsAPI POST] Fallback to mock store');
    }

    // Save to Mock Store fallback
    mockStore.saveProduct(newProduct);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error('[ProductsAPI POST Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to create product' }, { status: 500 });
  }
}
