export function TestimonialSection() {
  return (
    <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 bg-[#080d19] overflow-hidden">

      {/* Wave Transition Top */}
      <div className="absolute top-0 left-0 right-0 w-full z-0 overflow-hidden pointer-events-none">
        <img
          src="/landing-v4/backgrounds/wave-mid.svg"
          alt=""
          className="w-full min-w-[1440px] h-[60px] md:h-[100px] object-cover object-top"
        />
      </div>

      {/* Atmospheric Glows */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-10 lg:pt-14">

        {/* Social Proof Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-5">
            Quem já usa
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-white tracking-tight leading-tight mb-4">
            Mais de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">5.000 empresas</span>
            <br className="hidden md:block" /> já automatizaram com a Variaty.
          </h2>
          <p className="text-base md:text-lg text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
            Do primeiro atendimento automático ao agendamento confirmado — sem aumentar o time.
          </p>
        </div>

        {/* Premium Testimonial Card */}
        <div className="relative rounded-[2rem] bg-[#0f172a] border border-slate-800 shadow-[0_30px_80px_rgba(0,0,0,0.5)] overflow-hidden max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-11">

            {/* Left — Photo (face sempre visível) */}
            <div className="relative lg:col-span-4 min-h-[420px] lg:min-h-full overflow-hidden">
              {/* Imagem ancorada no topo para preservar rosto */}
              <img
                src="/landing-v4/social-proof/testimonial-person.webp"
                alt="Gestora que usa Variaty"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              {/* Overlay gradiente apenas na base e na direita */}
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0f172a] to-transparent" />
              <div className="hidden lg:block absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0f172a] to-transparent" />
            </div>

            {/* Right — Copy */}
            <div className="relative lg:col-span-7 flex flex-col justify-center p-8 sm:p-10 lg:p-14">

              {/* Stars */}
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
                <span className="text-xs font-bold text-slate-500 ml-2 uppercase tracking-wide">Avaliação real</span>
              </div>

              {/* Quote */}
              <blockquote className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-[1.35] mb-8">
                "Nossa IA agenda reuniões no final de semana,{" "}
                <span className="text-indigo-400">
                  qualifica leads enquanto dormimos
                </span>{" "}
                e reduziu nosso CAC em 40%."
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-700/50">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-400/30 shrink-0">
                  <svg className="w-5 h-5 text-indigo-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
                </div>
                <div>
                  <p className="font-bold text-white text-sm leading-none mb-1">Gestora de Operações</p>
                  <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest">Tech & Serviços B2B</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-1">40<span className="text-indigo-500">%</span></p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">Redução de CAC</p>
                </div>
                <div>
                  <p className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-1">3<span className="text-indigo-500">x</span></p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">Mais agendamentos</p>
                </div>
                <div>
                  <p className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-1">24<span className="text-indigo-500">/7</span></p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">Operação ativa</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
