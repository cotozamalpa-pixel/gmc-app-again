import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdmin = (session.user as any).role === 'ADMIN';
  const orders = await prisma.order.findMany({
    where: isAdmin ? {} : { userId: (session.user as any).id },
    include: { items: { include: { product: true } }, user: isAdmin ? { select: { name: true, surname: true, apelido: true, email: true } } : false },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(orders);
}

// POST { items: [{ productId, size, quantity }] }
// Never trusts client-sent prices — always re-reads Product.priceCents,
// and re-checks that each product is available to the buyer's city
// (or the default Polish section) before allowing the order.
export async function PATCH(request: Request, {params}:RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orderId = params.id;
  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const requested: { productId: string; size: string; quantity: number }[] = body.items || [];
  if (!Array.isArray(requested) || requested.length === 0) {
    return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
  }

  export async function DELETE(request:Request, { params }: RouteParams) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orderId = params.id;
  }

  const orderItemsData = [];
  let totalCents = 0;

  for (const line of requested) {
    const product = await prisma.product.findUnique({
      where: { id: line.productId },
      include: { cities: { include: { city: true } } }
    });
    if (!product || !product.active) {
      return NextResponse.json({ error: `Product ${line.productId} is no longer available.` }, { status: 400 });
    }
    const allowedCityIds = product.cities.map((c) => c.cityId);
    const hasDefault = product.cities.some((c) => c.city.isDefaultSection);
    if (!allowedCityIds.includes(user.cityId) && !hasDefault) {
      return NextResponse.json({ error: `${product.name} is not available for your section.` }, { status: 403 });
    }
    if (!product.sizes.includes(line.size)) {
      return NextResponse.json({ error: `Invalid size for ${product.name}.` }, { status: 400 });
    }
    const qty = Math.max(1, Math.floor(line.quantity));
    totalCents += product.priceCents * qty;
    orderItemsData.push({ productId: product.id, size: line.size, quantity: qty, unitPriceCents: product.priceCents });
  }

  const order = await prisma.order.create({
    data: {
      userId,
      totalCents,
      currency: 'PLN',
      status: 'PENDING',
      items: { create: orderItemsData }
    },
    include: { items: { include: { product: true } } }
  });

  return NextResponse.json(order, { status: 201 });
}
