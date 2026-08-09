import { ChannelType } from '../types/database';

export interface ChannelUser {
  channel: ChannelType;
  channel_user_id: string;
  name?: string;
  phone_number?: string;
}

export interface IncomingMessage {
  id: string;
  channel: ChannelType;
  business_id: string;
  sender: ChannelUser;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface OutgoingMessage {
  id: string;
  channel: ChannelType;
  recipient: ChannelUser;
  content: string;
  intent_detected?: string;
  timestamp: string;
}

export interface ChannelAdapter {
  channel: ChannelType;
  sendMessage: (message: OutgoingMessage) => Promise<{ success: boolean; messageId: string }>;
  parseIncomingPayload: (payload: unknown) => IncomingMessage;
  verifyWebhookSignature?: (headers: Record<string, string>, rawBody: string) => boolean;
}
