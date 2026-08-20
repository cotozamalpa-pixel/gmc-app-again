import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ROLE_LABELS } from '@/lib/roles';
import Link from 'next/link';
import { redirect } from 'next/navigation';

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: { city: true, belt: true }
  });
  if (!user) redirect('/login');

  const trainingDays = Math.floor(
    (Date.now() - user.startDate.getTime()) / (1000 * 60 * 60 * 24) - user.totalPausedDays
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {user.name} “{user.apelido}” {user.surname}
        </h1>
        <p className="text-neutral-600">
          {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]} · {user.city.name}
        </p>
      </div>

      {user.isPaused && (
        <div className="card border-amber-300 bg-amber-50 text-amber-800">
          Your training timeline is currently <strong>paused</strong> by an admin
          {user.pausedReason ? `: ${user.pausedReason}` : '.'} Check-ins are disabled until it is resumed.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-semibold">Graduation</h2>
          <p>Current belt: <strong>{user.belt?.name ?? 'Not yet graduated'}</strong></p>
          <p className="mt-1 text-sm text-neutral-600">Training since {formatDate(user.startDate)}</p>
          <p className="text-sm text-neutral-600">
            ~{Math.max(trainingDays, 0)} days on the training timeline{user.totalPausedDays > 0 ? ` (${user.totalPausedDays} paused days excluded)` : ''}
          </p>
        </div>
        <div className="card">
          <h2 className="mb-2 font-semibold">Profile</h2>
          <p className="text-sm">Born {formatDate(user.birthDate)}</p>
          <p className="text-sm">Section: {user.city.name}</p>
          <Link href="/dashboard/profile" className="mt-3 inline-block text-sm font-medium text-muzenza-red">
            Edit profile →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/scan" className="btn-primary">
          Check into class
        </Link>
        <Link href="/dashboard/attendance" className="btn-secondary">
          View attendance
        </Link>
        <Link href="/store" className="btn-secondary">
          Visit store
        </Link>
      </div>
    </div>
  );
}
