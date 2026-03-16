import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

/**
 * POST /api/admin/demo/clone
 * superadmin only — copies AutomationRules and Services from a demo tenant
 * into a brand-new tenant with a trialing subscription.
 * Body: { tenantId: string, newTenantName: string, newEmail: string }
 */
export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  if (auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  let body: { tenantId?: string; newTenantName?: string; newEmail?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { tenantId, newTenantName, newEmail } = body;

  if (!tenantId || !newTenantName || !newEmail) {
    return NextResponse.json(
      { error: 'tenantId, newTenantName e newEmail são obrigatórios' },
      { status: 400 }
    );
  }

  // Confirm source tenant exists and is a demo tenant
  const sourceTenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, isDemo: true, name: true },
  });

  if (!sourceTenant) {
    return NextResponse.json({ error: 'Tenant de origem não encontrado' }, { status: 404 });
  }
  if (!sourceTenant.isDemo) {
    return NextResponse.json({ error: 'Tenant de origem não é um demo tenant' }, { status: 400 });
  }

  // Check if email is already in use
  const existingUser = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existingUser) {
    return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 });
  }

  try {
    // Fetch data to clone
    const [sourceRules, sourceServices] = await Promise.all([
      prisma.automationRule.findMany({ where: { tenantId } }),
      prisma.service.findMany({ where: { tenantId } }),
    ]);

    // Create new tenant
    const newTenant = await prisma.tenant.create({
      data: {
        name: newTenantName,
        isDemo: false,
        setupCompleted: false,
      },
    });

    // Generate a temporary password from a UUID (first 12 chars, uppercase for readability)
    const tempPassword = uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create admin user for new tenant
    const newUser = await prisma.user.create({
      data: {
        tenantId: newTenant.id,
        email: newEmail,
        passwordHash,
        role: 'admin',
      },
    });

    // Create trialing subscription (14-day trial)
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    await prisma.subscription.create({
      data: {
        tenantId: newTenant.id,
        plan: 'pro',
        status: 'trialing',
        trialEnd,
        currentPeriodStart: new Date(),
      },
    });

    // Clone automation rules
    if (sourceRules.length > 0) {
      await prisma.automationRule.createMany({
        data: sourceRules.map(({ id: _id, tenantId: _tid, createdAt: _ca, ...rest }) => ({
          ...rest,
          tenantId: newTenant.id,
        })),
      });
    }

    // Clone services
    if (sourceServices.length > 0) {
      await prisma.service.createMany({
        data: sourceServices.map(({ id: _id, tenantId: _tid, createdAt: _ca, ...rest }) => ({
          ...rest,
          tenantId: newTenant.id,
        })),
      });
    }

    return NextResponse.json({
      newTenantId: newTenant.id,
      userId: newUser.id,
      email: newEmail,
      tempPassword,
    });
  } catch (error: any) {
    console.error('[demo/clone] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
