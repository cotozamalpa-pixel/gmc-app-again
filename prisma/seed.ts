import { PrismaClient, Role, ProductType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // --- Default Polish national section ---
  const polska = await prisma.city.upsert({
    where: { name: 'Polska (Sede Nacional)' },
    update: { isDefaultSection: true },
    create: { name: 'Polska (Sede Nacional)', isDefaultSection: true }
  });

  const warszawa = await prisma.city.upsert({
    where: { name: 'Warszawa' },
    update: {},
    create: { name: 'Warszawa' }
  });

  const krakow = await prisma.city.upsert({
    where: { name: 'Krakow' },
    update: {},
    create: { name: 'Krakow' }
  });

  // --- Graduation system (edit freely from /admin/belts) ---
  const belts = [
    { name: 'Corda Crua (Iniciante)', colorHex: '#e5c07b', order: 0 },
    { name: 'Corda Amarela', colorHex: '#f2d600', order: 1 },
    { name: 'Corda Amarela e Azul', colorHex: '#3b82f6', order: 2 },
    { name: 'Corda Azul', colorHex: '#1d4ed8', order: 3 },
    { name: 'Corda Azul e Verde', colorHex: '#16a34a', order: 4 },
    { name: 'Corda Verde', colorHex: '#15803d', order: 5 },
    { name: 'Corda Verde e Roxa', colorHex: '#7c3aed', order: 6 },
    { name: 'Corda Roxa', colorHex: '#6d28d9', order: 7 },
    { name: 'Corda Roxa e Marrom', colorHex: '#92400e', order: 8 },
    { name: 'Corda Marrom', colorHex: '#78350f', order: 9 },
    { name: 'Corda Marrom e Vermelha', colorHex: '#b91c1c', order: 10 },
    { name: 'Corda Vermelha (Mestre)', colorHex: '#c8102e', order: 11 }
  ];
  for (const b of belts) {
    await prisma.belt.upsert({ where: { name: b.name }, update: {}, create: b });
  }

  // --- Admin account ---
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@muzenzapolska.pl';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
      name: 'Admin',
      surname: 'Muzenza',
      apelido: 'Admin',
      birthDate: new Date('1990-01-01'),
      startDate: new Date('2010-01-01'),
      cityId: polska.id
    }
  });

  // --- A couple of example store products ---
  const shirt = await prisma.product.upsert({
    where: { id: 'seed-tshirt-logo' },
    update: {},
    create: {
      id: 'seed-tshirt-logo',
      name: 'T-shirt Muzenza Logo',
      description: 'Official Muzenza Group training t-shirt.',
      type: ProductType.TSHIRT,
      priceCents: 8000,
      currency: 'PLN',
      sizes: ['PP', 'P', 'M', 'G', 'GG'],
      cities: { create: [{ cityId: polska.id }, { cityId: warszawa.id }, { cityId: krakow.id }] }
    }
  });

  await prisma.product.upsert({
    where: { id: 'seed-hoodie-logo' },
    update: {},
    create: {
      id: 'seed-hoodie-logo',
      name: 'Hoodie Muzenza',
      description: 'Warm hoodie with embroidered Muzenza crest.',
      type: ProductType.HOODIE,
      priceCents: 16000,
      currency: 'PLN',
      sizes: ['P', 'M', 'G', 'GG'],
      cities: { create: [{ cityId: polska.id }, { cityId: warszawa.id }] }
    }
  });

  console.log('Seed complete. Admin login:', adminEmail, '/', adminPassword);
  console.log('Example product id:', shirt.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
