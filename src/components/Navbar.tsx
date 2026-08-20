'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  return (
    <header className="border-b border-neutral-200 bg-muzenza-black text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-wide text-muzenza-yellow">
          MUZENZA POLSKA
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {session ? (
            <>
              <Link href="/dashboard">My Account</Link>
              <Link href="/dashboard/attendance">Attendance</Link>
              <Link href="/scan">Check-in</Link>
              <Link href="/store">Store</Link>
              <Link href="/orders">Orders</Link>
              {role === 'ADMIN' && (
                <Link href="/admin" className="text-muzenza-yellow">
                  Admin
                </Link>
              )}
              <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-primary">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
