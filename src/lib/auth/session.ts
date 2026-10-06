import { supabase } from '../db/client';
import { mockStore } from '../db/mock-store';
import { Business } from '../types/database';

export interface AuthSessionUser {
  id: string;
  email: string;
}

export async function getCurrentUser(): Promise<AuthSessionUser | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email || '',
      };
    }
  } catch (error) {
    console.warn('[AuthSession] Supabase session check error:', error);
  }

  // Fallback to active mock session for client testing if local storage token exists
  if (typeof window !== 'undefined') {
    const mockEmail = localStorage.getItem('vendor_auth_email');
    if (mockEmail) {
      return {
        id: 'user-demo-1',
        email: mockEmail,
      };
    }
  }

  return null;
}

export async function getUserBusiness(userId: string): Promise<Business | null> {
  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId)
      .single();

    if (business) {
      return business;
    }
  } catch {
    console.warn('[AuthSession] Business fetch error');
  }

  return mockStore.getBusiness('demo-biz-1') || null;
}
