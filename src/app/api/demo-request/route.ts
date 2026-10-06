import { NextResponse } from 'next/server';
import { z } from 'zod';

const demoRequestSchema = z.object({
  vendor_name: z.string().min(2, 'Business name must be at least 2 characters'),
  whatsapp_number: z.string().min(10, 'Valid Nigerian phone/WhatsApp number required'),
  category: z.string().min(2, 'Please select a business category'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = demoRequestSchema.parse(body);

    // Store in console / memory log for demo capture
    console.log('📥 [Demo Request Received]:', validatedData);

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your demo request has been received. Our team will contact you on WhatsApp shortly.',
      data: validatedData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Failed to submit demo request. Please try again.' },
      { status: 500 }
    );
  }
}
