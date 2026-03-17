'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { billingApi } from '@/lib/api/client';

const PLANS = [
  {
    slug: 'starter',
    name: 'Starter',
    price: 39.90,
    limit: 1000,
    features: ['1.000 mensagens IA/mês', 'WhatsApp integrado', 'Painel de conversas', 'Suporte por email'],
  },
  {
    slug: 'pro',
    name: 'Pro',
    price: 79.90,
    limit: 4000,
    popular: true,
    features: ['4.000 mensagens IA/mês', 'WhatsApp integrado', 'Painel de conversas', 'Inbox com atendimento humano', 'Suporte prioritário'],
  },
  {
    slug: 'business',
    name: 'Business',
    price: 149.00,
    limit: 15000,
    features: ['15.000 mensagens IA/mês', 'WhatsApp integrado', 'Painel completo', 'Inbox com atendimento humano', 'Integrações avançadas', 'Suporte dedicado'],
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

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const data = await billingApi.getSubscription();
      setSubscription(data);
    } catch (err) {
      console.error('Failed to load subscription', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (plan: string) => {
    setCheckoutLoading(plan);
    try {
      const data = await billingApi.createCheckout(plan);
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error('Checkout error', err);
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

  const getTrialDaysLeft = () => {
    if (!subscription?.trialEnd) return 0;
    const diff = new Date(subscription.trialEnd).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const usagePercent = subscription
    ? Math.min(100, (subscription.usageMessages / Math.max(1, subscription.limitMessages)) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin"></div>
      </div>
    );
  }

  const trialDaysLeft = getTrialDaysLeft();
  const isTrialExpired = subscription?.status === 'trialing' && trialDaysLeft <= 0;
  const isCanceled = subscription?.status === 'canceled';
  const showUrgentUpgrade = isTrialExpired || isCanceled;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assinatura</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie seu plano e acompanhe seu uso.</p>
      </div>

      {/* Hard block banner when trial expired or canceled */}
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
            <a href="#plans" className="shrink-0 inline-flex items-center justify-center px-6 py-3 bg-white text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-50 transition-colors">
              Assinar agora →
            </a>
          </div>
        </div>
      )}

      {/* Current plan overview */}
      {subscription?.hasSubscription && (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Plano {subscription.planName}
                </h3>
                {getStatusBadge(subscription.status)}
              </div>
              {subscription.status === 'trialing' && (
                <p className="text-sm text-amber-600 font-medium">
                  ⏱ {getTrialDaysLeft()} dias restantes de trial
                </p>
              )}
              {subscription.currentPeriodEnd && (
                <p className="text-xs text-gray-400">
                  Próxima cobrança: {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                R$ {subscription.planPrice?.toFixed(2).replace('.', ',')}
                <span className="text-sm font-normal text-gray-400">/mês</span>
              </p>
            </div>
          </div>

          {/* Usage bar */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">Mensagens IA utilizadas</span>
              <span className="text-gray-900 font-semibold">
                {subscription.usageMessages.toLocaleString()} / {subscription.limitMessages.toLocaleString()}
              </span>
            </div>
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
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div id="plans">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {subscription?.hasSubscription ? 'Alterar plano' : 'Escolha seu plano'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = subscription?.plan === plan.slug;
            return (
              <div
                key={plan.slug}
                className={`relative rounded-2xl border-2 bg-white p-6 flex flex-col transition-shadow hover:shadow-lg ${
                  plan.popular
                    ? 'border-[#4f46e5] shadow-md'
                    : isCurrent
                    ? 'border-[#4f46e5]'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#4f46e5] text-white text-xs font-bold px-4 py-1 rounded-full shadow">
                      MAIS POPULAR
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white text-xs font-bold px-4 py-1 rounded-full shadow">
                      PLANO ATUAL
                    </span>
                  </div>
                )}

                <h4 className="text-xl font-bold text-gray-900 mt-2">{plan.name}</h4>
                <div className="mt-3 mb-5">
                  <span className="text-3xl font-bold text-gray-900">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-sm text-gray-400">/mês</span>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrent ? 'secondary' : plan.popular ? 'primary' : 'secondary'}
                  disabled={isCurrent || checkoutLoading === plan.slug}
                  onClick={() => handleCheckout(plan.slug)}
                >
                  {checkoutLoading === plan.slug
                    ? 'Redirecionando...'
                    : isCurrent
                    ? 'Plano atual'
                    : 'Assinar'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trial banner */}
      {!subscription?.hasSubscription && (
        <Card className="p-6 bg-gradient-to-r from-[#4f46e5] to-[#6366f1] border-0">
          <div className="text-center text-white space-y-2">
            <h3 className="text-xl font-bold">🎉 Teste grátis por 7 dias</h3>
            <p className="text-indigo-100 text-sm max-w-md mx-auto">
              Escolha qualquer plano acima e comece com 7 dias grátis. Sem compromisso — cancele quando quiser.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
