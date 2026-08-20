'use client';

import { useEffect, useState } from 'react';

type Belt = { id: string; name: string; colorHex: string; order: number };

export default function AdminBeltsPage() {
  const [belts, setBelts] = useState<Belt[]>([]);
  const [form, setForm] = useState({ name: '', colorHex: '#f2b705', order: 0 });
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    fetch('/api/belts').then((r) => r.json()).then(setBelts);
  }

  useEffect(refresh, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/belts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (!res.ok) {
      setError('Could not add belt (name may already exist).');
      return;
    }
    setForm({ name: '', colorHex: '#f2b705', order: belts.length });
    refresh();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Graduation system</h1>
      <p className="mb-4 text-sm text-neutral-600">
        Define the belts/cordas students can be assigned. Order controls progression order shown to staff.
      </p>

      <div className="card mb-6">
        <h2 className="mb-3 font-semibold">Current belts</h2>
        <ol className="space-y-1">
          {belts
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((b) => (
              <li key={b.id} className="flex items-center gap-2 text-sm">
                <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: b.colorHex }} />
                <span>{b.name}</span>
                <span className="text-neutral-400">#{b.order}</span>
              </li>
            ))}
        </ol>
      </div>

      <form onSubmit={handleAdd} className="card space-y-3">
        <h2 className="font-semibold">Add a belt</h2>
        <div>
          <label className="label">Name</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Color</label>
            <input
              className="input h-10"
              type="color"
              value={form.colorHex}
              onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Order</label>
            <input
              className="input"
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary" type="submit">
          Add belt
        </button>
      </form>
    </div>
  );
}
