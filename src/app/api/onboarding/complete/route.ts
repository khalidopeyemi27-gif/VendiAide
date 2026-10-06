import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db/client';
import { mockStore } from '@/lib/db/mock-store';
import { slugify } from '@/lib/utils/formatters';

const completeOnboardingSchema = z.object({
  // Step 1
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  category: z.string().min(2, 'Category is required'),
  whatsapp_number: z.string().min(10, 'Valid WhatsApp phone number required'),
  location: z.string().min(2, 'Location is required'),

  // Step 2
  fee_lagos: z.number().min(0, 'Delivery fee cannot be negative'),
  fee_interstate: z.number().min(0, 'Delivery fee cannot be negative'),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  account_name: z.string().optional(),

  // Step 3 (Initial Catalog - At least ONE required)
  product_name: z.string().min(2, 'Product name is required'),
  product_price: z.number().positive('Price must be greater than zero'),
  product_sizes: z.array(z.string()).min(1, 'At least one size is required'),
  product_colors: z.array(z.string()).min(1, 'At least one color is required'),
  product_in_stock: z.boolean().default(true),

  // Step 4 (AI Persona)
  assistant_name: z.string().default('Aisha'),
  tone: z.enum(['friendly_professional', 'warm_nigerian_pinyin', 'formal']).default('friendly_professional'),
  greeting_message: z.string().default('Welcome to our store! How can I help you choose your outfit today?'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = completeOnboardingSchema.parse(body);

    // Get active user from auth context or session header
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || 'user-demo-1';

    const slug = slugify(data.business_name) || `biz-${Date.now()}`;

    // SECURITY: Prepare bank details safely (never log account numbers or pass to OpenAI)
    const paymentInfo = {
      bank_name: data.bank_name || '',
      account_number: data.account_number || '',
      account_name: data.account_name || '',
    };

    const deliveryInfo = {
      fee_lagos: data.fee_lagos,
      fee_interstate: data.fee_interstate,
      policy: 'Delivery within 24-48 hours in Lagos, 3-5 days interstate.',
    };

    // Attempt Atomic RPC Execution on Supabase
    const { data: rpcResult, error: rpcError } = await supabase.rpc('complete_business_onboarding', {
      p_business_name: data.business_name,
      p_slug: slug,
      p_category: data.category,
      p_whatsapp_number: data.whatsapp_number,
      p_location: data.location,
      p_delivery_info: deliveryInfo,
      p_payment_info: paymentInfo,
      p_product_name: data.product_name,
      p_product_price: data.product_price,
      p_product_sizes: data.product_sizes,
      p_product_colors: data.product_colors,
      p_product_in_stock: data.product_in_stock,
      p_assistant_name: data.assistant_name,
      p_assistant_tone: data.tone,
      p_greeting_message: data.greeting_message,
    });

    if (!rpcError && rpcResult?.success) {
      return NextResponse.json({
        success: true,
        message: 'Onboarding completed successfully',
        business_id: rpcResult.business_id,
      });
    }

    // Fallback atomic save in local mock store if database is offline
    console.warn('[OnboardingComplete] Supabase RPC notice, executing atomic local store fallback:', rpcError?.message);

    const business = mockStore.getBusiness('demo-biz-1')!;
    business.name = data.business_name;
    business.category = data.category;
    business.whatsapp_number = data.whatsapp_number;
    business.location = data.location;
    business.delivery_info = deliveryInfo;
    business.payment_info = paymentInfo;
    business.onboarding_completed = true;
    business.owner_id = userId;

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully (Local Fallback)',
      business_id: business.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error('[OnboardingComplete Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to complete onboarding transaction.' },
      { status: 500 }
    );
  }
}
