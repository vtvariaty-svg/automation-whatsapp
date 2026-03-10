import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Variaty Secretary IA — Automatize seu Atendimento com Inteligência Artificial",
  description: "A secretária de IA que atende seus clientes no WhatsApp 24/7. Agendamentos, vendas e suporte automático com inteligência artificial. Teste grátis por 7 dias.",
  openGraph: {
    title: "Variaty Secretary IA — Secretária de IA para WhatsApp",
    description: "Automatize atendimento, vendas e agendamentos no WhatsApp com IA. 24/7, sem pausas.",
    url: "https://automation-whatsapp.onrender.com",
    siteName: "Variaty Secretary IA",
    type: "website",
  },
};

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center shadow-md shadow-indigo-200">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">Variaty<span className="text-[#4f46e5]"> Secretary</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#recursos" className="hover:text-[#4f46e5] transition-colors">Recursos</a>
          <a href="#como-funciona" className="hover:text-[#4f46e5] transition-colors">Como funciona</a>
          <a href="#planos" className="hover:text-[#4f46e5] transition-colors">Planos</a>
          <a href="#faq" className="hover:text-[#4f46e5] transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-[#4f46e5] transition-colors px-3 py-2">Entrar</Link>
          <Link href="/register" className="text-sm font-semibold bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white px-5 py-2.5 rounded-lg hover:shadow-lg hover:shadow-indigo-200 transition-all hover:-translate-y-0.5">
            Começar Grátis
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 via-white to-white"></div>
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#4f46e5] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse"></div>
      <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-[#7c3aed] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse" style={{ animationDelay: "1s" }}></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]"></span>
            </span>
            <span className="text-sm font-medium text-indigo-700">Conectado à API Oficial do WhatsApp</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
            Sua Secretária de
            <span className="bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#a855f7] bg-clip-text text-transparent"> Inteligência Artificial</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
            Atenda clientes no WhatsApp <strong className="text-gray-700">24 horas por dia</strong>. Agende, venda e resolva dúvidas automaticamente com IA.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link href="/register" className="w-full sm:w-auto text-lg font-semibold bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white px-8 py-4 rounded-xl hover:shadow-xl hover:shadow-indigo-200/50 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
              <span>🚀</span> Teste Grátis por 7 Dias
            </Link>
            <a href="#como-funciona" className="w-full sm:w-auto text-lg font-medium text-gray-700 px-8 py-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
              <span>▶️</span> Ver como funciona
            </a>
          </div>

          <p className="text-sm text-gray-400">Sem cartão de crédito • Configuração em 5 minutos</p>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-16 relative max-w-5xl mx-auto">
          <div className="absolute -inset-4 bg-gradient-to-r from-[#4f46e5]/20 to-[#7c3aed]/20 rounded-3xl blur-2xl"></div>
          <div className="relative bg-gray-900 rounded-2xl shadow-2xl shadow-gray-900/20 overflow-hidden border border-gray-700">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <span className="ml-4 text-xs text-gray-400 font-mono">variaty-secretary.app</span>
            </div>
            <Image src="/hero-dashboard.png" alt="Dashboard Variaty Secretary IA" width={1200} height={675} className="w-full" priority />
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoStrip() {
  return (
    <section className="py-12 border-y border-gray-100 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Integrações oficiais</p>
        <div className="flex items-center justify-center gap-12 flex-wrap opacity-60">
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-7 h-7 fill-[#25D366]" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z"/></svg>
            <span className="font-semibold text-lg">WhatsApp</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-7 h-7 fill-[#1877F2]" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span className="font-semibold text-lg">Facebook</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-2xl">🤖</span>
            <span className="font-semibold text-lg">OpenAI</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-2xl">🛍️</span>
            <span className="font-semibold text-lg">Nuvemshop</span>
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
      title: "Atendimento Automático 24/7",
      description: "IA que responde perguntas, resolve dúvidas e conduz vendas no WhatsApp de forma natural, a qualquer hora do dia ou da noite.",
      gradient: "from-emerald-500/10 to-teal-500/10",
      border: "border-emerald-200/50",
    },
    {
      icon: "📅",
      title: "Agendamentos Inteligentes",
      description: "Seus clientes agendam horários diretamente pelo WhatsApp. A IA verifica disponibilidade e confirma automaticamente.",
      gradient: "from-blue-500/10 to-cyan-500/10",
      border: "border-blue-200/50",
    },
    {
      icon: "🛒",
      title: "Vendas e Pedidos",
      description: "Catálogo de produtos integrado. A IA apresenta itens, responde sobre preços e processa pedidos no mesmo chat.",
      gradient: "from-violet-500/10 to-purple-500/10",
      border: "border-violet-200/50",
    },
    {
      icon: "🧠",
      title: "IA Personalizável",
      description: "Configure o tom de voz, regras de negócio e FAQs. A IA aprende sobre sua empresa e atende como se fosse parte da equipe.",
      gradient: "from-amber-500/10 to-orange-500/10",
      border: "border-amber-200/50",
    },
    {
      icon: "📊",
      title: "Painel Analítico",
      description: "Dashboard completo com métricas de atendimento, conversão, satisfação e volume de mensagens em tempo real.",
      gradient: "from-rose-500/10 to-pink-500/10",
      border: "border-rose-200/50",
    },
    {
      icon: "🔗",
      title: "Integrações Nativas",
      description: "Conecte com Nuvemshop, sistemas de pagamento e outras plataformas. API oficial do WhatsApp para máxima confiabilidade.",
      gradient: "from-indigo-500/10 to-blue-500/10",
      border: "border-indigo-200/50",
    },
  ];

  return (
    <section id="recursos" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center bg-indigo-50 text-[#4f46e5] text-sm font-semibold px-4 py-1 rounded-full mb-4">Recursos</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Tudo que sua empresa precisa</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">Uma plataforma completa para transformar seu WhatsApp numa máquina de vendas e atendimento.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className={`group relative bg-gradient-to-br ${feature.gradient} border ${feature.border} rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { number: "01", title: "Crie sua conta", description: "Cadastre-se em segundos com email ou Facebook. Ganhe 7 dias grátis." },
    { number: "02", title: "Conecte seu WhatsApp", description: "Vincule sua conta WhatsApp Business com um clique via Facebook." },
    { number: "03", title: "Configure a IA", description: "Defina o tom de voz, regras e produtos. A IA aprende em minutos." },
    { number: "04", title: "Comece a atender", description: "A IA responde seus clientes automaticamente. Você só acompanha." },
  ];

  return (
    <section id="como-funciona" className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center bg-indigo-50 text-[#4f46e5] text-sm font-semibold px-4 py-1 rounded-full mb-4">Como funciona</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Simples como deve ser</h2>
          <p className="text-xl text-gray-500">Comece a automatizar em menos de 5 minutos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center group">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-indigo-200 to-transparent"></div>
              )}
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] text-white text-2xl font-bold mb-6 shadow-lg shadow-indigo-200/50 group-hover:scale-110 transition-transform">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-500">{step.description}</p>
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
      name: "Starter",
      price: "97",
      description: "Ideal para profissionais autônomos",
      features: ["1 número WhatsApp", "500 mensagens/mês", "IA com GPT-4o", "Agendamentos", "Suporte por email"],
      popular: false,
      cta: "Começar Grátis",
    },
    {
      name: "Professional",
      price: "197",
      description: "Para pequenas empresas em crescimento",
      features: ["2 números WhatsApp", "2.000 mensagens/mês", "IA com GPT-4o", "Agendamentos + Vendas", "Integração Nuvemshop", "Painel analítico", "Suporte prioritário"],
      popular: true,
      cta: "Começar Grátis",
    },
    {
      name: "Enterprise",
      price: "497",
      description: "Para operações de alto volume",
      features: ["5 números WhatsApp", "10.000 mensagens/mês", "IA com GPT-4o", "Todas as integrações", "API personalizada", "Múltiplos usuários", "Gerente de sucesso dedicado"],
      popular: false,
      cta: "Falar com Vendas",
    },
  ];

  return (
    <section id="planos" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center bg-indigo-50 text-[#4f46e5] text-sm font-semibold px-4 py-1 rounded-full mb-4">Planos</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Invista menos que um funcionário</h2>
          <p className="text-xl text-gray-500">Todos os planos incluem 7 dias grátis. Cancele quando quiser.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div key={i} className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 ${
              plan.popular
                ? "bg-gradient-to-b from-[#4f46e5] to-[#3730a3] text-white shadow-2xl shadow-indigo-300/30 scale-105 border-0"
                : "bg-white border border-gray-200 hover:shadow-xl"
            }`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-400 text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                  MAIS POPULAR
                </div>
              )}
              <h3 className={`text-xl font-bold mb-1 ${plan.popular ? "text-white" : "text-gray-900"}`}>{plan.name}</h3>
              <p className={`text-sm mb-6 ${plan.popular ? "text-indigo-200" : "text-gray-500"}`}>{plan.description}</p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className={`text-sm ${plan.popular ? "text-indigo-200" : "text-gray-400"}`}>R$</span>
                <span className={`text-5xl font-extrabold ${plan.popular ? "text-white" : "text-gray-900"}`}>{plan.price}</span>
                <span className={`text-sm ${plan.popular ? "text-indigo-200" : "text-gray-400"}`}>/mês</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <span className={`mt-0.5 ${plan.popular ? "text-emerald-300" : "text-emerald-500"}`}>✓</span>
                    <span className={plan.popular ? "text-indigo-100" : "text-gray-600"}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/register" className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${
                plan.popular
                  ? "bg-white text-[#4f46e5] hover:bg-gray-100 shadow-lg"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    { name: "Carolina M.", role: "Clínica de Estética", text: "Reduzi 70% do tempo gasto com agendamentos. A IA responde de forma natural e os clientes adoram.", avatar: "CM" },
    { name: "Ricardo S.", role: "E-commerce de Moda", text: "Minhas vendas pelo WhatsApp triplicaram depois que a IA começou a atender automaticamente. Impressionante.", avatar: "RS" },
    { name: "Fernanda L.", role: "Escritório de Advocacia", text: "A integração foi simples e o suporte é excelente. Meus clientes são atendidos instantaneamente agora.", avatar: "FL" },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center bg-indigo-50 text-[#4f46e5] text-sm font-semibold px-4 py-1 rounded-full mb-4">Depoimentos</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Quem já usa, aprova</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, j) => <span key={j}>★</span>)}
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    { q: "Preciso ter WhatsApp Business?", a: "Sim, usamos a API Oficial do WhatsApp Business da Meta. Você precisa de uma conta WhatsApp Business vinculada. Ajudamos no processo de configuração." },
    { q: "A IA responde de forma natural?", a: "Sim! Utilizamos GPT-4o da OpenAI, que gera respostas naturais e contextualizadas. Você configura o tom de voz e regras de negócio." },
    { q: "Posso testar antes de assinar?", a: "Todos os planos incluem 7 dias grátis. Sem cartão de crédito. Se não gostar, basta não continuar." },
    { q: "E se eu precisar de ajuda na configuração?", a: "Nosso suporte te acompanha em todo o processo. No plano Enterprise, você tem um gerente de sucesso dedicado." },
    { q: "Funciona com qualquer tipo de negócio?", a: "Sim! Clínicas, e-commerces, escritórios, restaurantes, salões de beleza — qualquer negócio que atende clientes pelo WhatsApp." },
    { q: "Os dados dos meus clientes são seguros?", a: "Absolutamente. Usamos criptografia, servidores seguros e seguimos as diretrizes da LGPD. Seus dados nunca são compartilhados." },
  ];

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center bg-indigo-50 text-[#4f46e5] text-sm font-semibold px-4 py-1 rounded-full mb-4">FAQ</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Perguntas Frequentes</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-gray-900 hover:text-[#4f46e5] transition-colors list-none">
                {faq.q}
                <span className="text-gray-400 group-open:rotate-45 transition-transform text-2xl ml-4">+</span>
              </summary>
              <div className="px-6 pb-6 text-gray-600 leading-relaxed -mt-2">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-[#4f46e5] via-[#5b4cdb] to-[#7c3aed] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
          Pronto para transformar seu atendimento?
        </h2>
        <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
          Junte-se a centenas de empresas que já automatizaram seu WhatsApp com inteligência artificial.
        </p>
        <Link href="/register" className="inline-flex items-center gap-2 text-lg font-bold bg-white text-[#4f46e5] px-10 py-4 rounded-xl hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1">
          🚀 Começar Agora — É Grátis
        </Link>
        <p className="mt-4 text-sm text-indigo-300">7 dias grátis • Sem compromisso • Cancele quando quiser</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="font-bold text-lg text-white">Variaty Secretary IA</span>
            </div>
            <p className="text-gray-500 leading-relaxed max-w-md">
              Plataforma de automação de atendimento via WhatsApp com Inteligência Artificial. Conectado à API Oficial da Meta.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#recursos" className="hover:text-white transition-colors">Recursos</a></li>
              <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Política de Privacidade</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Termos de Serviço</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} Variaty Secretary IA. Todos os direitos reservados.</p>
          <p className="text-xs text-gray-700">Powered by VTvariaty • API Oficial Meta WhatsApp Business</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="bg-white">
      <Navbar />
      <HeroSection />
      <LogoStrip />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
