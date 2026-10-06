'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, ArrowRight, Loader2, Sparkles, Check, Bot, Package, CreditCard, Building2 } from 'lucide-react';
import { FashionIndustryTemplate } from '@/lib/templates/fashion';

export default function OnboardingWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  // Step 1: Business Profile
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState(FashionIndustryTemplate.defaultCategories[0]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [location, setLocation] = useState('');

  // Step 2: Logistics & Bank Info
  const [feeLagos, setFeeLagos] = useState<number>(2500);
  const [feeInterstate, setFeeInterstate] = useState<number>(5000);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Step 3: Initial Catalog
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState<number>(25000);
  const [productSizes, setProductSizes] = useState<string[]>(['M', 'L', 'XL']);
  const [productColors, setProductColors] = useState<string[]>(['Black']);
  const [productInStock, setProductInStock] = useState<boolean>(true);

  // Step 4: AI Persona
  const [assistantName, setAssistantName] = useState('Aisha');
  const [tone, setTone] = useState<'friendly_professional' | 'warm_nigerian_pinyin' | 'formal'>('friendly_professional');
  const [greetingMessage, setGreetingMessage] = useState('Welcome to our store! How can I help you choose your outfit today?');

  // Step Validation
  const validateStep = (currentStep: number) => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!businessName.trim() || businessName.trim().length < 2) {
        errs.businessName = 'Business name must be at least 2 characters';
      }
      if (!whatsappNumber.trim() || whatsappNumber.trim().length < 10) {
        errs.whatsappNumber = 'Please enter a valid WhatsApp phone number (e.g. 08012345678)';
      }
      if (!location.trim() || location.trim().length < 2) {
        errs.location = 'Location/City is required (e.g. Ikeja, Lagos)';
      }
    }

    if (currentStep === 2) {
      if (isNaN(feeLagos) || feeLagos < 0) {
        errs.feeLagos = 'Lagos delivery rate cannot be negative';
      }
      if (isNaN(feeInterstate) || feeInterstate < 0) {
        errs.feeInterstate = 'Interstate delivery rate cannot be negative';
      }
    }

    if (currentStep === 3) {
      if (!productName.trim() || productName.trim().length < 2) {
        errs.productName = 'Product name is required';
      }
      if (isNaN(productPrice) || productPrice <= 0) {
        errs.productPrice = 'Price must be greater than zero';
      }
      if (productSizes.length === 0) {
        errs.productSizes = 'Select at least one size';
      }
      if (productColors.length === 0) {
        errs.productColors = 'Select at least one color';
      }
    }

    if (currentStep === 4) {
      if (!assistantName.trim()) {
        errs.assistantName = 'Assistant name is required';
      }
      if (!greetingMessage.trim()) {
        errs.greetingMessage = 'Greeting message is required';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setErrors({});
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          category,
          whatsapp_number: whatsappNumber,
          location,
          fee_lagos: feeLagos,
          fee_interstate: feeInterstate,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
          product_name: productName,
          product_price: productPrice,
          product_sizes: productSizes,
          product_colors: productColors,
          product_in_stock: productInStock,
          assistant_name: assistantName,
          tone,
          greeting_message: greetingMessage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/dashboard/overview');
      } else {
        setErrors({ general: data.message || 'Failed to complete onboarding.' });
      }
    } catch {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSize = (size: string) => {
    if (productSizes.includes(size)) {
      if (productSizes.length > 1) {
        setProductSizes(productSizes.filter((s) => s !== size));
      }
    } else {
      setProductSizes([...productSizes, size]);
    }
  };

  const toggleColor = (color: string) => {
    if (productColors.includes(color)) {
      if (productColors.length > 1) {
        setProductColors(productColors.filter((c) => c !== color));
      }
    } else {
      setProductColors([...productColors, color]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/70 font-sans pb-16">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-100 py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <span>VendiAide <span className="text-emerald-600">AI</span></span>
          </Link>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-full border border-emerald-200">
            Step {step} of 4
          </span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[
            { num: 1, label: 'Profile', icon: Building2 },
            { num: 2, label: 'Logistics', icon: CreditCard },
            { num: 3, label: 'Catalog', icon: Package },
            { num: 4, label: 'AI Setup', icon: Bot },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = step >= item.num;
            const isCurrent = step === item.num;
            return (
              <div key={item.num} className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xs transition border ${
                    isCurrent
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                      : isActive
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-white text-gray-400 border-gray-200'
                  }`}
                >
                  {isActive && !isCurrent ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`text-[11px] font-semibold mt-2 ${isActive ? 'text-emerald-800' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Wizard Card Container */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-10 shadow-xl max-w-2xl mx-auto">
          {errors.general && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-200">
              {errors.general}
            </div>
          )}

          {/* STEP 1: BUSINESS PROFILE */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Step 1 of 4</span>
                <h2 className="text-2xl font-extrabold text-gray-900 mt-1">Tell Us About Your Fashion Business</h2>
                <p className="text-sm text-gray-600">Enter your brand name, category, and official WhatsApp number.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Business / Brand Name *</label>
                <input
                  type="text"
                  placeholder="e.g. VoguePulse Fashion RTW"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={`w-full rounded-xl border py-3 px-4 text-sm outline-hidden ${
                    errors.businessName ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
                  }`}
                />
                {errors.businessName && <p className="mt-1 text-xs text-red-600">{errors.businessName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Category *</label>
                <select
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp Business Phone Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. 08012345678"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className={`w-full rounded-xl border py-3 px-4 text-sm outline-hidden ${
                    errors.whatsappNumber ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
                  }`}
                />
                {errors.whatsappNumber && <p className="mt-1 text-xs text-red-600">{errors.whatsappNumber}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">City / Location *</label>
                <input
                  type="text"
                  placeholder="e.g. Ikeja, Lagos"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full rounded-xl border py-3 px-4 text-sm outline-hidden ${
                    errors.location ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
                  }`}
                />
                {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
              </div>
            </div>
          )}

          {/* STEP 2: LOGISTICS & BANK DETAILS */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Step 2 of 4</span>
                <h2 className="text-2xl font-extrabold text-gray-900 mt-1">Delivery Rates & Payment Info</h2>
                <p className="text-sm text-gray-600">Specify your shipping fees in ₦ Naira and optional bank account details.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Lagos Delivery Rate (₦) *</label>
                  <input
                    type="number"
                    value={feeLagos}
                    onChange={(e) => setFeeLagos(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 py-3 px-4 text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  />
                  {errors.feeLagos && <p className="mt-1 text-xs text-red-600">{errors.feeLagos}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Interstate Delivery Rate (₦) *</label>
                  <input
                    type="number"
                    value={feeInterstate}
                    onChange={(e) => setFeeInterstate(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 py-3 px-4 text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  />
                  {errors.feeInterstate && <p className="mt-1 text-xs text-red-600">{errors.feeInterstate}</p>}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Bank Transfer Details (Optional at setup)</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. First Bank, GTBank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 py-2.5 px-4 text-sm outline-hidden focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 0123456789"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 py-2.5 px-4 text-sm outline-hidden focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Account Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Brand Account Name"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 py-2.5 px-4 text-sm outline-hidden focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: INITIAL CATALOG */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Step 3 of 4</span>
                <h2 className="text-2xl font-extrabold text-gray-900 mt-1">Add Your First Fashion Item</h2>
                <p className="text-sm text-gray-600">Your AI assistant requires at least 1 product in catalog to begin answering buyers.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Black Oversized Hoodie"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className={`w-full rounded-xl border py-3 px-4 text-sm outline-hidden ${
                    errors.productName ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
                  }`}
                />
                {errors.productName && <p className="mt-1 text-xs text-red-600">{errors.productName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Price in Naira (₦) *</label>
                <input
                  type="number"
                  placeholder="25000"
                  value={productPrice}
                  onChange={(e) => setProductPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 py-3 px-4 text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
                {errors.productPrice && <p className="mt-1 text-xs text-red-600">{errors.productPrice}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Available Sizes *</label>
                <div className="flex flex-wrap gap-2">
                  {['S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43', '44', '45'].map((size) => {
                    const isSelected = productSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                {errors.productSizes && <p className="mt-1 text-xs text-red-600">{errors.productSizes}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Available Colours *</label>
                <div className="flex flex-wrap gap-2">
                  {['Black', 'White', 'Navy Blue', 'Gold', 'Red', 'Beige', 'Green'].map((color) => {
                    const isSelected = productColors.includes(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleColor(color)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
                {errors.productColors && <p className="mt-1 text-xs text-red-600">{errors.productColors}</p>}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-xs font-semibold text-gray-800">In Stock & Available Immediately</span>
                <button
                  type="button"
                  onClick={() => setProductInStock(!productInStock)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    productInStock ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      productInStock ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: AI ASSISTANT PERSONA */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Step 4 of 4</span>
                <h2 className="text-2xl font-extrabold text-gray-900 mt-1">Configure AI Sales Assistant</h2>
                <p className="text-sm text-gray-600">Set your assistant name, tone, and welcome message.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assistant Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Aisha"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 py-3 px-4 text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
                {errors.assistantName && <p className="mt-1 text-xs text-red-600">{errors.assistantName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Conversation Tone *</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as 'friendly_professional' | 'warm_nigerian_pinyin' | 'formal')}
                  className="w-full rounded-xl border border-gray-300 py-3 px-4 text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 bg-white"
                >
                  <option value="friendly_professional">Friendly & Professional (Recommended)</option>
                  <option value="warm_nigerian_pinyin">Warm & Polite Nigerian Style</option>
                  <option value="formal">Formal & Elite Corporate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Default Greeting Message *</label>
                <textarea
                  rows={3}
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
                {errors.greetingMessage && <p className="mt-1 text-xs text-red-600">{errors.greetingMessage}</p>}
              </div>
            </div>
          )}

          {/* Action Buttons Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 py-2.5 px-4 rounded-xl border border-gray-200 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 py-3 px-6 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 py-3.5 px-7 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 focus:outline-hidden disabled:opacity-70 transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Completing Setup...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Complete Setup & Enter Dashboard</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
