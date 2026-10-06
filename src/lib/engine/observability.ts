import { MeaningResolution, OrderLifecycleState, MutationReason } from './types';

export interface TurnTrace {
  traceId: string;
  tenantId: string;
  sessionId: string;
  messageId: string;
  userText: string;
  intent: string;
  domain: string;
  groundedFacts: {
    productName?: string;
    size?: string;
    color?: string;
    locationName?: string;
    priceNaira?: number;
    deliveryFeeNaira?: number;
  };
  lifecycleState: OrderLifecycleState;
  mutationAuthorization: {
    shouldMutate: boolean;
    reason: MutationReason;
  };
  processingTimeMs: number;
  fallbackUsed: boolean;
  timestamp: string;
}

const traceBuffer: TurnTrace[] = [];

/**
 * Creates and logs a structured execution trace for a single conversation turn.
 */
export function recordTurnTrace(params: {
  tenantId?: string;
  sessionId: string;
  userText: string;
  meaningResolution: MeaningResolution;
  processingTimeMs: number;
  fallbackUsed?: boolean;
}): TurnTrace {
  const { tenantId = 'tenant_default', sessionId, userText, meaningResolution, processingTimeMs, fallbackUsed = false } = params;
  
  const trace: TurnTrace = {
    traceId: `trace_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId,
    sessionId,
    messageId: `msg_${Date.now()}`,
    userText,
    intent: meaningResolution.primaryIntent,
    domain: meaningResolution.domainCategory,
    groundedFacts: {
      productName: meaningResolution.groundedFacts.productName || undefined,
      size: meaningResolution.resolvedEntities.size || undefined,
      color: meaningResolution.resolvedEntities.color || undefined,
      locationName: meaningResolution.resolvedEntities.location || undefined,
      priceNaira: meaningResolution.groundedFacts.priceNaira || undefined,
      deliveryFeeNaira: meaningResolution.groundedFacts.deliveryFeeNaira || undefined,
    },
    lifecycleState: meaningResolution.stateMutation.lifecycleState,
    mutationAuthorization: {
      shouldMutate: meaningResolution.stateMutation.shouldMutate,
      reason: meaningResolution.stateMutation.reason,
    },
    processingTimeMs,
    fallbackUsed,
    timestamp: new Date().toISOString(),
  };

  traceBuffer.push(trace);
  if (traceBuffer.length > 500) {
    traceBuffer.shift(); // Keep buffer bounded
  }

  return trace;
}

/**
 * Retrieves the trace history for a given session.
 */
export function getSessionTraces(sessionId: string): TurnTrace[] {
  return traceBuffer.filter((t) => t.sessionId === sessionId);
}

/**
 * Clears trace history (useful for test isolation).
 */
export function clearTraceBuffer(): void {
  traceBuffer.length = 0;
}
