import { NextResponse } from 'next/server';
// @ts-ignore - Importing from JS file
import { createTenant, listTenants } from '@/src/services/tenantService';

export async function GET() {
  try {
    const tenants = await listTenants();
    return NextResponse.json(tenants);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newTenant = await createTenant(body);
    return NextResponse.json(newTenant);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
