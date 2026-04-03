import type { Metadata } from 'next'
import { NicheLandingShell } from '@/components/marketing/niche-landing/NicheLandingShell'
import { belezaContent } from '@/components/marketing/niche-landing/content/beleza'

export const metadata: Metadata = {
  title:
    'WhatsApp para Salão, Barbearia e Estética | Agenda Cheia e Mais Retorno | Variaty',
  description:
    'Automatize respostas, confirmações e reengajamento no WhatsApp do seu negócio de beleza. Atenda mais rápido, traga clientes de volta e mantenha a agenda em movimento.',
  keywords: [
    'whatsapp para salão de beleza',
    'automação whatsapp barbearia',
    'agenda cheia salão',
    'trazer clientes de volta',
    'automação whatsapp estética',
    'manicure whatsapp automatizado',
  ],
  openGraph: {
    title: 'WhatsApp para Salão, Barbearia e Estética | Variaty',
    description:
      'Atenda mais rápido, reduza tempo no celular e mantenha sua agenda em movimento com automação prática para negócios de beleza.',
    url: 'https://variaty.com.br/whatsapp/servicos-de-beleza',
    siteName: 'Variaty',
    locale: 'pt_BR',
    type: 'website',
  },
  alternates: {
    canonical: '/whatsapp/servicos-de-beleza',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ServicosDeBelezaPage() {
  return <NicheLandingShell content={belezaContent} />
}
