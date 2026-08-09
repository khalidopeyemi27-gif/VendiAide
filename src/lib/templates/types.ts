import { z } from 'zod';

export interface DefaultFAQ {
  question: string;
  answer: string;
  category: string;
}

export interface IntentRule {
  intent: string;
  keywords: string[];
  description: string;
}

export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  defaultCategories: string[];
  attributeSchema: z.ZodSchema;
  defaultFaqs: DefaultFAQ[];
  promptSystemExtension: string;
  intentRules: IntentRule[];
  formatItemSummary: (item: Record<string, unknown>) => string;
}
