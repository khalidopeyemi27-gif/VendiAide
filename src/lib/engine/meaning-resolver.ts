import { MeaningResolution, ParsedIntent, ConversationCorrelation } from './types';
import { interpretCustomerMessage } from './semantic-interpreter';
import { resolveNigerianLocation } from './nigeria-geography';
import { getVendorDeliveryCoverage } from '../demo/demo-engine';

interface SessionStateContext {
  pendingProductId?: string;
  pendingSize?: string;
  pendingColor?: string;
  pendingLocation?: string;
  pendingPurchaseIntent?: boolean;
  lastProductListIds?: string[];
  lastIntent?: string;
  messages?: { sender: 'customer' | 'ai'; text: string }[];
}

interface ProductItem {
  id: string;
  name: string;
  price_ngn: number;
  sizes: string[];
  colors: string[];
  in_stock: boolean;
  category: string;
}

const PASSIVE_ACK_PATTERN = /^(ok|okay|ok\s+o|okay\s+o|alright|sure|fine|cool|nice|good|understood|no\s+wahala|na\s+so|got\s+it|hmm|oh|alright\s+then)\.?!?$/i;

const OUT_OF_CATALOG_DOMAIN_PATTERN = /\b(?:do\s+you\s+sell|can\s+this|can\s+i|do\s+you\s+have|is\s+this)\s+(rice|food|fly|marry|pizza|edible|snacks?|goats?|cars?|phones?|laptops?|space|rich|cook|model)\b/i;

const CONVERSATIONAL_INTENTS: ParsedIntent[] = [
  'GENERAL_GREETING', 'GREETING', 'SMALL_TALK', 'COMPLIMENT', 'THANKS', 
  'GRATITUDE', 'ACKNOWLEDGEMENT', 'FAREWELL', 'ASSISTANT_IDENTITY', 'NONSENSE', 'OUT_OF_SCOPE'
];

const ITEM_INQUIRY_INTENTS: ParsedIntent[] = [
  'CATALOG_INQUIRY', 'CATALOG_DISCOVERY', 'CATEGORY_DISCOVERY', 'PRODUCT_INQUIRY', 
  'PRICE_INQUIRY', 'PRICE_FILTER', 'AVAILABILITY_INQUIRY', 'SIZE_AVAILABILITY_QUERY', 
  'COLOR_AVAILABILITY_QUERY', 'PRODUCT_DETAILS', 'PRODUCT_COMPARISON', 'PRODUCT_RECOMMENDATION',
  'FIT_QUERY', 'MATERIAL_QUERY', 'MATERIAL_QUESTION', 'QUALITY_QUERY', 'QUALITY_QUESTION',
  'CARE_QUERY', 'AUTHENTICITY_QUERY', 'DELIVERY_QUESTION', 'DELIVERY_RATE_QUERY', 
  'DELIVERY_TIME_QUERY', 'LOCATION_QUERY', 'POLICY_INQUIRY', 'RETURN_POLICY_QUERY',
  'REFUND_POLICY_QUERY', 'EXCHANGE_POLICY_QUERY', 'CANCELLATION_QUERY', 'PAYMENT_QUESTION',
  'PAYMENT_METHOD_QUERY', 'DISCOUNT_QUERY', 'CUSTOMIZATION_QUERY', 'STORE_LOCATION_INQUIRY',
  'UNRELATED_PRODUCT_INQUIRY', 'GENERAL_QUESTION', 'MULTI_QUESTION'
];

const TRANSACTIONAL_INTENTS: ParsedIntent[] = [
  'PURCHASE_INTENT', 'ORDER_CREATION', 'SIZE_SELECTION', 'COLOR_SELECTION', 
  'DELIVERY_LOCATION', 'POSITIONAL_SELECTION', 'CONFIRMATION', 'DECLINE', 'CORRECTION',
  'DISCOUNT_REQUEST'
];

export async function resolveCustomerMeaning(
  userMessageText: string,
  state: SessionStateContext,
  catalog: ProductItem[]
): Promise<MeaningResolution> {
  const rawMsg = userMessageText.trim();
  const normMsg = rawMsg.toLowerCase();

  const aiMessages = (state.messages || []).filter((m) => m.sender === 'ai');
  const lastAiText = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].text.toLowerCase() : '';

  // 1. Semantic Interpretation
  const interpretation = await interpretCustomerMessage(rawMsg, {
    activeProductId: state.pendingProductId,
    pendingProductId: state.pendingProductId,
    pendingSize: state.pendingSize,
    pendingColor: state.pendingColor,
    pendingLocation: state.pendingLocation,
    pendingPurchaseIntent: state.pendingPurchaseIntent,
    lastProductListIds: state.lastProductListIds,
    lastAiMessage: lastAiText,
  });

  const correlation: ConversationCorrelation = interpretation.correlation || {
    isCorrelatedToPrevious: false,
    correlationType: 'NEW_TOPIC',
  };

  const interpAny = interpretation as unknown as Record<string, unknown>;
  const interpEntities = interpretation.entities || {};

  const entities = {
    productId: (interpAny.productId || interpAny.targetProductId || interpEntities.productId || null) as string | null,
    size: (interpAny.size || interpEntities.size || null) as string | null,
    color: (interpAny.color || interpEntities.color || null) as string | null,
    location: (interpAny.location || interpEntities.location || null) as string | null,
    positionalIndex: (interpretation.positionalReference ? interpretation.positionalReference.index : interpEntities.positionalIndex ?? null) as number | null,
    purchaseIntent: Boolean(interpAny.purchaseIntent || interpEntities.purchaseIntent),
  };

  // 2. Check for Passive Acknowledgement Safety Invariant
  const isPassiveAck = PASSIVE_ACK_PATTERN.test(normMsg);
  const aiAskedQuestion = /\b(would you like|do you want|shall i|should i|ready to order|want to place|want to order|want the|want one|interested in|which one)\b/i.test(lastAiText) || /\?$/.test(lastAiText.trim());

  let finalIntent: ParsedIntent = interpretation.intent || 'GREETING';
  if (isPassiveAck && !aiAskedQuestion) {
    finalIntent = 'ACKNOWLEDGEMENT';
  }

  // 3. Multi-Intent Composition & Secondary Intent Detection
  const secondaryIntents: ParsedIntent[] = [];
  const isQuestion = normMsg.includes('how much') || normMsg.includes('do you') || normMsg.includes('can i') || normMsg.includes('what') || normMsg.includes('which') || normMsg.endsWith('?');

  if (/\b(hi|hello|hey|good\s+morning|good\s+afternoon|good\s+evening|howfar|how\s+far|hwfar|xup|yo|sup|wassup|hola|wagwan)\b/i.test(normMsg) && finalIntent !== 'GREETING' && finalIntent !== 'GENERAL_GREETING') {
    secondaryIntents.push('GREETING');
  }
  if (/\b(thanks?|thank you|thx|bless|god bless|oshe|ese|nagode)\b/i.test(normMsg) && finalIntent !== 'THANKS' && finalIntent !== 'GRATITUDE') {
    secondaryIntents.push('GRATITUDE');
  }
  if (/\b(beautiful|lovely|amazing|gorgeous|stunning|fire|clean|dope|mad|top tier|sweet|love|fine|nice|nice collection|una clothes fine|cool|alright|okay|no wahala|na so|correct|got it|great|makes sense)\b/i.test(normMsg) && finalIntent !== 'COMPLIMENT' && finalIntent !== 'ACKNOWLEDGEMENT') {
    secondaryIntents.push('ACKNOWLEDGEMENT');
  }
  if ((normMsg.includes('how much') || normMsg.includes('price') || normMsg.includes('cost')) && finalIntent !== 'PRICE_INQUIRY') {
    secondaryIntents.push('PRICE_INQUIRY');
  }
  if (/\b(wetin\s+una\s+get|wetin\s+una\s+dey\s+sell|what\s+do\s+you\s+have|what\s+do\s+you\s+sell|what\s+items|what\s+products|what's\s+available|show\s+me|catalog|collection)\b/i.test(normMsg) && finalIntent !== 'CATALOG_DISCOVERY' && finalIntent !== 'CATALOG_INQUIRY') {
    secondaryIntents.push('CATALOG_DISCOVERY');
  }
  if (/\bsizes?\b/i.test(normMsg) && isQuestion && finalIntent !== 'SIZE_AVAILABILITY_QUERY' && finalIntent !== 'SIZE_SELECTION') {
    secondaryIntents.push('SIZE_AVAILABILITY_QUERY');
  }
  if (entities.size && !isQuestion && finalIntent !== 'SIZE_SELECTION' && finalIntent !== 'SIZE_AVAILABILITY_QUERY') {
    secondaryIntents.push('SIZE_SELECTION');
  }
  if (entities.color && !isQuestion && finalIntent !== 'COLOR_SELECTION' && finalIntent !== 'COLOR_AVAILABILITY_QUERY') {
    secondaryIntents.push('COLOR_SELECTION');
  }
  if (entities.location && !isQuestion && finalIntent !== 'DELIVERY_LOCATION' && finalIntent !== 'DELIVERY_RATE_QUERY') {
    secondaryIntents.push('DELIVERY_LOCATION');
  }
  if (/\b(delivery|shipping|ship|deliver|how much to send)\b/i.test(normMsg) && finalIntent !== 'DELIVERY_RATE_QUERY') {
    secondaryIntents.push('DELIVERY_RATE_QUERY');
  }
  if (/\b(buy|order|i'll take|take it|reserve|book|send|deliver|bring)\b/i.test(normMsg) && !isQuestion && finalIntent !== 'ORDER_CREATION' && finalIntent !== 'PURCHASE_INTENT') {
    secondaryIntents.push('PURCHASE_INTENT');
  }

  const allIntents = [finalIntent, ...secondaryIntents];

  // 4. Domain Composition Flags (CONVERSATION vs ITEM_INQUIRY vs TRANSACTION)
  const isConversational = allIntents.some((i) => CONVERSATIONAL_INTENTS.includes(i));
  const isItemInquiry = allIntents.some((i) => ITEM_INQUIRY_INTENTS.includes(i));
  const isTransactional = allIntents.some((i) => TRANSACTIONAL_INTENTS.includes(i));

  // Domain Category Precedence: TRANSACTION > ITEM_INQUIRY > CONVERSATION > OTHER
  const domainCategory: MeaningResolution['domainCategory'] = isTransactional
    ? 'TRANSACTION'
    : isItemInquiry
    ? 'ITEM_INQUIRY'
    : isConversational
    ? 'CONVERSATION'
    : 'OTHER';

  // 5. Check for Out-of-Catalog Domain Boundary
  const outOfCatalogMatch = normMsg.match(OUT_OF_CATALOG_DOMAIN_PATTERN);
  const isRidiculousQuestion = Boolean(outOfCatalogMatch);
  let unrelatedItem: string | null = null;
  if (isRidiculousQuestion && outOfCatalogMatch) {
    unrelatedItem = outOfCatalogMatch[1].trim();
  }

  // 6. Grounded Product Match Resolution
  let matchedProduct: ProductItem | null = null;
  if (entities.productId) {
    matchedProduct = catalog.find((p) => p.id === entities.productId) || null;
  }

  // Positional index resolution
  let positionalIndex: number | null = null;
  if (entities.positionalIndex !== undefined && entities.positionalIndex !== null) {
    positionalIndex = entities.positionalIndex;
    const targetList = state.lastProductListIds && state.lastProductListIds.length > 0 ? state.lastProductListIds : catalog.map((p) => p.id);
    if (positionalIndex >= 0 && positionalIndex < targetList.length) {
      const pId = targetList[positionalIndex];
      matchedProduct = catalog.find((p) => p.id === pId) || null;
    }
  }

  if (!matchedProduct) {
    if (/\b(hoodie|hoodies|sweatshirt|jacket|jumper|pullover)\b/i.test(normMsg)) {
      matchedProduct = catalog.find((p) => p.name.toLowerCase().includes('hoodie')) || null;
    } else if (/\b(abaya|abayas|gown|dress|dresses|kaftan|jalabia)\b/i.test(normMsg)) {
      matchedProduct = catalog.find((p) => p.name.toLowerCase().includes('abaya')) || null;
    } else if (/\b(sneaker|sneakers|shoe|shoes|kicks|snkrs|trainers)\b/i.test(normMsg)) {
      matchedProduct = catalog.find((p) => p.name.toLowerCase().includes('sneaker')) || null;
    } else if (state.pendingProductId) {
      matchedProduct = catalog.find((p) => p.id === state.pendingProductId) || null;
    }
  }

  // Grounded Attributes
  const size = entities.size && matchedProduct ? (matchedProduct.sizes.includes(entities.size) ? entities.size : null) : entities.size || null;
  const color = entities.color && matchedProduct ? (matchedProduct.colors.includes(entities.color) ? entities.color : null) : entities.color || null;

  // Location Resolution
  let location: string | null = null;
  const locRes = resolveNigerianLocation(rawMsg);
  if (locRes) {
    location = locRes.name;
  }

  // 7. Explicit State Mutation Authorization Gate
  // Core Invariant: Understanding something != authorization to mutate state.
  // State mutation is authorized ONLY when isTransactional === true (explicit purchase/selection signals).
  const setPendingProductBool = Boolean(matchedProduct && !isPassiveAck && !isRidiculousQuestion && isTransactional);
  const setPendingSizeBool = Boolean(size && !isPassiveAck && isTransactional);
  const setPendingColorBool = Boolean(color && !isPassiveAck && isTransactional);
  const setPendingLocationBool = Boolean(location && !isPassiveAck && isTransactional);
  const setPurchaseIntent = Boolean(
    entities.purchaseIntent && !isPassiveAck && !isRidiculousQuestion && isTransactional
  );
  const shouldMutate = setPendingProductBool || setPendingSizeBool || setPendingColorBool || setPendingLocationBool || setPurchaseIntent;

  // 8. Order Lifecycle State Calculation
  const currentProduct = matchedProduct ? matchedProduct.id : (state.pendingProductId || null);
  const currentSize = size || state.pendingSize || null;
  const currentLocation = location || state.pendingLocation || null;
  const activePurchaseIntent = Boolean(setPurchaseIntent || state.pendingPurchaseIntent || isTransactional);

  let lifecycleState: MeaningResolution['stateMutation']['lifecycleState'] = 'DISCOVERY';
  if ((finalIntent === 'CONFIRMATION' || finalIntent === 'ORDER_CREATION') && currentProduct && currentSize && currentLocation) {
    lifecycleState = 'CHECKOUT_CONFIRMED';
  } else if (currentProduct && currentSize && currentLocation && activePurchaseIntent) {
    lifecycleState = 'READY_FOR_CHECKOUT';
  } else if (currentProduct && (currentSize || currentLocation)) {
    lifecycleState = 'CONFIGURING';
  } else if (currentProduct) {
    lifecycleState = 'PRODUCT_SELECTED';
  }

  // 8. Explicit State Mutation Authorization Gate
  let reason: MeaningResolution['stateMutation']['reason'] = 'NO_AUTHORIZATION';
  if (shouldMutate) {
    if (finalIntent === 'CORRECTION' || correlation.correlationType === 'CORRECTION') {
      reason = 'EXPLICIT_CORRECTION';
    } else if (finalIntent === 'ORDER_CREATION' || finalIntent === 'PURCHASE_INTENT') {
      reason = 'EXPLICIT_PURCHASE_REQUEST';
    } else {
      reason = 'EXPLICIT_SELECTION';
    }
  }

  // Grounded Delivery Facts
  let deliveryConfirmed = false;
  let deliveryFeeNaira: number | null = null;
  let deliveryTimeframe: string | null = null;
  if (location) {
    const coverage = getVendorDeliveryCoverage(location, locRes?.parsed);
    deliveryConfirmed = coverage.isConfirmedCoverage;
    deliveryFeeNaira = coverage.rateNaira || null;
    deliveryTimeframe = coverage.timeframe || null;
  }

  return {
    originalMessage: userMessageText,
    primaryIntent: finalIntent,
    secondaryIntents,
    intent: finalIntent,
    resolvedIntent: finalIntent,
    domainCategory,
    isItemInquiry,
    isConversational,
    isTransactional,
    correlation,
    resolvedEntities: {
      productId: matchedProduct ? matchedProduct.id : null,
      size,
      color,
      location,
      unrelatedItem,
      positionalIndex,
    },
    stateMutation: {
      shouldMutate,
      reason,
      lifecycleState,
      setPendingProduct: setPendingProductBool ? (matchedProduct ? matchedProduct.id : null) : null,
      setPendingSize: setPendingSizeBool ? size : null,
      setPendingColor: setPendingColorBool ? color : null,
      setPendingLocation: setPendingLocationBool ? location : null,
      setPurchaseIntent,
    },
    groundedFacts: {
      productName: matchedProduct ? matchedProduct.name : null,
      priceNaira: matchedProduct ? matchedProduct.price_ngn : null,
      inStock: matchedProduct ? matchedProduct.in_stock : false,
      availableSizes: matchedProduct ? matchedProduct.sizes : [],
      availableColors: matchedProduct ? matchedProduct.colors : [],
      deliveryConfirmed,
      deliveryFeeNaira,
      deliveryTimeframe,
    },
    responseDirective: {
      action: finalIntent,
    },
    isPassiveAcknowledgement: isPassiveAck,
    isRidiculousQuestion,
  };
}
