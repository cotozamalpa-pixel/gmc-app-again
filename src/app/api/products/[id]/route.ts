import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { cities: { include: { city: true } } }
  });
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  const isAdmin = (session.user as any).role === 'ADMIN';
  const allowedCityIds = product.cities.map((c) => c.cityId);
  const canBuy = isAdmin || (user && allowedCityIds.includes(user.cityId)) || product.cities.some((c) => c.city.isDefaultSection);

  return NextResponse.json({ ...product, canBuy });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const field of ['name', 'description', 'type', 'priceCents', 'currency', 'imageUrl', 'active'] as const) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  const product = await prisma.product.update({ where: { id: params.id }, data });

  if (Array.isArray(body.cityIds)) {
    await prisma.productCity.deleteMany({ where: { productId: params.id } });
    await prisma.productCity.createMany({
      data: body.cityIds.map((cityId: string) => ({ productId: params.id, cityId }))
    });
  }

  return NextResponse.json(product);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await prisma.product.update({ where: { id: params.id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
