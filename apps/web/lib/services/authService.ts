import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key';

export const generateToken = (userId: string, tenantId: string) => {
  return jwt.sign(
    { userId, tenantId },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
};

export const verifyPassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

export const registerUser = async (name: string, email: string, passwordPlain: string) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('User already exists');

  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  const tenant = await prisma.tenant.create({
    data: {
      name: `${name}'s Workspace`
    }
  });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      tenantId: tenant.id
    }
  });

  const token = generateToken(user.id, user.tenantId);

  return { user: { id: user.id, email: user.email, tenantId: user.tenantId }, token };
};

export const loginUser = async (email: string, passwordPlain: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  const isValid = await verifyPassword(passwordPlain, user.passwordHash);
  if (!isValid) throw new Error('Invalid credentials');

  const token = generateToken(user.id, user.tenantId);

  return { user: { id: user.id, email: user.email, tenantId: user.tenantId }, token };
};
