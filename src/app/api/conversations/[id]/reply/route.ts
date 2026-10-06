import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { mockStore } from '@/lib/db/mock-store';
import { getUserBusiness } from '@/lib/auth/session';
import { Message } from '@/lib/types/database';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { message_text } = body as { message_text: string };

    if (!message_text || message_text.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'Reply message cannot be empty' }, { status: 400 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let businessId = 'demo-biz-1';
    if (userId) {
      const biz = await getUserBusiness(userId);
      if (biz) businessId = biz.id;
    }

    const vendorMessage: Message = {
      id: `msg_vendor_${Date.now()}`,
      conversation_id: id,
      business_id: businessId,
      sender_type: 'vendor',
      content: message_text.trim(),
      intent_detected: 'VENDOR_MANUAL_REPLY',
      created_at: new Date().toISOString(),
    };

    try {
      const { data: inserted, error } = await supabase.from('messages').insert(vendorMessage).select().single();
      if (!error && inserted) {
        return NextResponse.json({ success: true, message: inserted });
      }
    } catch {
      console.warn('[ReplyAPI] Supabase fallback to mock store');
    }

    const saved = mockStore.saveMessage(vendorMessage);
    return NextResponse.json({ success: true, message: saved });
  } catch (error) {
    console.error('[ReplyAPI Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to send vendor reply' }, { status: 500 });
  }
}
