'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Archive,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Package,
  AlertCircle,
} from 'lucide-react';
import { Product } from '@/lib/types/database';
import { formatNaira } from '@/lib/utils/formatters';
import { FashionIndustryTemplate } from '@/lib/templates/fashion';

export default function ProductsCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'in_stock' | 'out_of_stock'
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'archived' | 'all'

  // Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set('status', statusFilter);
        if (category !== 'all') params.set('category', category);
        if (stockFilter !== 'all') params.set('in_stock', stockFilter === 'in_stock' ? 'true' : 'false');
        if (search) params.set('search', search);

        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setProducts(data.products || []);
        }
      } catch {
        if (isMounted) setFeedback({ type: 'error', message: 'Failed to load catalog products.' });
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [statusFilter, category, stockFilter, search]);

  const refreshCatalog = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (category !== 'all') params.set('category', category);
      if (stockFilter !== 'all') params.set('in_stock', stockFilter === 'in_stock' ? 'true' : 'false');
      if (search) params.set('search', search);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to refresh catalog products.' });
    }
  };

  // Quick Stock Toggle Action
  const handleToggleStock = async (product: Product) => {
    const newStockState = !product.in_stock;
    setActionLoading(`stock_${product.id}`);

    try {
      const res = await fetch(`/api/products/${product.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ in_stock: newStockState }),
      });

      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, in_stock: newStockState } : p))
        );
        setFeedback({
          type: 'success',
          message: `Updated "${product.name}" stock to ${newStockState ? 'In Stock' : 'Out of Stock'}.`,
        });
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to update stock.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error updating stock state.' });
    } finally {
      setActionLoading(null);
    }
  };

  // Soft Archival / Restore Action
  const handleArchiveRestore = async (product: Product, action: 'archive' | 'restore') => {
    setActionLoading(`archive_${product.id}`);

    try {
      const res = await fetch(`/api/products/${product.id}?action=${action}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        refreshCatalog();
        setFeedback({
          type: 'success',
          message: action === 'archive' ? `Archived "${product.name}".` : `Restored "${product.name}".`,
        });
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to update product status.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error updating product status.' });
    } finally {
      setActionLoading(null);
      setArchiveConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Fashion Catalog Hub</h1>
          <p className="text-sm text-gray-600">
            Manage your apparel, sizes, stock availability, and ₦ Naira pricing for AI sales grounding.
          </p>
        </div>

        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 px-5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Feedback Alert Toast */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-semibold ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="rounded-2xl bg-white p-4 border border-gray-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search by Name */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-xs outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-300 py-2.5 px-3 text-xs outline-hidden focus:border-emerald-600 bg-white"
            >
              <option value="all">All Categories</option>
              {FashionIndustryTemplate.defaultCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-300 py-2.5 px-3 text-xs outline-hidden focus:border-emerald-600 bg-white"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock Only</option>
            <option value="out_of_stock">Out of Stock Only</option>
          </select>

          {/* Active / Archived Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-300 py-2.5 px-3 text-xs outline-hidden focus:border-emerald-600 bg-white"
          >
            <option value="active">Active Products</option>
            <option value="archived">Archived Products</option>
            <option value="all">All Catalog Records</option>
          </select>

        </div>
      </div>

      {/* Catalog List / Grid Container */}
      {loading ? (
        <div className="py-16 text-center text-gray-500">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs font-semibold">Loading catalog products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center border border-gray-200/80 shadow-2xs space-y-4 max-w-lg mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Package className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">No Products Found</h3>
            <p className="text-xs text-gray-500 mt-1">
              {search || category !== 'all' || stockFilter !== 'all'
                ? 'Try clearing your filters or search term to view products.'
                : 'Start building your fashion catalog to power AI sales on WhatsApp.'}
            </p>
          </div>
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Product</span>
          </Link>
        </div>
      ) : (
        <div>
          {/* Desktop Table View (Hidden on Mobile) */}
          <div className="hidden md:block rounded-2xl bg-white border border-gray-200/80 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Item</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price (₦)</th>
                  <th className="py-3.5 px-4">Sizes & Colours</th>
                  <th className="py-3.5 px-4">Stock Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {products.map((product) => {
                  const attrs = product.attributes as { sizes?: string[]; colors?: string[] };
                  const isStockUpdating = actionLoading === `stock_${product.id}`;
                  const isArchiving = actionLoading === `archive_${product.id}`;

                  return (
                    <tr key={product.id} className={product.status === 'archived' ? 'bg-gray-50/60 opacity-75' : ''}>
                      {/* Product Name & Image */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400 font-bold text-[10px]">
                                NO IMG
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{product.name}</p>
                            {product.status === 'archived' && (
                              <span className="inline-block rounded-md bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700">
                                Archived
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 text-gray-600">{product.category || 'General'}</td>

                      {/* Price ₦ */}
                      <td className="py-4 px-4 font-bold text-gray-900">{formatNaira(product.price_ngn)}</td>

                      {/* Attributes */}
                      <td className="py-4 px-4 text-gray-600">
                        <div className="space-y-0.5">
                          <p>Sizes: {attrs?.sizes?.join(', ') || 'N/A'}</p>
                          <p className="text-gray-400 text-[11px]">Colours: {attrs?.colors?.join(', ') || 'N/A'}</p>
                        </div>
                      </td>

                      {/* Stock Toggle Button */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleStock(product)}
                          disabled={isStockUpdating || product.status === 'archived'}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition border ${
                            product.in_stock
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          } disabled:opacity-50`}
                        >
                          {isStockUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : product.in_stock ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-600" />
                          )}
                          <span>{product.in_stock ? 'In Stock' : 'Out of Stock'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/products/${product.id}/edit`}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                            title="Edit Product"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>

                          {product.status === 'archived' ? (
                            <button
                              onClick={() => handleArchiveRestore(product, 'restore')}
                              disabled={isArchiving}
                              className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                              title="Restore Product"
                            >
                              {isArchiving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                            </button>
                          ) : (
                            <button
                              onClick={() => setArchiveConfirmId(product.id)}
                              disabled={isArchiving}
                              className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                              title="Archive Product"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (Visible on Mobile) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {products.map((product) => {
              const attrs = product.attributes as { sizes?: string[]; colors?: string[] };
              const isStockUpdating = actionLoading === `stock_${product.id}`;

              return (
                <div key={product.id} className="rounded-2xl bg-white p-4 border border-gray-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400 font-bold text-[10px]">
                          NO IMG
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{product.name}</h4>
                      <p className="text-xs text-gray-500">{product.category}</p>
                      <p className="text-sm font-extrabold text-emerald-700 mt-0.5">{formatNaira(product.price_ngn)}</p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 bg-gray-50 rounded-xl p-2.5 space-y-1">
                    <p>Sizes: {attrs?.sizes?.join(', ') || 'N/A'}</p>
                    <p>Colours: {attrs?.colors?.join(', ') || 'N/A'}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleStock(product)}
                      disabled={isStockUpdating || product.status === 'archived'}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition border ${
                        product.in_stock ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {product.in_stock ? 'In Stock' : 'Out of Stock'}
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/products/${product.id}/edit`}
                        className="p-2 rounded-lg text-gray-600 bg-gray-100 text-xs font-bold hover:bg-gray-200"
                      >
                        Edit
                      </Link>
                      {product.status === 'archived' ? (
                        <button
                          onClick={() => handleArchiveRestore(product, 'restore')}
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => setArchiveConfirmId(product.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal before Soft Archival */}
      {archiveConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <h4 className="text-base font-bold text-gray-900">Archive Product?</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Archiving hides this item from your active catalog and AI assistant. Historical orders referencing this product will remain completely intact. You can restore it anytime.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setArchiveConfirmId(null)}
                className="rounded-xl border border-gray-300 py-2 px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const target = products.find((p) => p.id === archiveConfirmId);
                  if (target) handleArchiveRestore(target, 'archive');
                }}
                className="rounded-xl bg-red-600 py-2 px-4 text-xs font-semibold text-white hover:bg-red-700"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
