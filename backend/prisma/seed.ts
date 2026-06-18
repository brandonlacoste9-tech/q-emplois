import { PrismaClient, UserRole, TaskStatus, CreditTransactionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SERVICE_TYPES = ['menage', 'demenagement', 'montage_meubles', 'nettoyage', 'jardinage'];

async function main() {
  const passwordHash = await bcrypt.hash('Demo2026!', 10);

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
      { email: 'demo.tasker1@qemplois.ca', firstName: 'Alex', lastName: 'Gagnon', phone: '5145550201', types: ['menage', 'nettoyage'] },
      { email: 'demo.tasker2@qemplois.ca', firstName: 'Sophie', lastName: 'Roy', phone: '5145550202', types: ['demenagement', 'montage_meubles'] },
      { email: 'demo.tasker3@qemplois.ca', firstName: 'Marc', lastName: 'Lavoie', phone: '5145550203', types: ['jardinage', 'autre'] },
    ].map(async (t) => {
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
        update: { serviceTypes: t.types },
        create: {
          userId: user.id,
          serviceTypes: t.types,
          hourlyRate: 35,
          serviceRadiusKm: 20,
          isVerified: true,
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

  const demoTasks = [
    { title: 'Ménage printemps 3½', description: 'Nettoyage complet d\'un 3½ à Rosemont.', serviceType: 'menage', address: '1230 Rue Beaubien E', city: 'Montréal', postalCode: 'H2S 1T7', price: 120 },
    { title: 'Déménagement studio', description: 'Aide pour déménager un studio (2e étage sans ascenseur).', serviceType: 'demenagement', address: '4500 Rue Saint-Denis', city: 'Montréal', postalCode: 'H2J 2L3', price: 180 },
    { title: 'Montage IKEA', description: 'Montage d\'un lit et d\'une commode IKEA.', serviceType: 'montage_meubles', address: '7890 Boul. Décarie', city: 'Montréal', postalCode: 'H4P 1H5', price: 95 },
    { title: 'Nettoyage après rénovation', description: 'Poussière et débris après petite rénovation de cuisine.', serviceType: 'nettoyage', address: '2100 Rue Ontario E', city: 'Montréal', postalCode: 'H2K 1V2', price: 150 },
    { title: 'Tonte de pelouse', description: 'Pelouse moyenne, équipement sur place.', serviceType: 'jardinage', address: '5600 Av. du Parc', city: 'Montréal', postalCode: 'H2V 4H1', price: 60 },
    { title: 'Livraison meubles Kijiji', description: 'Ramasser un canapé et livrer à Verdun.', serviceType: 'livraison', address: '3900 Rue Wellington', city: 'Verdun', postalCode: 'H4G 1V3', price: 75 },
    { title: 'Aide ménage hebdo', description: '2h de ménage régulier.', serviceType: 'menage', address: '1200 Rue Sherbrooke O', city: 'Montréal', postalCode: 'H3A 1H6', price: 70 },
  ];

  for (let i = 0; i < demoTasks.length; i++) {
    const t = demoTasks[i];
    const client = clients[i % clients.length];
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
          estimatedPrice: t.price,
          estimatedDuration: 120,
          scheduledDate: new Date(Date.now() + (i + 1) * 86400000),
          status: TaskStatus.open,
        },
      });
    }
  }

  console.log('Seed complete:');
  console.log('  Clients:', clients.map((c) => c.email).join(', '));
  console.log('  Taskers:', taskers.map((t) => t.email).join(', '));
  console.log('  Password for all demo accounts: Demo2026!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
