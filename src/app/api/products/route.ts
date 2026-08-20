import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: products purchasable by the logged-in user, i.e. products whose
// ProductCity list includes either the user's own city, or the default
// Polish national section.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).role === 'ADMIN';
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const products = await prisma.product.findMany({
    where: isAdmin
      ? { active: true }
      : {
          active: true,
          cities: { some: { OR: [{ cityId: user.cityId }, { city: { isDefaultSection: true } }] } }
        },
    include: { cities: { include: { city: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(products);
}

// Admin-only: create a product, optionally scoping it to specific cities.
// If no cityIds are given, it defaults to the default Polish section only.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  if (!body.name || !body.priceCents) {
    return NextResponse.json({ error: 'name and priceCents are required' }, { status: 400 });
  }

  let cityIds: string[] = Array.isArray(body.cityIds) ? body.cityIds : [];
  if (cityIds.length === 0) {
    const defaultCity = await prisma.city.findFirst({ where: { isDefaultSection: true } });
    if (defaultCity) cityIds = [defaultCity.id];
  }

  const product = await prisma.product.create({
    data: {
      name: body.name,
      description: body.description || '',
      type: body.type || 'OTHER',
      priceCents: body.priceCents,
      currency: body.currency || 'PLN',
      imageUrl: body.imageUrl || null,
      sizes: Array.isArray(body.sizes) && body.sizes.length ? body.sizes : ['PP', 'P', 'M', 'G', 'GG'],
      cities: { create: cityIds.map((cityId: string) => ({ cityId })) }
    }
  });

  return NextResponse.json(product, { status: 201 });
}
