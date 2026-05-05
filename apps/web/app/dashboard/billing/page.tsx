'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { billingApi } from '@/lib/api/client';

const PUBLIC_PLAN_SLUGS = ['consultorio', 'restaurante'];

// Active commercial plans (shown as upgrade/checkout options)
const PLANS = [
  {
    slug: 'consultorio',
    name: 'Plano Consultório',
    price: 97.00, // provisional — confirm before launch
    highlight: 'Clínicas · Consultórios · Odontologia',
    hasTrial: true,
    isConsultative: false,
    features: [
      'Atendimento via WhatsApp',
      'IA administrativa',
      'Estrutura para página própria',
      'Registro de interessados no painel',
      'Lembretes e follow-up',
      'Encaminhamento humano',
    ],
    missing: [],
    disclaimer: 'A IA não diagnostica, não prescreve e não interpreta exames.',
  },
  {
    slug: 'restaurante',
    name: 'Plano Restaurante',
    price: 97.00, // provisional — confirm before launch
    highlight: 'Restaurante · Delivery · Marmitaria',
    hasTrial: true,
    isConsultative: false,
    features: [
      'Atendimento via WhatsApp',
      'IA de atendimento no horário de pico',
      'Estrutura para página própria',
      'Preparado para catálogo/cardápio online',
      'Base para organizar pedidos pelo WhatsApp',
      'Preparado para entrega ou retirada',
    ],
    missing: [],
    disclaimer: 'Pagamento online não é processado nesta etapa.',
  },
];

interface SubscriptionData {
  hasSubscription: boolean;
  plan: string | null;
  planName: string | null;
  planPrice: number;
  status: string | null;
  usageMessages: number;
  limitMessages: number;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [confirmFreeDowngrade, setConfirmFreeDowngrade] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => { loadSubscription(); }, []);

  const loadSubscription = async () => {
    try {
      const data = await billingApi.getSubscription();
      setSubscription(data);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, ok: boolean) => {
    setActionMessage({ text, ok });
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleConfirmDowngradeToFree = async () => {
    setConfirmFreeDowngrade(false);
    setCheckoutLoading('free');
    try {
      const data = await billingApi.createCheckout('free');
      const msg = data?.canceledStripeSubscription
        ? 'Plano alterado para Free. Sua assinatura paga foi cancelada no Stripe.'
        : 'Plano alterado para Free com sucesso.';
      showMessage(msg, true);
      // Reload subscription state so the UI reflects the new plan immediately.
      await loadSubscription();
    } catch (err: any) {
      showMessage(err?.message || 'Erro ao alterar plano. Tente novamente.', false);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleCheckout = async (planSlug: string) => {
    if (planSlug === 'free') {
      setConfirmFreeDowngrade(true);
      return;
    }

    setCheckoutLoading(planSlug);
    try {
      const data = await billingApi.createCheckout(planSlug);
      
      if (data.contactSales && data.contactUrl) {
        window.location.href = data.contactUrl;
        return;
      }
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      showMessage(err?.message || 'Erro ao criar sessão de pagamento. Tente novamente.', false);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active': return <Badge variant="success">Ativo</Badge>;
      case 'trialing': return <Badge variant="warning">Trial</Badge>;
      case 'canceled': return <Badge variant="danger">Cancelado</Badge>;
      default: return <Badge>Sem plano</Badge>;
    }
  };

  const trialDaysLeft = (() => {
    if (!subscription?.trialEnd) return 0;
    const diff = new Date(subscription.trialEnd).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  })();

  const usagePercent = subscription
    ? subscription.limitMessages === -1
      ? 0
      : Math.min(100, (subscription.usageMessages / Math.max(1, subscription.limitMessages)) * 100)
    : 0;

  const isTrialExpired = subscription?.status === 'trialing' && trialDaysLeft <= 0;
  const isCanceled = subscription?.status === 'canceled';
  const showUrgentUpgrade = isTrialExpired || isCanceled;
  const isPaidPlan = subscription?.plan && subscription.plan !== 'free' && subscription.plan !== 'starter';
  const isLegacyPlan = subscription?.hasSubscription && !!subscription.plan && !PUBLIC_PLAN_SLUGS.includes(subscription.plan);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assinatura</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie seu plano e acompanhe seu uso.</p>
      </div>

      {/* Action feedback banner */}
      {actionMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          actionMessage.ok
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Urgent upgrade banner */}
      {showUrgentUpgrade && (
        <div className="bg-gradient-to-r from-rose-600 to-red-500 rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">
                {isTrialExpired ? '⛔ Trial expirado' : '⛔ Assinatura cancelada'}
              </h3>
              <p className="text-rose-100 text-sm mt-1">
                {isTrialExpired
                  ? 'Seu período de teste terminou. Assine um plano para continuar recebendo e respondendo mensagens.'
                  : 'Sua assinatura foi cancelada. Reative para retomar o atendimento automático.'}
              </p>
            </div>
            <a
              href="#plans"
              className="shrink-0 inline-flex items-center justify-center px-6 py-3 bg-white text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-50 transition-colors"
            >
              Assinar agora →
            </a>
          </div>
        </div>
      )}

      {/* Legacy plan notice */}
      {isLegacyPlan && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="text-amber-500 text-2xl shrink-0">⚠️</div>
          <div>
            <h3 className="font-semibold text-amber-800 text-sm">Plano legado: {subscription?.planName}</h3>
            <p className="text-amber-700 text-xs mt-1">
              Seu plano atual não está mais disponível para novos clientes. Escolha um plano atual abaixo para continuar usando todos os recursos.
            </p>
          </div>
        </div>
      )}

      {/* Current plan overview */}
      {subscription?.hasSubscription && (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Plano {subscription.planName}</h3>
                {getStatusBadge(subscription.status)}
              </div>
              {subscription.status === 'trialing' && trialDaysLeft > 0 && (
                <p className="text-sm text-amber-600 font-medium">⏱ {trialDaysLeft} dias restantes de trial</p>
              )}
              {subscription.currentPeriodEnd && (
                <p className="text-xs text-gray-400">
                  Próxima cobrança: {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            <div className="text-right">
              {subscription.planPrice > 0 ? (
                <p className="text-3xl font-bold text-gray-900">
                  R$ {subscription.planPrice.toFixed(2).replace('.', ',')}
                  <span className="text-sm font-normal text-gray-400">/mês</span>
                </p>
              ) : (
                <p className="text-2xl font-bold text-gray-400">Grátis</p>
              )}
            </div>
          </div>

          {/* Usage bar */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">Mensagens IA utilizadas</span>
              <span className="text-gray-900 font-semibold">
                {subscription.usageMessages.toLocaleString()} /{' '}
                {subscription.limitMessages === -1 ? '∞' : subscription.limitMessages.toLocaleString()}
              </span>
            </div>
            {subscription.limitMessages !== -1 && (
              <>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-[#4f46e5]'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {usagePercent >= 100
                    ? '⚠️ Limite atingido. Faça upgrade para continuar usando.'
                    : `${(100 - usagePercent).toFixed(0)}% restante`}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div id="plans">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {subscription?.hasSubscription ? 'Alterar plano' : 'Escolha seu plano'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
          {PLANS.map((plan) => {
            const isCurrent = subscription?.plan === plan.slug;
            return (
              <div
                key={plan.slug}
                className={`relative rounded-2xl border-2 bg-white p-6 flex flex-col transition-shadow hover:shadow-lg ${
                  isCurrent ? 'border-[#4f46e5]' : 'border-gray-200'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white text-xs font-bold px-4 py-1 rounded-full shadow whitespace-nowrap">
                      PLANO ATUAL
                    </span>
                  </div>
                )}

                <h4 className="text-xl font-bold text-gray-900 mt-2">{plan.name}</h4>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">{plan.highlight}</p>

                <div className="mb-5">
                  {plan.hasTrial && !isCurrent && (
                    <p className="text-xs font-semibold text-emerald-600 mb-1">7 dias grátis</p>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-sm font-semibold text-gray-400">/mês</span>
                  </div>
                </div>

                <ul className="space-y-2 flex-1 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.disclaimer && (
                  <p className="text-xs text-gray-400 mb-4 border-t border-gray-100 pt-3">{plan.disclaimer}</p>
                )}

                <Button
                  className="w-full"
                  variant={isCurrent ? 'secondary' : 'primary'}
                  disabled={isCurrent || checkoutLoading === plan.slug}
                  onClick={() => handleCheckout(plan.slug)}
                >
                  {checkoutLoading === plan.slug
                    ? 'Aguarde...'
                    : isCurrent
                    ? 'Plano atual'
                    : plan.hasTrial
                    ? 'Iniciar teste grátis'
                    : 'Assinar'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trial disclaimer removed */}

      {/* Free downgrade confirmation modal */}
      {confirmFreeDowngrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 text-xl shrink-0">
                ⚠️
              </div>
              <h3 className="text-xl font-bold text-gray-900">Mudar para plano Free?</h3>
            </div>

            {isPaidPlan ? (
              <p className="text-gray-600 text-sm mb-2">
                Sua assinatura paga será <strong>cancelada imediatamente</strong> no Stripe e
                você perderá acesso aos recursos do plano atual <strong>agora mesmo</strong>.
              </p>
            ) : (
              <p className="text-gray-600 text-sm mb-2">
                Você voltará para o plano gratuito com recursos limitados.
              </p>
            )}

            <p className="text-gray-400 text-xs mb-6">
              Você pode fazer upgrade novamente a qualquer momento.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmFreeDowngrade(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDowngradeToFree}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors"
              >
                Confirmar downgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
