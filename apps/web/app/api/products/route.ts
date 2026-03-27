import { NextResponse } from 'next/server';
import { listProducts, createProduct } from '@/lib/services/tenantService';
import { getAuthUser } from '@/lib/auth-api';

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const products = await listProducts(user.tenantId);
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();

    // Normalization and type conversion
    if (data.aliases && typeof data.aliases === 'string') {
      data.aliases = data.aliases.split(',').map((a: string) => a.trim()).filter(Boolean);
    }
    if (data.salesPriority !== undefined) data.salesPriority = Number(data.salesPriority);
    if (data.requiresHumanApproval !== undefined) data.requiresHumanApproval = Boolean(data.requiresHumanApproval);
    if (data.price !== undefined) data.price = Number(data.price);
    if (data.stock !== undefined) data.stock = data.stock !== null ? Number(data.stock) : null;

    // Validation
    if (data.salesMode === 'external_link' && !data.externalSalesUrl) {
      return NextResponse.json({ error: 'URL externa é obrigatória para este modo de venda.' }, { status: 400 });
    }

    const product = await createProduct(user.tenantId, data);
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
