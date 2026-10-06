import {
  ConversationReferenceRepository,
  ReferenceConversation,
  ReferenceFilterOptions,
  ReferenceMessage,
  ReferenceSummary,
  ReviewLabel,
} from './types';

const STORAGE_KEY = 'vendiaide_conversation_references_v1';

// In-memory fallback for SSR/testing environments where window.localStorage is unavailable
let memoryStore: Map<string, ReferenceConversation> = new Map();

function getStorage(): Map<string, ReferenceConversation> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ReferenceConversation[];
        const map = new Map<string, ReferenceConversation>();
        parsed.forEach((c) => map.set(c.conversationId, c));
        return map;
      }
    } catch {
      // Fallback to memory store on storage error
    }
  }
  return memoryStore;
}

function saveStorage(store: Map<string, ReferenceConversation>): void {
  memoryStore = store;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const array = Array.from(store.values());
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
    } catch {
      // Silent catch if storage quota exceeded
    }
  }
}

export class LocalConversationReferenceRepository implements ConversationReferenceRepository {
  async saveMessageReference(
    input: Omit<ReferenceMessage, 'id'> & { id?: string }
  ): Promise<ReferenceMessage> {
    const store = getStorage();
    const id = input.id || `ref_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullMessage: ReferenceMessage = {
      ...input,
      id,
    };

    const convId = input.conversationId || 'demo_session_default';
    let conv = store.get(convId);

    if (!conv) {
      conv = {
        conversationId: convId,
        startTime: input.timestamp,
        lastUpdated: input.timestamp,
        messagesCount: 0,
        lastMessageText: input.customerMessage,
        language: input.language,
        product: input.product,
        orderStatus: input.orderCreated ? 'CONFIRMED' : input.intent === 'CANCEL' ? 'CANCELLED' : input.draftStatus === 'READY_FOR_CHECKOUT' ? 'PENDING' : 'NONE',
        orderCreated: input.orderCreated,
        totalAmount: input.totalAmount,
        messages: [],
      };
    }

    // Append message to conversation transcript
    conv.messages.push(fullMessage);
    conv.messagesCount = conv.messages.length;
    conv.lastUpdated = input.timestamp;
    conv.lastMessageText = input.customerMessage;
    conv.language = input.language || conv.language;
    conv.product = input.product || conv.product;
    if (input.orderCreated) {
      conv.orderCreated = true;
      conv.orderStatus = 'CONFIRMED';
    } else if (input.intent === 'CANCEL') {
      conv.orderStatus = 'CANCELLED';
    } else if (input.draftStatus === 'READY_FOR_CHECKOUT' && conv.orderStatus !== 'CONFIRMED') {
      conv.orderStatus = 'PENDING';
    }
    conv.totalAmount = Math.max(conv.totalAmount, input.totalAmount);

    store.set(convId, conv);
    saveStorage(store);

    return fullMessage;
  }

  async getConversations(filter?: ReferenceFilterOptions): Promise<ReferenceConversation[]> {
    const store = getStorage();
    let list = Array.from(store.values());

    if (!filter) return list.sort((a, b) => b.lastUpdated - a.lastUpdated);

    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      list = list.filter((conv) => {
        const matchesId = conv.conversationId.toLowerCase().includes(q);
        const matchesProd = conv.product?.toLowerCase().includes(q);
        const matchesMsg = conv.messages.some(
          (m) => m.customerMessage.toLowerCase().includes(q) || m.aiResponse.toLowerCase().includes(q)
        );
        const matchesIntent = conv.messages.some((m) => m.intent.toLowerCase().includes(q));
        return matchesId || matchesProd || matchesMsg || matchesIntent;
      });
    }

    if (filter.intent) {
      list = list.filter((conv) => conv.messages.some((m) => m.intent === filter.intent));
    }

    if (filter.language) {
      list = list.filter((conv) => conv.language.toLowerCase() === filter.language?.toLowerCase());
    }

    if (filter.reviewLabel) {
      list = list.filter((conv) => conv.messages.some((m) => m.reviewLabel === filter.reviewLabel));
    }

    if (filter.orderCreated !== undefined) {
      list = list.filter((conv) => conv.orderCreated === filter.orderCreated);
    }

    if (filter.startDate) {
      list = list.filter((conv) => conv.lastUpdated >= filter.startDate!);
    }

    if (filter.endDate) {
      list = list.filter((conv) => conv.lastUpdated <= filter.endDate!);
    }

    return list.sort((a, b) => b.lastUpdated - a.lastUpdated);
  }

  async getConversation(conversationId: string): Promise<ReferenceConversation | null> {
    const store = getStorage();
    return store.get(conversationId) || null;
  }

  async updateMessageReview(
    messageId: string,
    label: ReviewLabel,
    note?: string
  ): Promise<ReferenceMessage | null> {
    const store = getStorage();
    for (const conv of store.values()) {
      const msg = conv.messages.find((m) => m.id === messageId);
      if (msg) {
        msg.reviewLabel = label;
        if (note !== undefined) msg.reviewerNote = note;
        store.set(conv.conversationId, conv);
        saveStorage(store);
        return msg;
      }
    }
    return null;
  }

  async getSummary(): Promise<ReferenceSummary> {
    const store = getStorage();
    const conversations = Array.from(store.values());

    let totalMessages = 0;
    let ordersGenerated = 0;
    let cancelledConversations = 0;
    let unresolvedMessages = 0;
    let needsReviewCount = 0;

    conversations.forEach((conv) => {
      totalMessages += conv.messagesCount;
      if (conv.orderCreated) ordersGenerated++;
      if (conv.orderStatus === 'CANCELLED') cancelledConversations++;

      conv.messages.forEach((m) => {
        if (m.intent === 'GENERAL_QUESTION' || m.intent === 'CONTEXTUAL_REPLY') {
          unresolvedMessages++;
        }
        if (m.reviewLabel === 'NEEDS_REVIEW') {
          needsReviewCount++;
        }
      });
    });

    return {
      totalConversations: conversations.length,
      totalMessages,
      ordersGenerated,
      cancelledConversations,
      unresolvedMessages,
      needsReviewCount,
    };
  }

  async exportData(format: 'json' | 'csv'): Promise<string> {
    const store = getStorage();
    const conversations = Array.from(store.values());

    // Sanitize export payload to purge any sensitive tokens/secrets
    const sanitizedConversations = conversations.map((conv) => ({
      ...conv,
      messages: conv.messages.map((m) => ({
        ...m,
        customerMessage: sanitizeSecretTokens(m.customerMessage),
        aiResponse: sanitizeSecretTokens(m.aiResponse),
        reviewerNote: m.reviewerNote ? sanitizeSecretTokens(m.reviewerNote) : undefined,
      })),
    }));

    if (format === 'json') {
      return JSON.stringify(sanitizedConversations, null, 2);
    }

    // CSV format
    const rows: string[] = [
      'ConversationID,Timestamp,CustomerMessage,AIResponse,Intent,Language,Product,DraftStatus,Authorized,OrderCreated,TotalAmount,ReviewLabel,ReviewerNote',
    ];

    sanitizedConversations.forEach((conv) => {
      conv.messages.forEach((m) => {
        const timeStr = new Date(m.timestamp).toISOString();
        const escMsg = `"${m.customerMessage.replace(/"/g, '""')}"`;
        const escResp = `"${m.aiResponse.replace(/"/g, '""')}"`;
        const escNote = `"${(m.reviewerNote || '').replace(/"/g, '""')}"`;

        rows.push(
          `${m.conversationId},${timeStr},${escMsg},${escResp},${m.intent},${m.language},${m.product || 'None'},${m.draftStatus},${m.authorized},${m.orderCreated},${m.totalAmount},${m.reviewLabel || 'Unlabeled'},${escNote}`
        );
      });
    });

    return rows.join('\n');
  }

  async clearReferences(): Promise<void> {
    memoryStore.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Silent catch
      }
    }
  }
}

function sanitizeSecretTokens(text: string): string {
  if (!text) return text;
  return text
    .replace(/(?:ghp|sk|key|token|bearer|password)[_\-\w]*=[^\s,;&]+/gi, '[REDACTED_SECRET]')
    .replace(/AQ\.[A-Za-z0-9_\-]+/g, '[REDACTED_KEY]');
}

// Global Singleton Instance
export const referenceRepository = new LocalConversationReferenceRepository();
