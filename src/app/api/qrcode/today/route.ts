import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { signQrPayload } from '@/lib/qrcode-token';
import { isTeachingStaff } from '@/lib/roles';
import QRCode from 'qrcode';

function todayDateOnly() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// GET /api/qrcode/today?cityId=... -> returns (creating if needed) today's
// signed QR code for that city as a data-URL PNG, restricted to teaching
// staff/admin of that city's classes.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !isTeachingStaff(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get('cityId') || (session!.user as any).cityId;

  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) return NextResponse.json({ error: 'City not found' }, { status: 404 });

  const date = todayDateOnly();

  let qr = await prisma.dailyQRCode.findUnique({ where: { cityId_date: { cityId, date } } });
  if (!qr) {
    const dateISO = date.toISOString().slice(0, 10);
    const token = signQrPayload(cityId, dateISO);
    const expiresAt = new Date(date);
    expiresAt.setUTCHours(23, 59, 59, 999);
    qr = await prisma.dailyQRCode.create({ data: { cityId, date, token, expiresAt } });
  }

  const dataUrl = await QRCode.toDataURL(qr.token, { margin: 2, width: 320 });

  return NextResponse.json({ token: qr.token, dataUrl, expiresAt: qr.expiresAt, cityName: city.name });
}
