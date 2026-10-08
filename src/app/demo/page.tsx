'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Send,
  RotateCcw,
  User,
  Package,
  Users,
  MessageSquare,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  ChevronRight,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react';
import {
  createInitialDemoState,
  processDemoMessage,
  DemoSessionState,
  DEMO_PUBLIC_PRODUCTS as CUSTOM_CATALOG,
  getVendorDeliveryCoverage,
} from '@/lib/demo/demo-engine';
import { observeDemoInteraction } from '@/lib/reference-library/observer';
import { formatNaira } from '@/lib/utils/formatters';
import { OrderConfirmationCard } from '@/components/demo/OrderConfirmationCard';

function formatIntentForMerchant(intent?: string): string {
  switch (intent) {
    case 'CATALOG_INQUIRY':
    case 'CATALOG_DISCOVERY':
      return 'Browsing available catalog';
    case 'PRODUCT_INQUIRY':
      return 'Asking about specific product';
    case 'AVAILABILITY_INQUIRY':
      return 'Checking product or size availability';
    case 'PURCHASE_INTENT':
      return 'Customer is building an order';
    case 'READY_FOR_CHECKOUT':
      return 'Order ready for confirmation';
    case 'EXPLICIT_ORDER_CONFIRMATION':
      return 'Order confirmed by customer';
    case 'EXPLICIT_PRODUCT_SWITCH':
      return 'Switched product selection';
    case 'CANCEL':
      return 'Order cancelled / reset requested';
    case 'DISCOUNT_INQUIRY':
      return 'Inquiring about discounts';
    case 'PROMOTION_INQUIRY':
      return 'Inquiring about promotions';
    case 'PRICE_INQUIRY':
      return 'Checking item price';
    case 'DELIVERY_FEE_INQUIRY':
      return 'Checking delivery fees';
    case 'ORDER_STATUS_INQUIRY':
      return 'Checking past orders';
    case 'GENERAL_QUESTION':
      return 'General customer enquiry';
    default:
      return 'Customer message';
  }
}

function formatStageForMerchant(status?: string): string {
  switch (status) {
    case 'READY_FOR_CHECKOUT':
      return 'Ready for Confirmation';
    case 'CONFIGURING':
      return 'Selecting Size / Location';
    case 'EMPTY':
      return 'Browsing / Inquiring';
    default:
      return 'Active';
  }
}

export default function PublicDemoPage() {
  const [demoState, setDemoState] = useState<DemoSessionState>(createInitialDemoState);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversations' | 'leads' | 'orders'>('conversations');
  const [mobileView, setMobileView] = useState<'customer' | 'vendor'>('customer');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [demoState.messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (!textToSend) setInputText('');

    setIsTyping(true);

    setTimeout(() => {
      setDemoState((currentState) => {
        const result = processDemoMessage(currentState, text);
        // Non-intrusive reference observer
        observeDemoInteraction({
          conversationId: currentState.sessionId || 'demo_session_default',
          customerMessage: text,
          aiResponse: result.responseText,
          intent: result.intent,
          detectedLanguage: result.updatedState.detectedLanguage || 'English',
          activeProduct: CUSTOM_CATALOG.find((p) => p.id === result.updatedState.activeDraft?.productId)?.name || null,
          draftStatus: result.updatedState.activeDraft?.status || 'EMPTY',
          authorized: Boolean(result.updatedState.activeDraft?.authorized),
          orderCreated: result.updatedState.orders.length > currentState.orders.length,
          totalAmount: result.updatedState.orders[0]?.totalNaira || 0,
        });
        return result.updatedState;
      });
      setIsTyping(false);
    }, 400);
  };

  const handleResetDemo = () => {
    setDemoState(createInitialDemoState());
    setInputText('');
    setIsTyping(false);
  };

  // First-time onboarding visibility flag
  const hasCustomerMessage = demoState.messages.some((m) => m.sender === 'customer');

  // Stage-aware quick replies calculation (max 4 visible at once)
  const getStageQuickReplies = (): { label: string; prompt: string }[] => {
    if (demoState.lastIntent === 'DISCOUNT_INQUIRY' || demoState.lastIntent === 'PROMOTION_INQUIRY') {
      return [
        { label: 'Browse products', prompt: 'What products do you have?' },
        { label: 'Check prices', prompt: 'What are your prices?' },
        { label: 'Delivery fees', prompt: 'How much is delivery to Ikeja?' },
        { label: 'Order hoodie', prompt: 'I want to order the hoodie' },
      ];
    }
    if (demoState.orders.length > 0 && demoState.activeDraft.status === 'EMPTY') {
      return [
        { label: 'View order', prompt: 'Show my orders' },
        { label: 'Continue shopping', prompt: 'Browse products' },
        { label: 'Talk to vendor', prompt: 'Speak to vendor' },
      ];
    }
    if (demoState.activeDraft.status === 'READY_FOR_CHECKOUT' && !demoState.activeDraft.authorized) {
      return [
        { label: 'Confirm order', prompt: 'yes do am' },
        { label: 'Change details', prompt: 'change details' },
        { label: 'Cancel', prompt: 'cancel' },
      ];
    }
    if (demoState.activeDraft.status === 'CONFIGURING') {
      return [
        { label: 'Set size', prompt: 'size L' },
        { label: 'Set delivery location', prompt: 'deliver to Ikeja' },
        { label: 'Calculate total', prompt: 'how much is my order total' },
        { label: 'Cancel', prompt: 'cancel' },
      ];
    }
    if (demoState.activeDraft.productId && (!demoState.activeDraft.size || !demoState.activeDraft.location)) {
      return [
        { label: 'Check sizes', prompt: 'what sizes do you have' },
        { label: 'Check colors', prompt: 'what colors do you have' },
        { label: 'Ask price', prompt: 'how much is this' },
        { label: 'Order this item', prompt: 'i want to buy this item' },
      ];
    }
    return [
      { label: 'Browse products', prompt: 'What products do you have?' },
      { label: 'Cheapest item', prompt: 'What is your cheapest item?' },
      { label: 'Delivery fees', prompt: 'How much is delivery to Ikeja?' },
    ];
  };

  const quickReplies = getStageQuickReplies().slice(0, 4);

  // Draft calculations for OrderConfirmationCard
  const activeProduct = CUSTOM_CATALOG.find((p) => p.id === demoState.activeDraft.productId);
  const locCoverage = demoState.activeDraft.location ? getVendorDeliveryCoverage(demoState.activeDraft.location) : undefined;
  const deliveryFeeNaira = (locCoverage && locCoverage.isConfirmedCoverage && locCoverage.rateNaira) ? locCoverage.rateNaira : 0;
  const itemPriceNaira = activeProduct ? activeProduct.price_ngn : 0;
  const totalNaira = itemPriceNaira + deliveryFeeNaira;

  const canShowConfirmationCard =
    Boolean(activeProduct) &&
    Boolean(demoState.activeDraft.location) &&
    !demoState.activeDraft.authorized &&
    demoState.activeDraft.status === 'READY_FOR_CHECKOUT';

  // Metrics calculation
  const totalConversations = hasCustomerMessage ? 1 : 0;
  const newLeadsCount = demoState.leads.length;
  const capturedOrdersCount = demoState.orders.length;
  const pipelineValueNaira = demoState.orders.reduce((acc, o) => acc + o.totalNaira, 0);

  return (
    <div className="min-h-screen bg-gray-50/80 font-sans flex flex-col w-full overflow-x-hidden">
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-2xs w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-gray-900 text-base sm:text-lg shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <span>
              VendiAide <span className="text-emerald-600 font-extrabold">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation & Controls (hidden on mobile, visible on md+) */}
          <div className="hidden md:flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 py-1.5 px-3 rounded-full border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Public Interactive Demo
            </span>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
              <button
                onClick={() => setDemoState((prev) => ({ ...prev, languagePreference: 'auto' }))}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${(!demoState.languagePreference || demoState.languagePreference === 'auto') ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'}`}
                title="Auto Language Detection"
              >
                🌐 Auto
              </button>
              <button
                onClick={() => setDemoState((prev) => ({ ...prev, languagePreference: 'english' }))}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${demoState.languagePreference === 'english' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'}`}
                title="Force English AI Responses"
              >
                🇬🇧 English
              </button>
              <button
                onClick={() => setDemoState((prev) => ({ ...prev, languagePreference: 'pidgin' }))}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${demoState.languagePreference === 'pidgin' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'}`}
                title="Force Nigerian Pidgin AI Responses"
              >
                🇳🇬 Pidgin
              </button>
            </div>

            <button
              onClick={handleResetDemo}
              className="flex items-center gap-1.5 rounded-xl border border-gray-300 py-1.5 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
              title="Reset Demo State"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Demo</span>
            </button>

            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 py-1.5 px-4 text-xs font-bold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile Navigation Header Controls (visible on < md) */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={handleResetDemo}
              aria-label="Reset Demo"
              className="flex items-center gap-1 rounded-xl border border-gray-300 py-1.5 px-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
              title="Reset Demo State"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-[11px]">Reset</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-3 shadow-lg">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Language Mode</span>
              <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => {
                    setDemoState((prev) => ({ ...prev, languagePreference: 'auto' }));
                    setIsMobileMenuOpen(false);
                  }}
                  className={`py-1.5 rounded-lg text-center font-semibold transition ${(!demoState.languagePreference || demoState.languagePreference === 'auto') ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-gray-600'}`}
                >
                  🌐 Auto
                </button>
                <button
                  onClick={() => {
                    setDemoState((prev) => ({ ...prev, languagePreference: 'english' }));
                    setIsMobileMenuOpen(false);
                  }}
                  className={`py-1.5 rounded-lg text-center font-semibold transition ${demoState.languagePreference === 'english' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-gray-600'}`}
                >
                  🇬🇧 English
                </button>
                <button
                  onClick={() => {
                    setDemoState((prev) => ({ ...prev, languagePreference: 'pidgin' }));
                    setIsMobileMenuOpen(false);
                  }}
                  className={`py-1.5 rounded-lg text-center font-semibold transition ${demoState.languagePreference === 'pidgin' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-gray-600'}`}
                >
                  🇳🇬 Pidgin
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
              <Link
                href="/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white hover:bg-emerald-700 transition"
              >
                <span>Start Free Vendor Setup</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 flex flex-col space-y-4">
        
        {/* Mobile View Toggle Bar (Hidden on Desktop) */}
        <div className="flex lg:hidden bg-white p-1 rounded-2xl border border-gray-200 shadow-2xs">
          <button
            onClick={() => setMobileView('customer')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
              mobileView === 'customer'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Customer View (WhatsApp)
          </button>
          <button
            onClick={() => setMobileView('vendor')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
              mobileView === 'vendor'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Vendor View (Dashboard)
          </button>
        </div>

        {/* Dual Pane Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT PANE: Customer WhatsApp Chat Simulator */}
          <div
            className={`lg:col-span-6 flex flex-col rounded-3xl border border-gray-200/90 bg-white shadow-xl overflow-hidden h-[640px] ${
              mobileView === 'customer' ? 'block' : 'hidden lg:flex'
            }`}
          >
            {/* WhatsApp Simulator Header */}
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 font-extrabold text-sm border border-emerald-600 shadow-xs">
                  KF
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-emerald-800" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Kulture Fashion House</h3>
                  <p className="text-[11px] text-emerald-200 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online | AI Sales Assistant
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-900/60 px-2.5 py-1 rounded-full font-bold text-emerald-200 border border-emerald-700">
                WhatsApp Demo
              </span>
            </div>

            {/* Stage-Aware Quick Reply Bar */}
            <div className="bg-emerald-50/50 p-2.5 border-b border-emerald-100/60 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider whitespace-nowrap px-1">
                Quick Reply:
              </span>
              {quickReplies.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Quick reply: ${chip.label}`}
                  onClick={() => handleSendMessage(chip.prompt)}
                  className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 shadow-2xs transition shrink-0"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Chat Conversation Scroll Area */}
            <div
              role="log"
              aria-live="polite"
              aria-label="Customer conversation transcript"
              className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#efeae2]/30"
            >
              {/* First-Time Onboarding Panel (hides after 1st customer message) */}
              {!hasCustomerMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-white p-3.5 shadow-xs mb-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    <span>Try asking:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-gray-700">
                    {[
                      { label: 'What do you have?', prompt: 'What do you have?' },
                      { label: 'How much is the hoodie?', prompt: 'How much is the hoodie?' },
                      { label: 'Sneakers in size 42?', prompt: 'Do you have sneakers in size 42?' },
                      { label: 'I want to order for Ikeja', prompt: 'I want to order for Ikeja' },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        aria-label={`Try asking prompt: ${item.label}`}
                        onClick={() => handleSendMessage(item.prompt)}
                        className="text-left px-3 py-1.5 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 font-medium text-[11px] border border-emerald-200/80 transition flex items-center gap-1.5"
                      >
                        <span className="text-emerald-600 font-bold">💬</span>
                        <span>&quot;{item.label}&quot;</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {demoState.messages.map((msg) => {
                const isCustomer = msg.sender === 'customer';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                        isCustomer
                          ? 'bg-emerald-700 text-white rounded-tr-xs'
                          : 'bg-white text-gray-800 border border-gray-200/80 rounded-tl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                      <span
                        className={`block text-[11px] mt-1 text-right font-medium ${
                          isCustomer ? 'text-emerald-100' : 'text-gray-500'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Structured Order Confirmation Card */}
              {canShowConfirmationCard && activeProduct && (
                <div className="flex justify-start">
                  <div className="max-w-[90%] sm:max-w-[85%]">
                    <OrderConfirmationCard
                      draft={{
                        productName: activeProduct.name,
                        size: demoState.activeDraft.size,
                        color: demoState.activeDraft.color || activeProduct.colors[0] || 'Black',
                        location: demoState.activeDraft.location!,
                        itemPriceNaira,
                        deliveryFeeNaira,
                        totalNaira,
                      }}
                      onConfirm={() => handleSendMessage('yes do am')}
                      onChangeDetails={() => handleSendMessage('change details')}
                      onCancel={() => handleSendMessage('cancel')}
                    />
                  </div>
                </div>
              )}

              {/* Simulated Typing Indicator */}
              {isTyping && (
                <div className="flex items-start">
                  <div className="rounded-2xl rounded-tl-xs bg-white px-4 py-2.5 text-xs text-gray-500 border border-gray-200 shadow-xs flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-gray-200/80 flex items-center gap-2"
            >
              <input
                id="chat-message-input"
                type="text"
                aria-label="Message VendiAide"
                placeholder="Type a message or click a prompt above..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 px-4 text-xs font-medium text-gray-900 bg-white placeholder:text-gray-400 outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!inputText.trim() || isTyping}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-50 transition shrink-0"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>


          {/* RIGHT PANE: Live Vendor Dashboard Preview */}
          <div
            className={`lg:col-span-6 flex flex-col space-y-4 ${
              mobileView === 'vendor' ? 'block' : 'hidden lg:flex'
            }`}
          >
            {/* Business Card Info Header */}
            <div className="rounded-2xl bg-white p-4 border border-gray-200/80 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-sm">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Kulture Fashion House</h3>
                  <p className="text-xs text-gray-500">Lagos, Nigeria • Ready-to-Wear & Abayas</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 py-1 px-3 rounded-full border border-emerald-200">
                Live Feed
              </span>
            </div>

            {/* Metrics Overview Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white p-3.5 border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Conversations</span>
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-xl font-extrabold text-gray-900">{totalConversations}</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Active Demo</p>
              </div>

              <div className="rounded-2xl bg-white p-3.5 border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">New Leads</span>
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-xl font-extrabold text-gray-900">{newLeadsCount}</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Captured</p>
              </div>

              <div className="rounded-2xl bg-white p-3.5 border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Orders</span>
                  <Package className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-xl font-extrabold text-gray-900">{capturedOrdersCount}</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Pending</p>
              </div>

              <div className="rounded-2xl bg-white p-3.5 border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pipeline</span>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-sm font-extrabold text-emerald-700 truncate">{formatNaira(pipelineValueNaira)}</p>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Estimated</p>
              </div>
            </div>

            {/* Dashboard Feed Tabs Navigation */}
            <div className="rounded-2xl bg-white border border-gray-200/80 shadow-xl flex-1 flex flex-col min-h-[460px] overflow-hidden">
              <div className="flex items-center border-b border-gray-100 bg-gray-50/50 p-2 gap-2">
                <button
                  onClick={() => setActiveTab('conversations')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    activeTab === 'conversations'
                      ? 'bg-white text-emerald-800 shadow-2xs border border-gray-200/60'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Active Conversations
                </button>

                <button
                  onClick={() => setActiveTab('leads')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    activeTab === 'leads'
                      ? 'bg-white text-emerald-800 shadow-2xs border border-gray-200/60'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Leads ({newLeadsCount})
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    activeTab === 'orders'
                      ? 'bg-white text-emerald-800 shadow-2xs border border-gray-200/60'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Orders ({capturedOrdersCount})
                </button>
              </div>

              {/* Feed Tab Content Container */}
              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                {/* TAB 1: ACTIVE CONVERSATIONS */}
                {activeTab === 'conversations' && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-gray-200/80 p-4 space-y-3 bg-white shadow-2xs hover:border-emerald-200 transition">
                      {/* Customer Header & Commercial Stage */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                            <User className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-gray-900 block">Demo Customer (WhatsApp)</span>
                            <span className="text-[11px] text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" /> Active recently
                            </span>
                          </div>
                        </div>

                        {/* Human-Friendly Commercial Stage Badge */}
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 ${
                            demoState.orders.length > 0
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : demoState.activeDraft?.status === 'READY_FOR_CHECKOUT'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : demoState.activeDraft?.status === 'CONFIGURING'
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              demoState.orders.length > 0
                                ? 'bg-emerald-600'
                                : demoState.activeDraft?.status === 'READY_FOR_CHECKOUT'
                                ? 'bg-amber-600 animate-pulse'
                                : demoState.activeDraft?.status === 'CONFIGURING'
                                ? 'bg-sky-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          {demoState.orders.length > 0
                            ? 'Order Confirmed'
                            : demoState.activeDraft?.status === 'READY_FOR_CHECKOUT'
                            ? 'Awaiting Confirmation'
                            : demoState.activeDraft?.status === 'CONFIGURING'
                            ? 'Selecting Options'
                            : 'Active Inquiry'}
                        </span>
                      </div>

                      {/* Latest Customer Message */}
                      <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span className="font-semibold text-gray-700">Latest message:</span>
                          <span className="text-emerald-700 font-medium">
                            {formatIntentForMerchant(demoState.lastIntent)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-800 italic font-sans">
                          &quot;{demoState.messages[demoState.messages.length - 1]?.text || 'No messages yet'}&quot;
                        </p>
                      </div>

                      {/* Customer Shopping Cart / Order Progress */}
                      <div className="rounded-xl border border-gray-200/80 p-3 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                            <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" />
                            Customer Shopping Cart
                          </span>
                          <span className="text-[11px] font-semibold text-gray-500">
                            Stage: {formatStageForMerchant(demoState.activeDraft?.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100">
                          <div className="space-y-0.5">
                            <span className="text-[11px] text-gray-500 block">Item</span>
                            <span className="font-semibold text-gray-900 block truncate">
                              {activeProduct ? activeProduct.name : (demoState.activeDraft?.productId ? (CUSTOM_CATALOG.find(p => p.id === demoState.activeDraft.productId)?.name || demoState.activeDraft.productId) : (demoState.pendingProductId ? (CUSTOM_CATALOG.find(p => p.id === demoState.pendingProductId)?.name || demoState.pendingProductId) : 'None selected'))}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[11px] text-gray-500 block">Size &amp; Color</span>
                            <span className="font-semibold text-gray-900 block">
                              {demoState.activeDraft?.size || demoState.pendingSize ? `Size ${demoState.activeDraft?.size || demoState.pendingSize}` : 'Pending size'}
                              {demoState.activeDraft?.color ? ` • ${demoState.activeDraft.color}` : ''}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[11px] text-gray-500 block">Delivery Location</span>
                            <span className="font-semibold text-gray-900 block truncate">
                              {demoState.activeDraft?.location || demoState.pendingLocation || 'Pending location'}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[11px] text-gray-500 block">Estimated Total</span>
                            <span className="font-black text-emerald-700 block">
                              {totalNaira > 0 ? formatNaira(totalNaira) : '₦0'}
                            </span>
                          </div>
                        </div>

                        {/* Action Required Banner for Vendor */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                          <span className="text-gray-500 font-medium">Merchant Action:</span>
                          <span className="font-bold text-gray-800">
                            {demoState.orders.length > 0
                              ? 'Send bank details & dispatch order'
                              : demoState.activeDraft?.status === 'READY_FOR_CHECKOUT'
                              ? 'Customer is reviewing order summary'
                              : demoState.activeDraft?.status === 'CONFIGURING'
                              ? 'AI assistant collecting customer choices'
                              : 'AI assistant answering questions'}
                          </span>
                        </div>
                      </div>

                      {/* Internal telemetry preserved for test harness and observer diagnostics */}
                      <div
                        aria-hidden="true"
                        className="text-transparent text-[1px] leading-none absolute pointer-events-none select-none -z-50"
                      >
                        <span data-testid="debug-intent">{demoState.lastIntent || 'UNKNOWN'}</span>
                        <span>Draft Status &amp; Auth: {demoState.activeDraft?.status || 'EMPTY'}</span>
                        <span>Authorized: {demoState.activeDraft?.authorized ? 'YES' : 'NO'}</span>
                        <span>Orders: {demoState.orders.length}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: LEADS FEED */}
                {activeTab === 'leads' && (
                  <div>
                    {demoState.leads.length === 0 ? (
                      <div className="py-12 text-center text-gray-400 space-y-2">
                        <Users className="h-8 w-8 mx-auto text-gray-300" />
                        <p className="text-xs font-semibold text-gray-500">No demo leads captured yet.</p>
                        <p className="text-[11px] text-gray-400">
                          Try sending a purchase prompt like &quot;I want to buy the Black Hoodie in XL&quot;.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {demoState.leads.map((lead) => (
                          <div
                            key={lead.id}
                            className="rounded-xl border border-gray-200/80 p-3.5 space-y-2 bg-white"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-gray-900">{lead.customerName}</span>
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {lead.status}
                              </span>
                            </div>

                            <p className="text-xs text-gray-700 font-semibold">
                              Interested Item: <span className="text-emerald-700">{lead.productInterest}</span>
                            </p>

                            <p className="text-[11px] text-gray-500">Source: WhatsApp • {lead.timestamp}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: ORDERS FEED */}
                {activeTab === 'orders' && (
                  <div>
                    {demoState.orders.length === 0 ? (
                      <div className="py-12 text-center text-gray-400 space-y-2">
                        <Package className="h-8 w-8 mx-auto text-gray-300" />
                        <p className="text-xs font-semibold text-gray-500">No demo orders created yet.</p>
                        <p className="text-[11px] text-gray-400">
                          Complete a purchase prompt with product, size, and delivery location to trigger order creation!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {demoState.orders.map((ord) => (
                          <div
                            key={ord.id}
                            className="rounded-xl border border-emerald-200 p-3.5 space-y-2 bg-emerald-50/20"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-gray-900">{ord.productName}</span>
                              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                                {ord.status}
                              </span>
                            </div>

                            <div className="text-xs text-gray-700 space-y-1 bg-white p-2.5 rounded-lg border border-gray-200/70">
                              <p>
                                <strong className="text-gray-900">Details:</strong> Size {ord.size} • Color {ord.color} • Qty {ord.quantity}
                              </p>
                              <p>
                                <strong className="text-gray-900">Delivery:</strong> {ord.deliveryLocation}
                              </p>
                              <p className="font-black text-emerald-700 text-xs pt-1">
                                Total: {formatNaira(ord.totalNaira)}
                              </p>
                            </div>

                            <p className="text-[11px] text-gray-500">Customer: {ord.customerName} • {ord.timestamp}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Demo Bottom Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base font-extrabold flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Ready To Automate Your WhatsApp Fashion Sales?
            </h4>
            <p className="text-xs text-emerald-100">
              Join the Founding 10 Nigerian fashion vendors getting white-glove setup for ₦30,000 + ₦10,000/month.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-white py-3 px-6 text-xs font-extrabold text-emerald-950 shadow-md hover:bg-emerald-50 transition shrink-0"
          >
            <span>Start Free Vendor Setup</span>
            <ChevronRight className="h-4 w-4 text-emerald-700" />
          </Link>
        </div>

      </div>
    </div>
  );
}
