'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Sparkles, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { Business, AISettings } from '@/lib/types/database';

export default function DashboardSettingsPage() {
  const [business, setBusiness] = useState<Partial<Business>>({});
  const [aiSettings, setAiSettings] = useState<Partial<AISettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings').then((r) => r.json());
        if (isMounted && res.success && res.data) {
          setBusiness(res.data.business || {});
          setAiSettings(res.data.aiSettings || {});
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: business.name,
          description: business.description,
          category: business.category,
          phone_number: business.phone_number,
          instagram_handle: business.instagram_handle,
          whatsapp_number: business.whatsapp_number,
          delivery_info: business.delivery_info,
          payment_info: business.payment_info,
          ai_settings: aiSettings,
        }),
      }).then((r) => r.json());

      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-700 font-medium text-sm">
          <Sparkles className="h-5 w-5 animate-spin" /> Loading Vendor Settings...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveSettings} className="space-y-8 font-sans max-w-4xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-600" /> Vendor Business Settings
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your business profile, delivery rates (₦), bank details, AI persona, and subscription limits.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition self-start sm:self-auto"
        >
          {saving ? <Sparkles className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" /> Vendor settings saved successfully!
        </div>
      )}

      {/* 1. Business Profile */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">1. Business Profile</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Business Name</label>
            <input
              type="text"
              value={business.name || ''}
              onChange={(e) => setBusiness({ ...business, name: e.target.value })}
              className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <input
              type="text"
              value={business.category || ''}
              onChange={(e) => setBusiness({ ...business, category: e.target.value })}
              className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Business Description</label>
          <textarea
            rows={2}
            value={business.description || ''}
            onChange={(e) => setBusiness({ ...business, description: e.target.value })}
            className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp Business Number</label>
            <input
              type="text"
              value={business.whatsapp_number || ''}
              onChange={(e) => setBusiness({ ...business, whatsapp_number: e.target.value })}
              className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Instagram Handle</label>
            <input
              type="text"
              value={business.instagram_handle || ''}
              onChange={(e) => setBusiness({ ...business, instagram_handle: e.target.value })}
              className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* 2. Delivery Rates (₦) */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">2. Delivery Rates (₦ Naira)</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lagos Shipping Fee (₦)</label>
            <input
              type="number"
              value={business.delivery_info?.fee_lagos || 2500}
              onChange={(e) =>
                setBusiness({
                  ...business,
                  delivery_info: { ...business.delivery_info!, fee_lagos: Number(e.target.value) },
                })
              }
              className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Interstate Shipping Fee (₦)</label>
            <input
              type="number"
              value={business.delivery_info?.fee_interstate || 5000}
              onChange={(e) =>
                setBusiness({
                  ...business,
                  delivery_info: { ...business.delivery_info!, fee_interstate: Number(e.target.value) },
                })
              }
              className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* 3. Bank & Payment Details */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-900">3. Vendor Payment Details</h3>
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Isolated From Customer AI
          </span>
        </div>

        <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Security Protocol: Your bank account details are stored here for vendor reference only. They are strictly excluded from AI system prompts and will never be automatically generated to customers.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
            <input
              type="text"
              value={business.payment_info?.bank_name || ''}
              onChange={(e) =>
                setBusiness({
                  ...business,
                  payment_info: { ...business.payment_info!, bank_name: e.target.value },
                })
              }
              className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
            <input
              type="text"
              value={business.payment_info?.account_number || ''}
              onChange={(e) =>
                setBusiness({
                  ...business,
                  payment_info: { ...business.payment_info!, account_number: e.target.value },
                })
              }
              className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Account Name</label>
            <input
              type="text"
              value={business.payment_info?.account_name || ''}
              onChange={(e) =>
                setBusiness({
                  ...business,
                  payment_info: { ...business.payment_info!, account_name: e.target.value },
                })
              }
              className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* 4. AI Assistant Persona */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">4. AI Assistant Settings</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assistant Name</label>
            <input
              type="text"
              value={aiSettings.assistant_name || 'VoguePulse Sales Bot'}
              onChange={(e) => setAiSettings({ ...aiSettings, assistant_name: e.target.value })}
              className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tone</label>
            <select
              value={aiSettings.tone || 'friendly_professional'}
              onChange={(e) => setAiSettings({ ...aiSettings, tone: e.target.value as AISettings['tone'] })}
              className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
            >
              <option value="friendly_professional">Friendly & Professional</option>
              <option value="warm_nigerian_pinyin">Warm Nigerian Customer-Care</option>
              <option value="formal">Formal & Luxury</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Greeting Message</label>
          <textarea
            rows={2}
            value={aiSettings.greeting_message || ''}
            onChange={(e) => setAiSettings({ ...aiSettings, greeting_message: e.target.value })}
            className="w-full rounded-xl border border-gray-300 py-2 px-3 text-xs outline-none focus:border-emerald-600"
          />
        </div>
      </div>
    </form>
  );
}
