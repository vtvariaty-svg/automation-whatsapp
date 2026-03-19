import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, auditService } from '@/lib/superadmin';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);

    const { searchParams } = new URL(req.url);
    const search  = searchParams.get('search') || '';
    const role    = searchParams.get('role')   || undefined;
    const active  = searchParams.get('active');
    const page    = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit   = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const skip    = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name:  { contains: search, mode: 'insensitive' } },
        { id:    { equals: search } },
      ];
    }
    if (role)           where.role     = role;
    if (active === 'true')  where.isActive = true;
    if (active === 'false') where.isActive = false;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, role: true,
          isActive: true, emailVerifiedAt: true, lastLoginAt: true,
          createdAt: true, tenantId: true, forcePasswordReset: true,
          tenant: { select: { id: true, name: true } }
        }
      })
    ]);

    return NextResponse.json({ data: users, total, page, limit });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err.message === 'FORBIDDEN')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    console.error('[superadmin/users GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireSuperAdmin(req);
    const body  = await req.json();
    const { name, email, password, role, tenantId } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      const tenant = await prisma.tenant.create({ data: { name: `${name || email}'s Workspace` } });
      resolvedTenantId = tenant.id;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, tenantId: resolvedTenantId, role: role || 'user' },
      select: { id: true, email: true, name: true, role: true, tenantId: true }
    });

    await auditService.log({
      actorUserId: actor.id, action: 'CREATE_USER',
      targetUserId: user.id, targetTenantId: user.tenantId,
      entityType: 'user', entityId: user.id,
      after: user, req
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err.message === 'FORBIDDEN')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    console.error('[superadmin/users POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
