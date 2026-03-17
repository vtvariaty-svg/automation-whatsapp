import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import {
  getAvailabilityBlocks,
  createAvailabilityBlock,
} from '@/src/services/schedulingService';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') ?? undefined;

  const blocks = await getAvailabilityBlocks(auth.tenantId, date);
  return NextResponse.json(blocks);
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { date, startTime, endTime, reason } = body;

  if (!date) {
    return NextResponse.json({ error: 'date is required' }, { status: 400 });
  }
  if ((startTime && !endTime) || (!startTime && endTime)) {
    return NextResponse.json(
      { error: 'startTime and endTime must both be set, or both omitted for a full-day block' },
      { status: 400 }
    );
  }

  const block = await createAvailabilityBlock(auth.tenantId, {
    date,
    startTime: startTime ?? undefined,
    endTime: endTime ?? undefined,
    reason: reason ?? undefined,
  });
  return NextResponse.json(block, { status: 201 });
}
