import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST { paused: boolean, reason?: string }
// When pausing: records pausedAt + reason.
// When resuming: adds the elapsed paused duration to totalPausedDays,
// so the training timeline calculation (e.g. "time since start, minus
// paused time") stays accurate for graduation eligibility.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (body.paused) {
    if (user.isPaused) return NextResponse.json(user);
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { isPaused: true, pausedAt: new Date(), pausedReason: body.reason || null }
    });
    return NextResponse.json(updated);
  } else {
    if (!user.isPaused || !user.pausedAt) {
      const updated = await prisma.user.update({
        where: { id: params.id },
        data: { isPaused: false, pausedAt: null, pausedReason: null }
      });
      return NextResponse.json(updated);
    }
    const elapsedDays = Math.floor((Date.now() - user.pausedAt.getTime()) / (1000 * 60 * 60 * 24));
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        isPaused: false,
        pausedAt: null,
        pausedReason: null,
        totalPausedDays: user.totalPausedDays + Math.max(elapsedDays, 0)
      }
    });
    return NextResponse.json(updated);
  }
}
