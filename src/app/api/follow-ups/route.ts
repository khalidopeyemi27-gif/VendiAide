import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { mockStore } from '@/lib/db/mock-store';
import { getUserBusiness } from '@/lib/auth/session';
import { FollowUp } from '@/lib/types/database';

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
      const { data: dbFollowUps, error } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('business_id', businessId)
        .order('scheduled_at', { ascending: true });

      if (!error && dbFollowUps) {
        return NextResponse.json({ success: true, followUps: dbFollowUps });
      }
    } catch {
      console.warn('[FollowUpsAPI] Supabase fallback to mock store');
    }

    const followUps = mockStore.getFollowUps(businessId);
    const customers = mockStore.getCustomers(businessId);

    const enriched = followUps.map((f) => {
      const customer = customers.find((c) => c.id === f.customer_id);
      return {
        ...f,
        customer,
      };
    });

    return NextResponse.json({ success: true, followUps: enriched });
  } catch (error) {
    console.error('[FollowUpsAPI Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch follow-ups' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customer_id, reason, scheduled_at } = body as { customer_id: string; reason: string; scheduled_at: string };

    if (!reason || !scheduled_at) {
      return NextResponse.json({ success: false, message: 'Reason and scheduled date/time are required' }, { status: 400 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let businessId = 'demo-biz-1';
    if (userId) {
      const biz = await getUserBusiness(userId);
      if (biz) businessId = biz.id;
    }

    const newFollowUp: FollowUp = {
      id: `followup_${Date.now()}`,
      business_id: businessId,
      customer_id: customer_id || 'cust-1',
      conversation_id: null,
      reason: reason.trim(),
      scheduled_at: scheduled_at,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    try {
      const { data: inserted, error } = await supabase.from('follow_ups').insert(newFollowUp).select().single();
      if (!error && inserted) {
        return NextResponse.json({ success: true, followUp: inserted });
      }
    } catch {
      console.warn('[FollowUpsPOST] Supabase fallback to mock store');
    }

    const saved = mockStore.saveFollowUp(newFollowUp);
    return NextResponse.json({ success: true, followUp: saved });
  } catch (error) {
    console.error('[FollowUpsPOST Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to create follow-up' }, { status: 500 });
  }
}
