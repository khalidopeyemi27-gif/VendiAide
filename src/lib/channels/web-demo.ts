import { ChannelAdapter, IncomingMessage, OutgoingMessage } from './types';

export class WebDemoAdapter implements ChannelAdapter {
  readonly channel = 'web_demo' as const;

  async sendMessage(message: OutgoingMessage): Promise<{ success: boolean; messageId: string }> {
    console.log(`[WebDemoAdapter] Rendered response to Web Demo session ${message.recipient.channel_user_id}`);
    return {
      success: true,
      messageId: `web_demo_msg_${Date.now()}`,
    };
  }

  parseIncomingPayload(payload: unknown): IncomingMessage {
    const data = payload as Record<string, unknown>;
    const userId = String(data.session_id || data.channel_user_id || 'web_demo_user_1');
    return {
      id: `incoming_web_${Date.now()}`,
      channel: 'web_demo',
      business_id: String(data.business_id || 'demo-fashion-slug'),
      sender: {
        channel: 'web_demo',
        channel_user_id: userId,
        name: data.name ? String(data.name) : 'Demo Customer',
        phone_number: data.phone_number ? String(data.phone_number) : undefined,
      },
      content: String(data.content || ''),
      timestamp: new Date().toISOString(),
    };
  }
}
