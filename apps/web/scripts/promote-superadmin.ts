import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'vtvariaty@gmail.com';
  
  console.log(`Promoting ${email} to superadmin...`);
  
  const user = await prisma.user.update({
    where: { email },
    data: {
      role: 'superadmin',
      isActive: true
    }
  });
  
  console.log('User promoted successfully:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
