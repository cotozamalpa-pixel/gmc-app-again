import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    include: { city: true, belt: true },
    orderBy: { createdAt: 'desc' }
  });
  const safe = users.map(({ passwordHash, ...u }) => u);
  return NextResponse.json(safe);
}
