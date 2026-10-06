import { SemanticInterpretation, ConversationCorrelation } from './types';
import { extractColorFromMessage, extractSizeFromMessage, extractLocationFromMessage, extractPriceFilter } from '../demo/demo-engine';

export interface InterpretationContext {
  activeProductId?: string;
  pendingProductId?: string;
  pendingSize?: string;
  pendingColor?: string;
  pendingLocation?: string;
  pendingPurchaseIntent?: boolean;
  lastProductListIds?: string[];
  lastAiMessage?: string;
  recentTurns?: { sender: 'customer' | 'ai'; text: string }[];
}

/**
 * Conversation History Correlation Analyzer.
 * Inspects previous conversation turns & AI prompts to see if the new customer message
 * is related, answers an open question, refers to a list item, or introduces a new topic.
 */
function analyzeConversationCorrelation(
  userMsg: string,
  context?: InterpretationContext,
  entities?: { size?: string | null; color?: string | null; location?: string | null; positionalReference?: SemanticInterpretation['positionalReference'] }
): ConversationCorrelation {
  const lastAiText = (context?.lastAiMessage || '').toLowerCase();
  const activeProductId = context?.pendingProductId || context?.activeProductId || null;
  const hasList = Boolean(context?.lastProductListIds && context.lastProductListIds.length > 0);

  if (!lastAiText && !activeProductId && !hasList) {
    return {
      isCorrelatedToPrevious: false,
      correlationType: 'NEW_TOPIC',
    };
  }

  // 1. Prompt Correlation — AI asked a question in the previous turn
  const aiAskedForSize = /\b(what size|which size|available size|size would you like|size do you need|shoe size)\b/i.test(lastAiText);
  const aiAskedForLocation = /\b(where|delivery location|address|which city|state|location|where are you located)\b/i.test(lastAiText);
  const aiAskedForConfirmation = /\b(would you like|place an order|confirm|reserve|shall i book)\b/i.test(lastAiText);

  if (aiAskedForSize && entities?.size) {
    return {
      isCorrelatedToPrevious: true,
      correlationType: 'ANSWERING_AI_QUESTION',
      targetQuestionType: 'SIZE',
      targetProductId: activeProductId,
    };
  }

  if (aiAskedForLocation && entities?.location) {
    return {
      isCorrelatedToPrevious: true,
      correlationType: 'ANSWERING_AI_QUESTION',
      targetQuestionType: 'LOCATION',
      targetProductId: activeProductId,
    };
  }

  if (aiAskedForConfirmation && (userMsg.includes('yes') || userMsg.includes('ok') || userMsg.includes('sure') || userMsg.includes('manage am'))) {
    return {
      isCorrelatedToPrevious: true,
      correlationType: 'ANSWERING_AI_QUESTION',
      targetQuestionType: 'CONFIRMATION',
      targetProductId: activeProductId,
    };
  }

  // 2. Positional Selection Correlation
  if (entities?.positionalReference && hasList) {
    return {
      isCorrelatedToPrevious: true,
      correlationType: 'POSITIONAL_SELECTION',
      targetProductId: context?.lastProductListIds?.[entities.positionalReference.index ? (entities.positionalReference.index > 0 ? entities.positionalReference.index - 1 : context.lastProductListIds.length - 1) : 0] || null,
    };
  }

  // 3. Correction Correlation
  if (/\b(no,?\s+)?(i\s+meant|i\s+was\s+referring\s+to|i\s+said|i\s+mean|instead|actually|not\s+black|not\s+large)\b/i.test(userMsg)) {
    return {
      isCorrelatedToPrevious: true,
      correlationType: 'CORRECTION',
      targetProductId: activeProductId,
    };
  }

  // 4. Product Follow-up Correlation
  if (activeProductId && (entities?.size || entities?.color || entities?.location || userMsg.includes('how much') || userMsg.includes('price') || userMsg.includes('buy') || userMsg.includes('order'))) {
    return {
      isCorrelatedToPrevious: true,
      correlationType: 'PRODUCT_FOLLOWUP',
      targetProductId: activeProductId,
    };
  }

  // 5. Casual Interruption during active context
  if (activeProductId && /\b(beautiful|lovely|amazing|thanks|god bless|where is your shop|how are you|how body)\b/i.test(userMsg)) {
    return {
      isCorrelatedToPrevious: true,
      correlationType: 'CASUAL_INTERRUPTION',
      targetProductId: activeProductId,
    };
  }

  return {
    isCorrelatedToPrevious: Boolean(activeProductId || hasList),
    correlationType: activeProductId || hasList ? 'PRODUCT_FOLLOWUP' : 'NEW_TOPIC',
    targetProductId: activeProductId,
  };
}

/**
 * Semantic AI/ML Interpreter for VendiAide.
 * Interprets natural language, Nigerian English, Pidgin, slang, entities, and intent.
 * Evaluates previous conversation turns to determine correlation and context continuity.
 * AI interprets -> Code decides -> Database verifies -> AI communicates.
 */
export async function interpretCustomerMessage(
  userMessageText: string,
  context?: InterpretationContext
): Promise<SemanticInterpretation> {
  const msg = userMessageText.trim().toLowerCase();
  const rawMsg = userMessageText.trim();

  // 1. Check for Nonsense / Keyboard Mash / Emoji Spam
  const validWords = /\b(howfar|hwfar|abeg|wetin|nagode|thanks|thankyou|gorgeous|beautiful|stunning|incredible|wonderful|fantastic|goodnight|afternoon|evening|morning|sweatshirt|sneakers)\b/i;
  if (!validWords.test(msg) && (/^[asdfghjklzxcvbnmqwertyuiop]{7,}$/i.test(msg) || /^(.)\1{4,}$/i.test(msg) || /\b(asdfghjkl|qwertyuiop|zxcvbnm|lololol|bruh|lmao|rofl|hhhhh)\b/i.test(msg))) {
    return {
      intent: 'NONSENSE',
      confidence: 0.98,
      isNonsense: true,
      correlation: { isCorrelatedToPrevious: false, correlationType: 'NEW_TOPIC' },
    };
  }

  // 2. Check for Off-Topic / Unrelated Product Inquiries
  const unrelatedMatch = msg.match(/\b(?:do\s+you\s+sell|do\s+you\s+have|can\s+this|do\s+you\s+people\s+sell)\s+(snacks?|food|goats?|cars?|phones?|laptops?|rice|pizza|houses?|space|rich|cook)\b/i);
  if (unrelatedMatch) {
    const item = unrelatedMatch[1].toLowerCase();
    return {
      intent: 'UNRELATED_PRODUCT_INQUIRY',
      confidence: 0.99,
      unrelatedItem: item,
      correlation: { isCorrelatedToPrevious: false, correlationType: 'NEW_TOPIC' },
    };
  }

  // 3. Extract Core Entities
  const extractedColor = extractColorFromMessage(rawMsg);
  const aiAskedForSize = Boolean(context?.lastAiMessage && /\b(size|sizes)\b/i.test(context.lastAiMessage));
  const isExplicitSizeContext = aiAskedForSize || /\b(size|sizes)\b/i.test(rawMsg);
  const extractedSize = extractSizeFromMessage(rawMsg, null, isExplicitSizeContext);
  const extractedLocation = extractLocationFromMessage(rawMsg, false)?.name;
  const priceFilter = extractPriceFilter(msg);

  // 4. Positional References ("the 1st one", "the 2nd one", "number 2", "last one", "#3")
  let positionalReference: SemanticInterpretation['positionalReference'] = null;
  const wordPosMatch = msg.match(/\b(first|1st|second|2nd|third|3rd|fourth|4th|fifth|5th|last|final)\b/i);
  const digitPosMatch = msg.match(/^(?:number|option|item|no\.?|num\.?|#)?\s*(\d+)$/i) ||
    msg.match(/\b(?:number|option|item|no\.?|num\.?|#)\s*(\d+)\b/i);

  if (wordPosMatch) {
    const term = wordPosMatch[1].toLowerCase();
    let idx = 1;
    if (term === 'first' || term === '1st') idx = 1;
    else if (term === 'second' || term === '2nd') idx = 2;
    else if (term === 'third' || term === '3rd') idx = 3;
    else if (term === 'fourth' || term === '4th') idx = 4;
    else if (term === 'fifth' || term === '5th') idx = 5;
    else if (term === 'last' || term === 'final') idx = -1;

    positionalReference = {
      type: 'POSITIONAL',
      index: idx,
      rawKeyword: wordPosMatch[0],
    };
  } else if (digitPosMatch) {
    const parsedIdx = parseInt(digitPosMatch[1], 10);
    const isExplicitPosPrefix = /^(?:number|option|item|no\.?|num\.?|#)/i.test(msg.trim());
    if (parsedIdx > 0 && (parsedIdx < 35 || parsedIdx > 46 || isExplicitPosPrefix)) {
      positionalReference = {
        type: 'POSITIONAL',
        index: parsedIdx,
        rawKeyword: digitPosMatch[0],
      };
    }
  }

  // 5. Compute Conversation Correlation
  const correlation = analyzeConversationCorrelation(msg, context, {
    size: extractedSize,
    color: extractedColor,
    location: extractedLocation,
    positionalReference,
  });

  // 6. Check Multi-Question
  const questionCount = (msg.match(/\?/g) || []).length;
  const hasMultipleInquiries =
    (msg.includes('how much') || msg.includes('price')) &&
    (msg.includes('size') || msg.includes('delivery') || msg.includes('to'));

  if (hasMultipleInquiries || questionCount > 1) {
    const subIntents: SemanticInterpretation[] = [];
    if (msg.includes('how much') || msg.includes('price')) {
      subIntents.push({ intent: 'PRICE_INQUIRY', confidence: 0.95 });
    }
    if (msg.includes('size')) {
      subIntents.push({ intent: 'SIZE_AVAILABILITY_QUERY', confidence: 0.95, size: extractedSize || null });
    }
    if (msg.includes('delivery') || msg.includes('to') || extractedLocation) {
      subIntents.push({ intent: 'DELIVERY_RATE_QUERY', confidence: 0.95, location: extractedLocation || null });
    }

    if (subIntents.length > 1) {
      return {
        intent: 'MULTI_QUESTION',
        confidence: 0.96,
        isMultiQuestion: true,
        multiQuestions: subIntents,
        size: extractedSize || null,
        color: extractedColor || null,
        location: extractedLocation || null,
        correlation,
      };
    }
  }

  // 7. Conversational Greetings & Social
  if (/\b(hi|hello|hey|good\s+morning|good\s+afternoon|good\s+evening|howfar|hwfar|xup|yo|sup|wassup|hola|heyyy|how are you|you dey okay|how you dey)\b/i.test(msg) &&
      !msg.includes('how much') && !msg.includes('price') && !msg.includes('available') && !msg.includes('hoodie') && !msg.includes('abaya') && !msg.includes('sneaker') &&
      !/\b(wetin\s+una\s+get|wetin\s+una\s+dey\s+sell|what\s+do\s+you\s+have|what\s+do\s+you\s+sell|what\s+items|what\s+products|what's\s+available|show\s+me|catalog|collection)\b/i.test(msg) &&
      !/\b(good\s+night|have\s+a\s+good|goodbye|bye|see\s+you|later|take\s+care|gotta\s+go|ttyl|peace\s+out)\b/i.test(msg)) {
    return {
      intent: 'GENERAL_GREETING',
      confidence: 0.98,
      correlation,
    };
  }

  if (/\b(how was your day|how your day|how body|how work|how business|how life|how e dey go|how things dey go|how far with life|you dey sleep|wetin you dey do|hope sales fine|how market|hope you dey fine|hope you dey okay|how everything|e dey go|how have you been|how('?s| is) it going|long time no see|what('?s| is) new|what('?s| is) good|how('?s| is) life treating you|how('?s| is) everything|what have you been up to|how('?s| is) things|what('?s| is) happening|what('?s| is) the vibe|do you sleep|do you eat|are you real|what do you do for fun|i('?m| am) bored|that('?s| is) life|life is hard|it is what it is)\b/i.test(msg) &&
      !msg.includes('how much') && !msg.includes('price') && !msg.includes('available') && !msg.includes('hoodie') && !msg.includes('abaya') && !msg.includes('sneaker')) {
    return {
      intent: 'SMALL_TALK',
      confidence: 0.95,
      correlation,
    };
  }

  // 7b. Casual Browsing / Window Shopping
  if (/\b(i just dey check|just dey check|i dey check|i just dey look|just dey look|i dey look around|dey look around|na window shopping|window shopping|just checking|just looking|just browsing|i wan see wetin una get|make i see|let me see|i wan look|dey window shop|i('?m| am) just browsing|i('?m| am) just looking|i('?m| am) just checking|looking around|checking things out|just window shopping|browsing around|exploring)\b/i.test(msg)) {
    return {
      intent: 'CASUAL_BROWSING',
      confidence: 0.95,
      correlation,
    };
  }

  // 7c. Exclamations & Reactions (Nigerian + English)
  if (/^(na wa o|na wa|chai|omo|God dey|we dey|i dey o?|e go be|na so|wahala|walahi|wallahi|abeg o|haba|kilode|ko le werk|ah ah|eh eh|ehn|hmm+|lol|lmao|haha|😂|🤣|true true|for real|on God|swear|i swear|wow|omg|oh my god|oh wow|damn|dang|whoa|no way|seriously|really|for real|that('?s| is) crazy|that('?s| is) wild|that('?s| is) funny|haha that('?s| is) funny|interesting|i see|oh okay|oh|oh nice|oh cool|hmm interesting|fair enough)$/i.test(msg.trim())) {
    return {
      intent: 'REACTION',
      confidence: 0.94,
      correlation,
    };
  }

  // 7d. Farewell / Coming Back (Pidgin + English)
  if (/\b(i go come back|i dey come back|make i dey go|i wan comot|we go talk later|we go yarn later|i go check back|see you|bye|byebye|goodbye|go well|take care|till next time|make i bounce|i dey go|i dey leave|catch you later|talk to you later|talk later|i('?ll| will) be back|i('?ll| will) come back|have a good day|have a good one|have a great day|have a nice day|good night|gotta go|got to go|ttyl|peace|peace out|later|see ya|until next time|i('?m| am) out)\b/i.test(msg) &&
      !msg.includes('how much') && !msg.includes('price') && !msg.includes('buy') && !/\border\b/i.test(msg)) {
    return {
      intent: 'FAREWELL',
      confidence: 0.96,
      correlation,
    };
  }

  // 7e. Apology / Reassurance (Pidgin + English)
  if (/\b(no vex|abeg no vex|sorry o|i no mean am|my bad|pardon|forgive me|e no go happen again|sorry for the delay|sorry for delay|i('?m| am) sorry|so sorry|apologies|i apologize|excuse me|didn('?t| not) mean to|oops)\b/i.test(msg) &&
      !msg.includes('how much') && !msg.includes('price') && !msg.includes('return') && !msg.includes('refund')) {
    return {
      intent: 'APOLOGY',
      confidence: 0.95,
      correlation,
    };
  }

  // 7f. Presence Check
  if (/\b(you there|are you there|are you still there|hello\??|anyone there|still there|you still dey|you dey online|are you online|can you hear me)\b/i.test(msg) &&
      msg.trim().split(/\s+/).length <= 6) {
    return {
      intent: 'PRESENCE_CHECK',
      confidence: 0.96,
      correlation,
    };
  }

  if (/\b(who (is|be) (your|the) owner|who build (you|this)|are you (a )?(robot|ai|bot|human)|you be (robot|ai|bot|human)|what is your name|wetin be your name|tell me about yourself|what can you do|what do you do)\b/i.test(msg)) {
    return {
      intent: 'ASSISTANT_IDENTITY',
      confidence: 0.98,
      correlation,
    };
  }

  if (/\b(beautiful|lovely|amazing|gorgeous|stunning|fire|clean|dope|mad|top tier|sweet|love|fine|nice|nice collection|una clothes fine)\b/i.test(msg) &&
      !msg.includes('how much') && !msg.includes('buy') && !msg.includes('order')) {
    return {
      intent: 'COMPLIMENT',
      confidence: 0.96,
      correlation,
    };
  }

  if (/\b(thanks?|thank you|thx|bless|god bless|oshe|ese|nagode)\b/i.test(msg) &&
      !msg.includes('how much') && !msg.includes('size') && !msg.includes('hoodie')) {
    return {
      intent: 'GRATITUDE',
      confidence: 0.97,
      correlation,
    };
  }

  if (/^(ok|okay|alright|cool|nice|got it|understood|makes sense|no problem|no wahala|i hear you|i don hear|noted|roger|copy|sabi|i sabi|okay o|alright o|ehen|okay na|alright na|sure|make we see|we go see|e be like say|sha|true|tru|word|bet|no worries|that('?s| is) cool|that('?s| is) fine|fair enough|right|yep|yup|yeah|mhm|uh huh|i see|not much|not really|same|same here|nothing much|i('?m| am) good|all good|we('?re| are) good|sounds good|sounds great|perfect)$/i.test(msg.trim())) {
    return {
      intent: 'ACKNOWLEDGEMENT',
      confidence: 0.99,
      acknowledgement: true,
      correlation,
    };
  }

  if (/\b(correct!?\s+do\s+am|do\s+am|confirm\s+order|place\s+order|go\s+ahead|proceed|yes\s+confirm|yes\s+do\s+am)\b/i.test(msg)) {
    return {
      intent: 'CONFIRMATION',
      confidence: 0.98,
      correlation,
    };
  }

  if (/\b(last price|wetin be last price|discount dey|is there discount)\b/i.test(msg)) {
    return {
      intent: 'DISCOUNT_QUERY',
      confidence: 0.96,
      correlation,
    };
  }

  if (/\b(reduce|discount|slash|cheaper|cut|less|remove|bargain|reduce am|slash price|cut price)\b/i.test(msg)) {
    return {
      intent: 'DISCOUNT_REQUEST',
      confidence: 0.96,
      correlation,
    };
  }

  // 8. Corrections
  if (/\b(no,?\s+)?(i\s+meant|i\s+was\s+referring\s+to|i\s+said|i\s+mean|instead|actually|wait)\b/i.test(msg)) {
    return {
      intent: 'CORRECTION',
      confidence: 0.95,
      productName: msg.includes('abaya') ? 'Black Velvet Abaya' : msg.includes('hoodie') ? 'Black Oversized Hoodie' : msg.includes('sneakers') || msg.includes('shoe') ? 'White Premium Sneakers' : null,
      size: extractedSize || null,
      color: extractedColor || null,
      correlation,
    };
  }

  // 9. Size & Color Inquiries vs Selections
  if (/\bsizes?\b/i.test(msg) && !extractedSize && !msg.includes('how much')) {
    return {
      intent: 'SIZE_AVAILABILITY_QUERY',
      confidence: 0.95,
      correlation,
    };
  }

  if (extractedSize && (msg.includes('make am') || msg.includes('i want') || msg.includes('give me') || /^(s|m|l|xl|xxl|large|medium|small|extra\s+large|\d{2})$/i.test(msg.trim()))) {
    return {
      intent: 'SIZE_SELECTION',
      confidence: 0.97,
      size: extractedSize,
      correlation,
    };
  }

  // 10. Explicit Purchase & Nigerian Reservation Language
  const isExplicitPurchaseReq = /\b(buy|order|i'?ll?\s+take|take\s+it|i\s+want\s+to\s+buy|send\s+am|deliver\s+am|reserve|book|place\s+order|abeg\s+reserve\s+am|reserve\s+am|abeg\s+keep\s+am|keep\s+this\s+one|hold\s+am|hold\s+this\s+one|reserve\s+this\s+one|keep\s+am)\b/i.test(msg);

  if (positionalReference || isExplicitPurchaseReq) {
    return {
      intent: 'PURCHASE_INTENT',
      confidence: 0.96,
      purchaseIntent: true,
      positionalReference,
      size: extractedSize || null,
      color: extractedColor || null,
      location: extractedLocation || null,
      correlation,
    };
  }

  if (/\b(colou?rs?|another\s+colou?r|other\s+colou?rs?|different\s+colou?r|only\s+black|only\s+in\s+black|is\s+it\s+only|na\s+only|any\s+other\s+colou?r|do\s+you\s+have\s+another\s+colou?r)\b/i.test(msg)) {
    return {
      intent: 'COLOR_AVAILABILITY_QUERY',
      confidence: 0.96,
      color: extractedColor || null,
      correlation,
    };
  }

  if (extractedColor && (msg.includes('let\'s go with') || msg.includes('give me') || msg.includes('in black') || msg.includes('for black'))) {
    return {
      intent: 'COLOR_SELECTION',
      confidence: 0.96,
      color: extractedColor,
      purchaseIntent: msg.includes('let\'s go with') || msg.includes('give me'),
      correlation,
    };
  }

  // 11. Catalog Discovery & Category Queries
  if (/\b(wetin\s+una\s+get|wetin\s+una\s+dey\s+sell|show me|show catalog|what do you sell|what are you selling|what do you have|what items|what products|what's available|show me clothes|show me collection|see your collection)\b/i.test(msg)) {
    return {
      intent: 'CATALOG_DISCOVERY',
      confidence: 0.97,
      priceFilter: priceFilter ? { maxPrice: priceFilter.lte || priceFilter.lt, minPrice: priceFilter.gte || priceFilter.gt, exactPrice: priceFilter.eq, ...priceFilter } : null,
      correlation,
    };
  }

  if (/\b(do\s+you\s+have|una\s+get|do\s+you\s+sell|any|are\s+there)\s+(hoodies?|abayas?|sneakers?|shoes?|dresses?|gowns?|black|white|red|blue|gold)\b/i.test(msg)) {
    const cat = msg.includes('hoodie') ? 'hoodies' : msg.includes('abaya') || msg.includes('dress') || msg.includes('gown') ? 'dresses' : msg.includes('sneaker') || msg.includes('shoe') ? 'sneakers' : null;
    return {
      intent: 'CATEGORY_DISCOVERY',
      confidence: 0.96,
      category: cat,
      color: extractedColor || null,
      size: extractedSize || null,
      correlation,
    };
  }

  // 12. Delivery Location & Rate Commands
  if (/\b(send|bring|deliver|ship)\s+(am|it|this|them)?\s*(go|to)\b/i.test(msg) || (extractedLocation && /\b(send|bring|deliver|ship|location)\b/i.test(msg))) {
    return {
      intent: 'DELIVERY_LOCATION',
      confidence: 0.96,
      location: extractedLocation || null,
      size: extractedSize || null,
      color: extractedColor || null,
      purchaseIntent: true,
      correlation,
    };
  }

  if (/\b(delivery|shipping|ship|how much to|send to|deliver to)\b/i.test(msg)) {
    return {
      intent: 'DELIVERY_RATE_QUERY',
      confidence: 0.96,
      location: extractedLocation || null,
      correlation,
    };
  }

  // 13. Fallback Default
  return {
    intent: 'PRODUCT_INQUIRY',
    confidence: 0.85,
    size: extractedSize || null,
    color: extractedColor || null,
    location: extractedLocation || null,
    positionalReference,
    correlation,
  };
}
