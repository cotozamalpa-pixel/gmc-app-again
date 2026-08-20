'use client';

import { useEffect, useState } from 'react';
import AttendanceCalendar from '@/components/AttendanceCalendar';

type City = { id: string; name: string };

export default function AdminAttendancePage() {
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState('');

  useEffect(() => {
    fetch('/api/cities').then((r) => r.json()).then((cs) => {
      setCities(cs);
      if (cs.length) setCityId(cs[0].id);
    });
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Attendance overview</h1>
      <div className="mb-4">
        <label className="label">Section</label>
        <select className="input max-w-xs" value={cityId} onChange={(e) => setCityId(e.target.value)}>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="card">{cityId && <AttendanceCalendar cityId={cityId} />}</div>
    </div>
  );
}
