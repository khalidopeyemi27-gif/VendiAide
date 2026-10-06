import { mockStore } from '../db/mock-store';
import { supabase } from '../db/client';
import { getCurrentMonthYear } from '../utils/formatters';
import { SUBSCRIPTION_CONVERSATION_LIMITS, SubscriptionPlan } from '../types/database';
import { env } from '../env';

export interface UsageCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  plan: SubscriptionPlan;
  message?: string;
}

export async function checkAndEnforceUsage(businessId: string): Promise<UsageCheckResult> {
  const monthYear = getCurrentMonthYear();
  const isMockUrl = !env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL.includes('mock') || !env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http');

  if (!isMockUrl) {
    try {
      // 1. Fetch Subscription
      const { data: sub } = await supabase.from('subscriptions').select('plan, status').eq('business_id', businessId).single();
      const plan: SubscriptionPlan = (sub?.plan as SubscriptionPlan) || 'founding_10';
      const limit = SUBSCRIPTION_CONVERSATION_LIMITS[plan] || 500;

      // 2. Fetch Current Month Usage Stats
      const { data: usage } = await supabase
        .from('business_usage_stats')
        .select('conversations_count')
        .eq('business_id', businessId)
        .eq('month_year', monthYear)
        .single();

      const currentCount = usage?.conversations_count || 0;

      if (currentCount >= limit) {
        return {
          allowed: false,
          currentCount,
          limit,
          plan,
          message: `Monthly AI conversation limit reached (${currentCount}/${limit}). Upgrade your plan or contact support to resume automated AI sales.`,
        };
      }

      return {
        allowed: true,
        currentCount,
        limit,
        plan,
      };
    } catch (error) {
      console.warn('[UsageEnforcer] Supabase query fallback to mock store:', error);
    }
  }

  // Fallback to Mock Store check
  const sub = mockStore.getSubscription(businessId);
  const limit = SUBSCRIPTION_CONVERSATION_LIMITS[sub.plan] || 500;
  const stats = mockStore.getUsageStats(businessId);

  if (stats.conversations_count >= limit) {
    return {
      allowed: false,
      currentCount: stats.conversations_count,
      limit,
      plan: sub.plan,
      message: `Monthly AI conversation limit reached (${stats.conversations_count}/${limit}). Please contact platform admin or upgrade to Growth plan.`,
    };
  }

  return {
    allowed: true,
    currentCount: stats.conversations_count,
    limit,
    plan: sub.plan,
  };
}

export async function recordUsageIncrement(businessId: string, tokensUsed: number): Promise<void> {
  const monthYear = getCurrentMonthYear();
  const isMockUrl = !env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL.includes('mock') || !env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http');

  if (!isMockUrl) {
    try {
      const { data: existing } = await supabase
        .from('business_usage_stats')
        .select('id, conversations_count, ai_tokens_used')
        .eq('business_id', businessId)
        .eq('month_year', monthYear)
        .single();

      if (existing) {
        await supabase
          .from('business_usage_stats')
          .update({
            conversations_count: existing.conversations_count + 1,
            ai_tokens_used: existing.ai_tokens_used + tokensUsed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('business_usage_stats').insert({
          business_id: businessId,
          month_year: monthYear,
          conversations_count: 1,
          ai_tokens_used: tokensUsed,
          orders_count: 0,
        });
      }
      return;
    } catch {
      console.warn('[UsageEnforcer] Usage increment fallback to mock store');
    }
  }

  mockStore.incrementUsage(businessId, tokensUsed);
}
