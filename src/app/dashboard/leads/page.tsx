'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Sparkles, ArrowRight } from 'lucide-react';
import { Lead, LeadStatus, Customer } from '@/lib/types/database';

interface EnrichedLead extends Lead {
  customer?: Customer;
}

export default function DashboardLeadsPage() {
  const [leads, setLeads] = useState<EnrichedLead[]>([]);
  const [filter, setFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadLeads() {
      try {
        const res = await fetch('/api/leads').then((r) => r.json());
        if (isMounted && res.success && res.leads) {
          setLeads(res.leads);
        }
      } catch (err) {
        console.error('Failed to load leads:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLeads();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleStatusChange(leadId: string, newStatus: LeadStatus) {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }).then((r) => r.json());

      if (res.success && res.lead) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  }

  const filteredLeads = leads.filter((l) => {
    if (filter !== 'ALL' && l.status !== filter) return false;
    if (search) {
      const name = l.customer?.name?.toLowerCase() || '';
      const prod = l.product_interested?.toLowerCase() || '';
      return name.includes(search.toLowerCase()) || prod.includes(search.toLowerCase());
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-700 font-medium text-sm">
          <Sparkles className="h-5 w-5 animate-spin" /> Loading Leads CRM...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" /> Leads CRM Pipeline
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Qualify incoming customer inquiries and convert purchase intent into confirmed orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200">
            {leads.length} Total Pipeline Leads
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'NEW', 'CONTACTED', 'INTERESTED', 'ORDER_PENDING', 'CONVERTED', 'LOST'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                filter === tab
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search lead or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-gray-300 py-2 pl-9 pr-4 text-xs font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Interested Product</th>
                <th className="py-3.5 px-6">Channel</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Notes</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-800">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No leads found matching filter.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-4 px-6 font-bold text-gray-900">
                      {lead.customer?.name || 'Customer'}
                      <p className="text-[10px] text-gray-400 font-normal">{lead.customer?.phone_number || 'N/A'}</p>
                    </td>
                    <td className="py-4 px-6">{lead.product_interested || 'General Inquiry'}</td>
                    <td className="py-4 px-6 capitalize">{lead.source}</td>
                    <td className="py-4 px-6">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        className={`text-xs font-bold py-1 px-2.5 rounded-lg border outline-none cursor-pointer ${
                          lead.status === 'CONVERTED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : lead.status === 'ORDER_PENDING'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="INTERESTED">INTERESTED</option>
                        <option value="ORDER_PENDING">ORDER_PENDING</option>
                        <option value="CONVERTED">CONVERTED</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-gray-500 max-w-xs truncate">{lead.notes || '—'}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleStatusChange(lead.id, 'CONVERTED')}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3 rounded-lg transition border border-emerald-200"
                      >
                        <span>Convert</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
