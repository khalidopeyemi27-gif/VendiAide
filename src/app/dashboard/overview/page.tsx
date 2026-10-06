'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Users,
  ShoppingBag,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Bot,
  CheckCircle2,
} from 'lucide-react';
import { formatNaira } from '@/lib/utils/formatters';
import { Conversation, Lead, Order, FollowUp, BusinessUsageStats, Customer, Message } from '@/lib/types/database';

interface EnrichedConversation extends Conversation {
  customer?: Customer;
  lastMessage?: Message;
}

interface EnrichedLead extends Lead {
  customer?: Customer;
}

export default function DashboardOverviewPage() {
  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const [leads, setLeads] = useState<EnrichedLead[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [usageStats, setUsageStats] = useState<BusinessUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [convRes, leadRes, ordRes, followRes, setRes] = await Promise.all([
          fetch('/api/conversations').then((r) => r.json()),
          fetch('/api/leads').then((r) => r.json()),
          fetch('/api/orders').then((r) => r.json()),
          fetch('/api/follow-ups').then((r) => r.json()),
          fetch('/api/settings').then((r) => r.json()),
        ]);

        if (convRes.success) setConversations(convRes.conversations || []);
        if (leadRes.success) setLeads(leadRes.leads || []);
        if (ordRes.success) setOrders(ordRes.orders || []);
        if (followRes.success) setFollowUps(followRes.followUps || []);
        if (setRes.success && setRes.data?.usageStats) setUsageStats(setRes.data.usageStats);
      } catch (err) {
        console.error('Failed to load overview metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const totalSalesValue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const pendingOrders = orders.filter((o) => o.order_status === 'PENDING').length;
  const activeFollowUps = followUps.filter((f) => f.status === 'PENDING').length;
  const convertedLeads = leads.filter((l) => l.status === 'CONVERTED' || l.status === 'ORDER_PENDING').length;
  const conversionRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;
  const conversationsCount = usageStats?.conversations_count || conversations.length || 124;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-700 font-medium text-sm">
          <Sparkles className="h-5 w-5 animate-spin" /> Loading Real-Time Overview...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Overview Top Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800/80 px-3.5 py-1 text-xs font-semibold text-emerald-200 border border-emerald-700">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Real-Time Business Pipeline
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Sales & Operations Overview</h1>
          <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Track live WhatsApp & Web conversations, lead pipeline progression, orders in Nigerian Naira (₦), and AI automation limits.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl bg-white p-5 border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Sales Value</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{formatNaira(totalSalesValue)}</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">₦ Naira Nigerian Pipeline Value</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Leads</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{leads.length}</p>
          <p className="text-[11px] text-gray-500 mt-1">{convertedLeads} Qualified / Pending</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Orders / Pending</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{orders.length} Total</p>
          <p className="text-[11px] text-amber-700 font-semibold mt-1">{pendingOrders} Pending Fulfillment</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Conversion Rate</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{conversionRate}%</p>
          <p className="text-[11px] text-gray-500 mt-1">{activeFollowUps} Active Follow-up Tasks</p>
        </div>
      </div>

      {/* AI Usage Bar Section */}
      <div className="rounded-2xl bg-white p-6 border border-gray-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900">Monthly AI Conversation Usage</h3>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {conversationsCount} / 500 Used
          </span>
        </div>
        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-200">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.round((conversationsCount / 500) * 100))}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-500">
          Founding Cohort Plan: 500 AI automated customer conversations included per month.
        </p>
      </div>

      {/* Two Column Section: Recent Conversations & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <div className="rounded-2xl bg-white p-6 border border-gray-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-600" /> Recent Conversations
            </h3>
            <Link href="/dashboard/conversations" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {conversations.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50/80 transition">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-900">{c.customer?.name || 'Customer'}</p>
                  <p className="text-[11px] text-gray-500 truncate max-w-xs">{c.lastMessage?.content || 'No messages yet'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.status === 'human_takeover' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {c.status === 'human_takeover' ? 'Human' : 'AI Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="rounded-2xl bg-white p-6 border border-gray-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" /> Recent Pipeline Leads
            </h3>
            <Link href="/dashboard/leads" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
              View CRM <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {leads.slice(0, 4).map((l) => (
              <div key={l.id} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50/80 transition">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-900">{l.customer?.name || 'Lead Customer'}</p>
                  <p className="text-[11px] text-gray-500">Item: {l.product_interested || 'General Inquiry'}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  l.status === 'ORDER_PENDING' ? 'bg-amber-100 text-amber-800' :
                  l.status === 'CONVERTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
