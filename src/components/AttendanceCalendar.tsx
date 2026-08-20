'use client';

import { useEffect, useState } from 'react';

type Record = { id: string; date: string; user?: { name: string; surname: string; apelido: string } };
type View = 'weekly' | 'monthly' | 'yearly';

export default function AttendanceCalendar({ userId, cityId }: { userId?: string; cityId?: string }) {
  const [view, setView] = useState<View>('monthly');
  const [records, setRecords] = useState<Record[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ view });
    if (userId) params.set('userId', userId);
    if (cityId) params.set('cityId', cityId);
    setLoading(true);
    fetch(`/api/attendance/stats?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setRecords(data.records || []);
        setCount(data.count || 0);
        setLoading(false);
      });
  }, [view, userId, cityId]);

  const dateSet = new Set(records.map((r) => r.date.slice(0, 10)));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          {(['weekly', 'monthly', 'yearly'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1 text-sm ${
                view === v ? 'bg-muzenza-red text-white' : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <span className="text-sm text-neutral-600">{count} check-ins</span>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : view === 'yearly' ? (
        <YearlyGrid dateSet={dateSet} />
      ) : (
        <ul className="space-y-1">
          {records.length === 0 && <li className="text-sm text-neutral-500">No check-ins in this period.</li>}
          {records.map((r) => (
            <li key={r.id} className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
              <span>{new Date(r.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              {r.user && (
                <span className="text-neutral-600">
                  {r.user.name} “{r.user.apelido}” {r.user.surname}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function YearlyGrid({ dateSet }: { dateSet: Set<string> }) {
  const year = new Date().getUTCFullYear();
  const months = Array.from({ length: 12 }, (_, m) => m);

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {months.map((m) => {
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        return (
          <div key={m} className="rounded-lg border border-neutral-200 p-2">
            <p className="mb-1 text-xs font-semibold text-neutral-600">
              {new Date(year, m, 1).toLocaleDateString('en-GB', { month: 'short' })}
            </p>
            <div className="grid grid-cols-7 gap-[2px]">
              {days.map((d) => {
                const iso = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const active = dateSet.has(iso);
                return (
                  <div
                    key={d}
                    title={iso}
                    className={`h-2 w-2 rounded-sm ${active ? 'bg-muzenza-red' : 'bg-neutral-100'}`}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
