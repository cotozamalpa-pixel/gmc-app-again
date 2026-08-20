import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isTeachingStaff } from '@/lib/roles';

// GET /api/attendance/stats?view=weekly|monthly|yearly&userId=...&cityId=...&year=YYYY&month=MM
// - Regular users can only request their own userId (or omit it -> defaults to self).
// - Teaching staff/admin can pass cityId to see all attendance for a section,
//   or a specific userId to inspect one student.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const me = session.user as any;
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view') || 'monthly';
  const requestedUserId = searchParams.get('userId');
  const cityId = searchParams.get('cityId');
  const now = new Date();
  const year = Number(searchParams.get('year') || now.getUTCFullYear());
  const month = Number(searchParams.get('month') || now.getUTCMonth() + 1); // 1-12

  const staff = isTeachingStaff(me.role);
  if (requestedUserId && requestedUserId !== me.id && !staff) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (cityId && !staff) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let start: Date, end: Date;
  if (view === 'weekly') {
    const d = new Date();
    const day = d.getUTCDay() || 7;
    start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 1));
    end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
  } else if (view === 'yearly') {
    start = new Date(Date.UTC(year, 0, 1));
    end = new Date(Date.UTC(year + 1, 0, 1));
  } else {
    start = new Date(Date.UTC(year, month - 1, 1));
    end = new Date(Date.UTC(year, month, 1));
  }

  const where: Record<string, unknown> = { date: { gte: start, lt: end } };
  if (requestedUserId) where.userId = requestedUserId;
  else if (!cityId) where.userId = me.id; // default: my own attendance
  if (cityId) where.cityId = cityId;

  const records = await prisma.attendanceRecord.findMany({
    where,
    include: { user: { select: { id: true, name: true, surname: true, apelido: true } } },
    orderBy: { date: 'asc' }
  });

  return NextResponse.json({
    view,
    range: { start, end },
    count: records.length,
    records
  });
}
