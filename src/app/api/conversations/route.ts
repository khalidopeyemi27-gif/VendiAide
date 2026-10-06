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

    // Fetch tenant-scoped conversations and customers
    try {
      const { data: dbConvs, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('business_id', businessId)
        .order('updated_at', { ascending: false });

      if (!error && dbConvs) {
        return NextResponse.json({ success: true, conversations: dbConvs });
      }
    } catch {
      console.warn('[ConversationsAPI] Supabase fallback to mock store');
    }

    const conversations = mockStore.getConversations(businessId);
    const customers = mockStore.getCustomers(businessId);

    const enrichedConversations = conversations.map((conv) => {
      const customer = customers.find((c) => c.id === conv.customer_id);
      const messages = mockStore.getMessages(conv.id);
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

      return {
        ...conv,
        customer,
        lastMessage,
        messageCount: messages.length,
      };
    });

    return NextResponse.json({ success: true, conversations: enrichedConversations });
  } catch (error) {
    console.error('[ConversationsAPI Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch conversations' }, { status: 500 });
  }
}
