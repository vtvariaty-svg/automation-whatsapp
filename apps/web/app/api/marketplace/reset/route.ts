/**
 * POST /api/marketplace/reset
 *
 * Reset seguro de configuração derivada de preset/bot.
 * Remove apenas o que foi semeado pelo sistema; preserva tudo que é do usuário.
 *
 * O QUE É LIMPO:
 *   - activeBotKey → null
 *   - aiPrompt → null (era derivado do preset; usuário reconfigura via Guided Setup ou manual)
 *   - AutomationRule onde sourceType = 'system' → deletadas
 *   - Service onde sourceType = 'system' → desativadas (active = false)
 *     (não deletamos serviços pois podem ter appointments vinculados)
 *
 * O QUE NÃO É ALTERADO:
 *   - businessType / identidade do tenant
 *   - canais conectados
 *   - welcomeMessage (propriedade do operador)
 *   - businessHours
 *   - automações com sourceType = 'manual' (criadas pelo usuário)
 *   - serviços com sourceType = 'manual'
 *   - produtos / catálogo
 *   - dados de onboarding
 */

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Limpar preset ativo e prompt derivado no tenant
      await tx.tenant.update({
        where: { id: auth.tenantId },
        data: {
          activeBotKey: null,
          aiPrompt: null,
        },
      });

      // 2. Deletar automações semeadas pelo sistema (sourceType = 'system')
      //    Automações manuais do usuário (sourceType = 'manual') são preservadas.
      const { count: automationsDeleted } = await (tx.automationRule as any).deleteMany({
        where: {
          tenantId: auth.tenantId,
          sourceType: 'system',
        },
      });

      // 3. Desativar serviços semeados pelo sistema (sourceType = 'system')
      //    Não deletamos para não quebrar appointments já existentes.
      //    Serviços manuais do usuário (sourceType = 'manual') são preservados.
      const { count: servicesDeactivated } = await (tx.service as any).updateMany({
        where: {
          tenantId: auth.tenantId,
          sourceType: 'system',
        },
        data: { active: false },
      });

      return { automationsDeleted, servicesDeactivated };
    });

    return NextResponse.json({
      success: true,
      automationsDeleted: result.automationsDeleted,
      servicesDeactivated: result.servicesDeactivated,
    });
  } catch (error: any) {
    console.error('[marketplace/reset] Erro ao resetar preset:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
