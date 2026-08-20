import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isSelf = (session.user as any).id === params.id;
  const isAdmin = (session.user as any).role === 'ADMIN';
  if (!isSelf && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: { city: true, belt: true },
    select: undefined
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { passwordHash, ...safe } = user;
  return NextResponse.json(safe);
}

// Self or admin: update profile fields. Only admin can change role or beltId.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isSelf = (session.user as any).id === params.id;
  const isAdmin = (session.user as any).role === 'ADMIN';
  if (!isSelf && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  // Fields any user can edit about themselves
  for (const field of ['name', 'surname', 'apelido', 'cityId'] as const) {
    if (typeof body[field] === 'string') data[field] = body[field];
  }

  // Admin-only fields
  if (isAdmin) {
    if (typeof body.role === 'string') data.role = body.role;
    if (typeof body.beltId === 'string' || body.beltId === null) data.beltId = body.beltId;
  }

  const user = await prisma.user.update({ where: { id: params.id }, data });
  const { passwordHash, ...safe } = user;
  return NextResponse.json(safe);
}
