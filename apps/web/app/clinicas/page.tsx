import type { Metadata } from 'next'
import { NicheLandingShell } from '@/components/marketing/niche-landing/NicheLandingShell'
import { clinicasContent } from '@/components/marketing/niche-landing/content/clinicas'

export const metadata: Metadata = {
  title:
    'WhatsApp para Clínicas e Consultórios | Menos Faltas, Mais Organização | Variaty',
  description:
    'Automatize confirmações, lembretes e atendimento inicial no WhatsApp da sua clínica. Reduza faltas, organize a recepção e melhore a experiência do paciente sem sobrecarregar sua equipe.',
  keywords: [
    'whatsapp para clinicas',
    'automação whatsapp consultório',
    'reduzir faltas clinica',
    'confirmação automática consulta',
    'atendimento whatsapp saúde',
    'whatsapp odontologia',
    'automação consultório odontológico',
  ],
  openGraph: {
    title: 'WhatsApp para Clínicas e Consultórios | Variaty',
    description:
      'Organize confirmações, lembretes e atendimento no WhatsApp para reduzir faltas e profissionalizar o contato com pacientes.',
    url: 'https://variaty.com.br/clinicas',
    siteName: 'Variaty',
    locale: 'pt_BR',
    type: 'website',
  },
  alternates: {
    canonical: '/clinicas',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const clinicasLpContent = {
  ...clinicasContent,
  crossNiche: {
    text: 'Seu negócio é restaurante ou delivery? Veja a versão feita para atendimento de pedidos.',
    href: '/restaurantes',
    ctaLabel: 'Ver para restaurantes e delivery →',
    targetNiche: 'restaurantes',
  },
}

export default function ClinicasPage() {
  return <NicheLandingShell content={clinicasLpContent} />
}
