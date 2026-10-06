import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { mockStore } from '@/lib/db/mock-store';
import { getUserBusiness } from '@/lib/auth/session';
import { FollowUpStatus } from '@/lib/types/database';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body as { status: FollowUpStatus };

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let businessId = 'demo-biz-1';
    if (userId) {
      const biz = await getUserBusiness(userId);
      if (biz) businessId = biz.id;
    }

    try {
      const { data: updated, error } = await supabase
        .from('follow_ups')
        .update({ status })
        .eq('id', id)
        .eq('business_id', businessId)
        .select()
        .single();

      if (!error && updated) {
        return NextResponse.json({ success: true, followUp: updated });
      }
    } catch {
      console.warn('[FollowUpPATCH] Supabase fallback to mock store');
    }

    const followUps = mockStore.getFollowUps(businessId);
    const idx = followUps.findIndex((f) => f.id === id);
    if (idx >= 0) {
      followUps[idx].status = status;
      return NextResponse.json({ success: true, followUp: followUps[idx] });
    }

    return NextResponse.json({ success: false, message: 'Follow-up not found' }, { status: 404 });
  } catch (error) {
    console.error('[FollowUpPATCH Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to update follow-up' }, { status: 500 });
  }
}
