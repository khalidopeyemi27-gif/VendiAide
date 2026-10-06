import OpenAI from 'openai';
import { env } from '../env';
import { ConversationTurn } from './types';

const apiKey = env.OPENAI_API_KEY;
const isMock = !apiKey || apiKey === 'mock-openai-key';

const openai = isMock ? null : new OpenAI({ apiKey });

export function getActiveModelName(): string {
  return env.OPENAI_MODEL || 'gpt-4o-mini';
}

export async function generateAIResponse(
  systemPrompt: string,
  history: ConversationTurn[],
  userMessage: string
): Promise<{ content: string; promptTokens: number; completionTokens: number; latencyMs: number; model: string }> {
  const startTime = Date.now();
  const modelName = getActiveModelName();

  if (isMock || !openai) {
    // Generate intelligent simulated grounded response for demo & offline mode
    const latencyMs = Date.now() - startTime + 120;
    const mockContent = generateMockFashionResponse(userMessage);
    return {
      content: mockContent,
      promptTokens: 150,
      completionTokens: 60,
      latencyMs,
      model: modelName,
    };
  }

  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((h) => ({
        role: h.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: h.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await openai.chat.completions.create({
      model: modelName,
      messages,
      max_tokens: 350,
      temperature: 0.3,
    });

    const latencyMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content || 'I apologize, but I could not process your query right now.';
    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;

    return {
      content,
      promptTokens,
      completionTokens,
      latencyMs,
      model: modelName,
    };
  } catch (error) {
    console.error('[AIService] OpenAI API call failed:', error);
    const latencyMs = Date.now() - startTime;
    return {
      content: "Thanks for reaching out! We're experiencing a quick delay. Our sales team will get back to you shortly.",
      promptTokens: 0,
      completionTokens: 0,
      latencyMs,
      model: modelName,
    };
  }
}

function generateMockFashionResponse(userMsg: string): string {
  const msg = userMsg.toLowerCase();

  // --- Conversational intents (checked first, lowest commercial priority) ---
  // Farewells
  if (/\b(bye|goodbye|good\s*bye|see\s+you|talk\s+(later|soon)|take\s+care|that'?s?\s+all|i'?ll\s+come\s+back)\b/i.test(msg)) {
    return "You're welcome! Have a great day 😊 Feel free to reach out anytime.";
  }

  // Thanks (pure — no follow-up commercial question detected)
  if (/\b(thanks?|thank you|thx)\b/i.test(msg) &&
      !msg.includes('how much') && !msg.includes('price') && !msg.includes('available') &&
      !msg.includes('size') && !msg.includes('do you have') && !msg.includes('what')) {
    return "You're welcome! 😊 Let me know if you'd like help finding anything else.";
  }

  // Greetings (pure — no follow-up commercial question detected)
  const hasGreeting = /\b(hi|hello|hey|good\s+(morning|afternoon|evening|day)|how are you)\b/i.test(msg);
  const hasCommercialFollow = msg.includes('how much') || msg.includes('price') || msg.includes('available') ||
    msg.includes('what') || msg.includes('do you have') || msg.includes('size') || msg.includes('buy') || msg.includes('order');

  if (hasGreeting && !hasCommercialFollow) {
    if (/\bgood\s+morning\b/i.test(msg)) return 'Good morning! 😊 Welcome to VoguePulse Fashion. How can I help you today?';
    if (/\bgood\s+afternoon\b/i.test(msg)) return 'Good afternoon! 😊 Welcome to VoguePulse Fashion. How can I help you today?';
    if (/\bgood\s+evening\b/i.test(msg)) return 'Good evening! 😊 Welcome to VoguePulse Fashion. How can I help you today?';
    if (/\bhow are you\b/i.test(msg)) return "Hello! I'm doing well, thank you 😊 How can I help you find something today?";
    return 'Hi! 👋 Welcome to VoguePulse Fashion. How can I help you today?';
  }

  // Compliments (no commercial follow-up)
  const hasCompliment = /\b(beautiful|lovely|amazing|gorgeous|stunning|fantastic|wonderful|nice|love|cute|perfect|incredible)\b/i.test(msg);
  if (hasCompliment && !hasCommercialFollow && !msg.includes('hoodie') && !msg.includes('abaya') && !msg.includes('sneaker')) {
    return "Thank you! 😊 I'm glad you like it. Would you like to see what's currently available in our catalog?";
  }

  // --- Commercial intents ---
  if (msg.includes('hoodie') || msg.includes('black oversized')) {
    return 'Our Black Oversized Hoodie is in stock! It is ₦25,000 and available in sizes M, L, and XL. Delivery in Lagos is ₦2,500. Would you like to order one today? What size do you need?';
  }

  if (msg.includes('abaya')) {
    return 'Our Black Velvet Abaya is ₦35,000 (includes matching Sheila headscarf). Sizes available: M, L, XL. Would you like us to reserve one for you?';
  }

  if (msg.includes('sneaker') || msg.includes('shoe') || msg.includes('sneakers')) {
    return 'Our White Premium Sneakers are ₦45,000, available in sizes 40 to 45. What shoe size are you looking for?';
  }

  if (msg.includes('price') || msg.includes('how much')) {
    return 'Here are our current items:\n- Black Oversized Hoodie: ₦25,000\n- Black Velvet Abaya: ₦35,000\n- White Premium Sneakers: ₦45,000\n\nWhich item would you like to get?';
  }

  if (msg.includes('buy') || msg.includes('order') || msg.includes('pay') || msg.includes('account')) {
    return 'Awesome! To complete your order, please reply with your Full Name, Phone Number, Delivery Address, and preferred Item/Size. Official payment details will be provided at order checkout!';
  }

  if (msg.includes('delivery') || msg.includes('shipping') || msg.includes('lagos')) {
    return 'Delivery within Lagos is ₦2,500 (24-48 hours). Delivery to other states across Nigeria is ₦5,000 (3-5 days). What state are you located in?';
  }

  return "Welcome to VoguePulse Fashion! We have Black Oversized Hoodies (₦25,000), Black Velvet Abayas (₦35,000), and White Premium Sneakers (₦45,000) in stock. How can I help you with your order today?";
}

