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
  ],
  openGraph: {
    title: 'WhatsApp para Clínicas e Consultórios | Variaty',
    description:
      'Organize confirmações, lembretes e atendimento no WhatsApp para reduzir faltas e profissionalizar o contato com pacientes.',
    url: 'https://variaty.com.br/whatsapp/clinicas-consultorios',
    siteName: 'Variaty',
    locale: 'pt_BR',
    type: 'website',
  },
  alternates: {
    canonical: '/whatsapp/clinicas-consultorios',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ClinicasConsultoriosPage() {
  return <NicheLandingShell content={clinicasContent} />
}
