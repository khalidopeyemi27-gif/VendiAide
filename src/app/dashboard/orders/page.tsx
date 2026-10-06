'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Sparkles, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { formatNaira } from '@/lib/utils/formatters';
import { Order, OrderStatus, Customer, OrderItem } from '@/lib/types/database';

interface EnrichedOrder extends Order {
  customer?: Customer;
  items?: OrderItem[];
}

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<EnrichedOrder[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadOrders() {
      try {
        const res = await fetch('/api/orders').then((r) => r.json());
        if (isMounted && res.success && res.orders) {
          setOrders(res.orders);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: newStatus }),
      }).then((r) => r.json());

      if (res.success && res.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o)));
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (filter !== 'ALL' && o.order_status !== filter) return false;
    if (search) {
      const name = o.customer?.name?.toLowerCase() || '';
      const loc = o.delivery_location?.toLowerCase() || '';
      return name.includes(search.toLowerCase()) || loc.includes(search.toLowerCase());
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-700 font-medium text-sm">
          <Sparkles className="h-5 w-5 animate-spin" /> Loading Orders Management...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-emerald-600" /> Orders Management Hub
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track customer orders, review immutable item snapshots, and update fulfillment statuses in ₦ Naira.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200">
            {orders.length} Total Orders
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                filter === tab
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-gray-300 py-2 pl-9 pr-4 text-xs font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-200/80 text-center text-xs text-gray-500">
            No orders found matching filter.
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isExpanded = expandedId === ord.id;
            return (
              <div key={ord.id} className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden transition">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : ord.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/70 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-900">Order #{ord.id.slice(-6).toUpperCase()}</span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        {formatNaira(ord.total_amount)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700">{ord.customer?.name || 'Customer'}</p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" /> {ord.delivery_location || 'N/A'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={ord.order_status}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                      className={`text-xs font-bold py-1.5 px-3 rounded-xl border outline-none cursor-pointer ${
                        ord.order_status === 'PENDING'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : ord.order_status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-blue-50 text-blue-800 border-blue-300'
                      }`}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : ord.id)}
                      className="p-1 rounded-lg hover:bg-gray-200 text-gray-500"
                    >
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Immutable Order Item Snapshot View */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5 space-y-4">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Immutable Order Item Snapshot</h4>
                    <div className="space-y-2">
                      {ord.items && ord.items.length > 0 ? (
                        ord.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200/60 text-xs">
                            <div>
                              <p className="font-bold text-gray-900">{item.product_name}</p>
                              <p className="text-[11px] text-gray-500">
                                Size: <span className="font-semibold text-gray-800">{item.size || 'N/A'}</span> | Color: <span className="font-semibold text-gray-800">{item.color || 'N/A'}</span> | Qty: {item.quantity}
                              </p>
                            </div>
                            <span className="font-bold text-emerald-700">{formatNaira(item.unit_price * item.quantity)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500">{ord.notes || 'Order items snapshot details saved.'}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
