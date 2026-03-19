import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'vtvariaty@gmail.com';
  console.log(`Buscando usuario: ${email}...`);
  
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.error(`Usuario ${email} nao encontrado!`);
    return;
  }
  
  const updated = await prisma.user.update({
    where: { email },
    data: { role: 'superadmin' }
  });
  
  console.log(`Sucesso: ${updated.email} agora e superadmin.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
