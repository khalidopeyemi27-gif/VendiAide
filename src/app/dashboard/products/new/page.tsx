'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { FashionIndustryTemplate } from '@/lib/templates/fashion';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState(FashionIndustryTemplate.defaultCategories[0]);
  const [price, setPrice] = useState<number | ''>('');
  const [inStock, setInStock] = useState<boolean>(true);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sizes, setSizes] = useState<string[]>(['M', 'L', 'XL']);
  const [colors, setColors] = useState<string[]>(['Black']);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) {
      errs.name = 'Product name is required';
    }
    if (price === '' || isNaN(Number(price)) || Number(price) <= 0) {
      errs.price = 'Price must be a valid non-negative Naira amount';
    }
    if (sizes.length === 0) {
      errs.sizes = 'Select at least one available size';
    }
    if (colors.length === 0) {
      errs.colors = 'Select at least one available colour';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          price_ngn: Number(price),
          in_stock: inStock,
          description,
          image_url: imageUrl,
          attributes: {
            sizes,
            colors,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/dashboard/products');
      } else if (data.errors) {
        const fieldErrs: Record<string, string> = {};
        Object.entries(data.errors).forEach(([k, v]) => {
          fieldErrs[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(fieldErrs);
      } else {
        setErrors({ general: data.message || 'Failed to create product' });
      }
    } catch {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSize = (size: string) => {
    if (sizes.includes(size)) {
      if (sizes.length > 1) setSizes(sizes.filter((s) => s !== size));
    } else {
      setSizes([...sizes, size]);
    }
  };

  const toggleColor = (color: string) => {
    if (colors.includes(color)) {
      if (colors.length > 1) setColors(colors.filter((c) => c !== color));
    } else {
      setColors([...colors, color]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-gray-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products"
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Add New Fashion Item</h1>
            <p className="text-xs text-gray-500">Create a new item in your catalog for AI WhatsApp sales grounding.</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 sm:p-8 border border-gray-200/80 shadow-xl space-y-6">
        {errors.general && (
          <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-200">
            {errors.general}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name *</label>
          <input
            type="text"
            placeholder="e.g. Black Oversized Hoodie"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full rounded-xl border py-3 px-4 text-sm outline-hidden ${
              errors.name ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
            }`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-300 py-3 px-4 text-sm outline-hidden focus:border-emerald-600 bg-white"
            >
              {FashionIndustryTemplate.defaultCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Price in Naira (₦) *</label>
            <input
              type="number"
              placeholder="25000"
              value={price}
              onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
              className={`w-full rounded-xl border py-3 px-4 text-sm outline-hidden ${
                errors.price ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
              }`}
            />
            {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Available Sizes *</label>
          <div className="flex flex-wrap gap-2">
            {['S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43', '44', '45'].map((size) => {
              const isSelected = sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition border ${
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
          {errors.sizes && <p className="mt-1 text-xs text-red-600">{errors.sizes}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Available Colours *</label>
          <div className="flex flex-wrap gap-2">
            {['Black', 'White', 'Navy Blue', 'Gold', 'Red', 'Beige', 'Emerald'].map((color) => {
              const isSelected = colors.includes(color);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleColor(color)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition border ${
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
          {errors.colors && <p className="mt-1 text-xs text-red-600">{errors.colors}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Image URL (Optional)</label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/photo-..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded-xl border border-gray-300 py-3 px-4 text-sm outline-hidden focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Description (Optional)</label>
          <textarea
            rows={3}
            placeholder="Heavyweight 100% cotton street-style hoodie with ribbed cuffs..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-hidden focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
          <span className="text-xs font-bold text-gray-800">Product In Stock & Immediately Available</span>
          <button
            type="button"
            onClick={() => setInStock(!inStock)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              inStock ? 'bg-emerald-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                inStock ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
          <Link
            href="/dashboard/products"
            className="rounded-xl border border-gray-300 py-3 px-5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 py-3 px-6 text-xs font-bold text-white shadow-md hover:bg-emerald-700 focus:outline-hidden disabled:opacity-70 transition"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Product...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Save Product</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
