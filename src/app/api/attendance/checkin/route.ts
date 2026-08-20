import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyQrToken } from '@/lib/qrcode-token';

// POST { token: string } - the authenticated student checks themself
// into today's class for the city encoded in the (signed) QR token.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const decoded = verifyQrToken(body.token || '');
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid or tampered QR code.' }, { status: 400 });
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  if (decoded.date !== todayISO) {
    return NextResponse.json({ error: 'This QR code is not for today. Ask your instructor for today\'s code.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.isPaused) {
    return NextResponse.json({ error: 'Your training timeline is currently paused by an admin. Contact your instructor.' }, { status: 403 });
  }

  const dateOnly = new Date(decoded.date);
  const qr = await prisma.dailyQRCode.findUnique({ where: { cityId_date: { cityId: decoded.cityId, date: dateOnly } } });
  if (!qr) return NextResponse.json({ error: 'QR code not recognized.' }, { status: 400 });

  const existing = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId, date: dateOnly } }
  });
  if (existing) {
    return NextResponse.json({ message: 'Already checked in today.', record: existing });
  }

  const record = await prisma.attendanceRecord.create({
    data: { userId, cityId: decoded.cityId, date: dateOnly, qrCodeId: qr.id }
  });

  return NextResponse.json({ message: 'Checked in!', record }, { status: 201 });
}
