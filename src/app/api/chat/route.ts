import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getUserBusiness } from '@/lib/auth/session';
import { conversationEngine } from '@/lib/engine/conversation';
import { z } from 'zod';

const chatRequestSchema = z.object({
  channel: z.enum(['whatsapp', 'web_demo', 'instagram']).default('web_demo'),
  channel_user_id: z.string().min(1, 'Channel user ID is required'),
  message_text: z.string().min(1, 'Message text cannot be empty'),
  sender_name: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = chatRequestSchema.parse(body);

    // CRITICAL SECURITY RULE: Resolve business ownership ONLY from session/auth. Never trust client business_id.
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let businessId = 'demo-biz-1';
    if (userId) {
      const biz = await getUserBusiness(userId);
      if (biz) businessId = biz.id;
    }

    // Process incoming message through grounded conversation engine
    const responsePayload = await conversationEngine.processIncomingMessage({
      id: `chat_${Date.now()}`,
      business_id: businessId,
      channel: validatedData.channel,
      sender: {
        channel: validatedData.channel,
        channel_user_id: validatedData.channel_user_id,
        name: validatedData.sender_name || 'Valued Customer',
      },
      content: validatedData.message_text,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: responsePayload,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error('[ChatAPI Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to process chat message' }, { status: 500 });
  }
}
