import { NextResponse } from 'next/server';
import { generateResponse, classifyIntent } from '@/lib/services/aiService';
import { getAuthUser } from '@/lib/auth-api';

export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const response = await generateResponse(user.tenantId, message);
    const intent = await classifyIntent(message);

    return NextResponse.json({ response, intent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
