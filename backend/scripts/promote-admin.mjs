import { PrismaClient } from '@prisma/client';

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error('Usage: node scripts/promote-admin.mjs <email>');
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'admin' },
    select: { id: true, email: true, role: true, firstName: true, lastName: true },
  });
  console.log('Promoted to admin:', user);
} catch (error) {
  console.error('Failed:', error.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}