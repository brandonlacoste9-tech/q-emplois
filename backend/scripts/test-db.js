const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  console.log("Total users:", count);
  if (count > 0) {
    const users = await prisma.user.findMany({ take: 5 });
    console.log("Sample users:", users.map(u => u.email));
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
