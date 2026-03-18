import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_SECRET = process.env.JWT_SECRET;

export const generateToken = (userId: string, tenantId: string, role: string) => {
  return jwt.sign(
    { userId, tenantId, role },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
};

export const verifyPassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

import crypto from 'crypto';
import { sendEmail } from '../email/client';
import { getVerificationEmailHtml } from '../email/templates/verificationTemplate';

export const registerUser = async (name: string, email: string, passwordPlain: string, role: string = 'user') => {
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
      tenantId: tenant.id,
      role
    }
  });

  // Criar token de verificação
  const unhashedToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(unhashedToken).digest('hex');
  
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      tokenHash,
      type: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 hours
    }
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verifyLink = `${baseUrl}/verify-email?token=${unhashedToken}`;

  await sendEmail({
    to: email,
    subject: 'Verifique seu e-mail para ativar sua conta',
    html: getVerificationEmailHtml(verifyLink, name)
  });

  return { 
    message: 'Conta criada. Verifique seu email para ativá-la.', 
    requiresVerification: true 
  };
};

export const loginUser = async (email: string, passwordPlain: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  // Social login users don't have a password
  if (!user.passwordHash) throw new Error('Use social login for this account');

  const isValid = await verifyPassword(passwordPlain, user.passwordHash);
  if (!isValid) throw new Error('Invalid credentials');

  // Bloquear login se o e-mail não estiver verificado e o role não for superadmin
  if (!user.emailVerifiedAt && user.role !== 'superadmin') {
    throw new Error('Email não verificado. Verifique seu email antes de fazer login.');
  }

  const token = generateToken(user.id, user.tenantId, user.role);

  return { user: { id: user.id, email: user.email, tenantId: user.tenantId, role: user.role }, token };
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string, tenantId: string, role: string };
  } catch (error) {
    return null;
  }
};

export const isAdmin = (token: string) => {
  const payload = verifyToken(token);
  return payload?.role === 'admin' || payload?.role === 'superadmin';
};
