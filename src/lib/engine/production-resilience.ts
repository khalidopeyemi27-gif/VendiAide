import { MeaningResolution } from './types';
import { VendorDeliveryConfig, verifyVendorDeliveryCoverage } from './vendor-delivery';

export interface ProductItem {
  id: string;
  name: string;
  price_ngn: number;
  sizes: string[];
  colors: string[];
  in_stock: boolean;
  category: string;
}

export interface ResilientConversationState {
  version: number;
  lastProcessedMessageId?: string;
  lastProcessedTimestamp?: number;
  pendingProductId?: string;
  pendingSize?: string;
  pendingColor?: string;
  pendingLocation?: string;
  pendingPurchaseIntent?: boolean;
  orders: Array<{
    id: string;
    productId: string;
    productName: string;
    size?: string;
    color?: string;
    priceNaira: number;
    deliveryLocation: string;
    deliveryFeeNaira: number;
    totalNaira: number;
    createdAt: string;
  }>;
  messages: Array<{ id?: string; sender: 'customer' | 'ai'; text: string; timestamp?: number }>;
}

export interface PipelineResult {
  updatedState: ResilientConversationState;
  responseText: string;
  idempotencyHit?: boolean;
  errorRollback?: boolean;
}

// 1. Idempotency & Duplicate Webhook Deduplication Manager
class IdempotencyManager {
  private cache: Map<string, { result: PipelineResult; timestamp: number }> = new Map();
  private ttlMs = 24 * 60 * 60 * 1000; // 24 Hours

  public get(messageId: string): PipelineResult | undefined {
    const entry = this.cache.get(messageId);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(messageId);
      return undefined;
    }
    return { ...entry.result, idempotencyHit: true };
  }

  public set(messageId: string, result: PipelineResult): void {
    this.cache.set(messageId, { result, timestamp: Date.now() });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const idempotencyManager = new IdempotencyManager();

// 2. Per-Conversation Serializing Mutex Lock Manager
class ConversationLockManager {
  private activeLocks: Map<string, Promise<void>> = new Map();

  public async acquireLock<T>(conversationId: string, fn: () => Promise<T>): Promise<T> {
    while (this.activeLocks.has(conversationId)) {
      await this.activeLocks.get(conversationId);
    }

    let resolveLock!: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });

    this.activeLocks.set(conversationId, lockPromise);

    try {
      return await fn();
    } finally {
      this.activeLocks.delete(conversationId);
      resolveLock();
    }
  }
}

export const conversationLockManager = new ConversationLockManager();

// 3. Live Checkout & Re-validation Engine (Catalog & Vendor Config Mutation Guard)
export function revalidateOrderAtCheckout(
  pendingProductId: string,
  pendingSize: string | undefined,
  pendingColor: string | undefined,
  pendingLocation: string,
  liveCatalog: ProductItem[],
  liveVendorConfig: VendorDeliveryConfig
): {
  valid: boolean;
  reason?: string;
  product?: ProductItem;
  priceNaira?: number;
  deliveryFeeNaira?: number;
} {
  // Check live product stock & price
  const product = liveCatalog.find((p) => p.id === pendingProductId);
  if (!product) {
    return { valid: false, reason: 'PRODUCT_REMOVED' };
  }
  if (!product.in_stock) {
    return { valid: false, reason: 'OUT_OF_STOCK', product };
  }

  // Check live size & color availability
  if (pendingSize && !product.sizes.includes(pendingSize)) {
    return { valid: false, reason: 'SIZE_UNAVAILABLE', product };
  }
  if (pendingColor && !product.colors.includes(pendingColor)) {
    return { valid: false, reason: 'COLOR_UNAVAILABLE', product };
  }

  // Check live vendor delivery coverage & rate
  const coverage = verifyVendorDeliveryCoverage(liveVendorConfig.vendorId, {
    input: pendingLocation,
    canonicalName: pendingLocation,
    displayName: pendingLocation,
    parsed: pendingLocation,
    state: pendingLocation,
    regionType: 'CITY',
    confidence: 0.9,
    matchedAlias: pendingLocation.toLowerCase(),
  }, liveVendorConfig);

  if (coverage.status !== 'CONFIRMED' || coverage.feeNaira === undefined) {
    return { valid: false, reason: 'DELIVERY_UNCONFIRMED', product };
  }

  return {
    valid: true,
    product,
    priceNaira: product.price_ngn,
    deliveryFeeNaira: coverage.feeNaira,
  };
}

// 4. Tenant Isolation & API Boundary Guard
export function enforceTenantIsolation(
  authenticatedVendorId: string,
  requestedVendorId: string
): void {
  if (authenticatedVendorId !== requestedVendorId) {
    const err = new Error(`Access Denied: Authenticated tenant "${authenticatedVendorId}" cannot access resources of tenant "${requestedVendorId}".`);
    (err as unknown as { status: number }).status = 403;
    throw err;
  }
}

// 5. Out-of-Order Message Timestamp & Sequence Validator
export function validateMessageSequence(
  state: ResilientConversationState,
  incomingTimestamp?: number
): boolean {
  if (!incomingTimestamp || !state.lastProcessedTimestamp) {
    return true; // Sequence valid
  }
  return incomingTimestamp >= state.lastProcessedTimestamp;
}

// 6. Transactional Atomic Pipeline Executor with Rollback & Fallback
export async function executeResilientPipeline(
  conversationId: string,
  messageId: string,
  incomingTimestamp: number,
  userMessageText: string,
  state: ResilientConversationState,
  expectedVersion: number,
  meaningResolverFn: () => Promise<MeaningResolution>,
  stateMutatorFn: (meaning: MeaningResolution) => ResilientConversationState,
  responseGeneratorFn: (meaning: MeaningResolution, newState: ResilientConversationState) => Promise<string>,
  persisterFn: (finalState: ResilientConversationState, responseText: string) => Promise<void>
): Promise<PipelineResult> {
  return conversationLockManager.acquireLock(conversationId, async () => {
    // A. Idempotency Check
    const cached = idempotencyManager.get(messageId);
    if (cached) return cached;

    // B. Optimistic Concurrency / Version Check (CAS)
    if (state.version !== expectedVersion) {
      throw new Error(`State CAS Version Mismatch! Expected ${expectedVersion}, got ${state.version}`);
    }

    // C. Out-of-Order Check
    if (!validateMessageSequence(state, incomingTimestamp)) {
      return {
        updatedState: state,
        responseText: 'A newer message was already processed. Ignoring stale out-of-order message.',
      };
    }

    // D. Meaning Resolution
    const meaning = await meaningResolverFn();

    // Backup state for rollback
    const snapshotState = JSON.parse(JSON.stringify(state));

    let newState: ResilientConversationState;
    try {
      // E. State Mutation
      newState = stateMutatorFn(meaning);
      newState.version = state.version + 1;
      newState.lastProcessedMessageId = messageId;
      newState.lastProcessedTimestamp = incomingTimestamp;
    } catch {
      // State mutation failure -> rollback
      return { updatedState: snapshotState, responseText: 'Processing error during state update.', errorRollback: true };
    }

    let responseText: string;
    try {
      // F. Response Generation
      responseText = await responseGeneratorFn(meaning, newState);
    } catch {
      // Response generation failed (e.g. LLM timeout) -> Use deterministic grounded fallback
      responseText = meaning.groundedFacts.productName
        ? `We have the ${meaning.groundedFacts.productName} available for ₦${meaning.groundedFacts.priceNaira?.toLocaleString()}. How else can I assist you?`
        : 'Thank you for your message. How can I assist you with our store items today?';
    }

    try {
      // G. Persistence Commit
      await persisterFn(newState, responseText);
    } catch {
      // Persistence failure -> Rollback state to snapshot so unpersisted ghost response is not saved
      return { updatedState: snapshotState, responseText: 'Service temporarily unavailable. Please try again.', errorRollback: true };
    }

    const result: PipelineResult = { updatedState: newState, responseText };
    idempotencyManager.set(messageId, result);
    return result;
  });
}
