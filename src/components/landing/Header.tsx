'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Sparkles, ShoppingBag } from 'lucide-react';

interface HeaderProps {
  onOpenDemoModal: () => void;
}

export function Header({ onOpenDemoModal }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-18">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-gray-900 text-xl tracking-tight">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <span>
            Vendi<span className="text-emerald-600 font-extrabold">Aide</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-emerald-600 transition">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-emerald-600 transition">
            How It Works
          </a>
          <a href="#who-its-for" className="hover:text-emerald-600 transition">
            Who It&apos;s For
          </a>
          <a href="#pricing" className="hover:text-emerald-600 transition">
            Pricing
          </a>
          <a href="#faq" className="hover:text-emerald-600 transition">
            FAQ
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-700 hover:text-emerald-600 transition px-2 py-2"
          >
            Vendor Login
          </Link>
          <button
            onClick={onOpenDemoModal}
            className="rounded-xl border border-gray-300 py-2.5 px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            Book a Setup Call
          </button>
          <Link
            href="/demo"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>Try Interactive Demo</span>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/demo"
            className="rounded-lg bg-emerald-600 py-1.5 px-3 text-xs font-semibold text-white shadow-xs"
          >
            Try Demo
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-100 bg-white px-4 pt-2 pb-6 space-y-3">
          <nav className="flex flex-col gap-3 font-medium text-gray-700 text-sm">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-gray-50"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-gray-50"
            >
              How It Works
            </a>
            <a
              href="#who-its-for"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-gray-50"
            >
              Who It&apos;s For
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-gray-50"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-gray-50"
            >
              FAQ
            </a>
          </nav>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/demo"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-center text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>Try Interactive Demo</span>
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDemoModal();
              }}
              className="w-full rounded-xl border border-gray-300 py-2.5 text-center text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
            >
              Book a Setup Call
            </button>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2 text-center text-xs font-semibold text-gray-600 hover:text-emerald-600 transition"
            >
              Vendor Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
