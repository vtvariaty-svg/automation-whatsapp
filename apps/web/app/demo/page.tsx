import type { Metadata } from 'next'
import MetaPixel from '@/components/marketing/MetaPixel'
import { Navbar } from '@/components/marketing/landing/Navbar'
import { Footer } from '@/components/marketing/landing/Footer'
import Link from 'next/link'

// ─── Niche context config ─────────────────────────────────────────────────────

type NicheKey = 'clinicas' | 'beleza'

const PHONE = '5519995993220'

const nicheConfig: Record<
  NicheKey,
  {
    headline: string
    support: string
    waMessage: string
    backHref: string
    backLabel: string
    tag: string
  }
> = {
  clinicas: {
    headline: 'Veja como a Variaty organiza o WhatsApp da sua clínica',
    support:
      'Demonstração focada em clínicas e consultórios — confirmação de consultas, redução de faltas e organização do fluxo de atendimento no WhatsApp, sem sobrecarregar a recepção.',
    waMessage:
      'Olá, quero ver uma demonstração da Variaty para clínica ou consultório.',
    backHref: '/whatsapp/clinicas-consultorios',
    backLabel: '← Voltar para Clínicas e Consultórios',
    tag: 'Clínicas e Consultórios',
  },
  beleza: {
    headline: 'Veja como a Variaty organiza o WhatsApp do seu negócio de beleza',
    support:
      'Demonstração focada em salão, barbearia e estética — mais velocidade no atendimento, agenda mais cheia e clientes que voltam com mais consistência.',
    waMessage:
      'Olá, quero ver uma demonstração da Variaty para salão, barbearia ou estética.',
    backHref: '/whatsapp/servicos-de-beleza',
    backLabel: '← Voltar para Serviços de Beleza',
    tag: 'Serviços de Beleza',
  },
}

const defaultConfig = {
  headline: 'Experimente a Variaty na prática',
  support:
    'Você pode testar nossa IA agora mesmo no WhatsApp ou criar sua conta gratuitamente para configurar a sua própria assistente virtual.',
  waMessage: 'Olá, quero testar a IA da Variaty.',
  backHref: null,
  backLabel: null,
  tag: null,
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(props: {
  searchParams: Promise<{ niche?: string; lp?: string }>
}): Promise<Metadata> {
  const searchParams = await props.searchParams
  const niche = searchParams.niche as NicheKey | undefined

  if (niche === 'clinicas') {
    return {
      title: 'Demonstração para Clínicas e Consultórios | Variaty',
      description:
        'Veja como a Variaty automatiza confirmações, lembretes e atendimento no WhatsApp para clínicas e consultórios. Agende sua demonstração.',
    }
  }
  if (niche === 'beleza') {
    return {
      title: 'Demonstração para Salão, Barbearia e Estética | Variaty',
      description:
        'Veja como a Variaty organiza o WhatsApp do seu negócio de beleza para atender mais rápido, trazer clientes de volta e manter a agenda em movimento.',
    }
  }
  return {
    title: 'Ver Demonstração | Variaty',
    description:
      'Teste nossa IA na prática no WhatsApp ou crie uma conta gratuita em minutos.',
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DemoPage(props: {
  searchParams: Promise<{ niche?: string; lp?: string }>
}) {
  const searchParams = await props.searchParams
  const nicheParam = searchParams.niche as NicheKey | undefined

  const cfg =
    nicheParam && nicheConfig[nicheParam]
      ? nicheConfig[nicheParam]
      : defaultConfig

  const waHref = `https://wa.me/${PHONE}?text=${encodeURIComponent(cfg.waMessage)}`

  return (
    <main className="bg-white min-h-screen flex flex-col selection:bg-blue-200 selection:text-blue-900 font-sans">
      <MetaPixel />
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center pt-32 pb-24 px-4 text-center">

        {/* Niche tag — only shown when a niche is detected */}
        {cfg.tag && (
          <span className="inline-block bg-blue-50 text-blue-700 text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-md ring-1 ring-blue-100 mb-6">
            {cfg.tag}
          </span>
        )}

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight leading-tight max-w-2xl mx-auto">
          {cfg.headline}
        </h1>

        <p className="text-base md:text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed font-medium">
          {cfg.support}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-none sm:w-auto">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 bg-[#25D366] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#20b858] transition-all shadow-lg shadow-[#25D366]/25 w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
            data-track="demo_wa_cta"
          >
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" />
            </svg>
            Falar com a IA (Demo)
          </a>
          <Link
            href="/register"
            className="flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            data-track="demo_register_cta"
          >
            Teste grátis
          </Link>
        </div>

        {/* Back link — only shown when niche context is present */}
        {cfg.backHref && cfg.backLabel && (
          <Link
            href={cfg.backHref}
            className="mt-10 text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium"
          >
            {cfg.backLabel}
          </Link>
        )}

      </div>

      <Footer />
    </main>
  )
}
