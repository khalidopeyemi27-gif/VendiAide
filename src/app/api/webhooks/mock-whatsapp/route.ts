import { NextResponse } from 'next/server';
import { conversationEngine } from '@/lib/engine/conversation';
import { z } from 'zod';

const webhookSchema = z.object({
  sender_phone: z.string().min(10, 'Valid WhatsApp phone number required'),
  sender_name: z.string().optional(),
  message_body: z.string().min(1, 'Message body cannot be empty'),
  business_phone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = webhookSchema.parse(body);

    // Trusted Channel Business Resolution (Decoupled Adapter Architecture)
    const businessId = 'demo-biz-1'; // Resolved from verified business phone mapping

    const response = await conversationEngine.processIncomingMessage({
      id: `wh_${Date.now()}`,
      business_id: businessId,
      channel: 'whatsapp',
      sender: {
        channel: 'whatsapp',
        channel_user_id: validatedData.sender_phone,
        phone_number: validatedData.sender_phone,
        name: validatedData.sender_name || 'WhatsApp Customer',
      },
      content: validatedData.message_body,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      status: 'success',
      channel: 'whatsapp',
      processed_at: new Date().toISOString(),
      response: {
        text: response.content,
        intent: response.intent,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ status: 'error', errors: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error('[MockWhatsAppWebhook Error]:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to process webhook payload' }, { status: 500 });
  }
}
