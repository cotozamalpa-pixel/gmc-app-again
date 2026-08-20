import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const links = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Students & staff' },
  { href: '/admin/belts', label: 'Graduation system' },
  { href: '/admin/cities', label: 'Sections/cities' },
  { href: '/admin/attendance', label: 'Attendance' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/orders', label: 'Orders' }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
      <aside className="space-y-1">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-neutral-100">
            {l.label}
          </Link>
        ))}
      </aside>
      <div>{children}</div>
    </div>
  );
}
