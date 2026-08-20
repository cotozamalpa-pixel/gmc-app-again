'use client';

import { useEffect, useState } from 'react';

type Order = {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  items: { id: string; size: string; quantity: number; product: { name: string } }[];
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency }).format(cents / 100);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    fetch('/api/orders').then((r) => r.json()).then(setOrders);
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My orders</h1>
      {!orders ? (
        <p>Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-neutral-600">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="card">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">{new Date(o.createdAt).toLocaleString('en-GB')}</p>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">{o.status}</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {o.items.map((it) => (
                  <li key={it.id}>
                    {it.product.name} ({it.size}) × {it.quantity}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-right font-bold">{money(o.totalCents, o.currency)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
