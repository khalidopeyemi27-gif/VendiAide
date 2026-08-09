import { ChannelAdapter } from './types';
import { MockWhatsAppAdapter } from './mock-whatsapp';
import { WebDemoAdapter } from './web-demo';
import { ChannelType } from '../types/database';

const adapters: Record<ChannelType, ChannelAdapter> = {
  whatsapp: new MockWhatsAppAdapter(),
  web_demo: new WebDemoAdapter(),
  instagram: new MockWhatsAppAdapter() as unknown as ChannelAdapter, // Placeholder interface fallback for Instagram
};

export function getChannelAdapter(channel: ChannelType): ChannelAdapter {
  return adapters[channel] || adapters.web_demo;
}

export { MockWhatsAppAdapter, WebDemoAdapter };
