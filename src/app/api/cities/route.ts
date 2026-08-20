import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(cities);
}

// Admin-only: create a new city/section.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  const city = await prisma.city.create({
    data: { name: body.name.trim(), isDefaultSection: !!body.isDefaultSection }
  });
  return NextResponse.json(city, { status: 201 });
}
