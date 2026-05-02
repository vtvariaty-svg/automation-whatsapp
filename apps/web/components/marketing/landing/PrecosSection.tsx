import Link from "next/link";

const WA_TEAM = "https://wa.me/5519995993220?text=Ol%C3%A1%2C%20quero%20entender%20os%20planos%20da%20Variaty.";

const CONSULTORIO_FEATURES = [
  "Atendimento via WhatsApp",
  "IA administrativa",
  "Estrutura para página própria de divulgação/agendamento",
  "Preparado para lista de serviços e procedimentos",
  "Solicitação de agendamento pelo WhatsApp",
  "Base para registro de interessados no painel",
  "Lembretes e follow-up automáticos",
  "Encaminhamento para atendimento humano",
  "7 dias de teste grátis",
];

const RESTAURANTE_FEATURES = [
  "Atendimento via WhatsApp",
  "Estrutura para página própria do restaurante",
  "Preparado para catálogo/cardápio online",
  "Preparado para categorias e produtos",
  "Base para organizar pedidos pelo WhatsApp",
  "Preparado para entrega ou retirada",
  "IA de atendimento no horário de pico",
  "Respostas automáticas sobre cardápio e preços",
  "7 dias de teste grátis",
];

const FAQS = [
  {
    q: "Preciso de cartão para o teste?",
    a: "Sim. O trial de 7 dias é processado pelo Stripe, que requer cartão para ativar a assinatura. Não há cobrança durante os 7 dias. Você pode cancelar antes do fim do teste.",
  },
  {
    q: "O que acontece após os 7 dias?",
    a: "A assinatura é ativada automaticamente no valor do plano escolhido. Você pode cancelar antes do vencimento pelo painel ou entrando em contato com a equipe.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. Sem contrato de fidelidade. Cancele quando quiser pelo painel ou pelo WhatsApp da equipe.",
  },
  {
    q: "Os dois planos têm funcionalidades diferentes?",
    a: "Sim. Cada plano é configurado para o perfil do negócio: clínicas focam em atendimento administrativo e agendamentos; restaurantes focam em organização de pedidos e atendimento no WhatsApp.",
  },
];

export function PrecosSection() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-[#080d19] pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(79,70,229,0.2),transparent)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Plano Consultório · Plano Restaurante</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.06] mb-5">
            Escolha o plano{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              do seu negócio.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-medium max-w-xl mx-auto mb-6">
            Teste grátis por 7 dias. O Variaty conecta atendimento via WhatsApp, IA assistiva e páginas próprias para clínicas e restaurantes.
          </p>
          <p className="text-sm text-slate-500 font-semibold">
            Cartão necessário para ativar o teste · sem cobrança nos 7 dias · cancele quando quiser
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
          <img src="/landing-v4/backgrounds/wave-top.svg" alt="" className="w-full min-w-[1440px] h-[60px] md:h-[100px] object-cover object-bottom" />
        </div>
      </section>

      {/* Plan Cards */}
      <section className="py-20 lg:py-28 bg-[#f8fafc] relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-200/60 to-transparent" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

            {/* Plano Consultório */}
            <div className="relative flex flex-col bg-white rounded-2xl border border-slate-200 p-8 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:border-teal-200 hover:shadow-[0_8px_30px_rgba(20,184,166,0.08)] transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-5 border border-teal-100">
                <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>

              <div className="inline-flex items-center bg-teal-50 border border-teal-100 rounded-full px-3 py-1 mb-4 self-start">
                <span className="text-xs font-extrabold text-teal-600 uppercase tracking-widest">Clínicas · Consultórios · Odontologia</span>
              </div>

              <h2 className="text-2xl font-extrabold text-[#0f172a] mb-2">Plano Consultório</h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                Atendimento pelo WhatsApp com IA administrativa e estrutura para sua clínica receber interessados e organizar agendamentos.
              </p>

              <div className="mb-7">
                <p className="text-sm font-semibold text-teal-600 mb-1">Teste grátis por 7 dias</p>
                <div className="flex items-end gap-1">
                  <span className="text-base font-bold text-slate-500">R$</span>
                  <span className="text-5xl font-black text-[#0f172a] tracking-tight">97,00</span>
                  <span className="text-sm font-medium text-slate-500 mb-1">/mês após o trial</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {CONSULTORIO_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium">
                    <svg className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <p className="text-xs text-slate-400 font-medium mb-6 border-t border-slate-100 pt-4">
                A IA não diagnostica, não prescreve e não interpreta exames.
              </p>

              <Link
                href="/register?plan=consultorio"
                className="block text-center w-full py-3.5 rounded-xl text-sm font-extrabold bg-teal-600 text-white hover:bg-teal-500 transition-all hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(20,184,166,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              >
                Começar teste grátis
              </Link>
            </div>

            {/* Plano Restaurante */}
            <div className="relative flex flex-col bg-white rounded-2xl border border-slate-200 p-8 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:border-orange-200 hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)] transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-5 border border-orange-100">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>

              <div className="inline-flex items-center bg-orange-50 border border-orange-100 rounded-full px-3 py-1 mb-4 self-start">
                <span className="text-xs font-extrabold text-orange-600 uppercase tracking-widest">Restaurante · Delivery · Marmitaria</span>
              </div>

              <h2 className="text-2xl font-extrabold text-[#0f172a] mb-2">Plano Restaurante</h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                Catálogo online, atendimento e pedidos pelo WhatsApp para restaurantes, delivery e marmitaria.
              </p>

              <div className="mb-7">
                <p className="text-sm font-semibold text-orange-600 mb-1">Teste grátis por 7 dias</p>
                <div className="flex items-end gap-1">
                  <span className="text-base font-bold text-slate-500">R$</span>
                  <span className="text-5xl font-black text-[#0f172a] tracking-tight">97,00</span>
                  <span className="text-sm font-medium text-slate-500 mb-1">/mês após o trial</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {RESTAURANTE_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium">
                    <svg className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <p className="text-xs text-slate-400 font-medium mb-6 border-t border-slate-100 pt-4">
                Pagamento online não é processado nesta etapa.
              </p>

              <Link
                href="/register?plan=restaurante"
                className="block text-center w-full py-3.5 rounded-xl text-sm font-extrabold bg-orange-500 text-white hover:bg-orange-400 transition-all hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(249,115,22,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                Começar teste grátis
              </Link>
            </div>

          </div>

          <p className="text-center text-sm text-slate-400 font-medium mt-8">
            Outro tipo de negócio?{" "}
            <a
              href={WA_TEAM}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 font-semibold transition-colors"
            >
              Fale com a equipe pelo WhatsApp
            </a>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-20 bg-white border-t border-slate-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0f172a] mb-2">Dúvidas sobre os planos?</h2>
            <p className="text-base text-slate-500 font-medium">Respostas rápidas antes de começar.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details key={i} className="group bg-[#f8fafc] rounded-xl border border-slate-200/60 overflow-hidden [&_summary::-webkit-details-marker]:hidden hover:border-indigo-200 transition-colors">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-bold text-sm text-[#0f172a] group-open:text-indigo-600 transition-colors">
                  {faq.q}
                  <span className="text-slate-300 group-open:rotate-45 transition-transform text-xl flex-shrink-0 ml-4 font-light">+</span>
                </summary>
                <div className="px-6 pb-4 text-slate-500 text-sm leading-relaxed font-medium -mt-1">{faq.a}</div>
              </details>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Ainda tem dúvida?{" "}
              <a href={WA_TEAM} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold hover:underline">
                Fala com a gente no WhatsApp
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
