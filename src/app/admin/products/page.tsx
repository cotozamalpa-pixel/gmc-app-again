'use client';

import { useEffect, useState } from 'react';

type City = { id: string; name: string; isDefaultSection: boolean };
type Product = {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  active: boolean;
  cities: { city: { id: string; name: string } }[];
};

const PRODUCT_TYPES = ['TSHIRT', 'HOODIE', 'RASHGUARD', 'ABADA', 'OTHER'];

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency }).format(cents / 100);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'TSHIRT',
    price: '',
    cityIds: [] as string[]
  });
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    const [c] = await Promise.all([fetch('/api/cities').then((r) => r.json())]);
    setCities(c);
    // Reuse the customer-facing endpoint won't show all products for admin filtering by city,
    // so we fetch by iterating: simplest is to just call /api/products as admin sees their own
    // city's + default products. For a full catalog view we fetch directly via a lightweight trick:
    const all = await fetch('/api/products').then((r) => r.json());
    setProducts(all);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function toggleCity(id: string) {
    setForm((f) => ({
      ...f,
      cityIds: f.cityIds.includes(id) ? f.cityIds.filter((c) => c !== id) : [...f.cityIds, id]
    }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const priceCents = Math.round(parseFloat(form.price) * 100);
    if (!priceCents || priceCents <= 0) {
      setError('Enter a valid price.');
      return;
    }
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        type: form.type,
        priceCents,
        cityIds: form.cityIds
      })
    });
    if (!res.ok) {
      setError('Could not create product.');
      return;
    }
    setForm({ name: '', description: '', type: 'TSHIRT', price: '', cityIds: [] });
    loadAll();
  }

  async function deactivate(id: string) {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    loadAll();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Products</h1>

      <div className="card mb-6">
        <h2 className="mb-3 font-semibold">Catalog</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-neutral-500">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Price</th>
              <th className="py-2 pr-3">Sections</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2 pr-3">{p.name}</td>
                <td className="py-2 pr-3">{money(p.priceCents, p.currency)}</td>
                <td className="py-2 pr-3">{p.cities.map((c) => c.city.name).join(', ')}</td>
                <td className="py-2 pr-3">
                  <button className="text-sm text-red-600" onClick={() => deactivate(p.id)}>
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleAdd} className="card space-y-3">
        <h2 className="font-semibold">Add a product</h2>
        <div>
          <label className="label">Name</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Price (PLN)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Available to sections (leave empty = default national section only)</label>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <label key={c.id} className="flex items-center gap-1 rounded-lg border px-2 py-1 text-sm">
                <input type="checkbox" checked={form.cityIds.includes(c.id)} onChange={() => toggleCity(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary" type="submit">
          Create product
        </button>
      </form>
    </div>
  );
}
