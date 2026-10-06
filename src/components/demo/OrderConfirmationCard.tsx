'use client';

import React from 'react';

export type OrderConfirmationCardProps = {
  draft: {
    productName: string;
    size: string | null;
    color: string | null;
    location: string;
    itemPriceNaira: number;
    deliveryFeeNaira: number;
    totalNaira: number;
  };
  onConfirm: () => void;
  onChangeDetails: () => void;
  onCancel: () => void;
};

const formatNaira = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(isNaN(value) ? 0 : value);

export function OrderConfirmationCard({
  draft,
  onConfirm,
  onChangeDetails,
  onCancel,
}: OrderConfirmationCardProps) {
  if (
    !draft ||
    !draft.productName ||
    !draft.location ||
    isNaN(draft.itemPriceNaira) ||
    isNaN(draft.deliveryFeeNaira) ||
    isNaN(draft.totalNaira)
  ) {
    return null;
  }

  return (
    <section
      aria-label="Order confirmation"
      className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm my-2 text-xs font-sans max-w-full"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold text-emerald-950 text-sm">
          Confirm your order
        </h3>

        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
          Pending confirmation
        </span>
      </div>

      <dl className="space-y-2 text-xs text-gray-700">
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500 font-medium">Product</dt>
          <dd className="font-semibold text-gray-900 text-right">{draft.productName}</dd>
        </div>

        {draft.size && (
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500 font-medium">Size</dt>
            <dd className="font-semibold text-gray-900">{draft.size}</dd>
          </div>
        )}

        {draft.color && (
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500 font-medium">Colour</dt>
            <dd className="font-semibold text-gray-900">{draft.color}</dd>
          </div>
        )}

        <div className="flex justify-between gap-4">
          <dt className="text-gray-500 font-medium">Delivery location</dt>
          <dd className="font-semibold text-gray-900 text-right">{draft.location}</dd>
        </div>

        <div className="border-t border-emerald-200/80 pt-2 space-y-1">
          <div className="flex justify-between">
            <dt className="text-gray-500">Item price</dt>
            <dd className="font-medium text-gray-900">{formatNaira(draft.itemPriceNaira)}</dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-gray-500">Delivery fee</dt>
            <dd className="font-medium text-gray-900">{formatNaira(draft.deliveryFeeNaira)}</dd>
          </div>

          <div className="mt-2 flex justify-between text-sm font-extrabold text-emerald-950 pt-1 border-t border-emerald-200">
            <dt>Total</dt>
            <dd className="text-emerald-800 font-black">{formatNaira(draft.totalNaira)}</dd>
          </div>
        </div>
      </dl>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={onConfirm}
          aria-label="Confirm order button"
          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
        >
          Confirm order
        </button>

        <button
          type="button"
          onClick={onChangeDetails}
          aria-label="Change details button"
          className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 active:scale-95 transition"
        >
          Change details
        </button>

        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel order button"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}
