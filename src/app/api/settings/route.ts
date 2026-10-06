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

    const business = mockStore.getBusiness(businessId);
    const aiSettings = mockStore.getAISettings(businessId);
    const subscription = mockStore.getSubscription(businessId);
    const usageStats = mockStore.getUsageStats(businessId);

    return NextResponse.json({
      success: true,
      data: {
        business,
        aiSettings,
        subscription,
        usageStats,
      },
    });
  } catch (error) {
    console.error('[SettingsAPI GET Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      category,
      phone_number,
      instagram_handle,
      whatsapp_number,
      delivery_info,
      payment_info,
      ai_settings,
    } = body;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let businessId = 'demo-biz-1';
    if (userId) {
      const biz = await getUserBusiness(userId);
      if (biz) businessId = biz.id;
    }

    const currentBiz = mockStore.getBusiness(businessId);
    if (currentBiz) {
      if (name) currentBiz.name = name;
      if (description !== undefined) currentBiz.description = description;
      if (category) currentBiz.category = category;
      if (phone_number !== undefined) currentBiz.phone_number = phone_number;
      if (instagram_handle !== undefined) currentBiz.instagram_handle = instagram_handle;
      if (whatsapp_number !== undefined) currentBiz.whatsapp_number = whatsapp_number;

      if (delivery_info) {
        currentBiz.delivery_info = {
          ...currentBiz.delivery_info,
          ...delivery_info,
        };
      }

      if (payment_info) {
        currentBiz.payment_info = {
          ...currentBiz.payment_info,
          ...payment_info,
        };
      }

      currentBiz.updated_at = new Date().toISOString();
      mockStore.saveBusiness(currentBiz);
    }

    if (ai_settings) {
      const currentAISettings = mockStore.getAISettings(businessId);
      const updatedAISettings = {
        ...currentAISettings,
        ...ai_settings,
        updated_at: new Date().toISOString(),
      };
      mockStore.saveAISettings(updatedAISettings);
    }

    // Try Supabase update
    try {
      if (currentBiz) {
        await supabase
          .from('businesses')
          .update({
            name: currentBiz.name,
            description: currentBiz.description,
            category: currentBiz.category,
            phone_number: currentBiz.phone_number,
            instagram_handle: currentBiz.instagram_handle,
            whatsapp_number: currentBiz.whatsapp_number,
            delivery_info: currentBiz.delivery_info,
            payment_info: currentBiz.payment_info,
            updated_at: new Date().toISOString(),
          })
          .eq('id', businessId);
      }
    } catch {
      console.warn('[SettingsPUT] Supabase sync fallback');
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      business: currentBiz,
      aiSettings: mockStore.getAISettings(businessId),
    });
  } catch (error) {
    console.error('[SettingsPUT Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to update settings' }, { status: 500 });
  }
}
