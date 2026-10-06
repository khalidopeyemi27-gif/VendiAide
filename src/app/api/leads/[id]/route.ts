import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { mockStore } from '@/lib/db/mock-store';
import { getUserBusiness } from '@/lib/auth/session';
import { LeadStatus } from '@/lib/types/database';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes } = body as { status?: LeadStatus; notes?: string };

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let businessId = 'demo-biz-1';
    if (userId) {
      const biz = await getUserBusiness(userId);
      if (biz) businessId = biz.id;
    }

    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const { data: updated, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', id)
        .eq('business_id', businessId)
        .select()
        .single();

      if (!error && updated) {
        return NextResponse.json({ success: true, lead: updated });
      }
    } catch {
      console.warn('[LeadPATCH] Supabase fallback to mock store');
    }

    const leads = mockStore.getLeads(businessId);
    const idx = leads.findIndex((l) => l.id === id);
    if (idx >= 0) {
      if (status) leads[idx].status = status;
      if (notes !== undefined) leads[idx].notes = notes;
      leads[idx].updated_at = new Date().toISOString();
      return NextResponse.json({ success: true, lead: leads[idx] });
    }

    return NextResponse.json({ success: false, message: 'Lead not found' }, { status: 404 });
  } catch (error) {
    console.error('[LeadPATCH Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to update lead' }, { status: 500 });
  }
}
