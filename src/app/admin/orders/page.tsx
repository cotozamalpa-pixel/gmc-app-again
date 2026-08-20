'use client';

import { useEffect, useState } from 'react';

type Order = {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  user: { name: string; surname: string; apelido: string; email: string };
  items: { id: string; size: string; quantity: number; product: { name: string } }[];
};

const STATUSES = ['PENDING', 'PAID', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'];

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency }).format(cents / 100);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  function refresh() {
    fetch('/api/orders').then((r) => r.json()).then(setOrders);
  }

  useEffect(refresh, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    refresh();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Orders</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {o.user.name} “{o.user.apelido}” {o.user.surname}
                </p>
                <p className="text-xs text-neutral-500">{o.user.email}</p>
              </div>
              <select className="input w-auto" value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <ul className="mt-2 text-sm text-neutral-700">
              {o.items.map((it) => (
                <li key={it.id}>
                  {it.product.name} ({it.size}) × {it.quantity}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-right font-bold">{money(o.totalCents, o.currency)}</p>
          </div>
        ))}
        {orders.length === 0 && <p className="text-neutral-500">No orders yet.</p>}
      </div>
    </div>
  );
}
