'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react';

interface HeroSectionProps {
  onOpenDemoModal: () => void;
}

export function HeroSection({ onOpenDemoModal }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-white pt-12 pb-20 sm:pt-16 sm:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Hero Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Built Exclusively for Nigerian Fashion Vendors</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.15]">
              Turn WhatsApp Enquiries Into <span className="text-emerald-600">Orders</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Your AI sales assistant for Nigerian fashion businesses. Automatically answer repetitive size, price, and stock questions, capture interested leads, and organize your orders in ₦ Naira.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onOpenDemoModal}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 px-7 text-base font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition"
              >
                <span>Book a Free Demo</span>
                <ArrowRight className="h-5 w-5" />
              </button>

              <Link
                href="/demo"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-4 px-7 text-base font-bold text-gray-800 shadow-2xs hover:bg-gray-50 transition"
              >
                <span>Try Demo</span>
              </Link>
            </div>

            {/* Value Proof Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Grounded on your actual catalog</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Nigerian Naira (₦) pricing & delivery rates</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Human takeover anytime</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity WhatsApp AI Sales Simulator Preview */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md rounded-3xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-2xl shadow-gray-200/80">
              
              {/* Simulator Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm">
                    VP
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">VoguePulse Fashion NG</h4>
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> AI Sales Assistant (Active)
                    </p>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                  ₦ Naira Ready
                </span>
              </div>

              {/* Chat Messages */}
              <div className="space-y-3 text-xs leading-relaxed font-normal">
                {/* Customer Question 1 */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-emerald-600 text-white p-3 shadow-2xs">
                    Hi! Do you have the Black Oversized Hoodie in size L? How much is Lagos delivery?
                  </div>
                </div>

                {/* AI Assistant Answer 1 */}
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-2xl rounded-tl-none bg-gray-100 text-gray-800 p-3 border border-gray-200/60">
                    <p className="font-semibold text-emerald-800 text-[11px] mb-1">🤖 VendiAide (Grounded):</p>
                    Yes! Our <strong>Black Oversized Hoodie</strong> is in stock for <strong>₦25,000</strong> in sizes M, L, and XL. 
                    <br /><br />
                    🚚 Delivery within Lagos is <strong>₦2,500</strong> (24–48 hrs). Would you like me to reserve one in size L for you?
                  </div>
                </div>

                {/* Customer Purchase Intent */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-emerald-600 text-white p-3 shadow-2xs">
                    Yes! I will take size L to Ikeja, Lagos.
                  </div>
                </div>

                {/* AI Order Confirmation */}
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-2xl rounded-tl-none bg-emerald-50 text-emerald-950 p-3 border border-emerald-200">
                    <p className="font-bold text-emerald-800 text-[11px] mb-1">🎉 Order Initiated & Lead Logged:</p>
                    Wonderful! Your order for size L is logged (₦27,500 total). I have notified the vendor to share the official payment link/transfer details with you on WhatsApp!
                  </div>
                </div>
              </div>

              {/* Bottom Simulated Status Badge */}
              <div className="mt-4 rounded-xl bg-gray-50 p-2.5 text-center text-[11px] text-gray-600 font-medium border border-gray-200/60">
                ⚡ Lead & Order automatically recorded in vendor dashboard
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
