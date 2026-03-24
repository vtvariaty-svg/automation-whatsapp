import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_SECRET = process.env.JWT_SECRET;

export const generateToken = (userId: string, tenantId: string, role: string, sessionVersion: number = 1) => {
  return jwt.sign(
    { userId, tenantId, role, sessionVersion },
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

// Set REQUIRE_EMAIL_VERIFICATION=false to disable email verification temporarily.
// Defaults to true (verification required) when the variable is absent or any value other than 'false'.
const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';

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
      role,
      // When verification is disabled, mark email as verified immediately
      ...(!requireEmailVerification && { emailVerifiedAt: new Date() }),
    }
  });

  if (requireEmailVerification) {
    // Criar token de verificação e enviar e-mail
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
      requiresVerification: true,
      user: { id: user.id, email: user.email, tenantId: user.tenantId, role: user.role }
    };
  }

  // Verificação desabilitada — retorna token JWT para login imediato
  const token = generateToken(user.id, user.tenantId, user.role);
  return {
    message: 'Conta criada com sucesso.',
    requiresVerification: false,
    user: { id: user.id, email: user.email, tenantId: user.tenantId, role: user.role },
    token,
  };
};

export const loginUser = async (email: string, passwordPlain: string, meta?: { ip?: string, userAgent?: string }) => {
  email = email.trim();
  passwordPlain = passwordPlain.trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');


  // Bloquear conta desativada pelo superadmin
  if (!user.isActive) throw new Error('Conta desativada. Entre em contato com o suporte.');

  // Social login users don't have a password
  if (!user.passwordHash) throw new Error('Use social login for this account');

  const isValid = await verifyPassword(passwordPlain, user.passwordHash || '');
  if (!isValid) throw new Error('Invalid credentials');


  // Bloquear login por e-mail não verificado apenas quando a verificação está habilitada
  if (requireEmailVerification && !user.emailVerifiedAt && user.role !== 'superadmin') {
    throw new Error('Email não verificado. Verifique seu email antes de fazer login.');
  }

  // Registrar evento de login e atualizar lastLoginAt
  await prisma.$transaction([
    prisma.loginEvent.create({
      data: {
        userId: user.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
      }
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })
  ]);

  const token = generateToken(user.id, user.tenantId, user.role, user.sessionVersion);

  return {
    user: { id: user.id, email: user.email, tenantId: user.tenantId, role: user.role, forcePasswordReset: user.forcePasswordReset, sessionVersion: user.sessionVersion },
    token
  };
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
