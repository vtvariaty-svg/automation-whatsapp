const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'vtvariaty@gmail.com';
  const newPassword = 'AdminPassword123!';
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        role: 'superadmin',
        isActive: true,
        forcePasswordReset: false,
        passwordHash,
      }
    });
    console.log(`User ${email} updated successfully. New password is: ${newPassword}`);
    console.log('User Details:', {
      id: updatedUser.id,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      sessionVersion: updatedUser.sessionVersion
    });
  } else {
    // If user doesn't exist, we create the superadmin.
    console.log(`User ${email} not found. Creating...`);
    // Need a tenant first
    let tenant = await prisma.tenant.findFirst({
      where: { name: 'SuperAdmin Workspace' }
    });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { name: 'SuperAdmin Workspace' }
      });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name: 'VTVariaty Admin',
        role: 'superadmin',
        isActive: true,
        passwordHash,
        tenantId: tenant.id
      }
    });
    console.log(`User ${email} created successfully. Password: ${newPassword}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
