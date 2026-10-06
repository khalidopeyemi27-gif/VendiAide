'use client';

import React from 'react';
import { Check, Sparkles, HelpCircle } from 'lucide-react';

interface PricingSectionProps {
  onOpenDemoModal: () => void;
}

export function PricingSection({ onOpenDemoModal }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-16 sm:py-24 bg-gray-50/60 border-y border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
            Transparent Pricing
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Simple Plans Tailored To Your Sales Volume
          </p>
          <p className="mt-4 text-base text-gray-600">
            All prices in Nigerian Naira (₦). No hidden charges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* Card 1: Founding 10 Cohort (Highlighted Offer) */}
          <div className="relative flex flex-col justify-between rounded-3xl border-2 border-emerald-500 bg-white p-8 shadow-xl">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1 text-xs font-bold text-white shadow-sm flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>LIMITED FOUNDING COHORT</span>
            </div>

            <div>
              <div className="mb-4 pt-2">
                <h3 className="text-xl font-bold text-gray-900">Founding 10</h3>
                <p className="text-xs text-gray-500 mt-1">First 10 Nigerian fashion vendors only</p>
              </div>

              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900">₦10,000</span>
                <span className="text-sm font-semibold text-gray-500">/month</span>
              </div>
              <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg p-2.5 mb-6 border border-emerald-200">
                + ₦30,000 one-time setup fee (Includes white-glove catalog setup & prompt tuning)
              </p>

              <ul className="space-y-3 text-xs text-gray-700 font-medium mb-8">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>500 AI conversations / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Up to 50 active fashion products</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>White-glove 1-on-1 catalog setup</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Grounded anti-hallucination rules</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Human takeover & lead pipeline</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenDemoModal}
              className="w-full rounded-xl bg-emerald-600 py-3.5 px-4 text-center text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition"
            >
              Apply for Founding Cohort
            </button>
          </div>

          {/* Card 2: Starter Tier */}
          <div className="flex flex-col justify-between rounded-3xl border border-gray-200/90 bg-white p-8 shadow-xs">
            <div>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">Starter</h3>
                <p className="text-xs text-gray-500 mt-1">For growing boutiques & Instagram sellers</p>
              </div>

              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900">₦15,000</span>
                <span className="text-sm font-semibold text-gray-500">/month</span>
              </div>

              <ul className="space-y-3 text-xs text-gray-700 font-medium mb-8">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Up to 500 AI conversations / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Up to 50 active fashion products</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Naira (₦) pricing & delivery rates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Lead & Order CRM logging</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Standard support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenDemoModal}
              className="w-full rounded-xl border border-gray-300 py-3.5 px-4 text-center text-sm font-bold text-gray-800 hover:bg-gray-50 transition"
            >
              Book a Free Demo
            </button>
          </div>

          {/* Card 3: Growth Tier */}
          <div className="flex flex-col justify-between rounded-3xl border border-gray-200/90 bg-white p-8 shadow-xs">
            <div>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">Growth</h3>
                <p className="text-xs text-gray-500 mt-1">For high-volume fashion brands & stores</p>
              </div>

              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900">₦30,000</span>
                <span className="text-sm font-semibold text-gray-500">/month</span>
              </div>

              <ul className="space-y-3 text-xs text-gray-700 font-medium mb-8">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Up to 2,000 AI conversations / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Unlimited products & catalog items</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Priority support & fast response</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Advanced follow-up task manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Multi-agent dashboard access</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenDemoModal}
              className="w-full rounded-xl border border-gray-300 py-3.5 px-4 text-center text-sm font-bold text-gray-800 hover:bg-gray-50 transition"
            >
              Book a Free Demo
            </button>
          </div>

        </div>

        {/* External WhatsApp API Usage Disclaimer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-gray-500 font-medium">
          <HelpCircle className="h-4 w-4 text-gray-400 shrink-0" />
          <span>Note: External WhatsApp API usage fees may apply where relevant.</span>
        </div>
      </div>
    </section>
  );
}
