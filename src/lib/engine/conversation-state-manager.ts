/**
 * VENDIAIDE CONVERSATION STATE MANAGER — MILESTONE B
 *
 * Dedicated state machine & orchestrator that sits between validated NLU output
 * (Gemini NLU / Deterministic Fallback) and VendiAide deterministic business logic.
 *
 * 🛑 ARCHITECTURAL BOUNDARIES:
 * - Gemini NLU is READ-ONLY (interprets intent & entities).
 * - Conversation State Manager is 100% PURE DETERMINISTIC LOGIC.
 * - Catalog prices, inventory, shipping rates, and order creation are governed exclusively by deterministic logic.
 */

import { GeminiNLUIntent } from './gemini-nlu';
import { DemoProduct } from '../demo/demo-engine';
import { LocationResolution } from './nigeria-geography';
import { formatNaira } from '../utils/formatters';

// ============================================================================
// 1. CONVERSATION STATE MODEL & TYPES
// ============================================================================

export type ConversationGoal =
  | 'CATALOG_EXPLORATION'
  | 'PRODUCT_INQUIRY'
  | 'ORDER_IN_PROGRESS'
  | 'AWAITING_CONFIRMATION'
  | 'ORDER_COMPLETED'
  | 'ORDER_CANCELLED';

export type ConfirmationStatus =
  | 'NONE'
  | 'PENDING_USER_CONFIRMATION'
  | 'USER_CONFIRMED'
  | 'USER_DECLINED';

export type CancellationStatus = 'NONE' | 'CANCELLED';

export interface OrderReadiness {
  isComplete: boolean;
  canCalculateTotal: boolean;
  itemPriceNaira?: number;
  deliveryFeeNaira?: number;
  totalNaira?: number;
}

export interface ConversationStateModel {
  sessionId: string;
  activeProductId?: string | null;
  activeProductName?: string | null;
  selectedSize?: string | null;
  selectedColor?: string | null;
  quantity: number;
  deliveryLocation?: string | null;
  missingFields: Array<'product' | 'size' | 'color' | 'location'>;
  conversationGoal: ConversationGoal;
  orderReadiness: OrderReadiness;
  confirmationStatus: ConfirmationStatus;
  cancellationStatus: CancellationStatus;
  turnHistoryCount: number;
  lastAssistantQuestion?: string | null;
  interruptionBuffer?: {
    previousProductId?: string | null;
    previousSize?: string | null;
    previousColor?: string | null;
    previousLocation?: string | null;
  } | null;
}

export interface StateTransitionResult {
  newState: ConversationStateModel;
  actionDirective:
    | 'SHOW_CATALOG'
    | 'ANSWER_PRODUCT_INFO'
    | 'PROMPT_MISSING_SLOT'
    | 'PROMPT_CONFIRMATION'
    | 'CREATE_ORDER'
    | 'CANCEL_ORDER'
    | 'HANDOFF_GENERAL';
  responsePrompt: string;
  resolvedProduct?: DemoProduct;
}

// ============================================================================
// 2. INITIALIZATION
// ============================================================================

export function createInitialConversationState(sessionId: string): ConversationStateModel {
  return {
    sessionId,
    activeProductId: null,
    activeProductName: null,
    selectedSize: null,
    selectedColor: null,
    quantity: 1,
    deliveryLocation: null,
    missingFields: ['product'],
    conversationGoal: 'CATALOG_EXPLORATION',
    orderReadiness: {
      isComplete: false,
      canCalculateTotal: false,
    },
    confirmationStatus: 'NONE',
    cancellationStatus: 'NONE',
    turnHistoryCount: 0,
    lastAssistantQuestion: null,
    interruptionBuffer: null,
  };
}

// ============================================================================
// 3. DETERMINISTIC STATE MACHINE TRANSITION FUNCTION
// ============================================================================

export function transitionConversationState(
  currentState: ConversationStateModel,
  nluInput: {
    intent: GeminiNLUIntent;
    extractedProduct?: string | null;
    extractedSize?: string | null;
    extractedColor?: string | null;
    extractedLocation?: string | null;
    isExplicitOrderAuthorization?: boolean;
    isCancellation?: boolean;
  },
  catalog: DemoProduct[],
  locationResolver: (locStr: string) => LocationResolution | undefined
): StateTransitionResult {
  const nextState: ConversationStateModel = {
    ...currentState,
    turnHistoryCount: currentState.turnHistoryCount + 1,
  };

  // --------------------------------------------------------------------------
  // A. HANDLE CANCELLATION & RESET
  // --------------------------------------------------------------------------
  if (nluInput.isCancellation || nluInput.intent === 'DECLINE') {
    nextState.activeProductId = null;
    nextState.activeProductName = null;
    nextState.selectedSize = null;
    nextState.selectedColor = null;
    nextState.deliveryLocation = null;
    nextState.missingFields = ['product'];
    nextState.conversationGoal = 'ORDER_CANCELLED';
    nextState.confirmationStatus = 'USER_DECLINED';
    nextState.cancellationStatus = 'CANCELLED';
    nextState.orderReadiness = { isComplete: false, canCalculateTotal: false };

    return {
      newState: nextState,
      actionDirective: 'CANCEL_ORDER',
      responsePrompt: 'No problem at all! 😊 I have cancelled that request. Let me know whenever you would like to explore our catalog again!',
    };
  }

  // Reset cancellation status if customer resumes
  nextState.cancellationStatus = 'NONE';

  // --------------------------------------------------------------------------
  // B. PRODUCT RESOLUTION & CONTINUITY / REPLACEMENT
  // --------------------------------------------------------------------------
  let resolvedProduct: DemoProduct | undefined;

  if (nluInput.extractedProduct) {
    const search = nluInput.extractedProduct.toLowerCase().trim();
    resolvedProduct = catalog.find((p) => {
      const pName = p.name.toLowerCase();
      return pName.includes(search) || search.includes(pName) || p.id === search;
    });

    if (!resolvedProduct) {
      // Fuzzy matching by product category or keywords
      if (search.includes('hoodie')) resolvedProduct = catalog.find((p) => p.name.toLowerCase().includes('hoodie'));
      else if (search.includes('abaya')) resolvedProduct = catalog.find((p) => p.name.toLowerCase().includes('abaya'));
      else if (search.includes('sneaker') || search.includes('shoe')) resolvedProduct = catalog.find((p) => p.name.toLowerCase().includes('sneaker'));
    }

    // DISAMBIGUATION GUARD: If extractedProduct is numeric (e.g. "30") and doesn't match any catalog item,
    // but an active product exists in context, reclassify "30" as size inquiry for the active product!
    if (!resolvedProduct && currentState.activeProductId && /^\d+$/.test(search)) {
      if (!nluInput.extractedSize) {
        nluInput.extractedSize = nluInput.extractedProduct;
      }
      nluInput.extractedProduct = null;
      resolvedProduct = catalog.find((p) => p.id === currentState.activeProductId);
    }
  }

  // If a new product was specified and differs from current active product: Product replacement / correction
  if (resolvedProduct && resolvedProduct.id !== nextState.activeProductId) {
    nextState.activeProductId = resolvedProduct.id;
    nextState.activeProductName = resolvedProduct.name;
    nextState.confirmationStatus = 'NONE';
    // Validate if current selected size/color exists in the new product
    if (nextState.selectedSize && !resolvedProduct.sizes.includes(nextState.selectedSize)) {
      nextState.selectedSize = null;
    }
    if (nextState.selectedColor && !resolvedProduct.colors.some((c) => c.toLowerCase() === nextState.selectedColor?.toLowerCase())) {
      nextState.selectedColor = null;
    }
  } else if (!nextState.activeProductId && catalog.length > 0) {
    // If state has active product from previous turns, keep it
    if (currentState.activeProductId) {
      resolvedProduct = catalog.find((p) => p.id === currentState.activeProductId);
    }
  } else if (nextState.activeProductId) {
    resolvedProduct = catalog.find((p) => p.id === nextState.activeProductId);
  }

  // --------------------------------------------------------------------------
  // C. ATTRIBUTE EXTRACTION, CORRECTION & REPLACEMENT (Size, Color, Location)
  // --------------------------------------------------------------------------
  // Size
  if (nluInput.extractedSize) {
    const rawSize = nluInput.extractedSize.toUpperCase().trim();
    if (resolvedProduct) {
      const validSize = resolvedProduct.sizes.find((s) => s.toUpperCase() === rawSize);
      if (validSize) {
        nextState.selectedSize = validSize;
      } else {
        // Requested size not available for product
        return {
          newState: nextState,
          actionDirective: 'PROMPT_MISSING_SLOT',
          responsePrompt: `The ${resolvedProduct.name} is available, but size ${rawSize} isn't currently listed. Available sizes are ${resolvedProduct.sizes.join(', ')}. Which size would you prefer?`,
          resolvedProduct,
        };
      }
    } else {
      nextState.selectedSize = rawSize;
    }
  }

  // Color
  if (nluInput.extractedColor) {
    const rawColor = nluInput.extractedColor.trim();
    if (resolvedProduct) {
      const validColor = resolvedProduct.colors.find((c) => c.toLowerCase() === rawColor.toLowerCase());
      if (validColor) {
        nextState.selectedColor = validColor;
      } else {
        return {
          newState: nextState,
          actionDirective: 'PROMPT_MISSING_SLOT',
          responsePrompt: `The ${resolvedProduct.name} is listed in ${resolvedProduct.colors.join(', ')}. We don't currently have a ${rawColor} option. Would you like to select from available colors?`,
          resolvedProduct,
        };
      }
    } else {
      nextState.selectedColor = rawColor;
    }
  }

  // Location
  if (nluInput.extractedLocation) {
    const locRes = locationResolver(nluInput.extractedLocation);
    if (locRes) {
      nextState.deliveryLocation = locRes.displayName;
    } else {
      nextState.deliveryLocation = nluInput.extractedLocation;
    }
  }

  // Default color if product has 1 or 0 color options
  if (resolvedProduct && resolvedProduct.colors && !nextState.selectedColor) {
    if (resolvedProduct.colors.length === 0) {
      nextState.selectedColor = 'NOT_APPLICABLE';
    } else if (resolvedProduct.colors.length === 1) {
      nextState.selectedColor = resolvedProduct.colors[0];
    }
  }

  // Default size if product has no size choices
  if (resolvedProduct && (!resolvedProduct.sizes || resolvedProduct.sizes.length === 0) && !nextState.selectedSize) {
    nextState.selectedSize = 'NOT_APPLICABLE';
  }

  // --------------------------------------------------------------------------
  // D. MISSING SLOT EVALUATION & ORDER READINESS
  // --------------------------------------------------------------------------
  const missing: Array<'product' | 'size' | 'color' | 'location'> = [];

  if (!nextState.activeProductId) missing.push('product');
  if (resolvedProduct && resolvedProduct.sizes && resolvedProduct.sizes.length > 0 && !nextState.selectedSize) missing.push('size');
  if (resolvedProduct && resolvedProduct.colors && resolvedProduct.colors.length > 1 && !nextState.selectedColor) missing.push('color');
  if (!nextState.deliveryLocation) missing.push('location');

  nextState.missingFields = missing;

  let itemPriceNaira: number | undefined;
  let deliveryFeeNaira: number | undefined;
  let totalNaira: number | undefined;

  if (resolvedProduct) {
    itemPriceNaira = resolvedProduct.price_ngn;
  }

  if (nextState.deliveryLocation) {
    const locRes = locationResolver(nextState.deliveryLocation);
    deliveryFeeNaira = locRes && locRes.state === 'Lagos' ? 2500 : 5000;
  }

  if (itemPriceNaira !== undefined && deliveryFeeNaira !== undefined) {
    totalNaira = itemPriceNaira * nextState.quantity + deliveryFeeNaira;
  }

  const isComplete = missing.length === 0;

  nextState.orderReadiness = {
    isComplete,
    canCalculateTotal: totalNaira !== undefined,
    itemPriceNaira,
    deliveryFeeNaira,
    totalNaira,
  };

  // --------------------------------------------------------------------------
  // E. EXPLICIT ORDER AUTHORIZATION GATE
  // --------------------------------------------------------------------------
  if (nluInput.isExplicitOrderAuthorization && isComplete) {
    nextState.confirmationStatus = 'USER_CONFIRMED';
    nextState.conversationGoal = 'ORDER_COMPLETED';

    return {
      newState: nextState,
      actionDirective: 'CREATE_ORDER',
      responsePrompt: `🎉 Perfect! Your order for ${resolvedProduct?.name} (Size: ${nextState.selectedSize}, Color: ${nextState.selectedColor}) to ${nextState.deliveryLocation} has been confirmed! Total: ${formatNaira(totalNaira || 0)}.`,
      resolvedProduct,
    };
  }

  // --------------------------------------------------------------------------
  // F. GOAL & ACTION DIRECTIVE DETERMINATION
  // --------------------------------------------------------------------------
  if (nluInput.intent === 'CATALOG_DISCOVERY') {
    nextState.conversationGoal = 'CATALOG_EXPLORATION';
    const catList = catalog.map((p) => `• ${p.name} — ${formatNaira(p.price_ngn)}`).join('\n');
    return {
      newState: nextState,
      actionDirective: 'SHOW_CATALOG',
      responsePrompt: `Here are our available items:\n\n${catList}\n\nWhich item would you like to order?`,
    };
  }

  if (nluInput.intent === 'PRICE_INQUIRY' || nluInput.intent === 'PRODUCT_INQUIRY') {
    if (resolvedProduct) {
      nextState.conversationGoal = 'PRODUCT_INQUIRY';
      const sizeStr = resolvedProduct.sizes.length > 0 ? ` (Sizes: ${resolvedProduct.sizes.join(', ')})` : '';
      return {
        newState: nextState,
        actionDirective: 'ANSWER_PRODUCT_INFO',
        responsePrompt: `The ${resolvedProduct.name} is ${formatNaira(resolvedProduct.price_ngn)}${sizeStr}. Would you like to reserve one?`,
        resolvedProduct,
      };
    }
  }

  // If order is ready & complete: Transition to AWAITING_CONFIRMATION
  if (isComplete) {
    nextState.conversationGoal = 'AWAITING_CONFIRMATION';
    nextState.confirmationStatus = 'PENDING_USER_CONFIRMATION';

    return {
      newState: nextState,
      actionDirective: 'PROMPT_CONFIRMATION',
      responsePrompt: `Great choice! ${resolvedProduct?.name} in Size ${nextState.selectedSize} (${nextState.selectedColor}). Delivery to ${nextState.deliveryLocation} is ${formatNaira(deliveryFeeNaira || 0)}. Total is ${formatNaira(totalNaira || 0)}. Should I place the order for you?`,
      resolvedProduct,
    };
  }

  // If missing specific slots: Prompt for next missing slot
  nextState.conversationGoal = 'ORDER_IN_PROGRESS';
  const nextMissingSlot = missing[0];
  let promptText = '';

  if (nextMissingSlot === 'product') {
    const listStr = catalog.map((p) => `• ${p.name} (${formatNaira(p.price_ngn)})`).join('\n');
    promptText = `Which item from our collection would you like to order?\n\n${listStr}`;
  } else if (nextMissingSlot === 'size') {
    promptText = `Got it! What size would you like for the ${resolvedProduct?.name}? Available sizes: ${resolvedProduct?.sizes.join(', ')}.`;
  } else if (nextMissingSlot === 'color') {
    promptText = `What color would you prefer for the ${resolvedProduct?.name}? Available colors: ${resolvedProduct?.colors.join(', ')}.`;
  } else if (nextMissingSlot === 'location') {
    promptText = `Got it! Where would you like us to deliver your ${resolvedProduct?.name}? (e.g. Lekki, Ikeja, Abuja)`;
  }

  return {
    newState: nextState,
    actionDirective: 'PROMPT_MISSING_SLOT',
    responsePrompt: promptText,
    resolvedProduct,
  };
}
