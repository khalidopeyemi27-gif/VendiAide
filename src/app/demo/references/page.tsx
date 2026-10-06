'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  MessageSquare,
  Tag,
  Trash2,
  BookOpen,
  FileSpreadsheet,
  FileJson,
  User,
  Bot,
} from 'lucide-react';
import { referenceRepository } from '@/lib/reference-library/repository';
import {
  ReferenceConversation,
  ReferenceFilterOptions,
  ReferenceSummary,
  ReviewLabel,
} from '@/lib/reference-library/types';
import { formatNaira } from '@/lib/utils/formatters';

export default function ConversationReferencesPage() {
  const [summary, setSummary] = useState<ReferenceSummary>({
    totalConversations: 0,
    totalMessages: 0,
    ordersGenerated: 0,
    cancelledConversations: 0,
    unresolvedMessages: 0,
    needsReviewCount: 0,
  });

  const [conversations, setConversations] = useState<ReferenceConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<ReferenceConversation | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [intentFilter, setIntentFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState<string>('');
  const [orderCreatedFilter, setOrderCreatedFilter] = useState<boolean | undefined>(undefined);

  // Note editing state for selected message
  const [editingNotes, setEditingNotes] = useState<{ [msgId: string]: string }>({});
  const [savingMsgId, setSavingMsgId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const filter: ReferenceFilterOptions = {
        searchQuery: searchQuery || undefined,
        intent: intentFilter || undefined,
        language: languageFilter || undefined,
        reviewLabel: (labelFilter as ReviewLabel) || undefined,
        orderCreated: orderCreatedFilter,
      };

      const [sumData, convsData] = await Promise.all([
        referenceRepository.getSummary(),
        referenceRepository.getConversations(filter),
      ]);

      if (!isMounted) return;

      setSummary(sumData);
      setConversations(convsData);

      if (convsData.length > 0) {
        setSelectedConvId((prevId) => {
          const activeId = prevId && convsData.some((c) => c.conversationId === prevId)
            ? prevId
            : convsData[0].conversationId;
          const activeConv = convsData.find((c) => c.conversationId === activeId) || null;
          setSelectedConv(activeConv);
          return activeId;
        });
      } else {
        setSelectedConv(null);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [searchQuery, intentFilter, languageFilter, labelFilter, orderCreatedFilter]);

  const refreshData = async () => {
    const filter: ReferenceFilterOptions = {
      searchQuery: searchQuery || undefined,
      intent: intentFilter || undefined,
      language: languageFilter || undefined,
      reviewLabel: (labelFilter as ReviewLabel) || undefined,
      orderCreated: orderCreatedFilter,
    };

    const [sumData, convsData] = await Promise.all([
      referenceRepository.getSummary(),
      referenceRepository.getConversations(filter),
    ]);

    setSummary(sumData);
    setConversations(convsData);
  };

  const handleSelectConversation = async (convId: string) => {
    setSelectedConvId(convId);
    const conv = await referenceRepository.getConversation(convId);
    setSelectedConv(conv);
  };

  const handleUpdateReviewLabel = async (msgId: string, label: ReviewLabel) => {
    setSavingMsgId(msgId);
    const note = editingNotes[msgId];
    await referenceRepository.updateMessageReview(msgId, label, note);
    await refreshData();
    if (selectedConvId) {
      const updatedConv = await referenceRepository.getConversation(selectedConvId);
      setSelectedConv(updatedConv);
    }
    setSavingMsgId(null);
  };

  const handleSaveNote = async (msgId: string, currentLabel?: ReviewLabel) => {
    setSavingMsgId(msgId);
    const label = currentLabel || 'GOOD';
    const note = editingNotes[msgId];
    await referenceRepository.updateMessageReview(msgId, label, note);
    await refreshData();
    if (selectedConvId) {
      const updatedConv = await referenceRepository.getConversation(selectedConvId);
      setSelectedConv(updatedConv);
    }
    setSavingMsgId(null);
  };

  const handleExportJSON = async () => {
    const jsonStr = await referenceRepository.exportData('json');
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendiaide-conversation-references-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    const csvStr = await referenceRepository.exportData('csv');
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendiaide-conversation-references-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all reference logs? This action cannot be undone.')) {
      await referenceRepository.clearReferences();
      await refreshData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-20 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/demo"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Demo
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl font-bold text-white tracking-tight">Conversation Reference Library</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Read-Only Observer
              </span>
            </div>
            <p className="text-xs text-slate-400">Review captured AI interactions, inspect intent metadata, and label training references</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 transition"
          >
            <FileJson className="w-4 h-4" /> Export JSON
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/50 text-red-400 text-xs font-semibold border border-red-800/40 transition"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* KPI Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-slate-850 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 block mb-1">Total Conversations</span>
            <span className="text-2xl font-bold text-white">{summary.totalConversations}</span>
          </div>
          <div className="bg-slate-850 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 block mb-1">Total Messages</span>
            <span className="text-2xl font-bold text-sky-400">{summary.totalMessages}</span>
          </div>
          <div className="bg-slate-850 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 block mb-1">Orders Generated</span>
            <span className="text-2xl font-bold text-emerald-400">{summary.ordersGenerated}</span>
          </div>
          <div className="bg-slate-850 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 block mb-1">Cancelled</span>
            <span className="text-2xl font-bold text-amber-400">{summary.cancelledConversations}</span>
          </div>
          <div className="bg-slate-850 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 block mb-1">Unresolved/General</span>
            <span className="text-2xl font-bold text-indigo-400">{summary.unresolvedMessages}</span>
          </div>
          <div className="bg-slate-850 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400 block mb-1">Needs Review</span>
            <span className="text-2xl font-bold text-purple-400">{summary.needsReviewCount}</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search message text, product, intent, or ID..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={intentFilter}
              onChange={(e) => setIntentFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Intents</option>
              <option value="CATALOG_INQUIRY">CATALOG_INQUIRY</option>
              <option value="PURCHASE_INTENT">PURCHASE_INTENT</option>
              <option value="DISCOUNT_INQUIRY">DISCOUNT_INQUIRY</option>
              <option value="EXPLICIT_ORDER_CONFIRMATION">EXPLICIT_ORDER_CONFIRMATION</option>
              <option value="CANCEL">CANCEL</option>
              <option value="PRODUCT_INQUIRY">PRODUCT_INQUIRY</option>
              <option value="GENERAL_QUESTION">GENERAL_QUESTION</option>
            </select>

            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Languages</option>
              <option value="Pidgin">Nigerian Pidgin</option>
              <option value="English">English</option>
            </select>

            <select
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Review Labels</option>
              <option value="GOOD">Good</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="INCORRECT_INTERPRETATION">Incorrect Interpretation</option>
              <option value="USEFUL_EXAMPLE">Useful Example</option>
              <option value="IGNORED">Ignored</option>
            </select>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg">
              <input
                type="checkbox"
                checked={orderCreatedFilter === true}
                onChange={(e) => setOrderCreatedFilter(e.target.checked ? true : undefined)}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
              />
              Orders Created Only
            </label>
          </div>
        </div>

        {/* Master / Detail Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          {/* Left Column: Conversation List */}
          <div className="lg:col-span-4 bg-slate-800/40 border border-slate-700/80 rounded-xl p-3 flex flex-col gap-2 max-h-[700px] overflow-y-auto">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Conversations ({conversations.length})
            </h2>

            {conversations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No reference conversations captured matching filters. Try interacting with the demo or clearing search filters.
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.conversationId === selectedConvId;
                return (
                  <button
                    key={conv.conversationId}
                    onClick={() => handleSelectConversation(conv.conversationId)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-semibold text-emerald-400 truncate max-w-[140px]">
                        {conv.conversationId}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(conv.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-1 mb-2">&quot;{conv.lastMessageText}&quot;</p>

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                        {conv.messagesCount} msgs
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 font-medium">
                        {conv.language}
                      </span>
                      {conv.product && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-medium truncate max-w-[120px]">
                          {conv.product}
                        </span>
                      )}
                      {conv.orderCreated ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                          ORDER CONFIRMED
                        </span>
                      ) : conv.orderStatus === 'CANCELLED' ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                          CANCELLED
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed Transcript & Message Metadata Inspector */}
          <div className="lg:col-span-8 bg-slate-800/40 border border-slate-700/80 rounded-xl p-5 flex flex-col max-h-[700px]">
            {selectedConv ? (
              <div className="flex flex-col h-full space-y-4">
                {/* Selected Conversation Metadata Header */}
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white font-mono">{selectedConv.conversationId}</h3>
                      {selectedConv.orderCreated && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Order Verified ({formatNaira(selectedConv.totalAmount)})
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      Started {new Date(selectedConv.startTime).toLocaleString()} • {selectedConv.messagesCount} Turn(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Detected Language:</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 font-semibold text-sky-400">
                      {selectedConv.language}
                    </span>
                  </div>
                </div>

                {/* Chronological Transcript Feed */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                  {selectedConv.messages.map((msg, idx) => {
                    const noteValue = editingNotes[msg.id] !== undefined ? editingNotes[msg.id] : msg.reviewerNote || '';

                    return (
                      <div key={msg.id || idx} className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                        {/* Customer Message */}
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-400">Customer</span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-3">
                              &quot;{msg.customerMessage}&quot;
                            </p>
                          </div>
                        </div>

                        {/* Message Metadata Pill Box */}
                        <div className="ml-10 bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-400">Interpretation:</span>
                            <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300 font-mono text-[11px]">
                              {msg.intent}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/60 text-sky-300 text-[11px]">
                              {msg.language}
                            </span>
                            {msg.product && (
                              <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[11px]">
                                {msg.product}
                              </span>
                            )}
                            <span className="text-slate-500 text-[11px]">
                              Status: <strong className="text-slate-300">{msg.draftStatus}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {msg.orderCreated ? (
                              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Order Created
                              </span>
                            ) : msg.authorized ? (
                              <span className="text-[11px] text-sky-400">Authorized</span>
                            ) : null}
                          </div>
                        </div>

                        {/* Vendiaide AI Response */}
                        <div className="flex items-start gap-3 pl-6">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                            <Bot className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-emerald-400">Vendiaide AI</span>
                            </div>
                            <p className="text-sm text-slate-200 bg-slate-800/80 border border-slate-700/80 rounded-lg p-3">
                              {msg.aiResponse}
                            </p>
                          </div>
                        </div>

                        {/* Interactive Review Label & Notes Bar */}
                        <div className="ml-10 border-t border-slate-800/80 pt-3 flex flex-col gap-2">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs text-slate-400 font-medium">Review Label:</span>
                              <select
                                value={msg.reviewLabel || 'GOOD'}
                                onChange={(e) => handleUpdateReviewLabel(msg.id, e.target.value as ReviewLabel)}
                                className="bg-slate-900 border border-slate-700 text-xs rounded px-2.5 py-1 text-slate-200 focus:border-emerald-500 focus:outline-none"
                              >
                                <option value="GOOD">Good ✅</option>
                                <option value="NEEDS_REVIEW">Needs Review ⚠️</option>
                                <option value="INCORRECT_INTERPRETATION">Incorrect Interpretation ❌</option>
                                <option value="USEFUL_EXAMPLE">Useful Example 💡</option>
                                <option value="IGNORED">Ignored 🚫</option>
                              </select>
                            </div>

                            <button
                              onClick={() => handleSaveNote(msg.id, msg.reviewLabel)}
                              disabled={savingMsgId === msg.id}
                              className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                            >
                              {savingMsgId === msg.id ? 'Saving...' : 'Save Note'}
                            </button>
                          </div>

                          <input
                            type="text"
                            value={noteValue}
                            onChange={(e) => setEditingNotes({ ...editingNotes, [msg.id]: e.target.value })}
                            placeholder="Add optional reviewer note (e.g. customer referred to previous post)..."
                            className="w-full bg-slate-950/80 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 mb-3 text-slate-600 stroke-1" />
                <h3 className="text-sm font-semibold text-slate-400 mb-1">No Conversation Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Select a captured conversation from the left panel to inspect its transcript, intent metadata, and review labels.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
