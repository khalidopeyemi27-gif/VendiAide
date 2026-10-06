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

    try {
      const { data: dbLeads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (!error && dbLeads) {
        return NextResponse.json({ success: true, leads: dbLeads });
      }
    } catch {
      console.warn('[LeadsAPI] Supabase fallback to mock store');
    }

    const leads = mockStore.getLeads(businessId);
    const customers = mockStore.getCustomers(businessId);

    const enrichedLeads = leads.map((lead) => {
      const customer = customers.find((c) => c.id === lead.customer_id);
      return {
        ...lead,
        customer,
      };
    });

    return NextResponse.json({ success: true, leads: enrichedLeads });
  } catch (error) {
    console.error('[LeadsAPI Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch leads' }, { status: 500 });
  }
}
