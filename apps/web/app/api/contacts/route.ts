import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { listContacts, upsertContactByPhone } from '@/lib/services/contactService';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);

  try {
    const result = await listContacts(auth.tenantId, {
      search: searchParams.get('search') ?? undefined,
      source: searchParams.get('source') ?? undefined,
      channel: searchParams.get('channel') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      createdFrom: searchParams.get('createdFrom') ?? undefined,
      createdTo: searchParams.get('createdTo') ?? undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const contact = await upsertContactByPhone({
      tenantId: auth.tenantId,
      phone: body.phone,
      name: body.name,
      email: body.email,
      source: body.source ?? 'manual',
      channel: body.channel,
    });

    if (!contact) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 422 });
    }

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
