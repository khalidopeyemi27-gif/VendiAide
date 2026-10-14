'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, CheckCircle, Loader2, MessageSquare, Sparkles } from 'lucide-react';
import { FashionIndustryTemplate } from '@/lib/templates/fashion';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: string;
}

export function DemoModal({ isOpen, onClose, selectedPlan }: DemoModalProps) {
  const [vendorName, setVendorName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [category, setCategory] = useState(FashionIndustryTemplate.defaultCategories[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!vendorName.trim() || vendorName.trim().length < 2) {
      errs.vendor_name = 'Please enter your business or brand name';
    }
    if (!whatsappNumber.trim() || whatsappNumber.trim().length < 10) {
      errs.whatsapp_number = 'Please enter a valid WhatsApp phone number (e.g. 08012345678)';
    }
    if (!category) {
      errs.category = 'Please select your fashion category';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_name: vendorName,
          whatsapp_number: whatsappNumber,
          category,
          plan: selectedPlan || 'Founding 10',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else if (data.errors) {
        const fieldErrs: Record<string, string> = {};
        Object.entries(data.errors).forEach(([k, v]) => {
          fieldErrs[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(fieldErrs);
      }
    } catch {
      setErrors({ general: 'Something went wrong. Please try again or chat with us.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl transition-all border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close Modal"
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Setup Request Received!</h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Thanks! We&apos;ve recorded your details for <strong className="text-gray-800">{vendorName || 'your brand'}</strong>. Our team will contact you on WhatsApp at <strong className="text-gray-800">{whatsappNumber}</strong> to arrange your walkthrough.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/demo"
                onClick={onClose}
                className="flex-1 rounded-xl bg-emerald-600 py-3.5 px-4 font-semibold text-white hover:bg-emerald-700 transition shadow-md text-center text-sm"
              >
                Launch Interactive Demo Now
              </Link>
              <button
                onClick={onClose}
                className="rounded-xl border border-gray-200 py-3.5 px-4 font-semibold text-gray-700 hover:bg-gray-50 transition text-sm"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="h-4 w-4" />
              <span>{selectedPlan ? `${selectedPlan} Tier Onboarding` : 'Founding Cohort Onboarding'}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedPlan ? `Book a ${selectedPlan} Setup Call` : 'Book a Guided Setup Call'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Schedule a 1-on-1 walkthrough with our team. We&apos;ll show you how VendiAide handles customer inquiries, calculates shipping, and logs orders for your fashion brand.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 font-medium">
                  {errors.general}
                </div>
              )}

              <div>
                <label htmlFor="vendor_name" className="block text-xs font-semibold text-gray-700 mb-1">
                  Fashion Brand / Business Name *
                </label>
                <input
                  id="vendor_name"
                  type="text"
                  placeholder="e.g. Kulture Fashion House"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className={`w-full rounded-xl border py-3 px-4 text-sm outline-hidden transition ${
                    errors.vendor_name ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
                  }`}
                />
                {errors.vendor_name && <p className="mt-1 text-xs text-red-600">{errors.vendor_name}</p>}
              </div>

              <div>
                <label htmlFor="whatsapp_number" className="block text-xs font-semibold text-gray-700 mb-1">
                  WhatsApp Phone Number *
                </label>
                <div className="relative">
                  <input
                    id="whatsapp_number"
                    type="tel"
                    placeholder="e.g. 08012345678"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className={`w-full rounded-xl border py-3 px-4 text-sm outline-hidden transition ${
                      errors.whatsapp_number ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
                    }`}
                  />
                  <MessageSquare className="absolute right-3.5 top-3.5 h-4 w-4 text-gray-400" />
                </div>
                {errors.whatsapp_number && <p className="mt-1 text-xs text-red-600">{errors.whatsapp_number}</p>}
              </div>

              <div>
                <label htmlFor="category" className="block text-xs font-semibold text-gray-700 mb-1">
                  Primary Fashion Category *
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 py-3 px-4 text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 bg-white"
                >
                  {FashionIndustryTemplate.defaultCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3.5 px-6 font-semibold text-white shadow-md hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/40 disabled:opacity-70 transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting Setup Request...
                  </>
                ) : (
                  selectedPlan ? `Request ${selectedPlan} Setup Call` : 'Book a Setup Call'
                )}
              </button>
              <p className="text-center text-[11px] text-gray-500 mt-2">
                No credit card or technical setup required. 100% free walk-through.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
