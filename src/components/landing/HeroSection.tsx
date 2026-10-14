'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react';

interface HeroSectionProps {
  onOpenDemoModal: () => void;
}

export function HeroSection({ onOpenDemoModal }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-white pt-8 pb-14 sm:pt-14 sm:pb-24 lg:pt-16 lg:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          
          {/* Left Column: Hero Text */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Built Exclusively for Nigerian Fashion Vendors</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.15]">
              Turn WhatsApp Enquiries Into <span className="text-emerald-600">Orders</span>
            </h1>

            <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              The AI sales assistant for Nigerian fashion vendors. Answer common questions about prices, sizes, stock and delivery, and keep track of interested buyers and orders.
            </p>

            {/* CTAs: Primary goes directly to working interactive demo */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1">
              <Link
                href="/demo"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 px-6 sm:py-4 sm:px-7 text-sm sm:text-base font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition"
              >
                <span>Try Interactive Demo</span>
                <ArrowRight className="h-5 w-5" />
              </Link>

              <button
                onClick={onOpenDemoModal}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3.5 px-6 sm:py-4 sm:px-7 text-sm sm:text-base font-bold text-gray-800 shadow-2xs hover:bg-gray-50 transition"
              >
                <span>Book a Setup Call</span>
              </button>
            </div>

            {/* Value Proof Badges */}
            <div className="pt-2 sm:pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-gray-600 font-medium">
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
            <div className="relative mx-auto max-w-md rounded-3xl border border-gray-200/80 bg-white p-3.5 sm:p-5 shadow-2xl shadow-gray-200/80">
              
              {/* Simulator Header: Matches Kulture Fashion House identity */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3 sm:mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm">
                    KF
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Kulture Fashion House</h4>
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> AI Sales Assistant (Preview)
                    </p>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                  ₦ Naira Ready
                </span>
              </div>

              {/* Chat Messages: Natural conversation without engineering debug prefixes */}
              <div className="space-y-2.5 sm:space-y-3 text-[11px] sm:text-xs leading-relaxed font-normal">
                {/* Customer Question 1 */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-emerald-600 text-white p-2.5 sm:p-3 shadow-2xs">
                    Hi! Do you have the Black Oversized Hoodie in size L? How much is Lagos delivery?
                  </div>
                </div>

                {/* AI Assistant Answer 1 */}
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-2xl rounded-tl-none bg-gray-100 text-gray-800 p-2.5 sm:p-3 border border-gray-200/60">
                    Yes, we do! Our <strong>Black Oversized Hoodie</strong> is in stock for <strong>₦25,000</strong> (sizes M, L, XL).
                    <br /><br />
                    🚚 Delivery within Lagos is <strong>₦2,500</strong> (24–48 hrs). Would you like me to reserve size L for you?
                  </div>
                </div>

                {/* Customer Purchase Intent */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-emerald-600 text-white p-2.5 sm:p-3 shadow-2xs">
                    Yes, please! Deliver to Ikeja, Lagos.
                  </div>
                </div>

                {/* AI Order Confirmation */}
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-2xl rounded-tl-none bg-emerald-50 text-emerald-950 p-2.5 sm:p-3 border border-emerald-200">
                    Wonderful! Got your order for Black Oversized Hoodie, size L to Ikeja. Total is <strong>₦27,500</strong> (₦25,000 + ₦2,500 delivery). We have recorded your order details for vendor fulfillment!
                  </div>
                </div>
              </div>

              {/* Bottom Simulated Status Badge */}
              <div className="mt-3 sm:mt-4 rounded-xl bg-gray-50 p-2 text-center text-[11px] text-gray-600 font-medium border border-gray-200/60">
                ⚡ Order & customer details recorded in vendor dashboard
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
