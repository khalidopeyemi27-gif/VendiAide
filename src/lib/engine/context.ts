import { GroundedContext } from './types';
import { mockStore } from '../db/mock-store';
import { supabase } from '../db/client';

/**
 * Retrieval Layer: Scopes database queries strictly by business_id to enforce multi-tenant isolation.
 */
export async function getGroundedContext(businessId: string): Promise<GroundedContext> {
  try {
    // Attempt Supabase fetch
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

  // Fallback to isolated mock store
  return {
    business: mockStore.getBusiness(businessId)!,
    products: mockStore.getProducts(businessId),
    faqs: mockStore.getFaqs(businessId),
    aiSettings: mockStore.getAISettings(businessId),
  };
}
