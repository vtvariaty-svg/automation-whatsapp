import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Variaty — Operação Comercial e Atendimento no Piloto Automático",
  description: "Centralize WhatsApp, Instagram e Facebook. Automatize vendas, agendamentos e suporte com IA profissional. Atenda 24/7 sem perder o controle humano.",
  openGraph: {
    title: "Variaty — Atendimento Inteligente para B2B",
    description: "Escale suas vendas no WhatsApp e Instagram usando IA treinada com as regras do seu negócio.",
    url: "https://automation-whatsapp.onrender.com",
    siteName: "Variaty",
    type: "website",
  },
};

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.webp" alt="Variaty" className="h-20 w-auto" />
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
          <a href="#problema" className="hover:text-blue-600 transition-colors">A Solução</a>
          <a href="#recursos" className="hover:text-blue-600 transition-colors">Plataforma</a>
          <a href="#planos" className="hover:text-blue-600 transition-colors">Planos e Preços</a>
          <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">Entrar</Link>
          <Link href="/register" className="text-sm font-bold bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 border border-gray-700">
            Automatizar meu Negócio
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gray-50">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-gray-50 to-white"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50/80 border border-blue-200/60 rounded-full px-4 py-1.5 mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span className="text-xs sm:text-sm font-bold text-blue-700 uppercase tracking-wide">
              Infraestrutura Oficial Meta & OpenAI
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
            Sua Operação Comercial e <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Atendimento no Piloto Automático</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10 max-w-3xl mx-auto font-medium">
            Centralize <strong className="text-gray-900">WhatsApp, Instagram e Facebook</strong>. Automatize vendas, agendamentos e suporte com IA para responder 24/7 sem perder a personalidade do seu negócio.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <Link href="/register" className="w-full sm:w-auto text-base font-bold bg-blue-600 text-white px-8 py-4 rounded-xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/30 transition-all hover:-translate-y-1">
              Testar Plataforma Grátis
            </Link>
            <a href="#como-funciona" className="w-full sm:w-auto text-base font-bold text-gray-700 bg-white border border-gray-200 px-8 py-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
              Ver como funciona
            </a>
          </div>
          <p className="text-xs text-gray-500 font-medium">Setup em 5 minutos • Não exige cartão de crédito no cadastro</p>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-20 relative max-w-5xl mx-auto">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur-2xl"></div>
          <div className="relative bg-[#0f172a] rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
            <div className="flex items-center gap-2 px-4 py-3 bg-[#1e293b] border-b border-gray-800">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <span className="mx-auto text-xs text-slate-400 font-mono">painel.variaty.com.br</span>
            </div>
            <Image src="/hero-dashboard.png" alt="Painel Variaty SaaS" width={1200} height={675} className="w-full opacity-90 hover:opacity-100 transition-opacity" priority />
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoStrip() {
  return (
    <section className="py-10 border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Integrações robustas para escala</p>
        <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2 text-gray-700">
            <svg className="w-8 h-8 fill-[#25D366]" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z"/></svg>
            <span className="font-bold text-lg">WhatsApp API</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <svg className="w-8 h-8 fill-[#E4405F]" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            <span className="font-bold text-lg">Instagram</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <svg className="w-8 h-8 fill-[#1877F2]" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span className="font-bold text-lg">Facebook</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <span className="font-extrabold text-[#635BFF] text-2xl tracking-tighter">stripe</span>
            <span className="font-bold text-lg">Pagamentos</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-2xl">🧠</span>
            <span className="font-bold text-lg">OpenAI</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section id="problema" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-50 px-3 py-1 rounded-full mb-4">O cenário atual</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
              Você está perdendo vendas por demora no atendimento.
            </h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Enquanto o seu time tenta se organizar num WhatsApp lotado de mensagens, os leads esfriam e os clientes compram do concorrente. A falta de processos afeta diretamente o faturamento.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                "Equipe sobrecarregada com dúvidas repetitivas.",
                "Agendamentos confusos em planilhas ou papel.",
                "Falta de integração entre Instagram e WhatsApp.",
                "Leads perdidos fora do horário comercial."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700 font-medium">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">✕</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600 rounded-3xl blur-2xl opacity-10 translate-y-4 translate-x-4"></div>
            <div className="relative bg-gray-50 border border-gray-200 rounded-3xl p-8 lg:p-12 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">A solução Variaty</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Transformamos o caos operacional em uma <strong className="text-gray-900">linha de montagem de vendas e agendamentos</strong>. Uma IA treinada especificamente para o seu negócio que atende, vende e agenda as 24h do dia.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-xl font-bold">✓</div>
                  <div>
                    <h4 className="font-bold text-gray-900">Organização Total</h4>
                    <p className="text-sm text-gray-500">Múltiplos canais, uma única tela.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xl font-bold">✓</div>
                  <div>
                    <h4 className="font-bold text-gray-900">Escala Imediata</h4>
                    <p className="text-sm text-gray-500">Atenda 100 ou 10.000 clientes com a mesma qualidade.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: "💬",
      title: "Omnichannel Integrado",
      description: "Conecte a API Oficial do WhatsApp, Instagram (Comentários e Directs) e Facebook Messenger. Responda tudo em um só lugar.",
    },
    {
      icon: "📅",
      title: "Agendamentos Inteligentes",
      description: "O cliente pede um horário e a IA consulta os disponíveis, bloqueia a agenda e envia confirmação e lembretes prévios sem intervenção humana.",
    },
    {
      icon: "🛒",
      title: "Catálogo e Vendas Flow",
      description: "Cadastre produtos, defina estoques e preços. A Inteligência Artificial tira dúvidas, oferece os produtos certos e gera pedidos integrados com Stripe.",
    },
    {
      icon: "🧠",
      title: "IA Dominada por Você",
      description: "Não é apenas GPT solto. Configure contexto, comportamento, tom de voz, e FAQs estritos. A IA respeita as regras do seu negócio e não inventa dados.",
    },
    {
      icon: "📊",
      title: "CRM e Painel Gestor",
      description: "Acompanhe métricas, intervenha em conversas quando necessário (Handoff humano) e gerencie o pipeline de vendas ou funil de agendamentos.",
    },
    {
      icon: "⚙️",
      title: "Automações e Gatilhos",
      description: "Crie regras de palavras-chave, configure mensagens de ausência, templates de aprovação oficial do WhatsApp e dispare campanhas em massa.",
    },
  ];

  return (
    <section id="recursos" className="py-24 bg-gray-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-100 px-3 py-1 rounded-full mb-4">Plataforma Completa</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">Tudo consolidado em um único SaaS</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Deixe de assinar 3 ferramentas diferentes. A Variaty integra CRM, Automação IA, Gateway de Agendamento e Caixa de Entrada.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl mb-6 bg-gray-50 w-16 h-16 rounded-xl flex items-center justify-center border border-gray-100">{feature.icon}</div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed font-medium">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { number: "1", title: "Conecte seus Canais", description: "Faça login com a Meta e integre WhatsApp Oficial e Instagram em 2 cliques." },
    { number: "2", title: "Treine a Plataforma", description: "Escreva as regras da empresa, adicione FAQ e configure seus serviços/produtos." },
    { number: "3", title: "Ative a IA", description: "A IA assume a primeira linha de atendimento e começa a qualificar e transacionar clientes." },
    { number: "4", title: "Feche Mais Negócios", description: "O time foca só nas exceções enquanto o painel enche de vendas e agendamentos concluídos." },
  ];

  return (
    <section id="como-funciona" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">Embarque simples e guiado</h2>
          <p className="text-lg text-gray-600">Nada de implantações que demoram meses. O sistema é self-service para PMEs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative group p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white text-xl font-bold flex items-center justify-center mb-6 shadow-md shadow-blue-500/30">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 font-medium">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
      name: "Free",
      price: null,
      description: "Para conhecer a mecânica",
      trial: false,
      features: [
        "Instagram DM Automatizado",
        "Até 1.000 contatos no CRM",
        "500 mensagens de IA / mês",
        "Até 5 automações estáticas",
        "Suporte Comunitário",
      ],
      missing: ["API Oficial WhatsApp", "Módulo de Agendamentos", "Pagamentos Stripe"],
      buttonText: "Começar Grátis",
      buttonStyle: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50",
    },
    {
      name: "Standard",
      price: "49,90",
      description: "Negócios locais buscando organização",
      trial: true,
      features: [
        "WhatsApp Business + Instagram",
        "Até 5.000 contatos",
        "3.000 mensagens inteligêntes / mês",
        "Módulo Básico de Agendamentos",
        "Catálogo de Produtos e Pedidos",
        "Gestão de Caixa de Entrada",
      ],
      missing: ["Segmentação Avançada", "Múltiplos Atendentes (Lim. 3)"],
      buttonText: "Testar por 7 dias grátis",
      buttonStyle: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25",
      popular: true,
    },
    {
      name: "Pro",
      price: "97,00",
      description: "Operações em pleno crescimento",
      trial: false,
      features: [
        "WhatsApp + Face + Instagram",
        "Até 20.000 contatos",
        "10.000 mensagens de IA / mês",
        "Agendamento Profissional e Lembretes",
        "Stripe Integrado (Pagamentos no Chat)",
        "Atendentes Ilimitados",
        "Automações Avançadas e Handoff",
      ],
      missing: ["Painel de Agência (White-label)"],
      buttonText: "Assinar Plano Pro",
      buttonStyle: "bg-gray-900 text-white hover:bg-gray-800",
    },
    {
      name: "Business",
      price: "197,00",
      description: "Escala máxima e controle white-label",
      trial: false,
      features: [
        "Tudo do Plano Pro",
        "Contatos e mensagens ilimitados",
        "White-label (Sua marca no sistema)",
        "Painel de Agência ou Franquias",
        "Consultor de Sucesso Dedicado",
        "Suporte técnico prioritário via SLA",
      ],
      missing: [],
      buttonText: "Falar com Vendas",
      buttonStyle: "bg-gray-900 text-white hover:bg-gray-800",
    },
  ];

  return (
    <section id="planos" className="py-24 bg-gray-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-100 px-3 py-1 rounded-full mb-4">Investimento</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">Custa menos que um café por dia</h2>
          <p className="text-lg text-gray-600">Economize o custo de novas contratações operacionais. A automação se paga nos primeiros dias.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {plans.map((plan, i) => (
            <div key={i} className={`bg-white rounded-3xl p-8 flex flex-col relative transition-all duration-300 ${plan.popular ? 'border-2 border-blue-600 shadow-xl shadow-blue-900/10 scale-105 z-10' : 'border border-gray-200'}`}>
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full">
                  Mais Escolhido
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-sm text-gray-500 h-10 mb-6">{plan.description}</p>
              
              <div className="mb-8">
                {plan.price === null ? (
                  <span className="text-5xl font-extrabold text-gray-900">Grátis</span>
                ) : (
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-gray-400">R$</span>
                    <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 font-medium ml-1">/mês</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span className="text-gray-700 font-medium text-sm leading-tight">{feature}</span>
                    </li>
                  ))}
                  {plan.missing.map((feature, j) => (
                    <li key={`m-${j}`} className="flex items-start gap-3 opacity-50">
                      <svg className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                      <span className="text-gray-500 font-medium text-sm leading-tight line-through">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/register" className={`w-full text-center py-4 rounded-xl font-bold transition-all ${plan.buttonStyle}`}>
                {plan.buttonText}
              </Link>
              {plan.trial && (
                <p className="text-center text-xs font-semibold text-green-600 mt-4">Nenhum cartão exigido no teste</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    { q: "Qual o diferencial para um 'chatbot genérico'?", a: "Nós utilizamos IA real (Modelos robustos como GPT). Você não precisará montar árvores de decisão infinitas. A IA da Variaty lê o contexto da loja, os produtos, e entende a intenção natural do cliente para responder da melhor forma." },
    { q: "Preciso de um número de WhatsApp Business específico?", a: "A Variaty opera 100% conectada à API Oficial da Meta. Você usará seu número atual ou um novo para vincular ao WhatsApp Business API com total estabilidade e segurança antifraude/banimento." },
    { q: "O sistema entende a agenda dos meus funcionários?", a: "Sim. O Módulo de Agendamentos permite vincular profissionais aos serviços. A IA apenas apresenta e bloqueia horários onde não existem conflitos ou bloqueios predefinidos na agenda da empresa." },
    { q: "Como o cliente paga no meio do WhatsApp?", a: "Através da integração nativa, a IA pode gerar Links de Pagamento via Stripe (Pix, Cartão, Boleto) e reconhece quando o pedido for pago, atualizando os relatórios automaticamente." },
    { q: "Tenho suporte para configurar a plataforma?", a: "Temos uma biblioteca de guias para o self-setup e uma equipe ativa. Para clientes Business, oferecemos gerente de onboarding e mapeamento de jornada de cliente sob medida." },
  ];

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">Perguntas Frequentes</h2>
          <p className="text-lg text-gray-600">Tudo o que sua empresa precisa saber antes de dar o próximo passo.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-lg text-gray-900 hover:text-blue-600 transition-colors">
                {faq.q}
                <span className="text-gray-400 group-open:rotate-45 transition-transform text-2xl flex-shrink-0 ml-4">+</span>
              </summary>
              <div className="px-6 pb-6 text-gray-600 leading-relaxed font-medium -mt-2">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 bg-[#080d19] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
      
      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
          Assuma hoje o controle<br/> das suas vendas.
        </h2>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-medium">
          Dobre a velocidade de atendimento e feche mais negócios com PMEs de todo o Brasil rodando na estabilidade da nossa plataforma.
        </p>
        <Link href="/register" className="inline-flex items-center justify-center gap-2 text-lg font-bold bg-blue-600 text-white px-10 py-5 rounded-xl hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1 sm:w-auto w-full">
           Testar Sistema Agora
           <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </Link>
        <p className="mt-6 text-sm text-slate-400 font-medium">Cadastro em menos de 1 minuto. Sem amarras.</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#050810] text-slate-400 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <img src="/logo.webp" alt="Variaty" className="h-16 w-auto grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all" />
            </Link>
            <p className="text-slate-500 leading-relaxed max-w-sm text-sm font-medium">
              Automação B2B de alta performance conectada diretamente à API Oficial do WhatsApp. Feito para operações que não podem parar.
            </p>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold mb-6 tracking-wide">Produto</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><a href="#problema" className="hover:text-blue-500 transition-colors">Visão Geral</a></li>
              <li><a href="#recursos" className="hover:text-blue-500 transition-colors">Funcionalidades</a></li>
              <li><a href="#planos" className="hover:text-blue-500 transition-colors">Preços e Assinatura</a></li>
              <li><Link href="/login" className="hover:text-blue-500 transition-colors">Acessar Painel</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold mb-6 tracking-wide">Empresa & Legal</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><a href="mailto:vtvariaty@gmail.com" className="hover:text-blue-500 transition-colors">Falar com Consultor</a></li>
              <li><Link href="/privacy" className="hover:text-blue-500 transition-colors">Política de Privacidade</Link></li>
              <li><Link href="/terms" className="hover:text-blue-500 transition-colors">Termos de Serviço</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Variaty. Todos os direitos reservados.</p>
            <p className="text-xs text-slate-600 font-medium">Contamei Tecnologia e Sistemas Digitais LTDA - CNPJ 64.790.325/0001-06</p>
          </div>
          <p className="text-xs text-slate-600 font-medium tracking-wide">
            Powered by VTvariaty &bull; Official Business Provider Partner
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="bg-white min-h-screen selection:bg-blue-200 selection:text-blue-900 font-sans">
      <Navbar />
      <HeroSection />
      <LogoStrip />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
