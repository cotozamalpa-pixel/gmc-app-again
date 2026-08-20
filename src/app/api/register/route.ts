import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1),
  surname: z.string().min(1),
  apelido: z.string().min(1),
  beltId: z.string().optional().nullable(),
  cityId: z.string().min(1, 'City is required'),
  startDate: z.string().min(1),
  birthDate: z.string().min(1)
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const city = await prisma.city.findUnique({ where: { id: data.cityId } });
  if (!city) return NextResponse.json({ error: 'Invalid city/section selected.' }, { status: 400 });

  if (data.beltId) {
    const belt = await prisma.belt.findUnique({ where: { id: data.beltId } });
    if (!belt) return NextResponse.json({ error: 'Invalid belt selected.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role: 'ALUNO',
      name: data.name,
      surname: data.surname,
      apelido: data.apelido,
      beltId: data.beltId || null,
      cityId: data.cityId,
      startDate: new Date(data.startDate),
      birthDate: new Date(data.birthDate)
    }
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
