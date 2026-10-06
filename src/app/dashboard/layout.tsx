'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingBag,
  LayoutDashboard,
  Package,
  MessageSquare,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/db/client';
import { getUserBusiness } from '@/lib/auth/session';
import { Business } from '@/lib/types/database';
import { DEMO_BUSINESS } from '@/lib/db/mock-store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [business, setBusiness] = useState<Business>(DEMO_BUSINESS);

  useEffect(() => {
    async function loadBusiness() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const biz = await getUserBusiness(session.user.id);
        if (biz) setBusiness(biz);
      }
    }
    loadBusiness();
  }, []);

  const navItems = [
    { label: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
    { label: 'Products', href: '/dashboard/products', icon: Package },
    { label: 'Conversations', href: '/dashboard/conversations', icon: MessageSquare },
    { label: 'Leads', href: '/dashboard/leads', icon: Users },
    { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
    { label: 'Follow-ups', href: '/dashboard/follow-ups', icon: Calendar },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vendor_auth_email');
      localStorage.removeItem('vendor_auth_session');
    }
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50/70 font-sans flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-gray-200/80 bg-white p-5 justify-between shrink-0 sticky top-0 h-screen">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-gray-900 text-lg px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <span>
              VendiAide <span className="text-emerald-600 font-extrabold">AI</span>
            </span>
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard/overview' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl py-2.5 px-3.5 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-100 text-xs">
            <p className="font-bold text-emerald-950 flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Founding Cohort
            </p>
            <p className="text-[11px] text-emerald-800">500 AI conversations / mo</p>
          </div>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="h-4 w-4 text-gray-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Toggle Navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">{business.name}</h2>
              <p className="text-[11px] text-gray-500 font-medium">{business.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/products/new"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 py-2 px-3.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Product</span>
            </Link>
          </div>
        </header>

        {/* Mobile Sidebar Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 p-4 space-y-2">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl py-2.5 px-3 text-xs font-semibold ${
                      isActive ? 'bg-emerald-50 text-emerald-800' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 text-emerald-600" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
