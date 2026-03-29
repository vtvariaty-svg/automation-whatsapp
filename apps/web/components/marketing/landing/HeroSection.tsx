import Link from "next/link";

const WHATSAPP_DEMO_URL =
  "https://wa.me/5519995993220?text=Ol%C3%A1%2C%20quero%20testar%20a%20IA%20da%20Variaty.";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-[#080d19]">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(79,70,229,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          
          {/* Left Column - Copy & CTAs */}
          <div className="text-center lg:text-left pt-8 md:pt-0">
            {/* Tech Badge */}
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8 shadow-[0_0_15px_rgba(79,70,229,0.1)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              <span className="text-xs sm:text-sm font-bold text-indigo-300 uppercase tracking-widest">
                Automação Inteligente de Vendas
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6 drop-shadow-sm">
              Sua equipe de vendas <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                nunca dorme
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0 font-medium">
              A plataforma corporativa que transforma seu WhatsApp em uma máquina de qualificação e agendamentos. Conectada à API Oficial da Meta para escalar sua operação com segurança.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Link
                href="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-extrabold bg-blue-600 text-white px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all hover:-translate-y-1 ring-2 ring-blue-500/30"
              >
                Criar conta grátis
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <a
                href={WHATSAPP_DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-xl text-slate-200 font-bold transition-all backdrop-blur-sm group hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 fill-[#25D366] opacity-90 group-hover:opacity-100" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" />
                </svg>
                Ver demonstração
              </a>
            </div>

            {/* Micro Commitments / Social Proof */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5 border-r border-slate-700/50 pr-6">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Setup em rápidos minutos
              </span>
            </div>
          </div>

          {/* Right Column - Premium Product Composition */}
          <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square flex items-center justify-center -mt-4 lg:mt-0 lg:scale-[1.03]">
             
             {/* Base Dashboard Mockup (Deep hierarchy, highest width) */}
             <div className="absolute top-4 right-0 lg:-right-6 w-[92%] rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] border border-slate-700/50 overflow-hidden bg-[#0f172a] z-10">
               {/* Browser/Window Header */}
               <div className="flex items-center gap-2 px-4 py-3 bg-[#1e293b] border-b border-slate-700/50">
                  <div className="w-3 h-3 rounded-full bg-slate-600/50" />
                  <div className="w-3 h-3 rounded-full bg-slate-600/50" />
                  <div className="w-3 h-3 rounded-full bg-slate-600/50" />
               </div>
               <div className="relative w-full aspect-[16/10] bg-[#0f172a]">
                  <img src="/landing-v4/hero/hero-dashboard-main.webp" alt="Interface Dashboard" className="absolute inset-0 w-full h-full object-cover object-top opacity-90" />
               </div>
             </div>

             {/* Phone Mockup Left - Support */}
             <div className="absolute bottom-12 left-0 lg:-left-4 w-[32%] lg:w-[30%] rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-[6px] border-[#1e293b] bg-white z-20 overflow-hidden group">
                <div className="relative w-full aspect-[9/19] bg-white">
                  <div className="absolute top-0 inset-x-0 h-4 bg-[#1e293b] rounded-b-xl w-[45%] mx-auto z-10" />
                  <img src="/landing-v4/hero/hero-phone-left.webp" alt="Interface WhatsApp" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
             </div>

             {/* Phone Mockup Right - Lead Interaction */}
             <div className="hidden sm:block absolute -bottom-4 right-8 lg:right-4 w-[28%] lg:w-[26%] rounded-[1.8rem] shadow-[0_40px_70px_rgba(0,0,0,0.5)] border-4 border-slate-800 bg-white z-30 overflow-hidden transform hover:-translate-y-3 transition-transform duration-500">
                <div className="relative w-full aspect-[9/19] bg-white">
                   <img src="/landing-v4/hero/hero-phone-right.webp" alt="Conversa de Vendas" className="absolute inset-0 w-full h-full object-cover" />
                </div>
             </div>

             {/* Floating Premium Card 1 (CSS + SVG) */}
             <div className="absolute top-16 -left-4 lg:-left-12 bg-white/95 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 border border-white/20 p-4 rounded-2xl flex items-center gap-4 z-40 animate-[bounce_4s_infinite]">
                <div className="shrink-0 bg-gradient-to-br from-green-400 to-emerald-600 p-2.5 rounded-xl shadow-inner text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="font-extrabold text-sm text-gray-900 tracking-tight">Reunião Agendada</p>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Automático via IA</p>
                </div>
             </div>

             {/* Floating Proof Card 2 (Image Based) */}
             <div className="absolute top-1/2 -right-6 lg:-right-12 z-40 animate-[bounce_5s_infinite_1s]">
               <img src="/landing-v4/hero/hero-floating-card-1.webp" alt="Card de Notificação" className="h-[72px] w-auto drop-shadow-2xl" />
             </div>
             
             {/* Floating Proof Card 3 (Image Based) */}
             <div className="hidden lg:block absolute bottom-1/4 -right-10 z-40 animate-[bounce_6s_infinite_2s]">
               <img src="/landing-v4/hero/hero-floating-card-2.webp" alt="Métrica de Conversão" className="h-16 w-auto drop-shadow-2xl opacity-90" />
             </div>

          </div>
        </div>
      </div>

      {/* White Wave SVG Transition to blend to the next Light Section */}
      <div className="absolute bottom-0 left-0 right-0 w-full z-0 overflow-hidden pointer-events-none">
        <img 
          src="/landing-v4/backgrounds/wave-top.svg" 
          alt="" 
          className="w-full min-w-[1440px] h-[60px] md:h-[120px] object-cover object-bottom" 
        />
      </div>

    </section>
  );
}
