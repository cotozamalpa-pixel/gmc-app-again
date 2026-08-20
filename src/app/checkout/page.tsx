'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';

function money(cents: number) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(cents / 100);
}

export default function CheckoutPage() {
  const { items, totalCents, clear } = useCart();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function placeOrder() {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity }))
      })
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error || 'Could not place order.');
      return;
    }
    clear();
    router.push('/orders');
  }

  if (items.length === 0) {
    return <p>Your cart is empty.</p>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      <div className="card space-y-2">
        {items.map((i) => (
          <div key={`${i.productId}-${i.size}`} className="flex justify-between text-sm">
            <span>
              {i.name} ({i.size}) × {i.quantity}
            </span>
            <span>{money(i.priceCents * i.quantity)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t pt-2 font-bold">
          <span>Total</span>
          <span>{money(totalCents)}</span>
        </div>
      </div>

      <div className="card mt-4 text-sm text-neutral-600">
        Payment: pay in person / bank transfer to your section on pickup. Your order will show as{' '}
        <strong>PENDING</strong> until an admin confirms payment.
        <br />
        <span className="text-xs">
          (To accept online card payments, wire a real payment provider — e.g. Stripe Checkout — into this step;
          the order record already tracks status transitions PENDING → PAID → READY_FOR_PICKUP → COMPLETED.)
        </span>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button className="btn-primary mt-4 w-full" onClick={placeOrder} disabled={loading}>
        {loading ? 'Placing order…' : 'Place order'}
      </button>
    </div>
  );
}
