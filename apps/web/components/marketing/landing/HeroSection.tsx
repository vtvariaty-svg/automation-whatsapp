import Link from "next/link";
import Image from "next/image";

const WHATSAPP_DEMO_URL =
  "https://wa.me/5519995993220?text=Ol%C3%A1%2C%20quero%20testar%20a%20IA%20da%20Variaty.";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-0 overflow-hidden bg-gray-50">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-gray-50" />
      <div className="absolute top-20 left-0 w-[600px] h-[600px] bg-[#4f46e5] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#7c3aed] rounded-full mix-blend-multiply filter blur-[128px] opacity-10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center lg:pb-32">
          
          {/* Left Column - Copy & CTAs */}
          <div className="text-center lg:text-left pt-10 md:pt-0">
            <div className="inline-flex items-center gap-2 bg-blue-50/80 border border-blue-200/60 rounded-full px-4 py-1.5 mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
              </span>
              <span className="text-xs sm:text-sm font-bold text-blue-700 uppercase tracking-wide">
                Configuração guiada · API Oficial Meta
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.05] mb-6">
              Venda e agende 24h
              <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {" "}no piloto automático
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0 font-medium text-balance">
              Sua plataforma corporativa de Inteligência Artificial conectada ao WhatsApp Oficial. Atenda massivamente, qualifique leads e feche vendas em segundos — sem inflar sua folha de pagamento.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
              <Link
                href="/register"
                className="w-full sm:w-auto text-base font-bold bg-blue-600 text-white px-8 py-4 rounded-xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all hover:-translate-y-1 ring-2 ring-blue-500/20"
              >
                Teste grátis agora
              </Link>
              <Link
                href="/demo"
                className="w-full sm:w-auto text-base font-bold text-gray-700 bg-white border-2 border-gray-100 px-8 py-4 rounded-xl hover:bg-gray-50 hover:border-blue-100 transition-all shadow-sm relative group"
              >
                Ver demonstração
              </Link>
            </div>

            <div className="flex justify-center lg:justify-start">
              <a
                href={WHATSAPP_DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 bg-white/50 backdrop-blur-md border border-[#25D366]/30 hover:bg-[#f6fef9] hover:border-[#25D366]/50 rounded-2xl px-5 py-3 shadow-sm hover:shadow-md transition-all duration-300 w-full sm:w-auto"
              >
                <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#25D366]" />
                  </span>
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 leading-snug group-hover:text-[#25D366] transition-colors">
                    Ver demo no WhatsApp
                  </p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Converse com a IA real na ponta
                  </p>
                </div>
              </a>
            </div>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-gray-500 font-bold mt-8">
              <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>Sem cartão exigido</span>
              <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>Sem escrever um único prompt</span>
            </div>
          </div>

          {/* Right Column - Layered UI Mockups */}
          <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square flex items-center justify-center mt-6 lg:mt-0">
             
             {/* Base Dashboard Mockup */}
             <div className="absolute top-0 right-0 lg:-right-4 w-[90%] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-200/50 overflow-hidden bg-white z-10">
               <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-800 border-b border-slate-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-500/50" />
               </div>
               <div className="relative w-full aspect-[16/10] bg-slate-100 flex items-center justify-center text-slate-300 font-medium text-sm">
                  {/* Dashboard Image */}
                  {/* Uses the fallback logic if not found to avoid next.js layout breaks visually */}
                  <img src="/landing-v4/hero/hero-dashboard-main.webp" onError={(e) => { e.currentTarget.style.display='none'; }} alt="Interface do CRM e Robô Variaty" className="absolute inset-0 w-full h-full object-cover object-top" />
               </div>
             </div>

             {/* Phone Mockup Left */}
             <div className="absolute bottom-10 left-0 lg:-left-6 w-[32%] rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-4 border-gray-900 bg-white z-20 overflow-hidden">
                <div className="relative w-full aspect-[9/19] bg-[#eef1f5] flex items-center justify-center">
                  <div className="absolute top-0 inset-x-0 h-5 bg-gray-900 rounded-b-xl w-1/2 mx-auto z-10" />
                  <img src="/landing-v4/hero/hero-phone-left.webp" onError={(e) => { e.currentTarget.style.display='none'; }} alt="Atendimento no WhatsApp" className="absolute inset-0 w-full h-full object-cover" />
                </div>
             </div>

             {/* Phone Mockup Right */}
             <div className="hidden sm:block absolute bottom-24 -right-2 lg:-right-8 w-[28%] rounded-[1.8rem] shadow-[0_25px_50px_rgba(0,0,0,0.12)] border-2 border-gray-100 bg-white z-30 overflow-hidden hover:-translate-y-2 transition-transform duration-500">
                <div className="relative w-full aspect-[9/19] bg-white flex items-center justify-center">
                   <img src="/landing-v4/hero/hero-phone-right.webp" onError={(e) => { e.currentTarget.style.display='none'; }} alt="Tela de Atendimento" className="absolute inset-0 w-full h-full object-cover" />
                </div>
             </div>

             {/* Floating Proof Card 1 - Pure CSS Fallback + Real Image if available */}
             <div className="absolute top-20 left-4 lg:-left-12 bg-white/95 backdrop-blur-md shadow-xl shadow-blue-900/5 border border-gray-100 p-3.5 rounded-2xl flex items-center gap-3 z-40 animate-bounce" style={{ animationDuration: '4s' }}>
                <div className="shrink-0 bg-green-100 p-2.5 rounded-xl">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="font-extrabold text-sm text-gray-900">Venda Fechada!</p>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">WhatsApp · Há 1 MIN</p>
                </div>
             </div>

             {/* Floating Proof Card 2 (Image Based) */}
             <div className="absolute bottom-1/3 -right-6 lg:-right-16 z-40 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
               <img src="/landing-v4/hero/hero-floating-card-1.webp" onError={(e) => e.currentTarget.style.display='none'} alt="Notificação Flutuante" className="h-20 w-auto drop-shadow-xl" />
             </div>

          </div>
        </div>
      </div>

      {/* Wave SVG Transition */}
      <div className="absolute bottom-0 w-full leading-none z-0">
        <svg 
          className="absolute bottom-0 w-full text-white fill-current -z-10" 
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          style={{ height: '80px', display: 'block', width: '100%' }}
        >
          <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </div>

    </section>
  );
}
