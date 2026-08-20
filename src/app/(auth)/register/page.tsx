'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

type City = { id: string; name: string; isDefaultSection: boolean };
type Belt = { id: string; name: string };

export default function RegisterPage() {
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [belts, setBelts] = useState<Belt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    surname: '',
    apelido: '',
    cityId: '',
    beltId: '',
    startDate: '',
    birthDate: ''
  });

  useEffect(() => {
    fetch('/api/cities').then((r) => r.json()).then(setCities);
    fetch('/api/belts').then((r) => r.json()).then(setBelts);
  }, []);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, beltId: form.beltId || null })
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === 'string' ? body.error : 'Please check the form and try again.');
      setLoading(false);
      return;
    }

    // Auto login after registration
    const signInRes = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      router.push('/login');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">Create your student account</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First name</label>
            <input className="input" required value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Surname</label>
            <input
              className="input"
              required
              value={form.surname}
              onChange={(e) => update('surname', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Apelido (capoeira nickname)</label>
          <input
            className="input"
            required
            value={form.apelido}
            onChange={(e) => update('apelido', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              minLength={8}
              required
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">City where you train</label>
            <select className="input" required value={form.cityId} onChange={(e) => update('cityId', e.target.value)}>
              <option value="">Select a section…</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Current belt (graduation)</label>
            <select className="input" value={form.beltId} onChange={(e) => update('beltId', e.target.value)}>
              <option value="">Not yet graduated</option>
              {belts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date you started training</label>
            <input
              className="input"
              type="date"
              required
              value={form.startDate}
              onChange={(e) => update('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Date of birth</label>
            <input
              className="input"
              type="date"
              required
              value={form.birthDate}
              onChange={(e) => update('birthDate', e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
