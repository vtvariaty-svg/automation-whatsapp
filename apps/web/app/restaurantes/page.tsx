import type { Metadata } from 'next'
import { NicheLandingShell } from '@/components/marketing/niche-landing/NicheLandingShell'
import { restaurantesContent } from '@/components/marketing/niche-landing/content/restaurantes'

export const metadata: Metadata = {
  title:
    'WhatsApp para Restaurantes e Delivery | Pedidos Organizados | Variaty',
  description:
    'Organize a entrada de pedidos, responda perguntas sobre o cardápio e reduza o caos no atendimento pelo WhatsApp. Para restaurantes, delivery e marmitaria.',
  keywords: [
    'whatsapp para restaurante',
    'automação whatsapp delivery',
    'pedidos pelo whatsapp',
    'whatsapp marmitaria',
    'cardápio whatsapp automático',
    'organizar pedidos whatsapp',
    'atendimento delivery whatsapp',
  ],
  openGraph: {
    title: 'WhatsApp para Restaurantes e Delivery | Variaty',
    description:
      'Pedidos organizados, cardápio automático e menos caos no horário de pico — tudo pelo WhatsApp que você já usa.',
    url: 'https://variaty.com.br/restaurantes',
    siteName: 'Variaty',
    locale: 'pt_BR',
    type: 'website',
  },
  alternates: {
    canonical: '/restaurantes',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RestaurantesPage() {
  return <NicheLandingShell content={restaurantesContent} />
}
