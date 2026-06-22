import { PrismaClient, UserRole, TaskStatus, CreditTransactionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { geocodeQuebecAddress } from '../src/common/utils/geocode';
import { getActiveDemoJobSet } from '../src/common/demo-jobs/demo-jobs.catalog';

const prisma = new PrismaClient();

const SERVICE_TYPES = ['menage', 'demenagement', 'montage_meubles', 'nettoyage', 'jardinage'];

async function main() {
  const passwordHash = await bcrypt.hash('Demo2026!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@qemplois.ca' },
    update: { role: UserRole.admin },
    create: {
      email: 'admin@qemplois.ca',
      firstName: 'Admin',
      lastName: 'Q-Emplois',
      phone: '5145550000',
      passwordHash,
      role: UserRole.admin,
      consentGiven: true,
      consentDate: new Date(),
    },
  });

  const clients = await Promise.all(
    [
      { email: 'demo.client1@qemplois.ca', firstName: 'Marie', lastName: 'Tremblay', phone: '5145550101' },
      { email: 'demo.client2@qemplois.ca', firstName: 'Jean', lastName: 'Dupont', phone: '5145550102' },
    ].map((c) =>
      prisma.user.upsert({
        where: { email: c.email },
        update: {},
        create: {
          ...c,
          passwordHash,
          role: UserRole.client,
          consentGiven: true,
          consentDate: new Date(),
        },
      }),
    ),
  );

  const taskers = await Promise.all(
    [
      { email: 'demo.tasker1@qemplois.ca', firstName: 'Alex', lastName: 'Gagnon', phone: '5145550201', types: ['menage', 'nettoyage'], city: 'Montréal' },
      { email: 'demo.tasker2@qemplois.ca', firstName: 'Sophie', lastName: 'Roy', phone: '5145550202', types: ['demenagement', 'montage_meubles'], city: 'Montréal' },
      { email: 'demo.tasker3@qemplois.ca', firstName: 'Marc', lastName: 'Lavoie', phone: '5145550203', types: ['jardinage', 'autre'], city: 'Verdun' },
    ].map(async (t) => {
      const coords = geocodeQuebecAddress(t.city);
      const user = await prisma.user.upsert({
        where: { email: t.email },
        update: {},
        create: {
          email: t.email,
          firstName: t.firstName,
          lastName: t.lastName,
          phone: t.phone,
          passwordHash,
          role: UserRole.provider,
          consentGiven: true,
          consentDate: new Date(),
        },
      });
      await prisma.provider.upsert({
        where: { userId: user.id },
        update: {
          serviceTypes: t.types,
          locationAddress: t.city,
          locationLat: coords?.lat,
          locationLng: coords?.lng,
        },
        create: {
          userId: user.id,
          serviceTypes: t.types,
          hourlyRate: 35,
          serviceRadiusKm: 25,
          isVerified: true,
          locationAddress: t.city,
          locationLat: coords?.lat,
          locationLng: coords?.lng,
        },
      });
      const wallet = await prisma.creditWallet.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, balance: 60, isFoundingTasker: true, lifetimeDiscountPercent: 20 },
      });
      if (wallet.balance === 0) {
        await prisma.creditWallet.update({
          where: { id: wallet.id },
          data: { balance: 60, isFoundingTasker: true, lifetimeDiscountPercent: 20 },
        });
        await prisma.creditTransaction.create({
          data: {
            walletId: wallet.id,
            amount: 60,
            type: CreditTransactionType.bonus,
            description: 'Seed — bonus founding tasker',
          },
        });
      }
      return user;
    }),
  );

  const activeDemoTasks = getActiveDemoJobSet(3);

  for (let i = 0; i < activeDemoTasks.length; i++) {
    const t = activeDemoTasks[i];
    const client = clients[i % clients.length];
    const coords = geocodeQuebecAddress(t.city, t.postalCode);
    const existing = await prisma.task.findFirst({
      where: { title: t.title, clientId: client.id },
    });
    if (!existing) {
      await prisma.task.create({
        data: {
          clientId: client.id,
          title: t.title,
          description: t.description,
          serviceType: t.serviceType,
          address: t.address,
          city: t.city,
          postalCode: t.postalCode,
          locationLat: coords?.lat,
          locationLng: coords?.lng,
          estimatedPrice: t.price,
          estimatedDuration: t.estimatedDuration ?? 120,
          scheduledDate: new Date(Date.now() + (i + 1) * 86400000),
          status: TaskStatus.open,
        },
      });
    } else if (existing.locationLat == null && coords) {
      await prisma.task.update({
        where: { id: existing.id },
        data: { locationLat: coords.lat, locationLng: coords.lng },
      });
    }
  }

  console.log('Seed complete:');
  console.log('  Clients:', clients.map((c) => c.email).join(', '));
  console.log('  Taskers:', taskers.map((t) => t.email).join(', '));
  console.log('  Demo jobs:', activeDemoTasks.length, '(summer set, geocoded)');
  console.log('  Password for all demo accounts: Demo2026!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
