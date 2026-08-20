'use client';

import { useEffect, useState } from 'react';

type City = { id: string; name: string; isDefaultSection: boolean };

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    fetch('/api/cities').then((r) => r.json()).then(setCities);
  }

  useEffect(refresh, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, isDefaultSection: isDefault })
    });
    if (!res.ok) {
      setError('Could not add city (name may already exist).');
      return;
    }
    setName('');
    setIsDefault(false);
    refresh();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Sections / cities</h1>
      <p className="mb-4 text-sm text-neutral-600">
        Each student trains under one city/section. Products can be scoped to a section, and every student can
        also buy products scoped to the default national section (marked below).
      </p>

      <div className="card mb-6">
        <h2 className="mb-3 font-semibold">Current sections</h2>
        <ul className="space-y-1 text-sm">
          {cities.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <span>{c.name}</span>
              {c.isDefaultSection && (
                <span className="rounded-full bg-muzenza-yellow px-2 py-0.5 text-xs font-medium">
                  Default national section
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleAdd} className="card space-y-3">
        <h2 className="font-semibold">Add a section</h2>
        <div>
          <label className="label">City name</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          Set as default national section (visible to every student's store)
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary" type="submit">
          Add section
        </button>
      </form>
    </div>
  );
}
