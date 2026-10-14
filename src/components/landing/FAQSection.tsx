'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function FAQSection() {
  const faqs = [
    {
      q: 'Does VendiAide support Nigerian Naira (₦)?',
      a: 'Yes, 100%! VendiAide is built specifically for Nigerian fashion businesses. Product pricing, Lagos delivery rates (₦2,500), nationwide shipping rates (₦5,000), order summaries, and payment instructions are all natively calculated and displayed in ₦ Naira.',
    },
    {
      q: 'How does catalog grounding work? Will the AI invent fake prices or sizes?',
      a: 'No. VendiAide operates on strict Grounded Information Rules. It accesses ONLY the products, sizes, colours, prices, and FAQs you upload in your vendor dashboard. If a customer asks for an unlisted size or discount, the AI explicitly states that it does not have that information and offers to connect them directly with you.',
    },
    {
      q: 'Can I take over a conversation from the AI assistant?',
      a: 'Yes. You retain 100% control at all times. Whenever a buyer requests custom tailoring or wants to speak to the owner, the AI flags the conversation for Human Takeover and notifies you on your dashboard.',
    },
    {
      q: 'How long does setup take?',
      a: 'You can try the interactive demo immediately on this site with zero setup. For live store deployment, onboarding is guided: our team works with you to load your catalog, configure shipping rates, and set up your assistant so it represents your brand accurately.',
    },
    {
      q: 'Does VendiAide take over my personal WhatsApp?',
      a: 'No. VendiAide connects via official WhatsApp Business API or designated store numbers. You keep complete visibility over all conversations, and human takeover ensures you can step in at any second.',
    },
    {
      q: 'Are there any external WhatsApp or API fees?',
      a: 'Our web simulator and demo mode are completely free to test. When you connect live Meta WhatsApp Cloud API infrastructure, standard external WhatsApp/Meta message fees apply where relevant based on conversation volume.',
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
            Got Questions?
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Frequently Asked Questions
          </p>
          <p className="mt-4 text-base text-gray-600">
            Everything you need to know about VendiAide for Nigerian fashion.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden transition"
              >
                <button
                  onClick={() => toggle(i)}
                  className="flex w-full items-center justify-between p-6 text-left font-bold text-gray-900 text-base sm:text-lg hover:text-emerald-600 transition focus:outline-hidden"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-500 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
