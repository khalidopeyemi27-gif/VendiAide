export {
  processDemoMessage,
  createInitialDemoState,
  resolveContextualReply,
  extractColorFromMessage,
  extractSizeFromMessage,
  extractLocationFromMessage,
  isPidginMessage,
  formatListWithAnd,
  type DemoSessionState,
  type DemoMessage,
  type DemoOrder,
  type DemoLead,
  type DemoProduct,
} from './lib/demo/demo-engine';

export { auditComprehensionLog, normalizeSentenceAndPhrases, detectIntentAndEntities } from './intent';

export { interpretCustomerMessage, type InterpretationContext } from './lib/engine/semantic-interpreter';
export { type SemanticInterpretation } from './lib/engine/types';
