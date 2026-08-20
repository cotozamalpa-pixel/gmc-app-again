import { prisma } from '@/lib/prisma';

export default async function AdminOverviewPage() {
  const [userCount, pausedCount, cityCount, beltCount, productCount, pendingOrders, todayCheckins] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isPaused: true } }),
      prisma.city.count(),
      prisma.belt.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.attendanceRecord.count({
        where: { date: new Date(new Date().toISOString().slice(0, 10)) }
      })
    ]);

  const stats = [
    { label: 'Total members', value: userCount },
    { label: 'Paused timelines', value: pausedCount },
    { label: 'Sections/cities', value: cityCount },
    { label: 'Belts in system', value: beltCount },
    { label: 'Active products', value: productCount },
    { label: 'Orders pending payment', value: pendingOrders },
    { label: "Check-ins today", value: todayCheckins }
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Admin overview</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-neutral-600">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
