/**
 * VENDIAIDE GEMINI NLU SIDECAR MODULE — PRODUCTION HARDENED EDITION
 *
 * Gemini API is used STRICTLY as a read-only Intent & Entity Extractor (NLU/NER).
 * It translates messy Nigerian Pidgin, English, interjections, and slang into structured JSON.
 *
 * 🛑 CRITICAL ARCHITECTURAL BOUNDARY:
 * Gemini is READ-ONLY. It NEVER mutates state, calculates prices/delivery rates, or creates orders.
 * The VendiAide Deterministic Engine remains 100% in control of state, calculations, and authorization.
 */

import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// ============================================================================
// 1. SCHEMAS & TYPES
// ============================================================================

export const GeminiNLUIntentEnum = z.enum([
  'CATALOG_DISCOVERY',
  'PRODUCT_INQUIRY',
  'PRICE_INQUIRY',
  'COLOR_AVAILABILITY_QUERY',
  'AVAILABILITY_INQUIRY',
  'PURCHASE_INTENT',
  'ORDER_STATUS_INQUIRY',
  'ORDER_TOTAL_INQUIRY',
  'DECLINE',
  'GENERAL_QUESTION',
]);

export type GeminiNLUIntent = z.infer<typeof GeminiNLUIntentEnum>;

export const GeminiNLUResponseSchema = z.object({
  intent: GeminiNLUIntentEnum,
  extractedProduct: z.string().nullable().optional(),
  extractedSize: z.string().nullable().optional(),
  extractedColor: z.string().nullable().optional(),
  extractedLocation: z.string().nullable().optional(),
  isExplicitOrderAuthorization: z.boolean().default(false),
  isCancellation: z.boolean().default(false),
  confidenceScore: z.number().nullable().optional(),
  reasoningBrief: z.string().nullable().optional(),
});

export type GeminiNLUResponse = z.infer<typeof GeminiNLUResponseSchema>;

export interface RecentTurn {
  sender: 'customer' | 'assistant';
  text: string;
}

export interface GeminiNLUContext {
  activeProductName?: string;
  activeSize?: string;
  activeLocation?: string;
  pendingOrderCount?: number;
  catalogProducts?: string[];
  recentTurns?: RecentTurn[];
}

export type FallbackReason =
  | 'timeout'
  | 'network_error'
  | 'http_error'
  | 'invalid_response'
  | 'schema_validation'
  | 'quota'
  | 'unknown';

export interface NLUMetrics {
  source: 'gemini' | 'fallback';
  intent?: GeminiNLUIntent;
  latencyMs: number;
  success: boolean;
  fallbackReason?: FallbackReason;
  timestamp: string;
}

// ============================================================================
// 2. OBSERVABILITY & TELEMETRY BUFFER
// ============================================================================

const nluMetricsBuffer: NLUMetrics[] = [];
const nluListeners: Array<(metric: NLUMetrics) => void> = [];

export function recordNLUMetric(metric: NLUMetrics): void {
  nluMetricsBuffer.push(metric);
  if (nluMetricsBuffer.length > 500) {
    nluMetricsBuffer.shift();
  }
  for (const listener of nluListeners) {
    try {
      listener(metric);
    } catch {
      // Ignore listener error
    }
  }
}

export function getNLUMetricsHistory(): NLUMetrics[] {
  return [...nluMetricsBuffer];
}

export function clearNLUMetricsBuffer(): void {
  nluMetricsBuffer.length = 0;
}

export function onNLUMetric(listener: (metric: NLUMetrics) => void): () => void {
  nluListeners.push(listener);
  return () => {
    const idx = nluListeners.indexOf(listener);
    if (idx !== -1) nluListeners.splice(idx, 1);
  };
}

// ============================================================================
// 3. SYSTEM PROMPT & NATIVE GEMINI SCHEMA DEFINITION
// ============================================================================

const SYSTEM_NLU_INSTRUCTION = `
You are the NLU (Natural Language Understanding) entity & intent parser for VendiAide, an e-commerce assistant operating in Nigeria.
Your SOLE job is to extract structured intent and commercial entities (product, size, color, location, cancellation, explicit authorization) from the customer's message into JSON.

CUSTOMER LANGUAGE PATTERNS TO UNDERSTAND:
- Nigerian Pidgin: "abeg make you keep that black one for me" -> product: "black one", intent: "PURCHASE_INTENT"
- "i wan buy something" -> intent: "CATALOG_DISCOVERY", product: null (NO specific product specified)
- "is it only the 3 goods you have?" / "na only these three goods una get?" -> intent: "CATALOG_DISCOVERY", product: null (Scope/inventory count query, NOT item 3 selection)
- "bring am like that" / "leave am like that" -> intent: "PURCHASE_INTENT", retains active product
- "how much altogether" / "how much be everything" -> intent: "ORDER_TOTAL_INQUIRY"
- "do you have 30" / "you get 30?" / "is 30 available?" -> size: "30", product: null (Numeric size inquiry, NOT a product named "30")
- "make am large" / "give me L" / "42" -> size: "L" or "42"
- "send to Ikeja" / "I dey Lekki" / "Lekki" -> location: "Ikeja" / "Lekki"
- "abeg no order am" / "cancel" / "cancel that" -> isCancellation: true, intent: "DECLINE"
- "yes do am" / "confirm order" -> isExplicitOrderAuthorization: true

CONTEXTUAL PRONOUN RESOLUTION:
- Use recent conversation history to resolve pronouns ("it", "them", "that one", "same size", "what about delivery?").
- If previous turn discussed "black sneakers" and customer says "Can you deliver them to Lekki?", extractedProduct is "black sneakers" and extractedLocation is "Lekki".
- If assistant asked "What size do you need?" and customer says "42", extractedSize is "42".

CATEGORIES AVAILABLE:
- Catalog Products: Black Oversized Hoodie, Black Velvet Abaya, White Premium Sneakers.
`;

const NATIVE_GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    intent: {
      type: 'STRING',
      enum: [
        'CATALOG_DISCOVERY',
        'PRODUCT_INQUIRY',
        'PRICE_INQUIRY',
        'COLOR_AVAILABILITY_QUERY',
        'AVAILABILITY_INQUIRY',
        'PURCHASE_INTENT',
        'ORDER_STATUS_INQUIRY',
        'ORDER_TOTAL_INQUIRY',
        'DECLINE',
        'GENERAL_QUESTION',
      ],
    },
    extractedProduct: { type: 'STRING', nullable: true },
    extractedSize: { type: 'STRING', nullable: true },
    extractedColor: { type: 'STRING', nullable: true },
    extractedLocation: { type: 'STRING', nullable: true },
    isExplicitOrderAuthorization: { type: 'BOOLEAN' },
    isCancellation: { type: 'BOOLEAN' },
    confidenceScore: { type: 'NUMBER', nullable: true },
    reasoningBrief: { type: 'STRING', nullable: true },
  },
  required: ['intent', 'isExplicitOrderAuthorization', 'isCancellation'],
};

// ============================================================================
// 4. SECURITY & SANITIZATION HELPER
// ============================================================================

export function sanitizeForPrompt(text: string): string {
  if (!text) return '';
  return text
    // Redact potential API keys or secret tokens
    .replace(/\b(?:AIza|AQ\.|sk-|bearer\s+)[A-Za-z0-9_\-]{15,}\b/gi, '[REDACTED_KEY]')
    // Redact potential credit card numbers (13-19 digits)
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[REDACTED_CARD]')
    // Redact passwords or secret key patterns
    .replace(/(?:password|secret|key|token)\s*=\s*\S+/gi, '[REDACTED_SECRET]');
}

// ============================================================================
// 5. API KEY DISCOVERY
// ============================================================================

export function getApiKey(): string | undefined {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;

  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^GEMINI_API_KEY\s*=\s*(.+)$/m);
      if (match) {
        return match[1].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // Ignore error
  }
  return undefined;
}

// ============================================================================
// 6. MAIN PARSER WITH NATIVE STRUCTURED OUTPUT, TIMEOUT & RESILIENCY
// ============================================================================

const GEMINI_NLU_TIMEOUT_MS = 2500;

/**
 * Parses a customer message using Gemini Free API with native structured output (responseSchema),
 * a strict 2.5-second timeout budget (AbortController), Zod validation, and structured telemetry.
 * If unconfigured, timed out, or invalid, returns undefined for 100% seamless fallback.
 */
export async function parseCustomerMessageWithGemini(
  userMessage: string,
  context?: GeminiNLUContext
): Promise<GeminiNLUResponse | undefined> {
  const startTime = Date.now();
  const apiKey = getApiKey();

  if (!apiKey) {
    const latencyMs = Date.now() - startTime;
    recordNLUMetric({
      source: 'fallback',
      latencyMs,
      success: false,
      fallbackReason: 'invalid_response',
      timestamp: new Date().toISOString(),
    });
    return undefined;
  }

  // Single top-level AbortController for strict 2.5-second NLU budget
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_NLU_TIMEOUT_MS);

  // Build lightweight context prompt (max 3 turns)
  const sanitizedUserMessage = sanitizeForPrompt(userMessage);
  const recentTurns = (context?.recentTurns || []).slice(-3);
  let contextBlock = `Active Product Context: ${context?.activeProductName || 'None'}\nActive Size Context: ${context?.activeSize || 'None'}\nActive Location Context: ${context?.activeLocation || 'None'}\nPending Orders: ${context?.pendingOrderCount || 0}`;

  if (recentTurns.length > 0) {
    contextBlock += '\n\nRecent Conversation History:\n';
    contextBlock += recentTurns
      .map((t) => `${t.sender.toUpperCase()}: "${sanitizeForPrompt(t.text)}"`)
      .join('\n');
  }

  const prompt = `${contextBlock}\n\nCurrent Customer Message:\n"${sanitizedUserMessage}"`;

  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
  let fallbackReason: FallbackReason = 'unknown';

  try {
    for (const modelName of models) {
      if (controller.signal.aborted) {
        fallbackReason = 'timeout';
        break;
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_NLU_INSTRUCTION }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
              responseSchema: NATIVE_GEMINI_RESPONSE_SCHEMA,
            },
          }),
        });

        if (response.status === 429) {
          fallbackReason = 'quota';
          continue;
        }

        if (!response.ok) {
          fallbackReason = 'http_error';
          continue;
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
          fallbackReason = 'invalid_response';
          continue;
        }

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(rawText);
        } catch {
          fallbackReason = 'invalid_response';
          continue;
        }

        const validation = GeminiNLUResponseSchema.safeParse(parsedJson);
        if (!validation.success) {
          fallbackReason = 'schema_validation';
          continue;
        }

        const validResult = validation.data;
        const latencyMs = Date.now() - startTime;

        recordNLUMetric({
          source: 'gemini',
          intent: validResult.intent,
          latencyMs,
          success: true,
          timestamp: new Date().toISOString(),
        });

        return validResult;
      } catch (err: unknown) {
        if (controller.signal.aborted || (err as Error)?.name === 'AbortError') {
          fallbackReason = 'timeout';
          break;
        } else if (err instanceof TypeError) {
          fallbackReason = 'network_error';
        }
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }

  // Graceful fallback to deterministic engine
  const latencyMs = Date.now() - startTime;
  recordNLUMetric({
    source: 'fallback',
    latencyMs,
    success: false,
    fallbackReason: controller.signal.aborted ? 'timeout' : fallbackReason,
    timestamp: new Date().toISOString(),
  });

  return undefined;
}
