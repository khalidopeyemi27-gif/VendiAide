import { ChannelAdapter, IncomingMessage, OutgoingMessage } from './types';

export class MockWhatsAppAdapter implements ChannelAdapter {
  readonly channel = 'whatsapp' as const;

  async sendMessage(message: OutgoingMessage): Promise<{ success: boolean; messageId: string }> {
    console.log(`[MockWhatsAppAdapter] Sent message to ${message.recipient.channel_user_id}: "${message.content}"`);
    return {
      success: true,
      messageId: `mock_wa_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }

  parseIncomingPayload(payload: unknown): IncomingMessage {
    const data = payload as Record<string, unknown>;
    const phone = String(data.phone_number || '2348012345678');
    return {
      id: `incoming_wa_${Date.now()}`,
      channel: 'whatsapp',
      business_id: String(data.business_id || 'demo-business-id'),
      sender: {
        channel: 'whatsapp',
        channel_user_id: phone,
        phone_number: phone,
        name: data.name ? String(data.name) : undefined,
      },
      content: String(data.content || ''),
      timestamp: new Date().toISOString(),
    };
  }

  verifyWebhookSignature(): boolean {
    return true; // Mock verification always succeeds
  }
}
