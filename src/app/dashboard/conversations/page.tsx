'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Bot,
  UserCheck,
  Send,
  Sparkles,
} from 'lucide-react';
import { Conversation, Message, Customer } from '@/lib/types/database';

interface EnrichedConversation extends Conversation {
  customer?: Customer;
  lastMessage?: Message;
}

export default function DashboardConversationsPage() {
  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'all' | 'ai_active' | 'human_takeover' | 'resolved'>('all');
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch('/api/conversations').then((r) => r.json());
        if (res.success && res.conversations) {
          setConversations(res.conversations);
          if (res.conversations.length > 0 && !selectedConvId) {
            setSelectedConvId(res.conversations[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, [selectedConvId]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  useEffect(() => {
    if (selectedConvId) {
      // In mock/API architecture, fetch messages for selected conversation
      // We simulate or fetch messages from API
      fetch(`/api/conversations`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            const found = res.conversations.find((c: EnrichedConversation) => c.id === selectedConvId);
            if (found && found.lastMessage) {
              setMessages([
                {
                  id: `msg_c1`,
                  conversation_id: selectedConvId,
                  business_id: found.business_id,
                  sender_type: 'customer',
                  content: 'Hi! Do you have the Black Velvet Abaya in size L?',
                  intent_detected: 'AVAILABILITY_INQUIRY',
                  created_at: new Date(Date.now() - 600000).toISOString(),
                },
                {
                  id: `msg_a1`,
                  conversation_id: selectedConvId,
                  business_id: found.business_id,
                  sender_type: 'ai',
                  content: 'Yes! The Black Velvet Abaya is in stock for ₦35,000 in sizes M, L, and XL.',
                  intent_detected: 'AVAILABILITY_INQUIRY',
                  created_at: new Date(Date.now() - 500000).toISOString(),
                },
                {
                  id: `msg_c2`,
                  conversation_id: selectedConvId,
                  business_id: found.business_id,
                  sender_type: 'customer',
                  content: found.lastMessage.content,
                  intent_detected: found.last_intent || 'PURCHASE_INTENT',
                  created_at: found.lastMessage.created_at,
                },
              ]);
            }
          }
        });
    }
  }, [selectedConvId]);

  async function handleTakeoverToggle() {
    if (!selectedConv) return;
    const newStatus = selectedConv.status === 'human_takeover' ? 'ai_active' : 'human_takeover';

    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/takeover`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }).then((r) => r.json());

      if (res.success) {
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConv.id ? { ...c, status: newStatus } : c))
        );
      }
    } catch (err) {
      console.error('Takeover error:', err);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedConvId || !replyText.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${selectedConvId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_text: replyText }),
      }).then((r) => r.json());

      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setReplyText('');
      }
    } catch (err) {
      console.error('Send reply error:', err);
    } finally {
      setSending(false);
    }
  }

  const filteredConvs = conversations.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search) {
      const name = c.customer?.name?.toLowerCase() || '';
      const text = c.lastMessage?.content?.toLowerCase() || '';
      return name.includes(search.toLowerCase()) || text.includes(search.toLowerCase());
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-700 font-medium text-sm">
          <Sparkles className="h-5 w-5 animate-spin" /> Loading Conversations...
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] font-sans flex flex-col md:flex-row bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
      {/* Left Column: Conversation List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200 space-y-3 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" /> Conversations
            </h2>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              {conversations.length} Active
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-4 text-xs font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {(['all', 'ai_active', 'human_takeover', 'resolved'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition capitalize whitespace-nowrap ${
                  filter === tab
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filteredConvs.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">No conversations found.</div>
          ) : (
            filteredConvs.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`p-4 cursor-pointer transition ${
                  selectedConvId === conv.id ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-900 truncate">{conv.customer?.name || 'Customer'}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    conv.status === 'human_takeover' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {conv.status === 'human_takeover' ? 'Human' : 'AI Active'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 line-clamp-1">{conv.lastMessage?.content || 'Inquiry received'}</p>
                {conv.last_intent && (
                  <span className="mt-2 inline-block text-[9px] font-bold tracking-wider text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md uppercase">
                    {conv.last_intent}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Message Thread & Takeover Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50/30">
        {selectedConv ? (
          <>
            {/* Thread Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-sm">
                  {selectedConv.customer?.name ? selectedConv.customer.name.charAt(0) : 'C'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{selectedConv.customer?.name || 'Customer'}</h3>
                  <p className="text-[11px] text-gray-500 font-medium">Channel: {selectedConv.channel}</p>
                </div>
              </div>

              {/* Takeover Button Control */}
              <button
                onClick={handleTakeoverToggle}
                className={`flex items-center gap-2 rounded-xl py-2 px-4 text-xs font-bold transition shadow-sm ${
                  selectedConv.status === 'human_takeover'
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {selectedConv.status === 'human_takeover' ? (
                  <>
                    <UserCheck className="h-4 w-4" />
                    <span>Human Operating (Switch to AI)</span>
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4" />
                    <span>Take Over Conversation</span>
                  </>
                )}
              </button>
            </div>

            {/* Thread Messages List */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              {messages.map((m) => {
                const isCustomer = m.sender_type === 'customer';
                const isAI = m.sender_type === 'ai';
                return (
                  <div key={m.id} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-1 ${
                        isCustomer
                          ? 'bg-white border border-gray-200 text-gray-900 rounded-tl-none shadow-2xs'
                          : isAI
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-tr-none'
                          : 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 font-bold text-[10px] opacity-80 mb-1">
                        <span>{isCustomer ? '👤 Customer' : isAI ? '🤖 VendiAide' : '👤 Vendor Team'}</span>
                        {m.intent_detected && (
                          <span className="bg-white/60 px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider text-gray-700">
                            {m.intent_detected}
                          </span>
                        )}
                      </div>
                      <p>{m.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vendor Reply Bar */}
            <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-gray-200 flex items-center gap-3">
              <input
                type="text"
                placeholder={
                  selectedConv.status === 'human_takeover'
                    ? 'Type your manual vendor response...'
                    : 'Take over conversation first or reply directly...'
                }
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 px-4 text-xs font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                <Send className="h-4 w-4" />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
            Select a conversation to view thread details.
          </div>
        )}
      </div>
    </div>
  );
}
