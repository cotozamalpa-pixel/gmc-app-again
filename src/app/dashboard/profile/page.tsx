'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type City = { id: string; name: string };

export default function ProfilePage() {
  const { data: session } = useSession();
  const [cities, setCities] = useState<City[]>([]);
  const [form, setForm] = useState({ name: '', surname: '', apelido: '', cityId: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cities').then((r) => r.json()).then(setCities);
    if (session?.user) {
      fetch(`/api/users/${(session.user as any).id}`)
        .then((r) => r.json())
        .then((u) => {
          setForm({ name: u.name, surname: u.surname, apelido: u.apelido, cityId: u.cityId });
          setLoading(false);
        });
    }
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    const id = (session!.user as any).id;
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setSaved(true);
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Edit profile</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">First name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Surname</label>
          <input
            className="input"
            value={form.surname}
            onChange={(e) => setForm({ ...form, surname: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Apelido</label>
          <input
            className="input"
            value={form.apelido}
            onChange={(e) => setForm({ ...form, apelido: e.target.value })}
          />
        </div>
        <div>
          <label className="label">City / section</label>
          <select className="input" value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Note: changing your section affects which store products you can buy.
          </p>
        </div>
        {saved && <p className="text-sm text-green-600">Saved.</p>}
        <button className="btn-primary w-full" type="submit">
          Save changes
        </button>
      </form>
    </div>
  );
}
