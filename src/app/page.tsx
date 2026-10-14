'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { WhoItsForSection } from '@/components/landing/WhoItsForSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { Footer } from '@/components/landing/Footer';
import { DemoModal } from '@/components/landing/DemoModal';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(undefined);

  const handleOpenDemoModal = (plan?: string) => {
    setSelectedPlan(plan);
    setIsDemoModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-emerald-500 selection:text-white flex flex-col justify-between">
      <div>
        {/* Navigation Header */}
        <Header onOpenDemoModal={() => handleOpenDemoModal()} />

        {/* Main Content Sections */}
        <main>
          {/* Hero Section */}
          <HeroSection onOpenDemoModal={() => handleOpenDemoModal()} />

          {/* Problem Section */}
          <ProblemSection />

          {/* How It Works Section */}
          <HowItWorksSection />

          {/* Core Features Section */}
          <FeaturesSection />

          {/* Who It's For Section */}
          <WhoItsForSection />

          {/* Pricing Section */}
          <PricingSection onOpenDemoModal={handleOpenDemoModal} />

          {/* FAQ Section */}
          <FAQSection />

          {/* Final Call To Action Banner */}
          <section className="relative overflow-hidden bg-emerald-900 py-16 sm:py-20 text-white">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-emerald-200 border border-emerald-700">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Founding Cohort Offer — First 10 Vendors</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                Ready To Turn WhatsApp Enquiries Into Orders?
              </h2>
              <p className="text-emerald-100 text-base sm:text-lg max-w-2xl mx-auto font-normal">
                Join our founding cohort of Nigerian fashion vendors. Experience grounded catalog automation and start capturing organized orders today.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/demo"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-white py-4 px-8 text-base font-bold text-emerald-900 shadow-xl hover:bg-emerald-50 transition"
                >
                  <Sparkles className="h-5 w-5 text-emerald-700" />
                  <span>Try Interactive Demo</span>
                </Link>
                <button
                  onClick={() => handleOpenDemoModal('Founding 10')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-800/60 py-4 px-8 text-base font-bold text-white shadow-md hover:bg-emerald-800 transition"
                >
                  <span>Book a Setup Call</span>
                  <ArrowRight className="h-5 w-5 text-emerald-300" />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* Demo Request Modal */}
      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        selectedPlan={selectedPlan}
      />
    </div>
  );
}
