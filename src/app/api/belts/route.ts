import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const belts = await prisma.belt.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(belts);
}

// Admin-only: add a new belt/graduation to the system.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const belt = await prisma.belt.create({
    data: {
      name: body.name.trim(),
      colorHex: body.colorHex || '#f2b705',
      order: typeof body.order === 'number' ? body.order : 0
    }
  });
  return NextResponse.json(belt, { status: 201 });
}
