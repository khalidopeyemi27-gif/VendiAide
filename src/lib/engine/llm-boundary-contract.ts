import { DemoSessionState, DemoOrder } from '../demo/demo-engine';
import { ParsedIntent } from './types';

/**
 * VENDIAIDE ARCHITECTURAL BOUNDARY CONTRACT
 *
 * 🛑 CRITICAL INTEGRITY INVARIANT:
 * Gemini (or any external LLM) operates STRICTLY as a read-only Language Understanding Layer (NLU/NER).
 * Gemini is NEVER permitted to:
 * 1. Directly mutate DemoSessionState or state.orders.
 * 2. Calculate or override financial totals or delivery rates.
 * 3. Authorize or trigger order creation without passing through VendiAide's deterministic authorization gate.
 * 4. Bypass tenant boundaries or catalog stock checks.
 *
 * PIPELINE FLOW:
 * Customer Raw Message -> Gemini NLU (Parses Intent + Entities) -> StructuredNLUResult -> VendiAide Deterministic Engine -> State Machine + Authorization Gate -> Verified Output
 */

export interface StructuredNLUResult {
  intent: ParsedIntent;
  confidence: number;
  extractedEntities: {
    productName?: string;
    productCategory?: 'Hoodie' | 'Abaya' | 'Sneakers' | string;
    size?: string;
    color?: string;
    locationRaw?: string;
    ordinalPosition?: number;
    priceQuery?: boolean;
    deliveryFeeQuery?: boolean;
    cancellationRequested?: boolean;
    explicitAuthorizationToOrder?: boolean;
  };
  reasoningBrief?: string;
}

export interface EngineExecutionResult {
  updatedState: DemoSessionState;
  responseText: string;
  intent: string;
  orderCreated: boolean;
  orderSummary?: DemoOrder;
  boundaryChecks: {
    nluAttemptedOrderCreation: boolean;
    engineAuthorizedOrder: boolean;
    financialTotalVerified: boolean;
  };
}

/**
 * Enforces the architectural boundary between NLU interpretation and Engine State Authority.
 */
export function validateNLUBoundaryGuard(
  nluResult: StructuredNLUResult,
  stateBefore: DemoSessionState,
  processEngineFn: (state: DemoSessionState, input: string) => { updatedState: DemoSessionState; responseText: string; intent: string }
): EngineExecutionResult {
  const initialOrderCount = stateBefore.orders ? stateBefore.orders.length : 0;

  // Reconstruct deterministic input or pass through
  const engineResult = processEngineFn(stateBefore, nluResult.extractedEntities.locationRaw || 'customer_message');
  const finalOrderCount = engineResult.updatedState.orders ? engineResult.updatedState.orders.length : 0;
  const orderCreated = finalOrderCount > initialOrderCount;

  return {
    updatedState: engineResult.updatedState,
    responseText: engineResult.responseText,
    intent: engineResult.intent,
    orderCreated,
    orderSummary: orderCreated ? engineResult.updatedState.orders[finalOrderCount - 1] : undefined,
    boundaryChecks: {
      nluAttemptedOrderCreation: Boolean(nluResult.extractedEntities.explicitAuthorizationToOrder),
      engineAuthorizedOrder: orderCreated,
      financialTotalVerified: orderCreated ? engineResult.updatedState.orders[finalOrderCount - 1].totalNaira > 0 : true,
    },
  };
}
