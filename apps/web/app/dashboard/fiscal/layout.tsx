'use client';

import { useEntitlements } from '@/hooks/useEntitlements';
import { planAtLeast } from '@/lib/config/plans';
import UpgradeGate from '@/components/UpgradeGate';

export default function FiscalLayout({ children }: { children: React.ReactNode }) {
  const ent = useEntitlements();

  if (ent.loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
      </div>
    );
  }

  if (!planAtLeast(ent.plan, 'pro')) {
    return (
      <UpgradeGate
        icon="🧾"
        title="Módulo Fiscal"
        message="O módulo Fiscal está disponível exclusivamente nos planos Pro e Business. Acesse emissão de documentos, histórico, catálogo e emissão por WhatsApp."
        ctaPlan="Pro"
      />
    );
  }

  return <>{children}</>;
}
