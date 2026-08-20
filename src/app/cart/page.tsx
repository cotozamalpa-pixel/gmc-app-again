'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartContext';

function money(cents: number) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(cents / 100);
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalCents } = useCart();

  if (items.length === 0) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold">Your cart</h1>
        <p className="text-neutral-600">
          Your cart is empty.{' '}
          <Link href="/store" className="font-medium text-muzenza-red">
            Browse the store
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-bold">Your cart</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={`${item.productId}-${item.size}`} className="card flex items-center justify-between">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-neutral-600">Size {item.size}</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateQuantity(item.productId, item.size, Math.max(1, Number(e.target.value)))}
                className="input w-16"
              />
              <p className="w-20 text-right font-semibold">{money(item.priceCents * item.quantity)}</p>
              <button onClick={() => removeItem(item.productId, item.size)} className="text-sm text-red-600">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-lg font-bold">Total: {money(totalCents)}</p>
        <Link href="/checkout" className="btn-primary">
          Checkout
        </Link>
      </div>
    </div>
  );
}
