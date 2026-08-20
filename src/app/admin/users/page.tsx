'use client';

import { useEffect, useState } from 'react';
import { ROLES, ROLE_LABELS } from '@/lib/roles';

type User = {
  id: string;
  email: string;
  name: string;
  surname: string;
  apelido: string;
  role: string;
  isPaused: boolean;
  pausedReason: string | null;
  city: { id: string; name: string };
  belt: { id: string; name: string } | null;
};
type Belt = { id: string; name: string };
type City = { id: string; name: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [belts, setBelts] = useState<Belt[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filter, setFilter] = useState('');

  function refresh() {
    fetch('/api/admin/users').then((r) => r.json()).then(setUsers);
  }

  useEffect(() => {
    refresh();
    fetch('/api/belts').then((r) => r.json()).then(setBelts);
    fetch('/api/cities').then((r) => r.json()).then(setCities);
  }, []);

  async function togglePause(u: User) {
    let reason: string | null = null;
    if (!u.isPaused) {
      reason = window.prompt('Reason for pausing (optional):', '') || null;
    }
    await fetch(`/api/users/${u.id}/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paused: !u.isPaused, reason })
    });
    refresh();
  }

  async function updateField(u: User, field: 'role' | 'beltId' | 'cityId', value: string) {
    await fetch(`/api/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value })
    });
    refresh();
  }

  const filtered = (users || []).filter((u) => {
    const q = filter.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.surname.toLowerCase().includes(q) ||
      u.apelido.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Students & staff</h1>
      <input
        className="input mb-4 max-w-sm"
        placeholder="Search by name, apelido, email…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {!users ? (
        <p>Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Belt</th>
                <th className="py-2 pr-3">Section</th>
                <th className="py-2 pr-3">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="py-2 pr-3">
                    <p className="font-medium">
                      {u.name} “{u.apelido}” {u.surname}
                    </p>
                    <p className="text-xs text-neutral-500">{u.email}</p>
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      className="input"
                      value={u.role}
                      onChange={(e) => updateField(u, 'role', e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      className="input"
                      value={u.belt?.id || ''}
                      onChange={(e) => updateField(u, 'beltId', e.target.value)}
                    >
                      <option value="">Not graduated</option>
                      {belts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      className="input"
                      value={u.city.id}
                      onChange={(e) => updateField(u, 'cityId', e.target.value)}
                    >
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => togglePause(u)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        u.isPaused ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {u.isPaused ? 'Paused — resume' : 'Active — pause'}
                    </button>
                    {u.isPaused && u.pausedReason && (
                      <p className="mt-1 text-xs text-neutral-500">{u.pausedReason}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
