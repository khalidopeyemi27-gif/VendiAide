import React from 'react';
import { Upload, Bot, ShoppingCart } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      icon: Upload,
      title: 'Upload Catalog & Rates',
      description:
        'Add your fashion items with prices in ₦ Naira, available sizes, colours, stock status, Lagos/interstate shipping rates, and bank account details.',
    },
    {
      number: '02',
      icon: Bot,
      title: 'Activate Grounded AI Assistant',
      description:
        'Your AI sales assistant learns your exact products and FAQs. It responds instantly to buyers using strictly verified vendor facts — no invented details.',
    },
    {
      number: '03',
      icon: ShoppingCart,
      title: 'Auto-Capture Leads & Orders',
      description:
        'When customers express buying intent, the AI logs their preferred item, size, color, and delivery location into your structured dashboard.',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
            Simple 3-Step Process
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            How VendiAide Works For Your Store
          </p>
          <p className="mt-4 text-base text-gray-600">
            Set up your AI sales assistant in under 5 minutes. No coding or complex technical setup required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="relative rounded-2xl border border-gray-200/80 bg-white p-8 shadow-xs hover:border-emerald-300 transition duration-200"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700 font-bold">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-3xl font-black text-gray-200">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
