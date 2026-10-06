export type ReviewLabel =
  | 'GOOD'
  | 'NEEDS_REVIEW'
  | 'INCORRECT_INTERPRETATION'
  | 'USEFUL_EXAMPLE'
  | 'IGNORED';

export interface ReferenceMessage {
  id: string;
  conversationId: string;
  timestamp: number;
  customerMessage: string;
  aiResponse: string;
  intent: string;
  language: string;
  product: string | null;
  draftStatus: string;
  authorized: boolean;
  orderCreated: boolean;
  totalAmount: number;
  reviewLabel?: ReviewLabel;
  reviewerNote?: string;
}

export interface ReferenceConversation {
  conversationId: string;
  startTime: number;
  lastUpdated: number;
  messagesCount: number;
  lastMessageText: string;
  language: string;
  product: string | null;
  orderStatus: 'NONE' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  orderCreated: boolean;
  totalAmount: number;
  messages: ReferenceMessage[];
}

export interface ReferenceFilterOptions {
  searchQuery?: string;
  intent?: string;
  language?: string;
  reviewLabel?: ReviewLabel;
  orderCreated?: boolean;
  startDate?: number;
  endDate?: number;
}

export interface ReferenceSummary {
  totalConversations: number;
  totalMessages: number;
  ordersGenerated: number;
  cancelledConversations: number;
  unresolvedMessages: number;
  needsReviewCount: number;
}

export interface ConversationReferenceRepository {
  saveMessageReference(message: Omit<ReferenceMessage, 'id'> & { id?: string }): Promise<ReferenceMessage>;
  getConversations(filter?: ReferenceFilterOptions): Promise<ReferenceConversation[]>;
  getConversation(conversationId: string): Promise<ReferenceConversation | null>;
  updateMessageReview(messageId: string, label: ReviewLabel, note?: string): Promise<ReferenceMessage | null>;
  getSummary(): Promise<ReferenceSummary>;
  exportData(format: 'json' | 'csv'): Promise<string>;
  clearReferences(): Promise<void>;
}
