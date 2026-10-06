import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { mockStore } from '@/lib/db/mock-store';
import { getUserBusiness } from '@/lib/auth/session';
import { ConversationStatus } from '@/lib/types/database';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body as { status: ConversationStatus };

    if (!['ai_active', 'human_takeover', 'resolved'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid conversation status' }, { status: 400 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let businessId = 'demo-biz-1';
    if (userId) {
      const biz = await getUserBusiness(userId);
      if (biz) businessId = biz.id;
    }

    // Persist takeover state with explicit business_id tenant scoping
    try {
      const { data: updated, error } = await supabase
        .from('conversations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('business_id', businessId)
        .select()
        .single();

      if (!error && updated) {
        return NextResponse.json({ success: true, conversation: updated });
      }
    } catch {
      console.warn('[TakeoverAPI] Supabase fallback to mock store');
    }

    const conversations = mockStore.getConversations(businessId);
    const idx = conversations.findIndex((c) => c.id === id);
    if (idx >= 0) {
      conversations[idx].status = status;
      conversations[idx].updated_at = new Date().toISOString();
      return NextResponse.json({ success: true, conversation: conversations[idx] });
    }

    return NextResponse.json({ success: false, message: 'Conversation not found' }, { status: 404 });
  } catch (error) {
    console.error('[TakeoverAPI Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to update takeover status' }, { status: 500 });
  }
}
