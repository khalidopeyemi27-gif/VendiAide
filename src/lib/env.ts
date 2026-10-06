import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('https://mock-supabase.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default('mock-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default('mock-service-key'),
  OPENAI_API_KEY: z.string().optional().default('mock-openai-key'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().default('vendiaide_webhook_secret_key'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  const isProduction = process.env.NODE_ENV === 'production';

  const result = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    if (isProduction) {
      console.error('❌ Critical Environment Error in Production:', result.error.format());
      throw new Error('Missing or invalid environment variables in production execution environment.');
    }
    console.warn('⚠️ Invalid environment variables detected. Using default fallback configuration.', result.error.format());
    return envSchema.parse({});
  }

  // In production, warn or fail fast if default mock values are present
  if (isProduction) {
    if (result.data.NEXT_PUBLIC_SUPABASE_URL.includes('mock-supabase') || result.data.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('mock-anon')) {
      if (process.env.STRICT_PROD_ENV === 'true') {
        console.error('❌ Critical Security Error: Mock Supabase credentials detected in production environment.');
        throw new Error('Production environment cannot start with mock Supabase credentials. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      }
      console.warn('⚠️ Production Warning: Next.js build running with mock Supabase credentials. Provide real Supabase URL & keys for live deployments.');
    }
  }

  return result.data;
}

export const env = getEnv();
