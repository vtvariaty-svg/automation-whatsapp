import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token e nova senha são obrigatórios' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'A senha deve conter no mínimo 6 caracteres.' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.verificationToken.findUnique({
      where: { tokenHash }
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'Link inválido ou não autorizado' }, { status: 400 });
    }

    if (resetToken.type !== 'PASSWORD_RESET') {
      return NextResponse.json({ error: 'Tipo de token inválido' }, { status: 400 });
    }

    if (resetToken.usedAt) {
      return NextResponse.json({ error: 'Este link de redefinição já foi utilizado' }, { status: 400 });
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'O link de redefinição expirou' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: resetToken.identifier } });
    
    if (!user) {
       return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Faz o update protegido em lote (senha no user e anulação no token para single-use)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, forcePasswordReset: false, sessionVersion: { increment: 1 } }
      }),
      prisma.verificationToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() }
      })
    ]);

    return NextResponse.json({ message: 'Sua senha foi alterada com sucesso.' });
  } catch (error: any) {
    console.error('[Reset Password Error]', error);
    return NextResponse.json({ error: 'Falha ao redefinir a senha.' }, { status: 500 });
  }
}
