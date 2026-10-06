import { GroundedContext } from './types';
import { mockStore } from '../db/mock-store';
import { supabase } from '../db/client';
import { env } from '../env';

/**
 * Retrieval Layer: Scopes database queries strictly by business_id to enforce multi-tenant isolation.
 */
export async function getGroundedContext(businessId: string): Promise<GroundedContext> {
  const isMockUrl = !env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL.includes('mock') || !env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http');

  if (!isMockUrl) {
    try {
      const { data: business } = await supabase.from('businesses').select('*').eq('id', businessId).single();
      const { data: products } = await supabase.from('products').select('*').eq('business_id', businessId).eq('status', 'active');
      const { data: faqs } = await supabase.from('faqs').select('*').eq('business_id', businessId);
      const { data: aiSettings } = await supabase.from('ai_settings').select('*').eq('business_id', businessId).single();

      if (business && products && faqs && aiSettings) {
        return {
          business,
          products,
          faqs,
          aiSettings,
        };
      }
    } catch (error) {
      console.warn('[ContextRetriever] Supabase query fallback to mock store:', error);
    }
  }

  // Fallback to isolated mock store
  return {
    business: mockStore.getBusiness(businessId)!,
    products: mockStore.getProducts(businessId).filter((p) => p.status !== 'archived'),
    faqs: mockStore.getFaqs(businessId),
    aiSettings: mockStore.getAISettings(businessId),
  };
}
