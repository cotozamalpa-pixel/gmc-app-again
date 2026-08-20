'use client';

import AttendanceCalendar from '@/components/AttendanceCalendar';

export default function MyAttendancePage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My attendance</h1>
      <div className="card">
        <AttendanceCalendar />
      </div>
    </div>
  );
}
