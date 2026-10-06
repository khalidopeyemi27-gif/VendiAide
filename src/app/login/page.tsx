'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/db/client';
import { getUserBusiness } from '@/lib/auth/session';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!password) {
      errs.password = 'Password is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrors({ general: 'Invalid email or password' });
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('vendor_auth_email', email);
      }

      const business = await getUserBusiness(data.user.id);
      if (business && business.onboarding_completed) {
        router.push('/dashboard/overview');
      } else {
        router.push('/onboarding');
      }
    } catch {
      // Dev mode local login fallback
      if (typeof window !== 'undefined') {
        localStorage.setItem('vendor_auth_email', email);
      }
      router.push('/onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-gray-900 text-2xl tracking-tight mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <span>
            VendiAide <span className="text-emerald-600 font-extrabold">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Sign In To Vendor Dashboard
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Manage your AI sales assistant, leads, and orders.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl border border-gray-200/80 sm:rounded-3xl sm:px-10">
          <form onSubmit={handleLogin} className="space-y-4">
            {errors.general && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium border border-red-200">
                {errors.general}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                placeholder="vendor@fashion.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-xl border py-3 px-4 text-sm outline-hidden transition ${
                  errors.email ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1">
                Password *
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-xl border py-3 px-4 text-sm outline-hidden transition ${
                  errors.password ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
                }`}
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 px-4 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 focus:outline-hidden disabled:opacity-70 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-4 text-center">
            <p className="text-xs text-gray-600">
              Don&apos;t have a vendor account yet?{' '}
              <Link href="/signup" className="font-bold text-emerald-600 hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
