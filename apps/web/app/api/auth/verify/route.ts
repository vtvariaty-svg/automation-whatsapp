import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { tokenHash }
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Token inválido ou inexistente' }, { status: 400 });
    }

    if (verificationToken.type !== 'EMAIL_VERIFICATION') {
      return NextResponse.json({ error: 'Tipo de token inválido' }, { status: 400 });
    }

    if (verificationToken.usedAt) {
      return NextResponse.json({ error: 'Este link já foi utilizado.' }, { status: 400 });
    }

    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'O link de verificação expirou.' }, { status: 400 });
    }

    // Marca como usado e atualiza User em transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { email: verificationToken.identifier },
        data: { emailVerifiedAt: new Date() }
      }),
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() }
      })
    ]);

    return NextResponse.json({ message: 'Email verificado com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
