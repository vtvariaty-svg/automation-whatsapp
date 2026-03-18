import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email/client';
import { getPasswordResetEmailHtml } from '@/lib/email/templates/resetPasswordTemplate';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Respondemos success mesmo que não exista pra não revelar enumerador de usuários (User Enum)
    if (!user) {
      return NextResponse.json({ message: 'Se o e-mail existir, você receberá um link de redefinição.' });
    }

    const unhashedToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(unhashedToken).digest('hex');

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        tokenHash,
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 minutos de validade
      }
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${unhashedToken}`;

    await sendEmail({
      to: email,
      subject: 'Redefinição de Senha',
      html: getPasswordResetEmailHtml(resetLink)
    });

    return NextResponse.json({ message: 'Se o e-mail existir, você receberá um link de redefinição.' });
  } catch (error: any) {
    console.error('[Forgot Password Error]', error);
    return NextResponse.json({ error: 'Falha ao processar a requisição.' }, { status: 500 });
  }
}
